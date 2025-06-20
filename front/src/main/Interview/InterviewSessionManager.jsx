// src/main/Interview/InterviewSessionManager.jsx
import React, { useState, useRef, useEffect } from "react";
import MicRecorder from "./asset/Mic/MicRecorder";
import { nextQuestion } from "./api/interview";
import { requestSpeechToText } from "./api/stt";
import Timer from "./asset/Timer";

const PHASE = {
  IDLE: "idle",
  READY: "ready", // 준비(시작)
  TTS: "tts", // 질문 음성 재생
  WAITING: "wait", // 대기시간
  RECORDING: "recording", // 답변 녹음
  UPLOADING: "uploading", // 업로드
  COMPLETE: "complete", // 다음 질문 대기
};

function InterviewSessionManager({
                                   sessionId,
                                   jobRole,
                                   waitTime = 3,
                                   answerDuration = 10,
                                   allowRetry = true,
                                   initialQuestion,
                                   onStatusChange,
                                   onTimeUpdate,
                                   onNewQuestion,
                                   onAnswerComplete,
                                 }) {
  // 시작은 TTS 단계로: initialQuestion의 audio_url 재생
  const [phase, setPhase] = useState(PHASE.TTS);
  const [question, setQuestion] = useState(initialQuestion);
  const [remainingTime, setRemainingTime] = useState(0);
  const [sttResult, setSttResult] = useState(null);

  const timerRef = useRef(null);
  const recorderRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    if (startInterview && phase === PHASE.IDLE) {
      console.log(
        "🚀 InterviewSessionManager: 면접 시작 신호 감지, READY로 전환"
      );
      setPhase(PHASE.READY);
    }
  }, [startInterview, phase]);

  // phase 바뀔 때마다 로직 분기(useEffect 1개)
  useEffect(() => {
    onStatusChange?.(phase);
    if (phase === PHASE.TTS && question?.audio_url) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      const audio = new Audio("http://localhost:8000" + question.audio_url);
      audioRef.current = audio;
      audio.onended = () => setPhase(PHASE.WAITING);
      audio.play().catch(() => setPhase(PHASE.WAITING));
    }
  }, [phase, question, onStatusChange]);

  // ⏱️ WAITING & RECORDING 타이머 관리
  useEffect(() => {
    clearInterval(timerRef.current);

    if (phase === PHASE.WAITING) {
      setRemainingTime(waitTime);
      onTimeUpdate?.(waitTime);
      timerRef.current = setInterval(() => {
        setRemainingTime(prev => {
          onTimeUpdate?.(prev - 1);
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setPhase(PHASE.RECORDING);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

      case PHASE.RECORDING:
        recorderRef.current?.start && recorderRef.current.start();
        // 4. 녹음 시작 + 답변 타이머
        // setRemainingTime(answerDuration);
        // onTimeUpdate?.(answerDuration);
        
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
  }, [phase, waitTime, answerDuration, onTimeUpdate]);

  // 답변 녹음 끝 → 서버 전송
  const handleRecordingComplete = async (blob) => {
    //잘 들리는지 확인한 코드 개발중에는 두고 나중에 지우기
    console.log(
      "녹음 결과 Blob:",
      blob,
      "size:",
      blob.size,
      "type:",
      blob.type
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = "녹음_결과.webm"; // 파일 이름
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
      const data = await requestSpeechToText(blob);
      setSttResult(data.text);
      setPhase(PHASE.COMPLETE);
    } catch (err) {
      console.error("STT 오류:", err);
    }
  };

  // STT 결과 → 인터뷰로 전달
  useEffect(() => {
    if (phase === PHASE.COMPLETE && sttResult) {
      console.log("🎉 [COMPLETE] 프론트에 결과 전달:", sttResult);
      onAnswerComplete?.(sttResult); // 인터뷰 컴포넌트로 전달 등
      setSttResult(null);
    }
  }, [phase, sttResult, sessionId, onAnswerComplete, onNewQuestion]);

  // ↺ 다시 답변하기
  const handleRetry = () => {
    setRemainingTime(waitTime);
    setPhase(PHASE.WAITING);
  };

  // UI 렌더링
  return (
      <div className="interview-session">
        <MicRecorder
            ref={recorderRef}
            isRecording={phase === PHASE.RECORDING}
            onStop={handleRecordingComplete}
        />

      {phase === PHASE.WAITING && (
        <div className="timer-area">
          <Timer duration={remainingTime} autoStart={true} label="대기시간" />
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
