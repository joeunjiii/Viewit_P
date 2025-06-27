// FeedbackSoftskills.jsx
import React from "react";
import "../css/FeedbackSummarySoftskills.css";

export default function FeedbackSoftskills({ strengths, weaknesses }) {
  return (
    <div className="softskills-block">
      <div className="softskills-title">요약된 피드백 포인트</div>
      <table className="softskills-table">
        <thead>
          <tr>
            <th>강점</th>
            <th>약점</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <ol className="softskills-list">
                {strengths.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ol>
            </td>
            <td>
              <ol className="softskills-list">
                {weaknesses.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ol>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
