import pytesseract
from pdf2image import convert_from_path

def extract_text_from_pdf(pdf_path: str, lang: str = "kor+eng") -> str:
    # PDF → 이미지 변환
    pages = convert_from_path(pdf_path, dpi=300)
    all_text = ""
    for page in pages:
        text = pytesseract.image_to_string(page, lang=lang)
        all_text += text + "\n"
    return all_text
