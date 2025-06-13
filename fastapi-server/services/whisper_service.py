# services/whisper_service.py
import whisper

print("🔊 Whisper 모델 불러오는 중...")
model = whisper.load_model("small")  # tiny, base, small, medium, large
print("✅ Whisper 모델 로딩 완료")

def transcribe_audio(file_path: str) -> str:
    result = model.transcribe(file_path)
    return result["text"]
