from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from interview.routers.stt import router as stt_router
from interview.routers.tts import router as tts_router
from fastapi.staticfiles import StaticFiles

app = FastAPI()

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 추후 React 주소로 제한
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Question(BaseModel):
    text: str


app.mount("/static", StaticFiles(directory="static"), name="static")

app.include_router(stt_router, prefix="/interview")
app.include_router(tts_router, prefix="/interview")

