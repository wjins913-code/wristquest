import sqlite3
import json
from contextlib import contextmanager
from pathlib import Path
from datetime import datetime

DB_PATH = Path(__file__).parent / "wristquest.db"


def init_db():
    with get_conn() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS assessments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                pain_score REAL NOT NULL,
                function_score REAL NOT NULL,
                stability_score REAL NOT NULL,
                overall_score REAL NOT NULL,
                grade TEXT NOT NULL,
                survey_data TEXT NOT NULL,
                typing_data TEXT NOT NULL,
                mouse_data TEXT NOT NULL
            )
            """
        )
        conn.commit()


@contextmanager
def get_conn():
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()


def insert_assessment(data: dict) -> int:
    with get_conn() as conn:
        cur = conn.execute(
            """
            INSERT INTO assessments
                (timestamp, pain_score, function_score, stability_score,
                 overall_score, grade, survey_data, typing_data, mouse_data)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                data.get("timestamp", datetime.utcnow().isoformat()),
                data["pain_score"],
                data["function_score"],
                data["stability_score"],
                data["overall_score"],
                data["grade"],
                json.dumps(data["survey_data"], ensure_ascii=False),
                json.dumps(data["typing_data"], ensure_ascii=False),
                json.dumps(data["mouse_data"], ensure_ascii=False),
            ),
        )
        conn.commit()
        return cur.lastrowid


def list_assessments(limit: int = 20) -> list:
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT * FROM assessments ORDER BY id DESC LIMIT ?",
            (limit,),
        ).fetchall()
        return [row_to_dict(r) for r in rows]


def get_assessment(assessment_id: int):
    with get_conn() as conn:
        row = conn.execute(
            "SELECT * FROM assessments WHERE id = ?", (assessment_id,)
        ).fetchone()
        return row_to_dict(row) if row else None


def row_to_dict(row) -> dict:
    d = dict(row)
    for key in ("survey_data", "typing_data", "mouse_data"):
        if d.get(key):
            try:
                d[key] = json.loads(d[key])
            except json.JSONDecodeError:
                pass
    return d
