// components/MainHeader.jsx
import React from "react";
import "./css/Mainheader.css"; // 별도 스타일 필요시

function MainHeader() {
  return (
    <div className="main-header">
      <div className="explain">
        <h1>AI 모의면접 서비스</h1>
        <br />
        <h2>
          {/* AI 모의면접은 사용자의 음성 답변을 실시간으로 분석하여, 실제 면접과
          유사한 환경에서 효과적으로 면접 연습을 할 수 있도록 도와주는 훈련
          서비스입니다. */}
        </h2>
      </div>
    </div>
  );
}

export default MainHeader;
