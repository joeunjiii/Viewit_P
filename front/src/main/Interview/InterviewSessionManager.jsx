import React, { useEffect, useRef, useState, useCallback } from "react";
import MicRecorder from "./asset/Mic/MicRecorder";
import { requestNextTTSQuestion, requestTTS } from "./api/tts";
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
}) {
  const [phase, setPhase] = useState(PHASE.READY);
  const [question, setQuestion] = useState(null);
  const [remainingTime, setRemainingTime] = useState(0);
  const timerRef = useRef(null);
  const recorderRef = useRef(null);
  const audioRef = useRef(null);
  const lastPlayedAudioUrl = useRef(null);
  const isPlaying = useRef(false);

  const updatePhase = useCallback(
    (p) => {
      setPhase(p);
      onStatusChange?.(p);
    },
    [onStatusChange]
  );

  const updateTime = useCallback(
    (t) => {
      setRemainingTime(t);
      onTimeUpdate?.(t);
    },
    [onTimeUpdate]
  );

  const startCountdown = useCallback(
    (seconds, onFinish) => {
      clearInterval(timerRef.current);
      updateTime(seconds);
      timerRef.current = setInterval(() => {
        updateTime((prev) => {
          const next = prev - 1;
          if (next <= 0) {
            clearInterval(timerRef.current);
            onFinish();
            return 0;
          }
          return next;
        });
      }, 1000);
    },
    [updateTime]
  );

  const stopRecording = useCallback(() => {
    updatePhase(PHASE.UPLOADING);
    recorderRef.current.stop();
  }, [updatePhase]);

  const fetchNextQuestion = useCallback(async () => {
    let result;
    try {
      if (!question) {
        const audioUrl = await requestTTS();
        if (audioUrl) {
          result = { audioUrl, question: "자기소개 부탁드립니다." };
        }
      } else {
        result = await requestNextTTSQuestion();
      }

      // ✅ result와 audioUrl이 모두 있어야 TTS 단계로 진행
      if (result && result.audioUrl) {
        setQuestion(result);
        updatePhase(PHASE.TTS);
      } else {
        console.warn("❌ 질문 또는 오디오 URL 누락 - WAITING 유지");
        updatePhase(PHASE.WAITING);
        updateTime(waitTime);
      }
    } catch (error) {
      console.error("❌ fetchNextQuestion 예외 발생:", error);
      updatePhase(PHASE.WAITING);
      updateTime(waitTime);
    }
  }, [updatePhase, updateTime, waitTime]);

  // TTS 오디오 재생을 위한 별도 useEffect
  useEffect(() => {
    if (phase === PHASE.TTS && question?.audioUrl && !isPlaying.current) {
      console.log("🎵 TTS 오디오 재생 시작:", question.audioUrl);
      isPlaying.current = true;

      // 기존 오디오 정리
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      const audio = new Audio("http://localhost:8000" + question.audioUrl);
      audioRef.current = audio;
      audio.play();
      audio.onended = () => {
        console.log("🎵 TTS 오디오 재생 완료, WAITING으로 전환");
        isPlaying.current = false;
        updatePhase(PHASE.WAITING);
      };
    }
  }, [phase, question?.audioUrl, updatePhase]);

  // WAITING 페이즈에서 타이머 시작
  useEffect(() => {
    if (phase === PHASE.WAITING) {
      console.log("⏰ WAITING 페이즈 - 타이머 시작:", waitTime);
      startCountdown(waitTime, () => updatePhase(PHASE.RECORDING));
    }
  }, [phase, waitTime, startCountdown, updatePhase]);

  const handleRecordingComplete = async (blob) => {
    const formData = new FormData();
    formData.append("audio", blob, "answer.webm");
    try {
      const res = await fetch("http://localhost:8000/stt", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      onAnswerComplete?.(data.text);
    } catch (err) {
      console.error("STT 오류:", err);
    }
    updatePhase(PHASE.COMPLETE);
  };

  useEffect(() => {
    fetchNextQuestion();
    return () => clearInterval(timerRef.current);
  }, [fetchNextQuestion]);

  return (
    <div className="interview-session">
      <MicRecorder
        ref={recorderRef}
        isRecording={phase === PHASE.RECORDING}
        onStop={handleRecordingComplete}
      />

      {phase === PHASE.TTS}

      {phase === PHASE.WAITING && (
        <div className="timer-area">
          <Timer
            key={phase}
            duration={remainingTime}
            autoStart={true}
            label="대기시간"
          />
          <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
            {allowRetry && (
              <button
                className="replay-button"
                onClick={() => {
                  updateTime(waitTime);
                  updatePhase(PHASE.WAITING);
                }}
              >
                다시 답변하기
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default InterviewSessionManager;
