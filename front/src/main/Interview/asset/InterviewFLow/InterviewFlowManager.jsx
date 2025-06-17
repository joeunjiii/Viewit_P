import React, { useEffect, useRef, useState } from "react";
import MicRecorder from "../Mic/MicRecorder"; // Web Audio API 기반 녹음 컴포넌트

function InterviewFlowManager({ questionAudioUrl, waitDuration = 2, answerDuration = 10, onComplete }) {
  const [status, setStatus] = useState("idle"); // 'tts' | 'wait' | 'recording' | 'uploading'
  const [remainingTime, setRemainingTime] = useState(0);
  const timerRef = useRef(null);

  // TTS 질문 재생
  const playTTS = () => {
    setStatus("tts");
    const audio = new Audio(questionAudioUrl);
    audio.play();
    audio.onended = () => startWaitTimer();
  };

  // 대기 시간
  const startWaitTimer = () => {
    setStatus("wait");
    setRemainingTime(waitDuration);
    startCountdown(waitDuration, startRecording);
  };

  // 답변 시간
  const startRecording = () => {
    setStatus("recording");
    setRemainingTime(answerDuration);
    startCountdown(answerDuration, stopRecording);
  };

  const stopRecording = () => {
    setStatus("uploading");
    recorderRef.current.stop(); // MicRecorder 내부에서 exposed 된 stop
  };

  // 유틸: 타이머 제어
  const startCountdown = (seconds, onFinish) => {
    clearInterval(timerRef.current);
    setRemainingTime(seconds);
    timerRef.current = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          onFinish();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // MicRecorder에서 녹음 완료 시
  const handleRecordingComplete = async (blob) => {
    const formData = new FormData();
    formData.append("audio", blob, "answer.webm");

    try {
      const res = await fetch("http://localhost:8000/stt", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      onComplete(data.text); // 부모로 결과 전달
    } catch (err) {
      console.error("STT 오류:", err);
      onComplete("STT 실패");
    }

    setStatus("idle");
  };

  const recorderRef = useRef(null);

  useEffect(() => {
    playTTS();
    return () => clearInterval(timerRef.current);
  }, [questionAudioUrl]);

  return (
    <div style={{ textAlign: "center" }}>
      {status === "tts" && <p>👂 질문 듣는 중...</p>}
      {status === "wait" && <p>⏱ 곧 답변 시간입니다... ({remainingTime})</p>}
      {status === "recording" && <p>🎤 녹음 중입니다! ({remainingTime})</p>}
      {status === "uploading" && <p>📤 답변 업로드 중...</p>}

      <MicRecorder
        ref={recorderRef}
        isRecording={status === "recording"}
        onStop={handleRecordingComplete}
      />
    </div>
  );
}

export default InterviewFlowManager;