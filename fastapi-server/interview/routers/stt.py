from fastapi import APIRouter, UploadFile, File, HTTPException, Form
import os
import datetime
import traceback
from interview.services.whisper_service import stt_from_webm
from interview.utils.logging_utils import insert_log

router = APIRouter()
UPLOAD_DIR = "./interview/uploads/webm"
os.makedirs(UPLOAD_DIR, exist_ok=True)

MAX_SIZE = 20 * 1024 * 1024

@router.post("/")
async def speech_to_text(
    audio: UploadFile = File(...),
    session_id: str = Form(...)
):
    print("STT API 진입")
    
    # 파일명 방어
    filename = os.path.basename(audio.filename)
    webm_path = os.path.join(UPLOAD_DIR, filename)
    
    # STT 시작 로깅
    t1 = datetime.datetime.now()
    insert_log(session_id, "stt", "STT 처리 시작", t1)
    
    try:
        # 파일 읽기
        audio_bytes = await audio.read()
        print("audio_bytes size:", len(audio_bytes))
        if len(audio_bytes) == 0:
            raise HTTPException(400, detail="업로드된 파일이 비어 있습니다.")
        if len(audio_bytes) > MAX_SIZE:
            raise HTTPException(413, detail="업로드 파일이 너무 큽니다.")

        # 파일 저장
        try:
            with open(webm_path, "wb") as f:
                f.write(audio_bytes)
        except Exception as e:
            traceback.print_exc()
            raise HTTPException(500, detail=f"파일 저장 실패: {e}")

        print("실제 저장된 파일 사이즈", os.path.getsize(webm_path))
        if not os.path.exists(webm_path) or os.path.getsize(webm_path) == 0:
            raise HTTPException(500, detail="저장된 파일이 존재하지 않거나 사이즈가 0입니다.")

        # STT 처리
        try:
            abs_webm_path = os.path.abspath(webm_path)
            text = stt_from_webm(abs_webm_path)
            if not text or not text.strip():
                text = "소리없음"
                
            # STT 완료 로깅
            t2 = datetime.datetime.now()
            insert_log(session_id, "stt", "STT 처리 완료", t1, t2)
                
            return {"text": text}
        except Exception as e:
            traceback.print_exc()
            raise HTTPException(500, detail=f"STT 처리 오류: {e}")

    except HTTPException as e:
        # 이미 핸들된 에러는 그냥 다시 raise
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(500, detail=f"알 수 없는 서버 에러: {e}")
        
        