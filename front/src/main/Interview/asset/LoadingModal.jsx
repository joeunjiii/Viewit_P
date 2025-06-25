// components/LoadingModal.jsx
import React from "react";
import "./css/modal.css";
export default function LoadingModal({
  open = true,
  message = "로딩 중입니다...",
  spinner = true,
}) {
  if (!open) return null;
  return (
    <div className="modal-bg">
      <div className="modal-box">
        {spinner && <div className="spinner" />}
        <div style={{ marginTop: 16, fontSize: 18 }}>{message}</div>
      </div>
    </div>
  );
}
