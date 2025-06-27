from fastapi import APIRouter, UploadFile, File, Form
import os
from interview.services.ocr_service import extract_text_from_pdf

router = APIRouter()


@router.post("/upload")
async def upload_jd(jd_text: str = Form(""), file: UploadFile = File(None)):
    print("==== [JD 업로드 API 호출] ====")
    print("받은 JD 텍스트:", repr(jd_text))
    print("받은 파일:", file.filename if file else None)
    print("파일 타입:", file.content_type if file else None)
    # 저장 경로 설정
    UPLOAD_DIR = "./uploads"
    os.makedirs(UPLOAD_DIR, exist_ok=True)

    saved_path = None
    pdf_ocr_text = ""
    if file:
        saved_path = os.path.join(UPLOAD_DIR, file.filename)
        with open(saved_path, "wb") as f:
            f.write(await file.read())
        # ✅ 업로드 즉시 OCR 파싱
        try:
            pdf_ocr_text = extract_text_from_pdf(saved_path)
        except Exception as e:
            pdf_ocr_text = ""
            print("PDF OCR 실패:", e)
    return {
        "message": "JD 업로드 및 OCR 파싱 성공",
        "jd_text": jd_text,
        "file_saved": saved_path,
        "pdf_ocr_text": pdf_ocr_text,  # OCR로 추출한 텍스트 바로 반환
    }
