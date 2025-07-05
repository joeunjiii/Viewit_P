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

# @router.get("/voice-options")
# async def get_voice_options():
    
#     options = [
#         {"id": "ErXwobaYiN019PkySvjV", "label": "기본 목소리"},
#         {"id": "AW5wrnG1jVizOYY7R1Oo", "label": "차분한 여성"},
#         {"id": "fLvpMIGwcTmxzsUF4z1U", "label": "편안한 목소리(남성)"},
#         {"id": "4JJwo477JUAx3HV0T7n7", "label": "자신감 있는 목소리(남성)"},
#         # ...더 추가 가능
#     ]
#     return JSONResponse(content=options)