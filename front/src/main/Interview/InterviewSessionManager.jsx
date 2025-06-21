import React, { useState, useRef, useEffect } from "react";
import MicRecorder from "./asset/Mic/MicRecorder";
import { nextQuestion } from "./api/interview";
import { requestSpeechToText } from "./api/stt";
import Timer from "./asset/Timer";

const PHASE = {
  READY: "ready",
  TTS: "tts",
  WAITING: "wait",
  RECORDING: "recording",
  UPLOADING: "uploading",
  COMPLETE: "complete",
};

function InterviewSessionManager({
  sessionId,
  jobRole,
  waitTime = 3,
  allowRetry = true,
  initialQuestion,
  onStatusChange,
  onTimeUpdate,
  onNewQuestion,
  onAnswerComplete,
}) {
  // 첫 질문부터 셋팅!
  const [phase, setPhase] = useState(PHASE.TTS);
  const [question, setQuestion] = useState(initialQuestion);
  const [remainingTime, setRemainingTime] = useState(0);
  const [sttResult, setSttResult] = useState(null);

  const timerRef = useRef(null);
  const recorderRef = useRef(null);
  const audioRef = useRef(null);

  // props의 initialQuestion이 변경될 때마다 동기화
  useEffect(() => {
    setQuestion(initialQuestion);
    setPhase(PHASE.TTS);
  }, [initialQuestion]);

  // 오디오 재생
  useEffect(() => {
    onStatusChange?.(phase);
    if (phase === PHASE.TTS && question?.audio_url) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      const url = question.audio_url.startsWith("http")
        ? question.audio_url
        : "http://localhost:8000" + question.audio_url;
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => setPhase(PHASE.WAITING);
      audio.play().catch(() => setPhase(PHASE.WAITING));
    }
  }, [phase, question, onStatusChange]);

  // 타이머 관리 (WAITING, RECORDING)
  useEffect(() => {
    clearInterval(timerRef.current);

    if (phase === PHASE.WAITING) {
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
    }

    if (phase === PHASE.RECORDING) {
      recorderRef.current?.start?.();
    }

    return () => clearInterval(timerRef.current);
  }, [phase, waitTime, onTimeUpdate]);

  // 녹음 완료 → STT 요청
  const handleRecordingComplete = async (blob) => {
    setPhase(PHASE.UPLOADING);
    try {
      const data = await requestSpeechToText(blob);
      setSttResult(data.text);
      setPhase(PHASE.COMPLETE);
    } catch (err) {
      console.error("STT 오류:", err);
    }
  };

  // 답변 끝나면 후속질문
  useEffect(() => {
    if (phase === PHASE.COMPLETE && sttResult) {
      onAnswerComplete?.(sttResult);
      (async () => {
        try {
          const res = await nextQuestion(sessionId, sttResult);
          const { question: q, audio_url, done } = res.data;
          if (done) {
            setQuestion({ question: q, audio_url, done: true });
          } else {
            setQuestion({ question: q, audio_url });
            onNewQuestion?.(q);
            setPhase(PHASE.TTS);
          }
        } catch (err) {
          console.error("next_question 실패", err);
        }
      })();
      setSttResult(null);
    }
  }, [phase, sttResult, sessionId, onAnswerComplete, onNewQuestion]);

  // 다시 답변하기
  const handleRetry = () => {
    setRemainingTime(waitTime);
    setPhase(PHASE.WAITING);
  };

  return (
    <div className="interview-session">
      <MicRecorder
        ref={recorderRef}
        isRecording={phase === PHASE.RECORDING}
        onStop={handleRecordingComplete}
      />
      {phase === PHASE.WAITING && (
        <div className="timer-area">
          <Timer duration={remainingTime} autoStart label="대기시간" />
          {allowRetry && (
            <button className="replay-button" onClick={handleRetry}>
              다시 답변하기
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default InterviewSessionManager;
