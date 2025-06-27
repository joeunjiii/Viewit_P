import os
import time
import logging
from pathlib import Path

import app
from dotenv import load_dotenv

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Dict

from sentence_transformers import SentenceTransformer
from qdrant_client import QdrantClient
from openai import OpenAI

from interview.routers.stt import router as stt_router
from interview.routers.tts import router as tts_router
from interview.routers.interview import router as interview_router

from interview.uploads.database import SessionLocal
from interview.services.feedback_service import save_final_feedback
from interview.services.llm_feedback import generate_answer_feedback, generate_final_feedback
from interview.services.feedback_service import save_answer_feedback_to_spring
from interview.routers.feedback import router as feedback_router


env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("uvicorn")

app = FastAPI()
start_time = time.time()

session_store: dict[str, 'InterviewSession'] = {}

@app.on_event("startup")
async def load_resources():
    global st_model, qdrant_client, openai_client
    logger.info("▶ 모델·클라이언트 로딩 시작")
    st_model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
    logger.info("✅ SentenceTransformer 로딩 완료")
    qdrant_url = os.getenv("QDRANT_URL")
    qdrant_key = os.getenv("QDRANT_API_KEY")
    qdrant_client = QdrantClient(url=qdrant_url, api_key=qdrant_key)
    qdrant_client.get_collections()
    logger.info("✅ QdrantClient 연결 및 컬렉션 조회 성공")
    openai_api_key = os.getenv("OPENAI_API_KEY")
    openai_client = OpenAI(api_key=openai_api_key)
    logger.info("✅ OpenAI 클라이언트 준비 완료")
    app.state.st_model = st_model
    app.state.qdrant_client = qdrant_client
    app.state.openai_client = openai_client
    app.state.session_store = session_store

@app.get("/health")
async def health_check():
    return {
        "status": {
            "sentence_transformer": app.state.st_model is not None,
            "qdrant": app.state.qdrant_client is not None,
            "openai": app.state.openai_client is not None,
            "uptime_seconds": int(time.time() - start_time)
        }
    }

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
app.mount("/static", StaticFiles(directory="static"), name="static")

app.include_router(stt_router, prefix="/api/stt")
app.include_router(tts_router, prefix="/api/tts")
app.include_router(interview_router, prefix="/api/interview")
app.include_router(feedback_router)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class AnswerInput(BaseModel):
    session_id: str
    question_text: str
    answer_text: str

class FinalFeedbackInput(BaseModel):
    session_id: str
    answers: List[Dict[str, str]]

@app.post("/api/feedback/answer")
def feedback_answer(
        input: AnswerInput,
        db: Session = Depends(get_db)
):
    llm = app.state.openai_client
    feedback = generate_answer_feedback(llm, input.question_text, input.answer_text)
    save_answer_feedback_to_spring(db, input.session_id, input.question_text, feedback)
    return {"feedback": feedback}

@app.post("/api/feedback/final")
def feedback_final(
        input: FinalFeedbackInput,
        db: Session = Depends(get_db)
):
    llm = app.state.openai_client
    summary, strengths, weaknesses = generate_final_feedback(llm, input.answers)
    save_final_feedback(db, input.session_id, strengths, weaknesses, summary)
    return {
        "summary": summary,
        "strengths": strengths,
        "weaknesses": weaknesses
    }
