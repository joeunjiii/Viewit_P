import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import InterviewSettingsModal from "./InterviewSettingModal";
import MicCheckModal from "./asset/Mic/MicCheckModal";

import "./Interview.css";

function Interview() {
  const [showModal, setShowModal] = useState(true);
  const [micCheckOpen, setMicCheckOpen] = useState(false);
  const [autoQuestion, setAutoQuestion] = useState(false); //자막 상태
  const [answerTime, setAnswerTime] = useState(10);
  const [allowRetry, setAllowRetry] = useState(true);

  const navigate = useNavigate();

  //예시데이터 나중에 state로 변경, 추후에 삭제
  const [captionText, setCaptionText] = useState(
    "면접관: 자기소개 부탁드립니다.길어짐확인길어짐확인길어짐확인길어짐확인길어짐확인길어짐확인길어짐확인길어짐확인길어짐확인길어짐확인길어짐확인길어짐확인길어짐확인길어짐확인길어짐확인길어짐확인길어짐확인길어짐확인길어짐확인길어짐확인길어짐확인길어짐확인길어짐확인길어짐확인길어짐확인길어짐확인길어짐확인길어짐확인길어짐확인길어짐확인길어짐확인길어짐확인길어짐확인길어짐확인길어짐확인길어짐확인길어짐확인길어짐확인길어짐확인길어짐확인길어짐확인길어짐확인길어짐확인길어짐확인길어짐확인길어짐확인"
  );

  console.log("🎯 Interview 렌더링됨");

  const handleStart = (settings) => {
    console.log("시작 설정:", settings);
    setShowModal(false);
    setAutoQuestion(settings.autoQuestion);
    setAnswerTime(settings.answerTime);
    setAllowRetry(settings.allowRetry);
    if (settings.micEnabled) {
      // 마이크 접근 시도
    }
  };

  useEffect(() => {
    if (!showModal) {
      const startMic = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
          });
          // 오디오 처리
        } catch (err) {
          console.error("🎤 Interview 페이지에서 마이크 접근 실패:", err);
        }
      };
      startMic();
    }
  }, [showModal]);

  return (
    <>
      {showModal && (
        <InterviewSettingsModal
          onClose={() => setShowModal(false)}
          onStart={handleStart}
          onOpenMicCheck={() => setMicCheckOpen(true)}
        />
      )}
      {micCheckOpen && <MicCheckModal onClose={() => setMicCheckOpen(false)} />}

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
                  <div className="timer-value">{answerTime}</div>
                </div>
                {allowRetry && (
                  <button className="replay-button">다시 답변하기</button>
                )}
              </div>
            </div>
          </div>
          {autoQuestion && (
            <div className="caption-box">
              <p>{captionText}</p>
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default Interview;
