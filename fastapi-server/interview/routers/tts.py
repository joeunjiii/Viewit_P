from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from interview.services.tts_service import generate_tts_audio

router = APIRouter()

class TTSRequest(BaseModel):
    text: str

@router.post("/start")
async def tts_synthesize(data: TTSRequest):
    try:
        audio_url = generate_tts_audio(data.text)
        return {"audio_url": audio_url}
    except Exception as e:
        raise HTTPException(500, detail=f"TTS 에러: {e}")
