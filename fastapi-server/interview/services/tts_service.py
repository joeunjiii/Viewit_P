# services/tts_service.py
from gtts import gTTS
import os
import hashlib

def generate_tts_audio(text: str) -> str:
    # text 내용으로 MD5 해시를 구해, 파일명 충돌 방지
    h = hashlib.md5(text.encode()).hexdigest()[:8]
    filename = f"q_{h}.mp3"
    save_path = os.path.join("static", "audio", filename)

    # 파일이 아직 없으면 새로 생성
    if not os.path.exists(save_path):
        os.makedirs(os.path.dirname(save_path), exist_ok=True)
        tts = gTTS(text=text, lang="ko")
        tts.save(save_path)

    # 프론트에 전달할 URL 경로
    return f"/static/audio/{filename}"
