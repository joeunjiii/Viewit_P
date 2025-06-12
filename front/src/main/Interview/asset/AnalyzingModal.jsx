import React from "react";
import { useNavigate } from "react-router-dom";
import "./AnalyzingModal.css";

function AnalyzingModal({ onExit }) {
  const navigate = useNavigate();

  const handleExit = () => {
    navigate("/main");
  };
  return (
    <div className="analyzing-overlay">
      <div className="analyzing-modal">
        <h2 className="modal-title">
          모의 면접&nbsp;&nbsp;<strong>분석중...</strong>
        </h2>
        <p className="modal-subtitle">잠시만 기다려주세요</p>
        <div className="spinner-icon">
          {/* 원하는 로딩 아이콘을 넣으세요 (예: SVG, GIF, CSS 애니메이션) */}
          <div className="loading-animation"></div>
        </div>
        <button className="exit-button" onClick={handleExit}>
          중단하고 나가기
        </button>
      </div>
    </div>
  );
}

export default AnalyzingModal;
