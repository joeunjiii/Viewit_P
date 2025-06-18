# services/tts_service.py
from gtts import gTTS
import os
import hashlib

def generate_tts_audio(text: str) -> str:
    # filename = "intromyself.mp3"
    h = hashlib.md5(text.encode()).hexdigest()[:8]
    filename = f"q_{h}.mp3"
    save_path = os.path.join("static", "audio", filename)

    # 🔍 파일이 이미 존재하면 생성하지 않고 경로만 반환
    if not os.path.exists(save_path):
        os.makedirs(os.path.dirname(save_path), exist_ok=True)
        tts = gTTS(text=text, lang="ko")
        tts.save(save_path)
   

    return f"/static/audio/{filename}"  # 프론트에 넘길 URL 경로
