import React, { useState } from "react";
import "./Interview.css";
import InterviewSettingsModal from "./InterviewSettingModal";
import MicCheckModal from "./asset/Mic/MicCheckModal";
import CaptionBox from "./asset/CaptionBox";
import QuestionTabs from "./asset/QuestionTabs";
import InterviewHeader from "./asset/InterviewHeader";
import QuestionStatusBar from "./asset/QuestionStatusBar";
import InterviewSessionManager from "./InterviewSessionManager";
import WelcomeMessage from "./WelcomeMessage";
function Interview() {
  const [showModal, setShowModal] = useState(true);
  const [micCheckOpen, setMicCheckOpen] = useState(false);
  const [autoQuestion, setAutoQuestion] = useState(false);
  const [allowRetry, setAllowRetry] = useState(true);
  const [waitTime, setWaitTime] = useState(5);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [captionText, setCaptionText] =
    useState("면접관: 자기소개 부탁드립니다.");
  const [status, setStatus] = useState("idle");
  const [remainingTime, setRemainingTime] = useState(0);
  const [showWelcome, setShowWelcome] = useState(true);

  const handleStartSettings = (settings) => {
    console.log("🛠️ InterviewSettingsModal에서 설정 완료, WelcomeMessage 표시.");
    setShowModal(false);
    setShowWelcome(true);
    setAutoQuestion(settings.autoQuestion);
    setWaitTime(settings.waitTime);
    setAllowRetry(settings.allowRetry);
  };

  const handleWelcomeStart = () => {
    console.log("👋 WelcomeMessage '바로 시작하기' 버튼 클릭, 면접 시작.");
    setShowWelcome(false);
  };

  return (
    <>
      {/* 1. InterviewSettingsModal: showModal이 true일 때만 표시 */}
      {showModal && (
        <InterviewSettingsModal
          // InterviewSettingsModal 내의 onClose는 현재 로직에서 직접 사용되지 않습니다.
          // '취소' 버튼은 navigate('/main')을 호출하여 메인으로 돌아갑니다.
          // '설정하기' 버튼은 handleStartSettings를 호출하여 다음 단계로 넘어갑니다.
          onClose={() => setShowModal(false)} // 현재로선 크게 사용되지 않지만, prop으로 유지
          onStart={handleStartSettings} // ⭐ 이름 변경된 함수로 연결
          onOpenMicCheck={() => setMicCheckOpen(true)}
        />
      )}

      {/* 2. MicCheckModal: micCheckOpen이 true일 때만 표시 */}
      {micCheckOpen && <MicCheckModal onClose={() => setMicCheckOpen(false)} />}

      {/* 3. WelcomeMessage: showModal이 false이고 showWelcome이 true일 때만 표시 */}
      {/* 이 조건이 중요합니다. 설정 모달이 닫히고 WelcomeMessage가 열려야 합니다. */}
      {!showModal && showWelcome && (
        <WelcomeMessage username="유광명" onStart={handleWelcomeStart} />
      )}

      {/* 4. 실제 면접 콘텐츠: showModal도 false, showWelcome도 false일 때만 표시 */}
      {/* 두 모달이 모두 닫혔을 때만 면접 내용이 나타나도록 조건 변경 */}
      {!showModal && !showWelcome && (
        <div className="interview-wrapper">
          <InterviewHeader totalDuration={600} />
          <div className="interview-section-body">
            <QuestionTabs questionNumber={questionNumber} />
            <div className="interview-body">
              <div className="status-display-box">
                <QuestionStatusBar
                  status={status}
                  remainingTime={remainingTime}
                />
              </div>

              {/* InterviewSessionManager는 항상 startInterview={true}로 전달하여,
                  WelcomeMessage가 닫히자마자 바로 면접이 시작되도록 합니다.
                  InterviewSessionManager 내부에서 PHASE.IDLE -> PHASE.READY로 전환됩니다. */}
              <InterviewSessionManager
                startInterview={true} // ⭐ 이 부분이 중요합니다.
                waitTime={waitTime}
                allowRetry={allowRetry}
                onStatusChange={setStatus}
                onTimeUpdate={setRemainingTime}
                onAnswerComplete={(text) => {
                  console.log("답변 결과:", text);
                  setCaptionText(`이용자: ${text}`);
                  setQuestionNumber((prev) => prev + 1);
                }}
              />
            </div>
          </div>
          {autoQuestion && <CaptionBox text={captionText} />}
        </div>
      )}
    </>
  );
}

export default Interview;
