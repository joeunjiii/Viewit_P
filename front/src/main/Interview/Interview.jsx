// Interview.jsx
import React, { useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { createInterviewSession, initSession } from "./api/interview";
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
  const userId = localStorage.getItem("userId");
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

  const safeUserId = userId && userId !== "null" && userId !== "undefined" ? userId : null;

  const handleStartSettings = ({ jobRole, autoQuestion, allowRetry, waitTime }) => {
    setJobRole(jobRole);
    setAutoQuestion(autoQuestion);
    setAllowRetry(allowRetry);
    setWaitTime(waitTime);
    setStep("guide");
  };

  const handleGuideConfirm = () => setStep("welcome");

  // 면접 시작 시 첫 질문
  const handleWelcomeStart = async () => {
    if (!safeUserId) {
      alert("로그인 정보가 없습니다. 로그인이 필요합니다.");
      window.location.href = "/login";
      return;
    }
    setStep("interview");
    setInitialQuestion(null);
    try {
      await createInterviewSession({
        session_id: sessionId,
        user_id: safeUserId,
        job_role: jobRole
      });
      const res = await initSession({
        session_id: sessionId,
        user_id: safeUserId,
        job_role: jobRole
      });
      setInitialQuestion({
        question: res.data.question,
        audio_url: res.data.audio_url,
      });
      setQuestionNumber(1);
      setCaptionText(`면접관: ${res.data.question}`);
    } catch (err) {
      alert("면접 세션 초기화에 실패했습니다.");
      setStep("settings");
    }
  };

  // 질문 번호 +1만 유지 (캡션 제어는 아래 콜백에서)
  const handleNewQuestion = useCallback((q) => {
    setQuestionNumber((n) => n + 1);
  }, []);

  // 캡션 제어 콜백: 면접관/이용자 모두 InterviewSessionManager에서 직접 세팅
  const handleCaptionUpdate = useCallback((text) => {
    setCaptionText(text);
  }, []);

  return (
      <>
        <ScreenSizeGuard />
        {step === "settings" && (
            <InterviewSettingModal onStart={handleStartSettings} onOpenMicCheck={openMicCheck} />
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
                          onCaptionUpdate={handleCaptionUpdate} // 추가
                      />
                  ) : (
                      <div>첫 질문을 불러오는 중입니다...</div>
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
