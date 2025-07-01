import os
import hashlib
import requests
from dotenv import load_dotenv

load_dotenv()

ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
VOICE_ID = "7Nah3cbXKVmGX7gQUuwz"  # ElevenLabs의 기본 한국어/기본 목소리 id, 커스텀 가능
print(f"API 키: {ELEVENLABS_API_KEY}")
def generate_tts_audio(text: str) -> str:
    h = hashlib.md5(text.encode()).hexdigest()[:8]
    filename = f"q_{h}.mp3"
    save_path = os.path.join("static", "audio", filename)

    if not os.path.exists(save_path):
        os.makedirs(os.path.dirname(save_path), exist_ok=True)
        
        # ElevenLabs API 호출
        url = f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}"
        headers = {
            "xi-api-key": ELEVENLABS_API_KEY,
            "Content-Type": "application/json"
        }
        payload = {
            "text": text,
            "model_id": "eleven_multilingual_v2",  # 최신 모델 권장
            "voice_settings": {
                "stability": 0.7,
                "similarity_boost": 0.75
            }
        }
        response = requests.post(url, headers=headers, json=payload)
        if response.status_code == 200:
            with open(save_path, "wb") as f:
                f.write(response.content)
        else:
            raise Exception(f"ElevenLabs TTS API 실패: {response.status_code} {response.text}")

    return f"/static/audio/{filename}"
