# 모델만 로딩
import whisper
import os
import subprocess

FFMPEG_BIN_PATH = r"C:\Users\smhrd\ffmpeg-7.1.1-essentials_build\bin\ffmpeg.exe"

print("🔊 Whisper 모델 불러오는 중...")
model = whisper.load_model("small")
print("✅ Whisper 모델 로딩 완료")

def convert_webm_to_wav(webm_path: str, wav_path: str):
    cmd = [
        FFMPEG_BIN_PATH, "-y",
        "-i", webm_path,
        "-acodec", "pcm_s16le",
        "-ar", "16000",
        "-ac", "1",
        wav_path
    ]
    subprocess.run(cmd, check=True)

def stt_from_webm(webm_path: str):
    # 1. webm → wav 변환
    wav_path = webm_path.rsplit(".", 1)[0] + ".wav"
    convert_webm_to_wav(webm_path, wav_path)
    # 2. Whisper로 STT
    result = model.transcribe(wav_path, language="ko")
    return result["text"]