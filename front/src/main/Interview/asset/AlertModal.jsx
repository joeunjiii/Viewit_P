// components/AlertModal.jsx
import React from "react";
import "./css/AlertModal.css"; // 스타일 별도 관리 추천

export default function AlertModal({ open, message, onClose }) {
  if (!open) return null;

  return (
    <div className="alert-modal-bg">
      <div className="alert-modal-box">
        <div className="alert-modal-message">{message}</div>
        <button className="alert-modal-btn" onClick={onClose}>
          확인
        </button>
      </div>
    </div>
  );
}
