import os
import time
import logging
from pathlib import Path

from dotenv import load_dotenv

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from sentence_transformers import SentenceTransformer
from qdrant_client import QdrantClient
from openai import OpenAI

# ======= 라우터 임포트 =======
from interview.routers.stt import router as stt_router
from interview.routers.tts import router as tts_router
from interview.routers.interview import router as interview_router
from interview.routers.jd_upload import router as jd_router
from interview.routers.feedback import router as feedback_router
from interview.routers.finalfeedback import router as finalfeedback_router
# ===========================

from interview.uploads.database import SessionLocal

# .env 설정
env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("uvicorn")

app = FastAPI()
start_time = time.time()

session_store: dict[str, 'InterviewSession'] = {}

# =====================
# 모델 및 클라이언트 초기화
# =====================
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

# =====================
# 헬스체크
# =====================
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

# =====================
# 미들웨어/정적파일
# =====================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
app.mount("/static", StaticFiles(directory="static"), name="static")

# =====================
# 라우터 등록 (실제 API 구현은 각 라우터에서만)
# =====================
app.include_router(stt_router,      prefix="/api/stt")
app.include_router(tts_router,      prefix="/api/tts")
app.include_router(interview_router, prefix="/api/interview")
app.include_router(jd_router,       prefix="/api/jd")
app.include_router(feedback_router)                     # 개별 피드백
app.include_router(finalfeedback_router)                # 총평 피드백

# ========== (★중요) main.py에서 직접 API를 선언하지 않는다! ==========
# 모든 API 엔드포인트(POST/GET)는 routers/폴더 내 파일에서만 정의
# main.py에서는 include_router()만 한다.
# ===============================================================

# DB 세션 팩토리 함수 (필요시 라우터에서 import 해서 사용)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
