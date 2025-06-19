import React from "react";
import { FaClock, FaVolumeUp, FaHourglassHalf, FaUserTie } from "react-icons/fa";
import "./AssessmentIntro.css";

export default function AssessmentIntro({ onConfirm }) {
  const cards = [
    {
      icon: <FaClock size={44} color="#36b37e" />,
      text: "면접은 10분 동안 진행됩니다.",
    },
    {
      icon: <FaUserTie size={44} color="#725ffe" />,
      text: "면접에이전트의 질문이 TTS로 진행됩니다.",
    },
    {
      icon: <FaHourglassHalf size={44} color="#f9b233" />,
      text: "설정한 대기시간 동안 답변을 준비합니다.",
    },
    {
      icon: <FaVolumeUp size={44} color="#3694f2" />,
      text: "답변을 하고 면접에이전트의 질문을 기다립니다.",
    },
  ];

  return (
    <div className="assessment-intro-bg">
      <div className="assessment-intro-container">
        <h2 className="assessment-title">모의면접은 아래와 같이 이루어져 있어요.</h2>
        <p className="assessment-subtitle">
          모든 내용을 읽어보셨다면 확인 버튼을 눌러 모의면접을 시작해 주세요.
        </p>
        <div className="assessment-card-row">
          {cards.map((card, idx) => (
            <div className="assessment-card" key={idx}>
              <div className="assessment-card-icon">{card.icon}</div>
              <div className="assessment-card-text">{card.text}</div>
            </div>
          ))}
        </div>
        <button className="assessment-confirm-btn" onClick={onConfirm}>
          확인
        </button>
      </div>
    </div>
  );
}
