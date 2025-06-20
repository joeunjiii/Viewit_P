from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.tts_service import generate_tts_audio

router = APIRouter()

class TTSRequest(BaseModel):
    text: str

@router.post("/")
async def tts_synthesize(data: TTSRequest):
    try:
        audio_url = generate_tts_audio(data.text)  # 실제 mp3 파일 URL 반환
        return {"audio_url": audio_url}
    except Exception as e:
        raise HTTPException(500, detail=f"TTS 에러: {e}")