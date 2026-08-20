"""
shared.py — Functions and schemas ported from basic.ipynb.
"""

import json
import re

import numpy as np
import pandas as pd
from openai import OpenAI


def create_openai_client(api_key: str, base_url: str | None = None) -> OpenAI:
    if base_url:
        return OpenAI(api_key=api_key, base_url=base_url)
    return OpenAI(api_key=api_key)


# ----------------------------------------------------------------
# CSV cleaning
# ----------------------------------------------------------------

def clean_course_csv(df: pd.DataFrame) -> tuple:
    required_cols = ["SUBJ", "CRSE", "TITLE", "COURSE_DESC"]
    missing = [c for c in required_cols if c not in df.columns]
    if missing:
        raise ValueError(f"CSV is missing required column(s): {', '.join(missing)}")

    cols = required_cols + (["COURSE_TEXT"] if "COURSE_TEXT" in df.columns else [])
    course_df = df[cols].copy()
    if "COURSE_TEXT" not in course_df.columns:
        course_df["COURSE_TEXT"] = ""

    total_input = len(course_df)

    for col in course_df.columns:
        course_df[col] = course_df[col].fillna("").astype(str).str.strip()

    before = len(course_df)
    course_df = course_df.drop_duplicates(subset=["SUBJ", "CRSE", "TITLE"], keep="first")
    removed_duplicates = before - len(course_df)

    # Filter A: CRSE ends with 'U'
    before = len(course_df)
    course_df = course_df[~course_df["CRSE"].str.endswith("U")]
    removed_U = before - len(course_df)

    # Filter B: SUBJ is exactly 'LAW' (case-insensitive)
    before = len(course_df)
    course_df = course_df[course_df["SUBJ"].str.upper() != "LAW"]
    removed_LAW = before - len(course_df)

    # Filter C: leading integer of CRSE >= 500
    def _leading_int(val):
        m = re.match(r"(\d+)", str(val))
        return int(m.group(1)) if m else None

    before = len(course_df)
    course_df = course_df[
        course_df["CRSE"].apply(lambda x: (_leading_int(x) or 0) < 500)
    ]
    removed_500plus = before - len(course_df)

    course_df = course_df.reset_index(drop=True)

    stats = {
        "total_input": total_input,
        "removed_duplicates": removed_duplicates,
        "removed_U_suffix": removed_U,
        "removed_LAW": removed_LAW,
        "removed_500plus": removed_500plus,
        "rows_kept": len(course_df),
    }
    return course_df, stats


# ----------------------------------------------------------------
# Pricing — USD per token. Fill in input/output for unknown models.
# ----------------------------------------------------------------

MODEL_PRICING = {
    "text-embedding-3-small": {"input": 0.020 / 1000000, "output": 0.0},
    "gpt-5-nano":   {"input": 0.05 / 1000000, "output": 0.40 / 1000000},
    "gpt-5.4-mini": {"input": 0.75 / 1000000, "output": 4.5 / 1000000},
    "gpt-5.4-nano": {"input": 0.20 / 1000000, "output": 1.25 / 1000000},
    "web_search_tool": {"per_query": 10 / 1000},
}


def compute_cost(model, input_tokens, output_tokens=0):
    pricing = MODEL_PRICING.get(model)
    if not pricing or pricing["input"] is None:
        return None
    return round(
        pricing["input"] * input_tokens + (pricing["output"] or 0.0) * output_tokens,
        8,
    )


def compute_search_cost(num_queries):
    per_query = MODEL_PRICING.get("web_search_tool", {}).get("per_query")
    if per_query is None or not num_queries:
        return None
    return round(per_query * num_queries, 8)


# ----------------------------------------------------------------
# Embeddings: generation, similarity, loading
# ----------------------------------------------------------------

def get_embedding(text, client, model="text-embedding-3-small"):
    response = client.embeddings.create(
        model=model,
        input=text
    )
    return response.data[0].embedding, response.usage.prompt_tokens


def cosine_similarity(vector_a, vector_b):
    a = np.array(vector_a)
    b = np.array(vector_b)

    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))


def generate_course_embeddings(course_df: pd.DataFrame, client) -> tuple:
    title_description_embeddings = []
    all_details_embeddings = []

    for _, row in course_df.iterrows():
        title_desc_text = str(row["TITLE"]) + "\n\n" + str(row["COURSE_DESC"])
        all_details_text = (
            str(row["SUBJ"]) + " " + str(row["CRSE"]) +
            "\n\n" + str(row["TITLE"]) +
            "\n\n" + str(row["COURSE_DESC"]) +
            "\n\n" + str(row["COURSE_TEXT"])
        )

        # Correctly unpack (vector, tokens) — the notebook stored the whole
        # tuple by mistake, which would break cosine_similarity at query time.
        title_desc_vector, _ = get_embedding(title_desc_text, client)
        all_details_vector, _ = get_embedding(all_details_text, client)

        course_record = {
            "subject": row["SUBJ"],
            "course_number": row["CRSE"],
            "course_title": row["TITLE"],
            "course_description": row["COURSE_DESC"],
        }

        title_description_embeddings.append({**course_record, "embedding": title_desc_vector})
        all_details_embeddings.append({**course_record, "embedding": all_details_vector})

    return title_description_embeddings, all_details_embeddings


def load_course_embeddings(
    title_description_file="data/ur_title_description_embeddings.pkl",
    all_details_file="data/ur_all_details_embeddings.pkl"
):
    import pickle

    with open(title_description_file, "rb") as file:
        title_description_embeddings = pickle.load(file)

    with open(all_details_file, "rb") as file:
        all_details_embeddings = pickle.load(file)

    return title_description_embeddings, all_details_embeddings


# ----------------------------------------------------------------
# Retrieval: rank candidates against one embedding index
# ----------------------------------------------------------------

def rank_course_matches(query_text, course_embeddings, client, top_n=10):

    query_embedding, embedding_tokens = get_embedding(query_text, client)

    results = []

    for course in course_embeddings:
        score = cosine_similarity(
            query_embedding,
            course["embedding"]
        )

        results.append({
            "subject": course["subject"],
            "course_number": course["course_number"],
            "course_title": course["course_title"],
            "similarity_score": score,
            "course_description": course["course_description"]
        })

    results_df = pd.DataFrame(results)

    results_df = results_df.sort_values(
        by="similarity_score",
        ascending=False
    ).reset_index(drop=True)

    results_df["rank"] = results_df.index + 1

    return results_df.head(top_n), embedding_tokens


# ----------------------------------------------------------------
# Merge: combine both retrieval passes into one deduplicated pool
# ----------------------------------------------------------------
# Preserves both similarity scores separately (does not average or take
# max), so the LLM review stage can see whether a course matched on
# content, identity, or both.

def combine_unique_matches(matches_title_desc, matches_all_details):

    candidates = {}

    for _, row in matches_title_desc.iterrows():
        key = (row["subject"], row["course_number"])
        candidates[key] = {
            "subject": row["subject"],
            "course_number": row["course_number"],
            "course_title": row["course_title"],
            "course_description": row["course_description"],
            "score_title_desc": row["similarity_score"],
            "score_all_details": None
        }

    for _, row in matches_all_details.iterrows():
        key = (row["subject"], row["course_number"])
        if key in candidates:
            candidates[key]["score_all_details"] = row["similarity_score"]
        else:
            candidates[key] = {
                "subject": row["subject"],
                "course_number": row["course_number"],
                "course_title": row["course_title"],
                "course_description": row["course_description"],
                "score_title_desc": None,
                "score_all_details": row["similarity_score"]
            }

    candidate_pool = pd.DataFrame(candidates.values())

    return candidate_pool


# ----------------------------------------------------------------
# Formatting: turn the candidate pool into prompt-ready text
# ----------------------------------------------------------------

def format_matches_for_gpt(candidate_pool):
    text = ""
    for index, row in candidate_pool.iterrows():
        score_title_desc = (
            f"{row['score_title_desc']:.4f}"
            if row["score_title_desc"] is not None else "N/A (not retrieved by this pass)"
        )
        score_all_details = (
            f"{row['score_all_details']:.4f}"
            if row["score_all_details"] is not None else "N/A (not retrieved by this pass)"
        )

        text += f"""
Candidate {index + 1}

Course:
{row['subject']} {row['course_number']} - {row['course_title']}

Content Similarity Score (title + description):
{score_title_desc}

Identity Similarity Score (subject + code + title + description):
{score_all_details}

Description:
{row['course_description']}
"""

    return text


# ----------------------------------------------------------------
# Structured output schema: top 5 ranked matches with reasoning
# ----------------------------------------------------------------

transfer_match_schema = {
    "type": "object",
    "properties": {
        "top_matches": {
            "type": "array",
            "minItems": 1,
            "maxItems": 5,
            "items": {
                "type": "object",
                "properties": {
                    "rank": {"type": "integer"},
                    "course_code": {"type": "string"},
                    "course_title": {"type": "string"},
                    "subject_alignment": {"type": "string"},
                    "content_overlap": {"type": "string"},
                    "course_level_alignment": {"type": "string"},
                    "uncertainties": {"type": "string"},
                    "reason": {"type": "string"},
                    "confidence": {
                        "type": "string",
                        "enum": ["High", "Medium", "Low"]
                    }
                },
                "required": [
                    "rank",
                    "course_code",
                    "course_title",
                    "subject_alignment",
                    "content_overlap",
                    "course_level_alignment",
                    "uncertainties",
                    "reason",
                    "confidence"
                ],
                "additionalProperties": False
            }
        }
    },
    "required": ["top_matches"],
    "additionalProperties": False
}


# ----------------------------------------------------------------
# LLM review: rank and reason over the candidate pool
# ----------------------------------------------------------------

def review_top_matches_with_gpt(
    outside_university,
    outside_subject,
    outside_code,
    outside_title,
    outside_description,
    candidate_pool,
    client,
    llm_client=None,
):

    matches_text = format_matches_for_gpt(candidate_pool)

    prompt = f"""
You are helping evaluate possible transfer course equivalencies for a student
transferring to the University of Richmond (UR).

Outside course information (verified by the student):

University: {outside_university}
Subject: {outside_subject}
Code: {outside_code}
Title: {outside_title}

Description:
{outside_description}

Below is a pool of candidate UR courses. Each candidate was retrieved by one or
both of two independent searches: one based on course content (title + description),
and one based on course identity (subject + code + title + description). Candidates
may have a score from only one of these two searches; if a score is marked
"N/A (not retrieved by this pass)", that candidate did not appear in that search's
top results, which is itself useful information.

Candidate UR courses:
{matches_text}

Evaluate the candidates using the following criteria:

Subject Area Similarity:
Compare the academic discipline of the outside course to each UR candidate
(e.g. Economics to Economics, Biology to Biology). Avoid matching across
unrelated disciplines.

Course Level Similarity:
Determine whether each course is introductory, intermediate, or advanced.
Course numbering varies across institutions, so infer level primarily from
the title, description, learning outcomes, and course scope, not from the
course number alone. A 200-level course at one school may be equivalent to
a 100-level course at another.

Content Coverage:
Evaluate topic overlap, learning outcomes, skills taught, and the breadth
and depth of coverage.

Avoid Overmatching:
Do not recommend a course just because it shares a subject area if the level
or scope is mismatched. For example, an introductory course should not be
matched to an advanced course in the same subject just because no better
option exists in the candidate pool.

Ranking:
Rank candidates based on, in order of importance:
1. Subject alignment
2. Content similarity
3. Course level alignment
4. Overall likelihood of equivalency

Select and rank up to 5 UR course matches from the candidate pool. Return fewer
than 5 if there are not enough reasonable candidates — do not pad the list with
weak or irrelevant courses just to reach 5. However, always return at least 1
match: if every candidate is a weak fit, include the single closest one rather
than returning an empty list.

Prefer higher-confidence matches. Only include a Low confidence match to fill a
remaining slot (or as your sole result) when there are not enough Medium or High
confidence candidates available to complete the list — never include a Low
confidence match while a better (Medium or High confidence) candidate exists in
the pool but was left out.

Do not invent courses. Only select courses that appear in the candidate pool above.

For each match returned, provide:
- rank (1 through however many matches you return)
- course_code
- course_title
- subject_alignment: how well the subject areas align
- content_overlap: how much the course content overlaps
- course_level_alignment: how the course levels compare, and how you inferred level
- uncertainties: any limitations, ambiguities, or reasons for lower confidence
- reason: a concise overall summary of why this course was recommended
- confidence: High, Medium, or Low

Return between 1 and 5 matches, ranked best to worst, following the confidence
preference above.
"""
    inference_client = llm_client if llm_client is not None else client
    response = inference_client.responses.create(
        model="gpt-5-nano",
        input=prompt,
        text={
            "format": {
                "type": "json_schema",
                "name": "transfer_course_matches",
                "schema": transfer_match_schema
            }
        }
    )
    return json.loads(response.output_text), response.usage


# ----------------------------------------------------------------
# Orchestration: run both retrieval passes, merge, review
# ----------------------------------------------------------------

def evaluate_transfer_course(
    outside_university,
    outside_subject,
    outside_code,
    outside_title,
    outside_description,
    title_description_embeddings,
    all_details_embeddings,
    client,
    top_n=10,
    llm_client=None,
):
    EMBEDDING_MODEL = "text-embedding-3-small"
    REASONING_MODEL = "gpt-5-nano"

    # Retrieval Pass 1: content-based (title + description)
    query_text_title_desc = outside_title + "\n\n" + outside_description

    matches_title_desc, tokens_pass1 = rank_course_matches(
        query_text=query_text_title_desc,
        course_embeddings=title_description_embeddings,
        client=client,
        top_n=top_n
    )

    # Retrieval Pass 2: identity-aware (subject + code + title + description)
    query_text_all_details = (
        outside_subject + " " + outside_code +
        "\n\n" + outside_title +
        "\n\n" + outside_description
    )

    matches_all_details, tokens_pass2 = rank_course_matches(
        query_text=query_text_all_details,
        course_embeddings=all_details_embeddings,
        client=client,
        top_n=top_n
    )

    candidate_pool = combine_unique_matches(matches_title_desc, matches_all_details)

    structured_review, usage_reasoning = review_top_matches_with_gpt(
        outside_university=outside_university,
        outside_subject=outside_subject,
        outside_code=outside_code,
        outside_title=outside_title,
        outside_description=outside_description,
        candidate_pool=candidate_pool,
        client=client,
        llm_client=llm_client,
    )

    review_df = pd.DataFrame(structured_review["top_matches"])

    # Attach the UR catalog description to each ranked match
    candidate_pool["course_code_key"] = (
        candidate_pool["subject"].str.strip()
        + " "
        + candidate_pool["course_number"].astype(str).str.strip()
    )
    desc_map = (
        candidate_pool.set_index("course_code_key")["course_description"].to_dict()
    )
    review_df["course_description"] = review_df["course_code"].str.strip().map(desc_map)

    cost_pass1 = compute_cost(EMBEDDING_MODEL, tokens_pass1)
    cost_pass2 = compute_cost(EMBEDDING_MODEL, tokens_pass2)
    cost_reasoning = compute_cost(
        REASONING_MODEL,
        usage_reasoning.input_tokens,
        usage_reasoning.output_tokens,
    )
    known_costs = [c for c in (cost_pass1, cost_pass2, cost_reasoning) if c is not None]
    total_cost = round(sum(known_costs), 8) if known_costs else None

    costs = {
        "embedding_pass_1": {
            "model": EMBEDDING_MODEL,
            "tokens": tokens_pass1,
            "cost_usd": cost_pass1,
        },
        "embedding_pass_2": {
            "model": EMBEDDING_MODEL,
            "tokens": tokens_pass2,
            "cost_usd": cost_pass2,
        },
        "match_reasoning": {
            "model": REASONING_MODEL,
            "input_tokens": usage_reasoning.input_tokens,
            "output_tokens": usage_reasoning.output_tokens,
            "cost_usd": cost_reasoning,
        },
        "total_cost_usd": total_cost,
    }

    return candidate_pool, review_df, costs


# ----------------------------------------------------------------
# Structured output schema: web-search course lookup result
# ----------------------------------------------------------------

course_lookup_schema = {
    "type": "object",
    "properties": {
        "university": {"type": "string"},
        "subject": {"type": "string"},
        "code": {"type": "string"},
        "title": {"type": "string"},
        "description": {"type": "string"},
        "source_url": {"type": "string"},
        "found": {"type": "boolean"}
    },
    "required": [
        "university", "subject", "code", "title",
        "description", "source_url", "found"
    ],
    "additionalProperties": False
}


# ----------------------------------------------------------------
# Web search: find the outside course's official description
# ----------------------------------------------------------------

def find_course_description_online(university, subject, code, title, client, term=None, year=None):
    term_year_line = ""
    if term or year:
        term_year_line = f"Term: {term or 'unspecified'}\nYear: {year or 'unspecified'}\n"

    prompt = f"""
Search the web for the official course description for this college course.

University: {university}
Subject: {subject}
Code: {code}
Title: {title}
{term_year_line}
═══════════════════════════════════════════════
STRICT REQUIREMENTS — apply throughout every step below:
1. SOURCE: Only accept descriptions from the official university domain
   (e.g. university.edu, registrar.university.edu, catalog.university.edu).
   Never accept third-party sites: course-review aggregators, RateMyProfessors,
   Coursicle, transfer-equivalency databases, syllabus repositories, etc.
2. RECENCY: If a specific year was provided, match that year exactly; fall back
   to the nearest available year only if the target year is not published.
   If no year was provided, prefer the most current catalog year available
   on the university's site.
3. URL: The source_url you return must link directly to the page or PDF where
   the description appears — not to a search results page or a homepage.
═══════════════════════════════════════════════

SEARCH STEPS — follow in order, stop at the first verified result:

Step 1 — Broad official search (start here):
  Query: "{university}" "{subject} {code}" {"'"+title+"'" if title else ""} {year if year else ""}
  If a year was provided, include it as a keyword to surface the matching catalog page first. If no year was provided,
  do not include a year keyword — let recency be determined by the results.

Step 2 — Registrar / catalog search:
  Query: "{subject} {code}" "course description" {year if year else ""}
  Also try common catalog subdomains:
    catalog.<university_domain>, registrar.<university_domain>,
    courses.<university_domain>, bulletin.<university_domain>

Step 3 — Department course listing:
  Query: "{subject}" courses "{code}" {year if year else ""}
  Look for the department's official course listing page, not a syllabus.

Step 4 — Archived / versioned catalogs:
  Many universities publish year-specific catalog URLs such as:
    catalog.university.edu/<year>-<year+1>/courses/...
    catalog.university.edu/archive/<year>/...
  If a year was provided, search for these patterns directly using that year.
  If no year was provided, look for the most recent archived catalog available.

Step 5 — PDF bulletin:
  Query: site:<university_domain> "{subject} {code}" filetype:pdf {year if year else ""}
  Accept only if the PDF is hosted on the official university domain and
  the year is identifiable from the filename, URL, or document header.

Step 6 — If all steps fail:
  Set found = false. Do not guess, paraphrase, or fabricate a description.

═══════════════════════════════════════════════
SELECTING AMONG MULTIPLE RESULTS:
If multiple results exist, prefer in this order:
  a) Official university domain over any other source (non-negotiable — a more
     recent result from a third-party site never beats an older official one)
  b) Most recent catalog year if no year was specified; exact year match if a
     year was provided, falling back to the nearest available year
  c) Registrar or central catalog page over a department page
  d) HTML page over a PDF

VERIFYING THE DESCRIPTION:
Before returning, confirm:
  - The URL domain matches the official university site
  - The page or PDF explicitly labels the text as a course description
    (not a syllabus, not a prerequisite list, not a section header)
  - The catalog year on the page matches the provided year, or is the most
    recent available if no year was provided

═══════════════════════════════════════════════
Return a JSON object with exactly these fields:
- university: the university name as given
- subject: the subject as given
- code: the code as given
- title: the title as given
- description: the official course description, copied verbatim from the catalog
- source_url: direct URL to the page or PDF containing the description
- catalog_year: the catalog year shown on the source page (e.g. "2025-2026"), or "" if not determinable
- found: true if a real, verifiable, official description was found; false otherwise

If found is false, description, source_url, and catalog_year must all be empty strings.
"""

    SEARCH_MODEL = "gpt-5.4-mini"

    response = client.responses.create(
        model=SEARCH_MODEL,
        input=prompt,
        tools=[{"type": "web_search"}],
        text={
            "format": {
                "type": "json_schema",
                "name": "course_lookup_result",
                "schema": course_lookup_schema
            }
        }
    )

    result = json.loads(response.output_text)

    num_searches = sum(
        1 for item in response.output
        if getattr(item, "type", "") == "web_search_call"
    )
    token_cost = compute_cost(SEARCH_MODEL, response.usage.input_tokens, response.usage.output_tokens)
    search_cost = compute_search_cost(num_searches)
    known = [c for c in (token_cost, search_cost) if c is not None]
    total_cost = round(sum(known), 8) if known else None

    result["cost"] = {
        "model": SEARCH_MODEL,
        "input_tokens": response.usage.input_tokens,
        "output_tokens": response.usage.output_tokens,
        "token_cost_usd": token_cost,
        "web_searches": num_searches,
        "web_search_cost_usd": search_cost,
        "total_cost_usd": total_cost,
    }
    return result
