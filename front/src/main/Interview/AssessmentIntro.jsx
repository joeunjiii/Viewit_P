import React, { useState } from "react";
import {
  FaClock,
  FaHeadphonesAlt,
  FaRecordVinyl,
  FaUserTie,
  FaCheckCircle,
  FaMicrophone,
  FaRedo,
} from "react-icons/fa";
import "./css/AssessmentIntro.css";

export default function AssessmentIntro({ onConfirm }) {
  const cards = [
    { icon: <FaMicrophone size={44} color="#36b37e" />, text: "조용한 환경에서, 마이크를 사용해 진행해 주세요." },
    { icon: <FaUserTie size={44} color="#725ffe" />, text: "면접관 에이전트가 TTS로 질문을 안내합니다." },
    { icon: <FaHeadphonesAlt size={44} color="#3694f2" />, text: "질문 음성을 듣고 \n설정한 대기 시간 동안 답변을 준비하세요." },
    { icon: <FaRecordVinyl size={44} color="#f9b233" />, text: "대기 시간이 끝나면 \n답변 녹음이 자동으로 시작됩니다." },
    { icon: <FaRedo size={44} color="#fd6464" />, text: "대기시간이 지나기전에 \n'다시 답변하기' 기회를 쓸 수 있습니다." },
    { icon: <FaClock size={44} color="#5ec3b7" />, text: "모의면접 전체 진행 시간은 약 10분입니다." },
    { icon: <FaCheckCircle size={44} color="#6ed97b" />, text: "면접 종료 후 \n AI가 답변 피드백을 제공합니다." },
  ];

  const cardGroups = [
    cards.slice(0, 4),
    cards.slice(4, 7),
  ];
  const [page, setPage] = useState(0);

  const handleNext = () => {
    if (page < cardGroups.length - 1) {
      setPage(page + 1);
    } else {
      onConfirm();
    }
  };

  return (
    <div className="assessment-intro-bg">
      <div className="assessment-intro-container">
        <h2 className="assessment-title">모의면접 안내</h2>
        <div className="assessment-card-row">
          {cardGroups[page].map((card, idx) => (
            <div className="assessment-card" key={idx}>
              <div className="assessment-card-icon">{card.icon}</div>
              <div className="assessment-card-text">
                {card.text.split("\n").map((line, i) => (
                  <span key={i}>
                    {line}
                    <br />
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="assessment-progress">
          {cardGroups.map((_, idx) => (
            <span
              key={idx}
              className={`progress-dot ${idx === page ? "active" : ""}`}
            />
          ))}
        </div>
        <button className="assessment-confirm-btn" onClick={handleNext}>
          {page === cardGroups.length - 1 ? "확인" : "다음"}
        </button>
      </div>
    </div>
  );
}
