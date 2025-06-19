import React, { useEffect, useRef, useState } from "react";
import MicRecorder from "./asset/Mic/MicRecorder";
import { requestNextTTSQuestion, requestTTS } from "./api/tts";
import { requestSpeechToText } from "./api/stt";
import Timer from "./asset/Timer";

const PHASE = {
  IDLE: "idle",  
  READY: "ready",         // 준비(시작)
  TTS: "tts",             // 질문 음성 재생
  WAITING: "wait",        // 대기시간
  RECORDING: "recording", // 답변 녹음
  UPLOADING: "uploading", // 업로드
  COMPLETE: "complete",   // 다음 질문 대기
};

function InterviewSessionManager({
  startInterview = false,
  waitTime = 3,
  answerDuration = 10,
  allowRetry = true,
  onStatusChange,
  onTimeUpdate,
  onAnswerComplete,
}) {
  const [phase, setPhase] = useState(PHASE.READY);
  const [question, setQuestion] = useState(null);
  const [remainingTime, setRemainingTime] = useState(0);
  const [sttResult, setSttResult] = useState(null);

  const timerRef = useRef(null);
  const recorderRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    if (startInterview && phase === PHASE.IDLE) {
      console.log("🚀 InterviewSessionManager: 면접 시작 신호 감지, READY로 전환");
      setPhase(PHASE.READY);
    }
  }, [startInterview, phase]);
  
  // phase 바뀔 때마다 로직 분기(useEffect 1개)
  useEffect(() => {
    onStatusChange?.(phase);
    // 공통: 타이머 항상 정리
    clearInterval(timerRef.current);

    switch (phase) {
      case PHASE.IDLE:
        // startInterview가 true가 되기 전까지 대기
        break;
      case PHASE.READY:
        // 1. 질문+TTS URL 요청
        (async () => {
          let result;
          if (!question) {
            const audioUrl = await requestTTS();
            result = { audioUrl, question: "자기소개 부탁드립니다." };
          } else {
            result = await requestNextTTSQuestion();
          }
          setQuestion(result);
          setPhase(PHASE.TTS);
        })();
        break;

      case PHASE.TTS:
        // 2. 오디오 재생
        if (question?.audioUrl) {
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
          }
          const audio = new Audio("http://localhost:8000" + question.audioUrl);
          audioRef.current = audio;
          audio.onended = () => setPhase(PHASE.WAITING);
          audio.play().catch(() => setPhase(PHASE.WAITING)); // 실패 시도 WAITING
        }
        break;

      case PHASE.WAITING:
        // 3. 대기 타이머 시작
        setRemainingTime(waitTime);
        onTimeUpdate?.(waitTime);
        timerRef.current = setInterval(() => {
          setRemainingTime((prev) => {
            onTimeUpdate?.(prev - 1);
            if (prev <= 1) {
              clearInterval(timerRef.current);
              setPhase(PHASE.RECORDING);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        break;

      case PHASE.RECORDING:
        // 4. 녹음 시작 + 답변 타이머
        // setRemainingTime(answerDuration);
        // onTimeUpdate?.(answerDuration);
        recorderRef.current?.start && recorderRef.current.start();
        // timerRef.current = setInterval(() => {
        //   setRemainingTime((prev) => {
        //     onTimeUpdate?.(prev - 1);
        //     if (prev <= 1) {
        //       clearInterval(timerRef.current);
        //       setPhase(PHASE.UPLOADING);
        //       recorderRef.current?.stop();
        //       return 0;
        //     }
        //     return prev - 1;
        //   });
        // }, 1000);
        break;

      case PHASE.UPLOADING:
        // 5. 업로드(녹음 종료 후 handleRecordingComplete에서 phase 전이)
        break;

      case PHASE.COMPLETE:
        // 6. 다음 질문 대기(1초 후 자동)
        setTimeout(() => setPhase(PHASE.READY), 1000);
        break;

      default:
        break;
    }

    // Clean-up: phase 바뀔 때마다 타이머 정리
    return () => clearInterval(timerRef.current);

    // eslint-disable-next-line
  }, [phase]); // phase만 감시!

  // 답변 녹음 끝 → 서버 전송
  const handleRecordingComplete = async (blob) => {

    //잘 들리는지 확인한 코드 개발중에는 두고 나중에 지우기
    console.log("녹음 결과 Blob:", blob, "size:", blob.size, "type:", blob.type);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = '녹음_결과.webm'; // 파일 이름
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);

    //실제 서버업로드
    // 2. FastAPI 서버로 음성 파일 업로드 및 STT 변환 요청
    console.log("🔄 [UPLOADING] 서버에 파일 업로드 중...");
    setPhase(PHASE.UPLOADING); // (로딩 표시 등)
    try {
      const data = await requestSpeechToText(blob); // 이 한 줄로 OK!
      setSttResult(data.text);
      console.log("✅ [COMPLETE] 변환 결과 수신:", data.text);
      setPhase(PHASE.COMPLETE);
    } catch (err) {
      console.error("STT 오류:", err);
    }
    
  };

  // STT 결과 → 부모로 전달
  useEffect(() => {
    if (phase === PHASE.COMPLETE && sttResult) {
      console.log("🎉 [COMPLETE] 프론트에 결과 전달:", sttResult);
      onAnswerComplete?.(sttResult); // 부모 컴포넌트로 전달 등
      setSttResult(null);
      // 또는 결과 UI에 표시
      // 그 후 다음 질문 준비(phase READY로 재전환)
    }
  }, [phase, sttResult, onAnswerComplete]);

  // 다시 답변하기
  const handleRetry = () => {
    setRemainingTime(waitTime);
    setPhase(PHASE.WAITING);
  };

  // UI 렌더
  return (
    <div className="interview-session">
      <MicRecorder
        ref={recorderRef}
        isRecording={phase === PHASE.RECORDING}
        onStop={handleRecordingComplete}
      />

      {phase === PHASE.WAITING && (
        <div className="timer-area">
          <Timer
            duration={remainingTime}
            autoStart={true}
            label="대기시간"
          />
          {allowRetry && (
            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
              <button className="replay-button" onClick={handleRetry}>
                다시 답변하기
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default InterviewSessionManager;
