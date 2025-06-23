import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { initSession } from "./api/interview"; // 추가!
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
import LoadingModal from "./asset/LoadingModal";
import ErrorModal from "./asset/ErrorModal";
function Interview() {
  const navigate = useNavigate();
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

  const [initialQuestion, setInitialQuestion] = useState(null);

  const openMicCheck = () => setMicCheckOpen(true);
  const closeMicCheck = () => setMicCheckOpen(false);
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleStartSettings = ({
    jobRole,
    autoQuestion,
    allowRetry,
    waitTime,
  }) => {
    setJobRole(jobRole);
    setAutoQuestion(autoQuestion);
    setAllowRetry(allowRetry);
    setWaitTime(waitTime);
    setStep("guide");
  };
  const handleGuideConfirm = () => setStep("welcome");

  // 면접 시작 시 첫 질문
  const handleWelcomeStart = async () => {
    setShowLoadingModal(true);
    setStep("interview");
    setInitialQuestion(null);
    try {
      // 2초 대기 
      const delay = new Promise((resolve) => setTimeout(resolve, 2000));
      const resPromise = initSession(sessionId, jobRole);

      const [res] = await Promise.all([resPromise, delay]);
      setInitialQuestion({
        question: res.data.question,
        audio_url: res.data.audio_url,
      });
      setQuestionNumber(1);
      setCaptionText(`면접관: ${res.data.question}`);
      setShowLoadingModal(false);
    } catch (err) {
      setShowLoadingModal(false);
      setShowErrorModal(true);
      setErrorMsg(
        "면접 세션 초기화에 실패했습니다.\n서버 상태를 확인해주세요."
      );
    }
  };

  // 후속질문마다 실행
  const handleNewQuestion = useCallback((q) => {
    setCaptionText(`면접관: ${q}`);
    setQuestionNumber((n) => n + 1);
  }, []);

  const handleAnswerComplete = (text) => {
    setCaptionText(`이용자: ${text}`);
  };

  return (
    <>
      <ScreenSizeGuard />
      <LoadingModal
        open={showLoadingModal}
        text="면접 세션을 불러오는 중입니다..."
      />
      <ErrorModal
        open={showErrorModal}
        message={errorMsg}
        onClose={() => setShowErrorModal(false)}
      />
      {step === "settings" && (
        <InterviewSettingModal
          onStart={handleStartSettings}
          onOpenMicCheck={openMicCheck}
        />
      )}

      {step === "guide" && <AssessmentIntro onConfirm={handleGuideConfirm} />}
      {micCheckOpen && <MicCheckModal onClose={closeMicCheck} />}
      {step === "welcome" && (
        <WelcomeMessage username="회원" onStart={handleWelcomeStart} />
      )}

      {step === "interview" && (
        <div className="interview-wrapper">
          <InterviewHeader totalDuration={200} />
          <div className="interview-section-body">
            <QuestionTabs questionNumber={questionNumber} />
            <div className="interview-body">
              {status !== "wait" && status !== "WAITING" && (
                <div className="status-display-box">
                  <QuestionStatusBar
                    status={status}
                    remainingTime={remainingTime}
                  />
                </div>
              )}
              {initialQuestion ? (
                <InterviewSessionManager
                  sessionId={sessionId}
                  jobRole={jobRole}
                  waitTime={waitTime}
                  allowRetry={allowRetry}
                  initialQuestion={initialQuestion}
                  onStatusChange={setStatus}
                  onTimeUpdate={setRemainingTime}
                  onNewQuestion={handleNewQuestion}
                  onAnswerComplete={handleAnswerComplete}
                />
              ) : (
                <div className="first-question-loading">첫 질문을 불러오는 중입니다...</div>
              )}
            </div>
          </div>

          <CaptionBox text={captionText} />
        </div>
      )}
    </>
  );
}

export default Interview;
