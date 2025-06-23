// components/ErrorModal.jsx
import React from "react";
import "./css/modal.css";
import { useNavigate } from "react-router-dom";
export default function ErrorModal({ open, message, onClose }) {
  const navigate = useNavigate();
  const handleClose = () => {
    // 모달 닫는 핸들러 호출
    if (onClose) onClose();
    // /main 으로 이동
    // navigate("/main");
  };

  if (!open) return null;
  return (
    <div className="modal-bg">
      <div className="modal-box">
        <div
          style={{
            color: "#d32f2f",
            marginBottom: 20,
            fontWeight: 700,
            fontSize: "1.32rem",
            letterSpacing: "-0.5px",
          }}
        >
          에러 발생
        </div>
        <div className="modal-text">
          {message.split("\n").map((line, idx) => (
            <React.Fragment key={idx}>
              {line}
              {idx < message.split("\n").length - 1 && <br />}
            </React.Fragment>
          ))}
        </div>
        <button onClick={handleClose} className="modal-btn">
          닫기
        </button>
      </div>
    </div>
  );
}
