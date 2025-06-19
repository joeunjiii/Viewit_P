import React, { useState, useEffect } from "react";
import "./Interview.css";
import InterviewSettingsModal from "./InterviewSettingModal";
import MicCheckModal from "./asset/Mic/MicCheckModal";
import CaptionBox from "./asset/CaptionBox";
import QuestionTabs from "./asset/QuestionTabs";
import InterviewHeader from "./asset/InterviewHeader";
import QuestionStatusBar from "./asset/QuestionStatusBar";
import InterviewSessionManager from "./InterviewSessionManager";
import AssessmentIntro from "./AssessmentIntro";
import WelcomeMessage from "./WelcomeMessage";
import ScreenSizeGuard from "./asset/ScreenSizeGuard";
function Interview() {
  const [step, setStep] = useState("settings"); // "settings" | "welcome" | "interview | guide"
  const [micCheckOpen, setMicCheckOpen] = useState(false);
  const [autoQuestion, setAutoQuestion] = useState(false);
  const [allowRetry, setAllowRetry] = useState(true);
  const [waitTime, setWaitTime] = useState(5);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [captionText, setCaptionText] =
    useState("면접관: 자기소개 부탁드립니다.");
  const [status, setStatus] = useState("idle");
  const [remainingTime, setRemainingTime] = useState(0);

  const handleStartSettings = (settings) => {
    setAutoQuestion(settings.autoQuestion);
    setWaitTime(settings.waitTime);
    setAllowRetry(settings.allowRetry);
    setStep("guide"); // 바로 안내화면으로
  };
  
  const handleGuideConfirm = () => {
    setStep("welcome");
  };
  const handleWelcomeStart = () => {
    console.log("👋 WelcomeMessage '바로 시작하기' 버튼 클릭, 면접 시작.");
    setStep("interview");
  };
  const openMicCheck = () => setMicCheckOpen(true);
  const closeMicCheck = () => setMicCheckOpen(false);
  useEffect(() => {
    console.log("[Interview] 현재 step 상태:", step);
  }, [step]);
  return (
    <>
      <ScreenSizeGuard />
      {step === "settings" && (
        <InterviewSettingsModal
          onClose={() => setStep("interview")}
          onStart={handleStartSettings}
          onOpenMicCheck={openMicCheck}
        />
      )}
      {step === "guide" && <AssessmentIntro onConfirm={handleGuideConfirm} />}
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
