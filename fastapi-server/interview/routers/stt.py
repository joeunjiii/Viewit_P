from fastapi import APIRouter, UploadFile, File
import os
from services.whisper_service import stt_from_webm

router = APIRouter()

UPLOAD_DIR = "./interview/uploads/webm"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/stt")
async def speech_to_text(audio: UploadFile = File(...)):
    # 1. webm 저장
    webm_path = os.path.join(UPLOAD_DIR, audio.filename)
    with open(webm_path, "wb") as f:
        f.write(await audio.read())
    abs_webm_path = os.path.abspath(webm_path)
    
    
    print("파일 저장됨:", abs_webm_path)
    print("저장 경로 존재 여부:", os.path.exists(abs_webm_path))
    print("현재 작업 디렉토리:", os.getcwd())
    
    if not os.path.exists(webm_path):
        print("실제 경로에 파일 없음:", webm_path)
        return {"error": "파일이 저장되지 않았습니다."}
    # 2. STT 처리
    try:
        text = stt_from_webm(abs_webm_path)
        print("STT 결과:", repr(text))
        if not text or text.strip() == "":
            # 결과가 없을 때
            text = "소리없음"
    except Exception as e:
        print("STT 오류:", e)
        return {"error": str(e)}
    return {"text": text}