// FeedbackJobTable.jsx
import React from "react";
import "../css/Feedbackjobtable.css";

export default function FeedbackJobTable({ name, date, job }) {
  return (
    <div className="feedback-info-card">
      <div className="info-row">
        <span className="info-label">이름</span>
        <span className="info-value">{name}</span>
      </div>
      <div className="info-row">
        <span className="info-label">면접 날짜</span>
        <span className="info-value">{date}</span>
      </div>
      <div className="info-row">
        <span className="info-label">지원 직무</span>
        <span className="info-value">{job}</span>
      </div>
    </div>
  );
}
