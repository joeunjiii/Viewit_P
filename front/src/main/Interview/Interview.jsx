import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import InterviewSettingsModal from "./InterviewSettingModal";
import "./Interview.css";

function Interview() {
  const [showModal, setShowModal] = useState(true); // 초기엔 모달 열림
  const navigate = useNavigate(); // navigate 준비
  console.log("🎯 Interview 렌더링됨");
  const handleStart = (settings) => {
    console.log("시작 설정:", settings);
    setShowModal(false);
  };

  return (
    <>
      {showModal && (
        <InterviewSettingsModal
          onClose={() => setShowModal(false)}
          onStart={handleStart}
        />
      )}

      {!showModal && (
        <div className="interview-wrapper">
          {/* 상단 섹션 */}
          <div className="interview-header">
            <div className="header-left">
              남은 시간 <strong>9:56</strong>
            </div>
            <div className="header-spacer" />
            <button className="end-button" onClick={() => navigate("/main")}>
              종료하기
            </button>
          </div>

          {/* 본문 섹션 */}
          <div className="interview-section-body">
            {/* 좌측: 질문 탭 */}
            <div className="question-tabs">
              <button className="tab selected">질문</button>
              <button className="tab">Q1</button>
            </div>

            {/* 본문 2단 영역 */}
            <div className="interview-body">
              {/* 왼쪽: 음성 파형 */}
              <div className="voice-area">
                <div className="voice-item">
                <div className="voice-label">면접관</div>
                  <div className="waveform">파형1</div>
                </div>
                <div className="voice-item">
                <div className="voice-label">면접자</div>
                  <div className="waveform">파형2</div>
                </div>
              </div>

              {/* 오른쪽: 타이머 */}
              <div className="timer-area">
                <div className="timer-circle">
                  <div className="timer-label">답변시간</div>
                  <div className="timer-value">15</div>
                </div>
                <button className="replay-button">다시 답변하기</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Interview;
