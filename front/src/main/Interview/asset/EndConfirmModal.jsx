import React from 'react';
import './css/EndConfirmModal.css';

function EndConfirmModal({ isOpen, onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <div className="end-confirm-modal-bg">
      <div className="end-confirm-modal-box">
        <div className="end-confirm-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="#ff6b6b" />
          </svg>
        </div>
        <div className="end-confirm-message">
          정말 면접을 종료하시겠습니까?
        </div>
        <div className="end-confirm-subtitle">
          종료 후에는 면접을 다시 시작할 수 없습니다.
        </div>
        <div className="end-confirm-buttons">
          <button className="end-confirm-btn confirm" onClick={onConfirm}>
            종료하기
          </button>
          <button className="end-confirm-btn cancel" onClick={onCancel}>
            취소
          </button>
        </div>
      </div>
    </div>
  );
}

export default EndConfirmModal; 