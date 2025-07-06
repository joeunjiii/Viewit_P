// Interview.jsx
import React, { useState, useCallback, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { createInterviewSession, endSession, initSession } from "./api/interview";
import "./css/Interview.css";
import InterviewSettingModal from "./InterviewSettingModal";
import AssessmentIntro from "./AssessmentIntro";
import WelcomeMessage from "./WelcomeMessage";
import ScreenSizeGuard from "./asset/ScreenSizeGuard";
import MicCheckModal from "./asset/Mic/MicCheckModal";
import InterviewHeader from "./asset/InterviewHeader";
import QuestionTabs from "./asset/QuestionTabs";
import InterviewSessionManager from "./InterviewSessionManager";
import CaptionBox from "./asset/CaptionBox";
import LoadingModal from "./asset/LoadingModal";
import ErrorModal from "./asset/ErrorModal";
import PersonalizationModal from "./PersonalizationModal";
import Timer from "./asset/Timer";
import defaultImg from "./img/default.png";
import ttsImg from "./img/tts.png";
import waitImg from "./img/waiting.png";
import LoadingSpinner from "../maincomponent/asset/LoadingSpinner";
import EndConfirmModal from "./asset/EndConfirmModal";
import UploadingLoading from "../maincomponent/asset/UploadingLoading";


function Interview() {
  const location = useLocation();
  const navigate = useNavigate()
  const mode = new URLSearchParams(location.search).get("mode");
  const [showPersonalModal, setShowPersonalModal] = useState(
    mode === "personal"
  );
  const [showSettingModal, setShowSettingModal] = useState(mode === "common");
  const [personalData, setPersonalData] = useState(null);
  const userId = localStorage.getItem("userId");

  const [step, setStep] = useState("settings");
  const [sessionId] = useState(uuidv4());
  const [interviewerVoice, setInterviewerVoice] = useState("");
  const [jobRole, setJobRole] = useState("backend");
  // const [autoQuestion, setAutoQuestion] = useState(true);
  const [allowRetry, setAllowRetry] = useState(true);
  const [waitTime, setWaitTime] = useState(5);
  const [micCheckOpen, setMicCheckOpen] = useState(false);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(1);
  const [questions, setQuestions] = useState([]);
  const [hasReceivedQuestion, setHasReceivedQuestion] = useState(false);
  const [captionText, setCaptionText] = useState("");
  const [status, setStatus] = useState("idle");
  const [remainingTime, setRemainingTime] = useState(0);
  const [initialQuestion, setInitialQuestion] = useState(null);
  const [captionEnabled, setCaptionEnabled] = useState(true);
  const [isEnding, setIsEnding] = useState(false);
  const [currentUserAnswer, setCurrentUserAnswer] = useState(""); //답변전달 스테이트
  const sessionManagerRef = useRef(null); // InterviewSessionManager ref 추가

  const openMicCheck = () => setMicCheckOpen(true);
  const closeMicCheck = () => setMicCheckOpen(false);

  const safeUserId =
    userId && userId !== "null" && userId !== "undefined" ? userId : null;
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showEndConfirmModal, setShowEndConfirmModal] = useState(false);

  const statusImages = {
    tts: ttsImg,
    default: defaultImg,
    wait: waitImg,
  };

  const handlePersonalConfirm = (data) => {
    setPersonalData(data); // JD/파일 등 저장
    setShowPersonalModal(false); // PersonalizationModal 닫기
    setShowSettingModal(true); // InterviewSettingModal 띄우기
    console.log("JD 텍스트:", data.jd_text);
    console.log("PDF OCR 텍스트:", data.pdf_ocr_text);
  };

  //종료하기 핸들러
  const handleManualEnd = () => {
    setShowEndConfirmModal(true);
  }

  // 종료 확인 핸들러
  const handleEndConfirm = async () => {
    setShowEndConfirmModal(false);

    // InterviewSessionManager의 수동 종료 함수 호출
    if (sessionManagerRef.current) {
      await sessionManagerRef.current.handleManualEnd();
    }
  }

  // 종료 취소 핸들러
  const handleEndCancel = () => {
    setShowEndConfirmModal(false);
  }


  const handleStartSettings = ({
    interviewerVoice,
    jobRole,
    autoQuestion,
    allowRetry,
    waitTime,
    captionEnabled,
  }) => {
    setInterviewerVoice(interviewerVoice);
    setJobRole(jobRole);
    // setAutoQuestion(autoQuestion);
    setAllowRetry(allowRetry);
    setWaitTime(waitTime);
    setShowSettingModal(false);
    setCaptionEnabled(captionEnabled);
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
    setShowLoadingModal(true); // 로딩모달 on

    try {
      // 2초 대기 + 세션 초기화 병렬 실행
      const delay = new Promise((resolve) => setTimeout(resolve, 2000));

      // 면접 세션(백엔드/DB) 생성 -> 성공 후 initSession 호출
      await createInterviewSession({
        session_id: sessionId,
        user_id: safeUserId,
        job_role: jobRole,
        wait_time: waitTime,
        interviewerVoice,
      });
      console.log("🔍 session 초기화 파라미터:", {
        session_id: sessionId,
        user_id: safeUserId,
        job_role: jobRole,
        wait_time: waitTime,
        interviewerVoice: interviewerVoice,
      });

      const [res] = await Promise.all([
        initSession({
          session_id: sessionId,
          user_id: safeUserId,
          job_role: jobRole,
          jdText: personalData?.jd_text || "",
          pdfText: personalData?.pdf_ocr_text || "",
          interviewerVoice,
        }),
        delay,
      ]);

      setInitialQuestion({
        question: res.data.question,
        audio_url: res.data.audio_url,
      });
      setQuestionNumber(1);
      setTotalQuestions(1);
      setQuestions([res.data.question]);
      setHasReceivedQuestion(true);
      setCaptionText(`면접관: ${res.data.question}`);
      setShowLoadingModal(false);
    } catch (err) {
      setShowLoadingModal(false);
      setShowErrorModal(true);
      setErrorMsg(
        "면접 세션 초기화에 실패했습니다.\n서버 상태를 확인해주세요."
      );
      setStep("settings");
    }
  };

  // 사용자 답변을 처리하는 콜백 함수
  const handleUserAnswer = useCallback((answerText) => {
    console.log("사용자 답변:", answerText);
    setCurrentUserAnswer(answerText);
  }, []);

  // 질문 번호 +1만 유지 (캡션 제어는 아래 콜백에서)
  const handleNewQuestion = useCallback((q) => {
    setQuestionNumber((n) => n + 1);
    setTotalQuestions((t) => t + 1);
    setQuestions((prev) => [...prev, q]);
    setHasReceivedQuestion(true);
    setCurrentUserAnswer(""); //다음질문 시작되면 사용자 답변나오는곳은 초기화
  }, []);

  // 캡션 제어 콜백: 면접관/이용자 모두 InterviewSessionManager에서 직접 세팅
  const handleCaptionUpdate = useCallback((text) => {
    setCaptionText(text);
  }, []);

  return (
    <>
      <ScreenSizeGuard />
      <LoadingModal
        open={showLoadingModal}
        type="interview"
        text="면접 세션을 불러오는 중입니다..."
      />
      <ErrorModal
        open={showErrorModal}
        message={errorMsg}
        onClose={() => setShowErrorModal(false)}
      />
      <EndConfirmModal
        isOpen={showEndConfirmModal}
        onConfirm={handleEndConfirm}
        onCancel={handleEndCancel}
      />
      {step === "settings" && (
        <InterviewSettingModal
          onStart={handleStartSettings}
          onOpenMicCheck={openMicCheck}
        />
      )}
      {/* 개인화 모드면 먼저 PersonalizationModal 띄우기 */}
      {showPersonalModal && (
        <PersonalizationModal
          onClose={() => setShowPersonalModal(false)}
          onConfirm={handlePersonalConfirm}
        />
      )}

      {/* 세팅 모달은 개인화/공통 모두에서 사용 */}
      {showSettingModal && (
        <InterviewSettingModal
          onStart={handleStartSettings}
          onOpenMicCheck={openMicCheck}
          mode={mode}
          personalData={personalData}
          onClose={() => setShowSettingModal(false)}
        />
      )}
      {step === "guide" && <AssessmentIntro onConfirm={handleGuideConfirm} />}
      {micCheckOpen && <MicCheckModal onClose={closeMicCheck} />}
      {step === "welcome" && (
        <WelcomeMessage username="회원" onStart={handleWelcomeStart} />
      )}

      {step === "interview" && (
        <div className="interview-wrapper">
          <InterviewHeader totalDuration={600}
            onEndInterview={handleManualEnd} />
          <div className="interview-section-body">
            {hasReceivedQuestion && (
              <QuestionTabs
                current={questionNumber}
                total={1}
                status={status}
                remainingTime={remainingTime}
              />
            )}
            <CaptionBox text={captionText} enabled={captionEnabled} />
            <div className="interview-body">
              <div className="center-row-fixed">
                <div className="side-area-fixed" />
                <div className="img-area">
                  {/* {console.log("status:", status)} */}
                  <img
                    src={statusImages[status] || defaultImg}
                    alt={status}
                    className="step-img"
                  />
                </div>
                <div className="timer-area-fixed">
                  {status === "wait" ? (
                    <Timer
                      duration={remainingTime}
                      autoStart
                      label="대기시간"
                    />
                  ) : (
                    <div style={{ width: "160px", height: "70px" }} />
                  )}
                </div>
              </div>
            </div>

            {initialQuestion && (
              <InterviewSessionManager
                ref={sessionManagerRef} // ref 추가
                sessionId={sessionId}
                jobRole={jobRole}
                isEnding={isEnding}
                setIsEnding={setIsEnding}
                waitTime={waitTime}
                allowRetry={allowRetry}
                initialQuestion={initialQuestion}
                onStatusChange={setStatus}
                onTimeUpdate={setRemainingTime}
                onNewQuestion={handleNewQuestion}
                onCaptionUpdate={handleCaptionUpdate}
                onUserAnswer={handleUserAnswer} // 사용자 답변 전달 콜백
              />
            )}
          </div>
          {/* 종료 중일 때 전체 화면을 덮는 오버레이 */}
          {isEnding && (
            <div className="interview-end-overlay">
              <div className="interview-end-modal-card">
                <UploadingLoading />
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default Interview;
