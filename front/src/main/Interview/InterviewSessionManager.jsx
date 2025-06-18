import React, { useState, useRef, useEffect } from "react";
import MicRecorder from "./asset/Mic/MicRecorder";
import { nextQuestion } from "./api/interview"; // ⭐️ initSession 삭제!
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
                                   answerDuration = 10,
                                   allowRetry = true,
                                   initialQuestion, // ⭐️ Interview.jsx에서 전달
                                   onStatusChange,
                                   onTimeUpdate,
                                   onAnswerComplete,
                                   onNewQuestion,
                                 }) {
  const [phase, setPhase] = useState(PHASE.TTS); // ⭐️ 바로 TTS로!
  const [question, setQuestion] = useState(initialQuestion); // ⭐️ 초기 질문 세팅
  const [remainingTime, setRemainingTime] = useState(0);
  const [sttResult, setSttResult] = useState(null);

  const timerRef = useRef(null);
  const recorderRef = useRef(null);
  const audioRef = useRef(null);

  // ⭐️ 질문 오디오 재생
  useEffect(() => {
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
  }, [phase, question]);

  // ⭐️ 대기/녹음 타이머는 기존과 동일
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

    if (phase === PHASE.RECORDING) {
      setRemainingTime(answerDuration);
      onTimeUpdate?.(answerDuration);
      recorderRef.current?.start?.();
      timerRef.current = setInterval(() => {
        setRemainingTime((prev) => {
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
    // eslint-disable-next-line
  }, [phase]);

  // ⭐️ 답변(STT) 업로드/완료 → 다음 질문
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

  // ⭐️ COMPLETE에서 다음 질문/오디오 받기
  useEffect(() => {
    if (phase === PHASE.COMPLETE && sttResult) {
      onAnswerComplete?.(sttResult);

      (async () => {
        const res = await nextQuestion(sessionId, sttResult);
        const { question: q, audio_url, done } = res.data;
        if (done) {
          setQuestion({ question: q, audio_url, done: true });
        } else {
          setQuestion({ question: q, audio_url });
          onNewQuestion?.(q);
          setPhase(PHASE.TTS); // 다음 질문 오디오 재생!
        }
      })();

      setSttResult(null);
    }
    // eslint-disable-next-line
  }, [phase, sttResult, sessionId]);

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
