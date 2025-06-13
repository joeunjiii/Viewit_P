from fastapi import APIRouter, UploadFile, File
from services.whisper_service import transcribe_audio  # 여기서 whisper 모델과 연결됨

router = APIRouter()

@router.post("/stt")
async def speech_to_text(audio: UploadFile = File(...)):
    # 파일 저장하고
    file_path = f"temp_{audio.filename}"
    # 👇 Whisper 모델로 텍스트 변환
    text = transcribe_audio(file_path)
    return {"text": text}
