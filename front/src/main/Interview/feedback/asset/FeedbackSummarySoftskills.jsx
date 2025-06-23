// FeedbackSummarySoftskills.jsx
import React from "react";
import "../css/FeedbackSummarySoftskills.css";

export default function FeedbackSummarySoftskills({
  summary,
  strengths,
  weaknesses,
}) {
  return (
    <div className="summary-softskills-row">
      {/* 면접 총평 */}
      <div className="summary-col">
        <div className="summary-title">면접 총평</div>
        <textarea className="summary-text" value={summary} readOnly />
      </div>
      {/* 소프트 스킬 */}
      <div className="softskills-col">
        <div className="softskills-title">소프트 스킬</div>
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
                  {strengths.map((s, idx) => (
                    <li key={idx}>{s}</li>
                  ))}
                </ol>
              </td>
              <td>
                <ol className="softskills-list">
                  {weaknesses.map((w, idx) => (
                    <li key={idx}>{w}</li>
                  ))}
                </ol>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
