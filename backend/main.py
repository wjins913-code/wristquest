from datetime import datetime
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

from database import init_db, insert_assessment, list_assessments, get_assessment

app = FastAPI(title="WristQuest API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AssessmentIn(BaseModel):
    pain_score: float = Field(..., ge=0, le=100)
    function_score: float = Field(..., ge=0, le=100)
    stability_score: float = Field(..., ge=0, le=100)
    overall_score: float = Field(..., ge=0, le=100)
    grade: str
    survey_data: dict
    typing_data: dict
    mouse_data: dict
    timestamp: Optional[str] = None


@app.on_event("startup")
def on_startup():
    init_db()


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "wristquest"}


@app.post("/api/assessments")
def create_assessment(payload: AssessmentIn):
    data = payload.model_dump()
    if not data.get("timestamp"):
        data["timestamp"] = datetime.utcnow().isoformat()
    new_id = insert_assessment(data)
    return {"id": new_id, **data}


@app.get("/api/assessments")
def get_assessments(limit: int = 20):
    return list_assessments(limit=limit)


@app.get("/api/assessments/{assessment_id}")
def get_one(assessment_id: int):
    row = get_assessment(assessment_id)
    if not row:
        raise HTTPException(status_code=404, detail="Assessment not found")
    return row


# Serve frontend build (for EC2 single-process deployment)
FRONTEND_DIST = Path(__file__).parent.parent / "frontend" / "dist"
if FRONTEND_DIST.exists():
    app.mount(
        "/assets",
        StaticFiles(directory=str(FRONTEND_DIST / "assets")),
        name="assets",
    )

    @app.get("/{full_path:path}")
    def spa_fallback(full_path: str):
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="Not found")
        index = FRONTEND_DIST / "index.html"
        if index.exists():
            return FileResponse(str(index))
        raise HTTPException(status_code=404, detail="Frontend not built")
