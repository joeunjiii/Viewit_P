// components/LoadingModal.jsx
import React from "react";
import "./css/modal.css";
export default function LoadingModal({
  open = true,
  message = "모의면접 로딩 중입니다",
  spinner = true,
  type = "default", // "interview" | "default"
}) {
  if (!open) return null;

  // 분기 스타일 클래스
  const modalClass =
    type === "interview" ? "modal-box interview-loading" : "modal-box";
  const spinnerClass =
    type === "interview" ? "spinner interview-spinner" : "spinner";
  return (
    <div className="modal-bg">
      <div className={modalClass}>
        {spinner && <div className={spinnerClass} />}
        <div style={{ marginTop: 22, fontWeight: 'bold' }}>{message}</div>
      </div>
    </div>
  );
}
