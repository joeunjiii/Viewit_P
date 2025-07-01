from fastapi import APIRouter, UploadFile, File, HTTPException
import os
from interview.services.whisper_service import stt_from_webm
from interview.utils.logger_utils import timing_logger
router = APIRouter()
UPLOAD_DIR = "./interview/uploads/webm"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/")
@timing_logger("STT 전체 처리")
async def speech_to_text(audio: UploadFile = File(...)):
    print("STT API 진입")
    # ( 호출 :: DB 저장 할 수 있는 코드  )
    print("audio.filename:", audio.filename)

    # 1) 파일 읽기
    audio_bytes = await audio.read()
    print("audio_bytes size:", len(audio_bytes))

    # 2) 파일 저장
    webm_path = os.path.join(UPLOAD_DIR, audio.filename)
    with open(webm_path, "wb") as f:
        f.write(audio_bytes)
    print("실제 저장된 파일 사이즈", os.path.getsize(webm_path))

    # 3) 파일 존재/사이즈 체크
    if not os.path.exists(webm_path) or os.path.getsize(webm_path) == 0:
        raise HTTPException(500, detail="저장된 파일이 존재하지 않거나 사이즈가 0입니다.")

    # 4) STT 처리 (여기서 CUDA 사용!)
    try:
        abs_webm_path = os.path.abspath(webm_path)
        text = stt_from_webm(abs_webm_path)
        if not text or not text.strip():
            text = "소리없음"
        return {"text": text}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(500, detail=f"STT 처리 오류: {e}")
    
    