from fastapi import APIRouter, UploadFile, File
import shutil
import os
from services.whisper_service import model  # 모델만 import
import subprocess
import asyncio
import anyio
import time
router = APIRouter()

WEBM_DIR = "./interview/uploads/webm"
WAV_DIR = "./interview/uploads/wav"
FFMPEG_BIN_PATH = r"C:\Program Files\ffmpeg-7.0.2-essentials_build\bin\ffmpeg.exe" # <--- 이 줄을 추가하고 경로를 수정하세요!
os.makedirs(WEBM_DIR, exist_ok=True)
os.makedirs(WAV_DIR, exist_ok=True)

# 서버 시작 시 현재 작업 디렉토리 및 절대 경로 출력 (정보 확인용)
print(f"Server CWD: {os.getcwd()}")
print(f"WEBM_DIR absolute path: {os.path.abspath(WEBM_DIR)}")
print(f"WAV_DIR absolute path: {os.path.abspath(WAV_DIR)}")


@router.post("/stt")
async def speech_to_text(audio: UploadFile = File(...)):
    # 파일 이름을 고정하고 경로를 직접 설정
    filename_safe = os.path.basename(audio.filename) # 파일명에서 경로 정보 제거 (보안)
    webm_path = os.path.join(WEBM_DIR, filename_safe)
    wav_name = filename_safe.rsplit(".", 1)[0] + ".wav" # 확장자를 .wav로 변경
    wav_path = os.path.join(WAV_DIR, wav_name)

    print(f"저장 시도 경로 (WebM): {os.path.abspath(webm_path)}")
    print(f"변환될 WAV 경로: {os.path.abspath(wav_path)}")
    print(f"클라이언트에서 받은 파일 이름: {audio.filename}")

    try:
        # 1. webm 파일 저장
        # audio.file의 포인터를 파일 시작점으로 돌립니다.
        # (shutil.copyfileobj는 현재 포인터부터 읽기 때문에 중요합니다.)
        audio.file.seek(0)
        with open(webm_path, "wb") as buffer:
            shutil.copyfileobj(audio.file, buffer)
        print(f"✅ WEBM 저장 완료: {webm_path}")
        # --- 저장된 파일 존재 여부 및 크기 확인 (디버깅용, 필요 없으면 삭제) ---
        if os.path.exists(webm_path):
            saved_webm_size = os.path.getsize(webm_path)
            print(f"💡 저장된 WEBM 파일 실제 존재 확인: True, 크기: {saved_webm_size} bytes")
            if saved_webm_size == 0:
                print("⚠️ 경고: 저장된 WEBM 파일 크기가 0입니다. 내용이 비어있을 수 있습니다.")
        else:
            print("❌ 심각: WEBM 파일이 저장 완료 메시지에도 불구하고 존재하지 않습니다.")
        # --------------------------------------------------------

        # 2. FFmpeg로 WAV 변환
        print("🔄 FFmpeg 변환 시작")
        # FFMPEG_BIN_PATH 변수를 사용합니다.
        ffmpeg_cmd = [FFMPEG_BIN_PATH, "-y", "-i", webm_path, wav_path] # <--- 이 부분은 이미 수정되어 있을 겁니다.

        ffmpeg_result = await anyio.to_thread.run_sync(
            lambda: subprocess.run(ffmpeg_cmd, check=True, capture_output=True, text=True)
        )
        print(f"✅ WAV 변환 완료: {wav_path}")
        print(f"FFmpeg stdout: {ffmpeg_result.stdout.strip()}")
        print(f"FFmpeg stderr: {ffmpeg_result.stderr.strip()}")

        if os.path.exists(wav_path):
            saved_wav_size = os.path.getsize(wav_path)
            print(f"💡 변환된 WAV 파일 실제 존재 확인: True, 크기: {saved_wav_size} bytes")
            if saved_wav_size == 0:
                print("⚠️ 경고: 변환된 WAV 파일 크기가 0입니다. 변환 실패 가능성.")
        else:
            print("❌ 심각: WAV 파일이 변환 완료 메시지에도 불구하고 존재하지 않습니다.")
        
       # --- 파일이 다른 프로세스에 의해 잠겨있지 않은지 확인하며 대기 ---
        # 최대 30초 동안 0.5초 간격으로 파일 접근 가능 여부 시도
        max_retries = 60 # 0.5초 * 60 = 30초
        retry_delay = 0.5 # 0.5초
        file_ready = False
        for i in range(max_retries):
            try:
                # 파일을 읽기 모드로 열어봅니다. 성공하면 파일이 잠겨있지 않다는 의미입니다.
                with open(wav_path, 'rb') as f:
                    # 파일이 비어있는지 확인 (선택 사항, 이미 위에서 크기 확인했음)
                    # if f.read(1): # 최소 1바이트라도 읽을 수 있는지 확인
                    pass # 파일이 열렸으면 OK
                file_ready = True
                print(f"✅ WAV 파일 접근 가능 확인 (시도 {i+1}회).")
                break
            except IOError as e:
                print(f"⏳ WAV 파일 잠김 또는 접근 불가 (시도 {i+1}회): {e}. 재시도...")
                await asyncio.sleep(retry_delay)
            except Exception as e:
                print(f"❌ WAV 파일 접근 중 예기치 않은 오류: {e}")
                break # 다른 예외 발생 시 루프 종료

        if not file_ready:
            raise Exception(f"WAV 파일 '{wav_path}'이(가) 지정된 시간 내에 접근 가능해지지 않았습니다. 파일 잠금 또는 권한 문제일 수 있습니다.")
        # --- 파일 접근 가능 확인 로직 끝 ---
        
        normalized_wav_path = os.path.normpath(wav_path)
        
        # 3. Whisper 모델로 STT 변환 (블로킹 작업이므로 anyio.to_thread.run_sync 사용)
        print("🗣️ Whisper STT 변환 시작")
        stt_result = await anyio.to_thread.run_sync(model.transcribe, normalized_wav_path) # <--- 여기서 anyio 사용
        print(f"✅ Whisper STT 변환 완료: {stt_result['text'][:100]}...")

        # 4. 임시 파일 삭제 (선택 사항)
        # os.remove(webm_path)
        # os.remove(wav_path)
        # print(f"🧹 임시 파일 삭제 완료: {webm_path}, {wav_path}")

        return {"text": stt_result["text"]}
    except subprocess.CalledProcessError as e:
        print(f"❌ FFmpeg 변환 중 오류 발생: {e}")
        # ... (기존 오류 처리 로직 유지) ...
        if os.path.exists(webm_path): os.remove(webm_path)
        if os.path.exists(wav_path): os.remove(wav_path)
        return {"error": f"오디오 변환 오류: {e.stderr.strip()}"}
    except Exception as e:
        print(f"❌ 예기치 않은 오류 발생: {e}")
        # ... (기존 오류 처리 로직 유지) ...
        if os.path.exists(webm_path): os.remove(webm_path)
        if os.path.exists(wav_path): os.remove(wav_path)
        return {"error": f"서버 처리 오류: {str(e)}"}