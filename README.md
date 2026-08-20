# Transfer Course Equivalency Tool

A FastAPI application that evaluates whether an outside course (from another university) has an equivalent course in the University of Richmond catalog, using OpenAI embeddings for retrieval and an LLM for ranked, reasoned matching.

## How it works

The evaluation pipeline runs in phases, split across two API calls:

1. **Description lookup** (`POST /api/search-description`) — given an outside course's university/subject/code/title, an LLM with web search finds and verifies the official catalog description from the source university's own domain (registrar/catalog pages only, no third-party aggregators).
2. **Dual-index retrieval** — the outside course description is embedded twice against the UR catalog:
   - *Content pass*: title + description similarity
   - *Identity pass*: subject + code + title + description similarity
   Each pass independently returns its top-N most similar UR courses (cosine similarity over `text-embedding-3-small` embeddings).
3. **Merge** — the two result sets are deduplicated into one candidate pool, preserving both similarity scores per course so the next stage can see *how* each candidate was retrieved.
4. **LLM review** (`POST /api/evaluate`) — the candidate pool is passed to a reasoning model (`gpt-5-nano`) with a structured JSON schema, which ranks up to 5 matches with per-match reasoning (subject alignment, content overlap, course level alignment, uncertainties, confidence).

Token/search costs are computed and returned alongside results at each step (see `MODEL_PRICING` in [shared.py](shared.py)).

## Project structure

```
.
├── main.py              # FastAPI app: routes, app state, static file serving
├── shared.py             # Core logic: CSV cleaning, embeddings, retrieval, LLM prompts
├── basic.ipynb            # Original notebook the pipeline was ported from
├── requirements.txt
├── data/
│   ├── ur_title_description_embeddings.pkl   # Precomputed UR catalog embeddings (content pass)
│   ├── ur_all_details_embeddings.pkl         # Precomputed UR catalog embeddings (identity pass)
│   └── embeddings_meta.json                  # Generated at runtime: timestamp + course count
└── static/
    ├── index.html
    ├── app.js
    └── styles.css
```

## Setup

**Requirements:** Python 3.11+ (developed on 3.14), an OpenAI API key.

```bash
git clone https://github.com/minahilmobeen/transfer-course-matching-tool.git
cd transfer-course-matching-tool
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Create a `.env` file in the project root:

```
OPENAI_API_KEY=sk-...
```

This key is only used as a fallback/dev convenience — the app is designed to accept the API key at runtime via the Settings panel in the UI (`POST /api/settings/api-key`), which validates it against the embeddings endpoint before storing it in memory.

Run the app:

```bash
uvicorn main:app --reload
```

The app serves the frontend and API from the same origin — open `http://localhost:8000`.

## Data / embeddings

`data/*.pkl` are precomputed embeddings for the UR course catalog and are required for `/api/evaluate` to work (the app loads them at startup in `lifespan()`, [main.py:38-46](main.py#L38-L46)). They are checked into this repo so the app runs immediately after cloning.

To regenerate them from a fresh course catalog CSV instead of using the checked-in versions:

1. Via the UI: open Settings → upload a CSV with at minimum `SUBJ`, `CRSE`, `TITLE`, `COURSE_DESC` columns (optionally `COURSE_TEXT`) → "Create Embeddings". This calls `clean_course_csv` then `generate_course_embeddings` ([shared.py](shared.py)), and writes the three files under `data/` in the background (`POST /api/settings/create-embeddings`).
2. Via the notebook: [basic.ipynb](basic.ipynb) contains the original exploratory pipeline this app was ported from, reading from `Fall2026Registration.csv` / `clean_ur_courses.xlsx` (not tracked in this repo — supply your own).

CSV cleaning (`clean_course_csv`, [shared.py:23-74](shared.py#L23-L74)) drops duplicate `(SUBJ, CRSE, TITLE)` rows, courses with a `CRSE` code ending in `U`, all `LAW`-subject courses, and any course numbered 500+.

## API reference

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/settings/api-key` | Validate and store an OpenAI API key (and optional custom `base_url`/separate LLM key) in server memory. |
| `POST` | `/api/settings/upload-csv` | Upload and clean a course catalog CSV; stores the cleaned DataFrame in server memory. |
| `POST` | `/api/settings/create-embeddings` | Kick off background generation of both embedding indexes from the uploaded CSV. |
| `GET` | `/api/settings/status` | Current server state: API key set, embeddings available, generation job status, etc. |
| `POST` | `/api/search-description` | Look up an outside course's official description via web search. |
| `POST` | `/api/evaluate` | Run the full retrieval + LLM ranking pipeline for one outside course. |
| `GET` | `/` , `/app.js`, `/styles.css` | Frontend static assets. |

Full request/response schemas are defined as Pydantic models in [main.py](main.py) (`ApiKeyRequest`, `SearchDescriptionRequest`, `EvaluateRequest`).

## Notes on server state

`app_state` (a module-level dict in [main.py:34](main.py#L34)) holds the OpenAI client, uploaded CSV, and embeddings **in process memory** — there is no database or persistence layer beyond the `data/*.pkl` files written on disk. Restarting the server clears the uploaded CSV and any API key entered via the UI (embeddings persist since they're reloaded from disk on startup). This is a single-process, single-tenant design; it is not intended to run behind multiple worker processes without changes.

## Known gaps

- The `previous_ur_matches` field returned by `/api/evaluate` is a stubbed `None` — a lookup against a "previous matches" sheet is planned but not wired up ([main.py:146](main.py#L146)).
