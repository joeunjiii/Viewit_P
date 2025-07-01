from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
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

@router.get("/voice-options")
async def get_voice_options():
    
    options = [
        {"id": "default", "label": "기본 목소리"},
        {"id": "korean_female", "label": "여성 - 차분한"},
        {"id": "korean_male", "label": "남성 - 명확한"},
        # ...더 추가 가능
    ]
    return JSONResponse(content=options)