// FeedbackSummary.jsx
import React from "react";
import "../css/FeedbackSummarySoftskills.css";

export default function FeedbackSummary({ summary }) {
  return (
    <div className="summary-block">
    <div className="summary-title">면접 총평</div>
    <div className="summary-text-display">{summary}</div>
  </div>
  );
}
