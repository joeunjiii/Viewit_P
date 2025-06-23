// components/Timer.jsx
import { React, useState, useEffect } from "react";

function Timer({
  duration,
  onComplete,
  autoStart = true,
  label = "타이머",
  mode = "circle",
  className = "",
}) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isRunning, setIsRunning] = useState(autoStart);

  useEffect(() => {
    setTimeLeft(duration);
    if (autoStart) setIsRunning(true);
  }, [duration, autoStart]);

  useEffect(() => {
    if (!isRunning) return;
    if (timeLeft === 0) {
      onComplete?.(); // 콜백 실행
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, timeLeft, onComplete]);

  const formatTime = (sec) => {
    const m = String(Math.floor(sec / 60)).padStart(1, "0");
    const s = String(sec % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  return mode === "text" ? (
    <span className={className} style={{ display: "inline-block" }}>
      {label} {formatTime(timeLeft)}
    </span>
  ) : (
    <div className="timer-circle">
      <div className="timer-label">{label}</div>
      <div className="timer-value">{formatTime(timeLeft)}</div>
    </div>
  );
}

export default Timer;
