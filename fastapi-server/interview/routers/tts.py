from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from interview.services.tts_service import generate_tts_audio
from interview.utils.logger_utils import timing_logger
router = APIRouter()

class TTSRequest(BaseModel):
    text: str

@router.post("/start")
@timing_logger("TTS전체 처리")
async def tts_synthesize(data: TTSRequest):
    try:
        audio_url = generate_tts_audio(data.text)
        return {"audio_url": audio_url}
    except Exception as e:
        raise HTTPException(500, detail=f"TTS 에러: {e}")
