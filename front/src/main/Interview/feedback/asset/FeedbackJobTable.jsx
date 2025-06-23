// FeedbackJobTable.jsx
import React from "react";
import "../css/Feedbackjobtable.css";

export default function FeedbackJobTable({ job, fillerWords }) {
  return (
    <table className="job-filler-table">
      <thead>
        <tr>
          <th className="job-th">직무</th>
          <th className="filler-th">불필요한 단어</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>{job}</td>
          <td className="filler-words">{fillerWords}</td>
        </tr>
      </tbody>
    </table>
  );
}
