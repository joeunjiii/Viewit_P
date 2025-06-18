from fastapi import APIRouter, UploadFile, File
import os
from services.whisper_service import stt_from_webm

router = APIRouter()

UPLOAD_DIR = "./interview/uploads/webm"

@router.post("/stt")
async def speech_to_text(audio: UploadFile = File(...)):
    # 1. webm 저장
    webm_path = os.path.join(UPLOAD_DIR, audio.filename)
    with open(webm_path, "wb") as f:
        f.write(await audio.read())
    # 2. STT 처리
    try:
        text = stt_from_webm(webm_path)
        print("STT 결과:", repr(text))
        if not text or text.strip() == "":
            # 결과가 없을 때
            text = "소리없음"
    except Exception as e:
        print("STT 오류:", e)
        return {"error": str(e)}
    return {"text": text}