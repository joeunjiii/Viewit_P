import os
import time
import logging
from pathlib import Path
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from sentence_transformers import SentenceTransformer
from qdrant_client import QdrantClient
from openai import OpenAI

from interview.interview_session import InterviewSession
from interview.routers.stt import router as stt_router
from interview.routers.tts import router as tts_router

# — .env 파일 로드 —
env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)

# — 로거 설정 —
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("uvicorn")

app = FastAPI()
start_time = time.time()

# 메모리 세션 스토어
session_store: dict[str, InterviewSession] = {}

# 요청 모델
class InitRequest(BaseModel):
    session_id: str
    job_role: str
    softskill_label: str | None = None

class AnswerRequest(BaseModel):
    session_id: str
    answer: str

# 자원 로딩
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

# 헬스체크
@app.get("/health")
async def health_check():
    return {
        "status": {
            "sentence_transformer": 'st_model' in globals(),
            "qdrant": 'qdrant_client' in globals(),
            "openai": 'openai_client' in globals(),
            "uptime_seconds": int(time.time() - start_time)
        }
    }

# 세션 초기화
@app.post("/init_session")
async def init_session(data: InitRequest):
    session = InterviewSession(
        session_id=data.session_id,
        qdrant_client=qdrant_client,
        openai_client=openai_client,
        st_model=st_model,
        collection_name="interview_questions",
        job_role=data.job_role,
        softskill_label=data.softskill_label
    )
    first_q = session.ask_fixed_question("intro")
    session.store_answer(first_q, "")
    session_store[data.session_id] = session

    logger.info(f"[FastAPI ▶ init_session] session={data.session_id} question={first_q}")
    return {"question": first_q}

# 다음 질문
@app.post("/next_question")
async def next_question(data: AnswerRequest):
    session = session_store.get(data.session_id)
    if not session:
        raise HTTPException(404, "Session not found")

    last_q = session.state["history"][-1]["question"]
    session.store_answer(last_q, data.answer)

    if time.time() - session.start_time >= 600:
        final_q = session.ask_fixed_question("final")
        session.store_answer(final_q, "")
        logger.info(f"[FastAPI ▶ next_question] session={data.session_id} final_question={final_q}")
        return {"question": final_q, "done": True}

    next_q = session.decide_next_question(data.answer)
    session.store_answer(next_q, "")
    logger.info(f"[FastAPI ▶ next_question] session={data.session_id} question={next_q}")
    return {"question": next_q, "done": False}

# 최종 답변
@app.post("/final_answer")
async def final_answer(data: AnswerRequest):
    session = session_store.get(data.session_id)
    if not session:
        raise HTTPException(404, "Session not found")
    session.store_answer("마지막으로 하실 말 있나요?", data.answer)
    logger.info(f"[FastAPI ▶ final_answer] session={data.session_id} completed")
    return {"message": "면접 종료", "history": session.state["history"]}

# CORS 및 정적 파일
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
app.mount("/static", StaticFiles(directory="static"), name="static")
app.include_router(stt_router, prefix="/interview")
app.include_router(tts_router, prefix="/interview")
