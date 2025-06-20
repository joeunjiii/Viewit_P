import React, { useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import "./css/Interview.css";
import InterviewSettingModal from "./InterviewSettingModal";
import AssessmentIntro from "./AssessmentIntro";
import WelcomeMessage from "./WelcomeMessage";
import ScreenSizeGuard from "./asset/ScreenSizeGuard";
import MicCheckModal from "./asset/Mic/MicCheckModal";
import InterviewHeader from "./asset/InterviewHeader";
import QuestionTabs from "./asset/QuestionTabs";
import QuestionStatusBar from "./asset/QuestionStatusBar";
import InterviewSessionManager from "./InterviewSessionManager";
import CaptionBox from "./asset/CaptionBox";

function Interview() {
  const [step, setStep] = useState("settings");
  const [sessionId] = useState(uuidv4());
  const [jobRole, setJobRole] = useState("backend");
  const [autoQuestion, setAutoQuestion] = useState(true);
  const [allowRetry, setAllowRetry] = useState(true);
  const [waitTime, setWaitTime] = useState(5);
  const [micCheckOpen, setMicCheckOpen] = useState(false);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [captionText, setCaptionText] = useState("");
  const [status, setStatus] = useState("idle");
  const [remainingTime, setRemainingTime] = useState(0);

  const openMicCheck = () => setMicCheckOpen(true);
  const closeMicCheck = () => setMicCheckOpen(false);

  const handleStartSettings = ({ jobRole, autoQuestion, allowRetry, waitTime }) => {
    setJobRole(jobRole);
    setAutoQuestion(autoQuestion);
    setAllowRetry(allowRetry);
    setWaitTime(waitTime);
    setStep("guide");
  };
  const handleGuideConfirm = () => setStep("welcome");
  const handleWelcomeStart = () => setStep("interview");

  const handleNewQuestion = useCallback(
      async (q) => {
        setCaptionText(`면접관: ${q}`);
        setQuestionNumber((n) => n + 1);
      },
      []
  );

  const handleAnswerComplete = (text) => {
    setCaptionText(`이용자: ${text}`);
  };

  return (
      <>
        <ScreenSizeGuard />

        {step === "settings" && (
            <InterviewSettingModal
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
                    <QuestionStatusBar status={status} remainingTime={remainingTime} />
                  </div>
                  <InterviewSessionManager
                      sessionId={sessionId}
                      jobRole={jobRole}
                      waitTime={waitTime}
                      allowRetry={allowRetry}
                      onStatusChange={setStatus}
                      onTimeUpdate={setRemainingTime}
                      onNewQuestion={handleNewQuestion}
                      onAnswerComplete={handleAnswerComplete}
                  />
                </div>
              </div>
              <CaptionBox text={captionText} />
            </div>
        )}
      </>
  );
}

export default Interview;