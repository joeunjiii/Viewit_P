// src/main/Interview/InterviewLayout.js (예시)
import React from "react";
import "./css/Interviewlayout.css"; // InterviewLayout 전용 CSS 파일
import Interview from "../Interview/Interview"; // 실제 Interview 컴포넌트 임포트

function InterviewLayout() {
  return (
    <div className="interview-page-container">
      <Interview />
    </div>
  );
}

export default InterviewLayout;
