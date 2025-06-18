import React, { useState, useRef, useEffect } from "react";
import MicRecorder from "./asset/Mic/MicRecorder";
import { requestNextTTSQuestion, requestTTS } from "./api/tts";
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
                                   waitTime = 3,
                                   answerDuration = 10,
                                   allowRetry = true,
                                   onStatusChange,
                                   onTimeUpdate,
                                   onAnswerComplete,
                                   onNewQuestion, // 👈 질문 전달 prop 추가
                                 }) {
  const [phase, setPhase] = useState(PHASE.READY);
  const [question, setQuestion] = useState(null);
  const [remainingTime, setRemainingTime] = useState(0);
  const [sttResult, setSttResult] = useState(null);

  const timerRef = useRef(null);
  const recorderRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    onStatusChange?.(phase);
    clearInterval(timerRef.current);

    switch (phase) {
      case PHASE.READY:
        (async () => {
          let result;
          if (!question) {
            const audioUrl = await requestTTS();
            result = { audioUrl, question: "자기소개 부탁드립니다." };
          } else {
            result = await requestNextTTSQuestion();
          }
          setQuestion(result);
          onNewQuestion?.(result.question); // 👈 질문 텍스트 전달
          setPhase(PHASE.TTS);
        })();
        break;

      case PHASE.TTS:
        if (question?.audioUrl) {
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
          }
          const audio = new Audio("http://localhost:8000" + question.audioUrl);
          audioRef.current = audio;
          audio.onended = () => setPhase(PHASE.WAITING);
          audio.play().catch(() => setPhase(PHASE.WAITING));
        }
        break;

      case PHASE.WAITING:
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
        break;

      case PHASE.UPLOADING:
        break;

      case PHASE.COMPLETE:
        setTimeout(() => setPhase(PHASE.READY), 1000);
        break;

      default:
        break;
    }

    return () => clearInterval(timerRef.current);
  }, [phase]);

  const handleRecordingComplete = async (blob) => {
    console.log("🔄 [UPLOADING] 서버에 파일 업로드 중...");
    setPhase(PHASE.UPLOADING);
    try {
      const data = await requestSpeechToText(blob);
      setSttResult(data.text);
      setPhase(PHASE.COMPLETE);
    } catch (err) {
      console.error("STT 오류:", err);
    }
  };

  useEffect(() => {
    if (phase === PHASE.COMPLETE && sttResult) {
      onAnswerComplete?.(sttResult);
      setSttResult(null);
    }
  }, [phase, sttResult, onAnswerComplete]);

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
