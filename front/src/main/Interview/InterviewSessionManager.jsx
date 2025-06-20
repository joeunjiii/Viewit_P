import React, { useState, useRef, useEffect } from "react";
import MicRecorder from "./asset/Mic/MicRecorder";
import { initSession, nextQuestion } from "./api/interview";
import { requestSpeechToText } from "./api/stt";
//import { requestNextTTSQuestion, requestTTS } from "./api/tts";
import Timer from "./asset/Timer";

const PHASE = {
  IDLE: "idle",
  READY: "ready",
  TTS: "tts",
  WAITING: "wait",
  RECORDING: "recording",
  UPLOADING: "uploading",
  COMPLETE: "complete",
  END: "end",
  INTRO_TTS: "intro_tts",
  FINAL_TTS: "final_tts",
};

function InterviewSessionManager({
  sessionId,
  jobRole,
  waitTime = 3,
  allowRetry = true,
  onStatusChange,
  onTimeUpdate,
  onAnswerComplete,
  onNewQuestion,
}) {
  const [phase, setPhase] = useState(PHASE.READY);
  const [question, setQuestion] = useState(null);
  const [remainingTime, setRemainingTime] = useState(0);
  const [sttResult, setSttResult] = useState(null);
  const [fixedQuestionIdx, setFixedQuestionIdx] = useState(0);
  const timerRef = useRef(null);
  const recorderRef = useRef(null);
  const audioRef = useRef(null);

  // 세션 초기화
  useEffect(() => {
    console.log("InterviewSessionManager mounted");
    console.log("initSession fired");
    initSession(sessionId, jobRole)
      .then((res) => {
        const { question: q, audio_url } = res.data;
        setQuestion({ question: q, audio_url, done: false });
        onNewQuestion?.(q);
        setPhase(PHASE.TTS);
      })
      .catch((err) => console.error("init_session 실패", err));
  }, [sessionId, jobRole, onNewQuestion]);

  // TTS 재생
  useEffect(() => {
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
  }, [phase, question]);

  // 타이머 (질문 후 대기)
  useEffect(() => {
    onStatusChange?.(phase);
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

    // answerDuration 타이머 완전 제거

    return () => clearInterval(timerRef.current);
  }, [phase, waitTime, onStatusChange, onTimeUpdate]);

  // 🔥 침묵 감지
  const handleSilence = (duration) => {
    // duration: 침묵 지속 시간(초), 5초 이상이면 자동 제출
    if (phase === PHASE.RECORDING && duration >= 5) {
      recorderRef.current?.stop();
      setPhase(PHASE.UPLOADING);
    }
  };

  // 녹음 완료 → STT
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

  // 답변 완료 → 다음 질문
  useEffect(() => {
    console.log("InterviewSessionManager mounted");
    console.log("initSession fired");

    if (phase !== PHASE.COMPLETE || !sttResult) return;

    onAnswerComplete?.(sttResult);

    nextQuestion(sessionId, sttResult)
      .then((res) => {
        const { question: q, audio_url, done } = res.data;
        setQuestion({ question: q, audio_url, done });
        onNewQuestion?.(q);
        setPhase(done ? PHASE.WAITING : PHASE.TTS);
      })
      .catch((err) => console.error("next_question 실패", err))
      .finally(() => setSttResult(null));
  }, [phase, sttResult, sessionId, onNewQuestion, onAnswerComplete]);

  const handleRetry = () => {
    setRemainingTime(waitTime);
    setPhase(PHASE.WAITING);
  };

  if (phase === PHASE.READY) {
    return <div className="loading">모의 면접 질문 생성중...</div>;
  }

  return (
    <div className="interview-session">
      <MicRecorder
        ref={recorderRef}
        isRecording={phase === PHASE.RECORDING}
        onStop={handleRecordingComplete}
        onSilence={handleSilence} // 침묵 감지 콜백 추가
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
