import pytesseract
from pdf2image import convert_from_path
import PyPDF2


def extract_text_with_pypdf2(pdf_path: str) -> str:
    with open(pdf_path, "rb") as f:
        reader = PyPDF2.PdfReader(f)
        all_text = ""
        for page in reader.pages:
            text = page.extract_text() or ""
            all_text += text.strip() + "\n"
    return all_text

def extract_text_with_ocr(pdf_path: str, lang: str = "kor+eng") -> str:
    pages = convert_from_path(pdf_path, dpi=300)
    all_text = ""
    for i, page in enumerate(pages):
        text = pytesseract.image_to_string(page, lang=lang)
        all_text += text + "\n"
    return all_text

def extract_text_from_pdf(pdf_path: str, lang: str = "kor+eng", min_text_length: int = 50) -> str:
    # 1. 텍스트 추출 먼저 시도
    text = extract_text_with_pypdf2(pdf_path)
    # 2. 충분한 텍스트가 있으면 텍스트 PDF로 간주
    if len(text.replace("\n", "").strip()) > min_text_length:
        print("텍스트 PDF로 인식됨 (OCR 불필요)")
        return text
    else:
        print("이미지 PDF로 인식됨 (OCR 수행)")
        return extract_text_with_ocr(pdf_path, lang=lang)
