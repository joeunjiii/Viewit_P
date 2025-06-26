import os
import time
import logging
from pathlib import Path
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from sentence_transformers import SentenceTransformer
from qdrant_client import QdrantClient
from openai import OpenAI
from pydantic import BaseModel

from interview.routers.stt import router as stt_router
from interview.routers.tts import router as tts_router
from interview.routers.interview import router as interview_router
from interview.routers.jd_upload import router as jd_router


# — .env 파일 로드 —
env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)

# — 로거 설정 —
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("uvicorn")


app = FastAPI()
start_time = time.time()

# 메모리 세션 스토어
session_store: dict[str, "InterviewSession"] = {}


# FastAPI 이벤트: 서버 시작 시 자원 로딩
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


# 헬스체크 (기본 유지)
@app.get("/health")
async def health_check():
    return {
        "status": {
            "sentence_transformer": st_model is not None,
            "qdrant": qdrant_client is not None,
            "openai": openai_client is not None,
            "uptime_seconds": int(time.time() - start_time),
        }
    }


# ------ 미들웨어/정적 파일/라우터 등록 ------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
app.mount("/static", StaticFiles(directory="static"), name="static")


class Question(BaseModel):
    text: str


app.include_router(stt_router, prefix="/api/stt")
app.include_router(tts_router, prefix="/api/tts")
app.include_router(interview_router, prefix="/api/interview")
app.include_router(jd_router, prefix="/api/jd")
