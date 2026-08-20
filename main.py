"""
app/main.py — FastAPI application for the Transfer Course Equivalency Tool.

Run with:
    uvicorn main:app --reload
from the project root (the folder containing app/, static/, and data/).
"""

import io
import json
import os
import pickle
from contextlib import asynccontextmanager
from datetime import datetime

import pandas as pd
from fastapi import BackgroundTasks, FastAPI, File, HTTPException, UploadFile
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel

from shared import (
    clean_course_csv,
    create_openai_client,
    generate_course_embeddings,
    load_course_embeddings,
    find_course_description_online,
    evaluate_transfer_course,
)

# ----------------------------------------------------------------
# App-wide state
# ----------------------------------------------------------------
app_state: dict = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load pre-built embedding indexes if they exist; set to None otherwise.
    try:
        title_description_embeddings, all_details_embeddings = load_course_embeddings()
        app_state["title_description_embeddings"] = title_description_embeddings
        app_state["all_details_embeddings"] = all_details_embeddings
    except FileNotFoundError:
        app_state["title_description_embeddings"] = None
        app_state["all_details_embeddings"] = None

    # Load embedding metadata (timestamp, course count) if it exists.
    meta_path = "data/embeddings_meta.json"
    if os.path.exists(meta_path):
        with open(meta_path, "r") as f:
            app_state["embeddings_meta"] = json.load(f)
    else:
        app_state["embeddings_meta"] = {}

    yield


app = FastAPI(lifespan=lifespan)


# ----------------------------------------------------------------
# Request body schemas
# ----------------------------------------------------------------

class ApiKeyRequest(BaseModel):
    api_key: str
    base_url: str | None = None
    llm_api_key: str | None = None


class SearchDescriptionRequest(BaseModel):
    outside_university: str
    outside_subject: str
    outside_code: str
    outside_title: str
    term: str | None = None
    year: str | None = None


class EvaluateRequest(BaseModel):
    outside_university: str
    outside_subject: str
    outside_code: str
    outside_title: str
    description: str


# ----------------------------------------------------------------
# Routes
# ----------------------------------------------------------------

@app.post("/api/search-description")
def search_description(payload: SearchDescriptionRequest):
    """
    Phase 1 of the pipeline: web-search for the outside course's official description.
    """
    openai_client = app_state.get("openai_client")
    if openai_client is None:
        raise HTTPException(status_code=403, detail="API key not configured. Open Settings to continue.")

    llm_client = app_state.get("llm_client", openai_client)
    result = find_course_description_online(
        university=payload.outside_university,
        subject=payload.outside_subject,
        code=payload.outside_code,
        title=payload.outside_title,
        client=llm_client,
        term=payload.term,
        year=payload.year,
    )

    return result


@app.post("/api/evaluate")
def evaluate(payload: EvaluateRequest):
    """
    Phases 2-5 of the pipeline: dual-index embedding retrieval, merge, and LLM review.
    """
    openai_client = app_state.get("openai_client")
    if openai_client is None:
        raise HTTPException(status_code=403, detail="API key not configured. Open Settings to continue.")

    title_description_embeddings = app_state.get("title_description_embeddings")
    all_details_embeddings = app_state.get("all_details_embeddings")

    if title_description_embeddings is None or all_details_embeddings is None:
        raise HTTPException(status_code=503, detail="No course embeddings loaded. Open Settings to upload a CSV and create embeddings.")

    candidate_pool, review_df, costs = evaluate_transfer_course(
        outside_university=payload.outside_university,
        outside_subject=payload.outside_subject,
        outside_code=payload.outside_code,
        outside_title=payload.outside_title,
        outside_description=payload.description,
        title_description_embeddings=title_description_embeddings,
        all_details_embeddings=all_details_embeddings,
        client=openai_client,
        top_n=10,
        llm_client=app_state.get("llm_client"),
    )

    matches = review_df.to_dict(orient="records")

    # TODO: replace None with lookup_previous_matches(...) once the sheet is wired up
    return {"matches": matches, "previous_ur_matches": None, "costs": costs}


# ----------------------------------------------------------------
# Settings: API key + status
# ----------------------------------------------------------------

@app.post("/api/settings/api-key")
def save_api_key(payload: ApiKeyRequest):
    if not payload.api_key or not payload.api_key.strip():
        raise HTTPException(status_code=400, detail="API key cannot be empty.")
    base_url    = payload.base_url.strip()    if payload.base_url    and payload.base_url.strip()    else None
    llm_api_key = payload.llm_api_key.strip() if payload.llm_api_key and payload.llm_api_key.strip() else None
    try:
        # Always validate the main API key against the default OpenAI endpoint (used for embeddings).
        default_client = create_openai_client(payload.api_key.strip())
        default_client.embeddings.create(model="text-embedding-3-small", input="test")
        app_state["openai_client"] = default_client

        # LLM client uses the custom base URL (and optional separate key) for web search + ranking.
        # If no custom credentials are provided it falls back to the default client.
        if base_url:
            key_for_llm = llm_api_key if llm_api_key else payload.api_key.strip()
            app_state["llm_client"] = create_openai_client(key_for_llm, base_url=base_url)
        else:
            app_state["llm_client"] = default_client

        app_state["llm_base_url"] = base_url
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid API key: {e}")


@app.post("/api/settings/upload-csv")
async def upload_csv(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="File must be a .csv file.")
    contents = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not parse CSV: {e}")
    try:
        course_df, stats = clean_course_csv(df)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    if stats["rows_kept"] == 0:
        raise HTTPException(status_code=400, detail="No courses remain after cleaning. Check that the CSV contains valid course data.")
    app_state["course_df"] = course_df
    return {"success": True, "filename": file.filename, "stats": stats}


def _run_embedding_generation():
    try:
        course_df = app_state["course_df"]
        client    = app_state["openai_client"]

        title_desc_embs, all_details_embs = generate_course_embeddings(course_df, client)

        os.makedirs("data", exist_ok=True)
        with open("data/ur_title_description_embeddings.pkl", "wb") as f:
            pickle.dump(title_desc_embs, f)
        with open("data/ur_all_details_embeddings.pkl", "wb") as f:
            pickle.dump(all_details_embs, f)

        meta = {
            "generated_at": datetime.utcnow().isoformat(),
            "course_count": len(course_df),
        }
        with open("data/embeddings_meta.json", "w") as f:
            json.dump(meta, f)

        app_state["title_description_embeddings"] = title_desc_embs
        app_state["all_details_embeddings"]       = all_details_embs
        app_state["embeddings_meta"]              = meta
        app_state["embedding_job_status"]         = "done"
    except Exception as e:
        app_state["embedding_job_status"] = f"error: {e}"


@app.post("/api/settings/create-embeddings")
def create_embeddings(background_tasks: BackgroundTasks):
    if app_state.get("openai_client") is None:
        raise HTTPException(status_code=400, detail="API key not set. Please save your API key in Settings first.")
    if app_state.get("course_df") is None:
        raise HTTPException(status_code=400, detail="No CSV uploaded. Please upload a course catalog CSV first.")
    if app_state.get("embedding_job_status") == "running":
        raise HTTPException(status_code=400, detail="Embedding generation is already in progress.")

    app_state["embedding_job_status"] = "running"
    background_tasks.add_task(_run_embedding_generation)
    return {"status": "started"}


# ----------------------------------------------------------------
# Settings: status
# ----------------------------------------------------------------

@app.get("/api/settings/status")
def settings_status():
    embeddings_available = (
        app_state.get("title_description_embeddings") is not None
        and app_state.get("all_details_embeddings") is not None
    )
    meta = app_state.get("embeddings_meta", {})
    return {
        "api_key_set": app_state.get("openai_client") is not None,
        "base_url_set": app_state.get("llm_base_url") is not None,
        "embeddings_available": embeddings_available,
        "embeddings_generated_at": meta.get("generated_at"),
        "embeddings_course_count": meta.get("course_count"),
        "embedding_job_status": app_state.get("embedding_job_status"),
    }


# ----------------------------------------------------------------
# Static file serving
# ----------------------------------------------------------------

@app.get("/")
def serve_index():
    return FileResponse(
        "static/index.html",
        headers={"Cache-Control": "no-store, max-age=0"},
    )


@app.get("/app.js")
def serve_app_js():
    return FileResponse(
        "static/app.js",
        headers={"Cache-Control": "no-store, max-age=0"},
    )


@app.get("/styles.css")
def serve_styles_css():
    return FileResponse(
        "static/styles.css",
        headers={"Cache-Control": "no-store, max-age=0"},
    )


app.mount("/", StaticFiles(directory="static"), name="static")
