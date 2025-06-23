import React from "react";
import "./css/FeedbackModal.css"; // 스타일은 별도 CSS로 분리

export default function FeedbackModal({ open, onClose, feedbackList = [] }) {
  if (!open) return null;

  return (
    <div className="feedback-modal-overlay">
      <div className="feedback-modal">
        <h3 className="feedback-modal-title">피드백 결과</h3>
        {feedbackList.length === 0 ? (
          <div className="feedback-modal-empty">
            아직 받은 피드백이 없습니다.
          </div>
        ) : (
          <ul className="feedback-modal-list">
            {feedbackList.map((item, idx) => (
              <li key={idx}>
                <strong>{item.date}</strong>
                {item.type && <> - [{item.type}]</>}
                &nbsp;{item.message}
              </li>
            ))}
          </ul>
        )}
        <div className="feedback-modal-actions">
          <button className="feedback-modal-close" onClick={onClose}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
