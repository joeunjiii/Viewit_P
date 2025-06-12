import React from "react";
import "./SpeechAlertModal.css";

function SpeechAlertModal({ onClose }) {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <p>🚧 준비 중입니다 🚧</p>
        <button onClick={onClose} className="close-button">닫기</button>
      </div>
    </div>
  );
}

export default SpeechAlertModal;
