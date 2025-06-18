import React, { useState } from "react";
import "./Interview.css";
import InterviewSettingsModal from "./InterviewSettingModal";
import MicCheckModal from "./asset/Mic/MicCheckModal";
import CaptionBox from "./asset/CaptionBox";
import QuestionTabs from "./asset/QuestionTabs";
import InterviewHeader from "./asset/InterviewHeader";
import QuestionStatusBar from "./asset/QuestionStatusBar";
import InterviewSessionManager from "./InterviewSessionManager";
import Timer from "./asset/Timer";
import WelcomeMessage from "./WelcomeMessage";
function Interview() {
  const [step, setStep] = useState("settings"); // "settings" | "welcome" | "interview"
  const [micCheckOpen, setMicCheckOpen] = useState(false);
  const [autoQuestion, setAutoQuestion] = useState(false);
  const [allowRetry, setAllowRetry] = useState(true);
  const [waitTime, setWaitTime] = useState(5);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [captionText, setCaptionText] = useState("면접관: 자기소개 부탁드립니다.");
  const [status, setStatus] = useState("idle");
  const [remainingTime, setRemainingTime] = useState(0);
  // ⭐ 핵심 수정: WelcomeMessage는 처음에는 보이지 않아야 합니다.
  // 설정 모달이 닫힌 후에 보이도록 합니다.
  const [showWelcome, setShowWelcome] = useState(false); 
  

  const handleStartSettings = (settings) => {
    console.log("🛠️ InterviewSettingsModal에서 설정 완료, WelcomeMessage 표시.");
    setStep("welcome");
    setAutoQuestion(settings.autoQuestion);
    setWaitTime(settings.waitTime);
    setAllowRetry(settings.allowRetry);
  };

  const handleWelcomeStart = () => {
    console.log("👋 WelcomeMessage '바로 시작하기' 버튼 클릭, 면접 시작.");
    setStep("interview");
  };
  const openMicCheck = () => setMicCheckOpen(true);
  const closeMicCheck = () => setMicCheckOpen(false);

  return (
    <>
      {step === "settings" && (
        <InterviewSettingsModal
          onClose={() => setStep("interview")}
          onStart={handleStartSettings}
          onOpenMicCheck={openMicCheck}
        />
      )}

      {micCheckOpen && <MicCheckModal onClose={closeMicCheck} />}

      {step === "welcome" && (
        <WelcomeMessage username="유광명" onStart={handleWelcomeStart} />
      )}

      {step === "interview" && (
        <div className="interview-wrapper">
          <InterviewHeader totalDuration={600} />
          <div className="interview-section-body">
            <QuestionTabs questionNumber={questionNumber} />
            <div className="interview-body">
              <div className="status-display-box">
                <QuestionStatusBar status={status} remainingTime={remainingTime} />
              </div>

              <InterviewSessionManager
                waitTime={waitTime}
                allowRetry={allowRetry}
                onStatusChange={setStatus}
                onTimeUpdate={setRemainingTime}
                onAnswerComplete={(text) => {
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
