// components/LoadingModal.jsx
import React from "react";
import "./css/modal.css"
export default function LoadingModal({ open, text }) {
  if (!open) return null;
  return (
    <div className="modal-bg">
      <div className="modal-box">
        <div className="loader" />
        <div style={{ marginTop: 16 }}>{text || "로딩 중입니다..."}</div>
      </div>
    </div>
  );
}
