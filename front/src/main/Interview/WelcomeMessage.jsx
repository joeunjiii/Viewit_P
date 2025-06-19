import React, { useEffect, useState } from "react";
import "./WelcomeMessage.css";

const cheerMessages = [
  "오늘도 멋진 답변 기대할게요!",
  "유광명님의 멋진 취업을 응원합니다!",
  "긴장하지 말고, 당신의 이야기를 들려주세요!",
];

export default function WelcomeMessage({ username = "지원자", onStart }) {
  // 랜덤 문구 선택
  const [message] = useState(
    () => cheerMessages[Math.floor(Math.random() * cheerMessages.length)]
  );

  return (
    <div className="welcome-bg">
      <div className="welcome-card">
        <div className="emoji-wave">🌟</div>
        <h1 className="welcome-title">
          <span>{username}</span>님,
          <br />
          꿈을 향한 첫걸음을 응원해요!
        </h1>
        <p className="welcome-message">{message}</p>

        <button className="start-btn" onClick={onStart}>
          바로 시작하기
        </button>
      </div>
    </div>
  );
}
