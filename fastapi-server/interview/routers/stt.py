from fastapi import APIRouter, UploadFile, File
import shutil
import os
from services.whisper_service import model  # 모델만 import

router = APIRouter()

@router.post("/stt")
async def speech_to_text(audio: UploadFile = File(...)):
    file_path = f"./interview/uploads/temp_{audio.filename}"
    try:
        # 1. 파일 저장
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(audio.file, buffer)

        # 2. Whisper 변환 (transcribe)
        result = model.transcribe(file_path)

        # 3. 변환 후 임시 파일 삭제 (권장)
        os.remove(file_path)

        # 4. 텍스트만 리턴
        return {"text": result["text"]}
    except Exception as e:
        # 혹시 변환 실패해도 파일 정리
        if os.path.exists(file_path):
            os.remove(file_path)
        return {"error": str(e)}