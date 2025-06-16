# 모델만 로딩
import whisper

print("🔊 Whisper 모델 불러오는 중...")
model = whisper.load_model("small")
print("✅ Whisper 모델 로딩 완료")
