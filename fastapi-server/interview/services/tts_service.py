import os
import hashlib
import requests
from dotenv import load_dotenv

from fastapi import APIRouter
load_dotenv()

ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")

print(f"API 키: {ELEVENLABS_API_KEY}")
def generate_tts_audio(text: str, voice_id: str) -> str:
    print(f"[TTS-DEBUG] voice_id: {voice_id}")
    print(f"[TTS-DEBUG] text: {text}")

    h = hashlib.md5((text + voice_id).encode()).hexdigest()[:8]
    filename = f"q_{h}.mp3"
    save_path = os.path.join("static", "audio", filename)

    print(f"[TTS-DEBUG] save_path: {save_path}")

    if not os.path.exists(save_path):
        os.makedirs(os.path.dirname(save_path), exist_ok=True)
        
        # ElevenLabs API 호출
        url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
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
        print(f"[TTS-DEBUG] 요청 url: {url}")
        print(f"[TTS-DEBUG] headers: {headers}")
        print(f"[TTS-DEBUG] payload: {payload}")

        response = requests.post(url, headers=headers, json=payload)
        print(f"[TTS-DEBUG] ElevenLabs 응답코드: {response.status_code}")
        print(f"[TTS-DEBUG] ElevenLabs 응답내용: {response.text[:500]}")  # 처음 500자만
        if response.status_code == 200:
            with open(save_path, "wb") as f:
                f.write(response.content)
                print(f"[TTS-DEBUG] 파일 저장 성공: {save_path}")
        else:
            print(f"[TTS-DEBUG] 파일 저장 실패, Exception 발생")
            raise Exception(f"ElevenLabs TTS API 실패: {response.status_code} {response.text}")

    return f"/static/audio/{filename}"

