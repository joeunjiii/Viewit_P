# 모델만 로딩
import whisper
import os
import subprocess
from dotenv import load_dotenv
import io
import torch
import torch
# .env 파일 읽기
load_dotenv()
FFMPEG_BIN_PATH = os.getenv("FFMPEG_BIN_PATH")
if not FFMPEG_BIN_PATH:
    raise RuntimeError("FFMPEG_BIN_PATH 환경변수가 설정되지 않았습니다.")


device = "cuda" if torch.cuda.is_available() else "cpu"
if device == "cuda":
    print("🔊 Whisper 모델 불러오는 중... (GPU 사용)")
else:
    print("🔊 Whisper 모델 불러오는 중... (CPU 사용)")

model = whisper.load_model("base").to(device)
print("✅ Whisper 모델 로딩 완료 (device:", device, ")")
print(torch.cuda.memory_allocated() / 1024 ** 2, "MB")

def convert_webm_to_wav(webm_path: str, wav_path: str):
    cmd = [
        FFMPEG_BIN_PATH, "-y",
        "-i", webm_path,
        "-acodec", "pcm_s16le",
        "-ar", "16000",
        "-ac", "1",
        wav_path
    ]
    try:
        result = subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=30)
        # 변환 후 파일 존재/크기 확인
        if not os.path.exists(wav_path) or os.path.getsize(wav_path) == 0:
            raise RuntimeError("wav 파일 변환 실패(파일 없음 또는 크기 0)")
    except subprocess.CalledProcessError as e:
        print("ffmpeg 변환 실패:", e.stderr.decode())
        raise RuntimeError(f"ffmpeg 변환 실패: {e.stderr.decode()}")
    except subprocess.TimeoutExpired:
        print("ffmpeg 실행이 시간초과로 종료됨")
        raise RuntimeError("ffmpeg 변환 timeout")

def stt_from_webm(webm_path: str):
    wav_path = webm_path.rsplit(".", 1)[0] + ".wav"
    try:
        convert_webm_to_wav(webm_path, wav_path)
    except Exception as e:
        print(f"[ERROR] 웹엠 → wav 변환 에러: {e}")
        raise RuntimeError(f"webm → wav 변환 실패: {e}")

    try:
        result = model.transcribe(wav_path, language="ko")
        text = result.get("text", "")
        return text
    except Exception as e:
        print(f"[ERROR] Whisper 변환 에러: {e}")
        raise RuntimeError(f"Whisper 변환 실패: {e}")
    finally:
        # wav 임시파일 삭제
        if os.path.exists(wav_path):
            try:
                os.remove(wav_path)
            except Exception:
                pass