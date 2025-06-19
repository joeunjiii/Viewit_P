// src/main/Interview/InterviewSessionManager.jsx
import React, { useState, useRef, useEffect } from "react";
import MicRecorder from "./asset/Mic/MicRecorder";
import { nextQuestion } from "./api/interview";
import { requestSpeechToText } from "./api/stt";
import Timer from "./asset/Timer";

const PHASE = {
  IDLE: "idle",
  READY: "ready",
  TTS: "tts",
  WAITING: "wait",
  RECORDING: "recording",
  UPLOADING: "uploading",
  COMPLETE: "complete",
};

/**
 * Props:
 *  - sessionId: string
 *  - jobRole: string
 *  - waitTime: number
 *  - answerDuration: number
 *  - allowRetry: boolean
 *  - initialQuestion: { question: string; audio_url: string }
 *  - onStatusChange: (phase: string) => void
 *  - onTimeUpdate: (remaining: number) => void
 *  - onNewQuestion: (question: string) => void
 *  - onAnswerComplete: (userText: string) => void
 */
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

  // 🔊 TTS(오디오) 재생
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

    if (phase === PHASE.RECORDING) {
      setRemainingTime(answerDuration);
      onTimeUpdate?.(answerDuration);
      recorderRef.current?.start?.();
      timerRef.current = setInterval(() => {
        setRemainingTime(prev => {
          onTimeUpdate?.(prev - 1);
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setPhase(PHASE.UPLOADING);
            recorderRef.current?.stop();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(timerRef.current);
  }, [phase, waitTime, answerDuration, onTimeUpdate]);

  // 🎤 녹음 완료 → STT 요청
  const handleRecordingComplete = async blob => {
    setPhase(PHASE.UPLOADING);
    try {
      const data = await requestSpeechToText(blob);
      setSttResult(data.text);
      setPhase(PHASE.COMPLETE);
    } catch (err) {
      console.error("STT 오류:", err);
    }
  };

  // ✅ COMPLETE 단계 → nextQuestion 요청 후 다음 TTS
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

  // ↺ 다시 답변하기
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
