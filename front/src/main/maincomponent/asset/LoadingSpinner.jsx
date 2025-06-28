import React from "react";
import "../css/LoadingSpinner.css";

function LoadingSpinner({ message = "로딩 중..." }) {
  return (
    <div className="loading-spinner-container">
      <div className="loading-spinner" />
      <div className="loading-message">{message}</div>
    </div>
  );
}

export default LoadingSpinner;
