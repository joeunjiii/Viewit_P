# routers/tts.py

from fastapi import APIRouter
from services.tts_service import generate_tts_audio

router = APIRouter()

@router.get("/start")
async def tts_start():
    # 고정 질문 예시
    text = "자기소개 부탁드립니다."
    audio_url = generate_tts_audio(text)
    return {"audio_url": audio_url}

@router.get("/next")
async def tts_next():
    # 임시로 다음 질문 제공
    text = "지원 동기는 무엇인가요?"
    audio_url = generate_tts_audio(text)
    return {"audio_url": audio_url, "question": text}
