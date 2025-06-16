from fastapi import APIRouter, UploadFile, File
import shutil
from services.whisper_service import model  # 모델만 import

router = APIRouter()

@router.post("/stt")
async def speech_to_text(audio: UploadFile = File(...)):
    file_path = f"./interview/uploads/temp_{audio.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(audio.file, buffer)

    # 🔍 변환은 여기서 처리
    result = model.transcribe(file_path)
    return {"text": result["text"]}
