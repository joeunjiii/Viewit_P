import React, { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { initSession, nextQuestion, finalAnswer } from "./api/interview";
import "./Interview.css";
import InterviewSettingsModal from "./InterviewSettingModal";
import MicCheckModal from "./asset/Mic/MicCheckModal";
import CaptionBox from "./asset/CaptionBox";
import QuestionTabs from "./asset/QuestionTabs";
import InterviewHeader from "./asset/InterviewHeader";
import QuestionStatusBar from "./asset/QuestionStatusBar";
import InterviewSessionManager from "./InterviewSessionManager";

function Interview() {
  const [sessionId] = useState(uuidv4());
  const [jobRole, setJobRole] = useState("backend");
  const [showModal, setShowModal] = useState(true);
  const [micCheckOpen, setMicCheckOpen] = useState(false);
  const [autoQuestion, setAutoQuestion] = useState(false);
  const [allowRetry, setAllowRetry] = useState(true);
  const [waitTime, setWaitTime] = useState(5);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [captionText, setCaptionText] = useState("");
  const [status, setStatus] = useState("idle");
  const [remainingTime, setRemainingTime] = useState(0);

  /* ───────────── SettingsModal “시작” ───────────── */
  const handleStart = async (settings) => {
    setShowModal(false);
    setAutoQuestion(settings.autoQuestion);
    setWaitTime(settings.waitTime);
    setAllowRetry(settings.allowRetry);
    setJobRole(settings.jobRole);

    try {
      const res = await initSession(sessionId, settings.jobRole);
      if (settings.autoQuestion) {
        setCaptionText(`면접관: ${res.data.question}`);
      }
    } catch (err) {
      console.error("init_session 실패", err);
      setCaptionText("오류가 발생했습니다. 새로고침 해주세요.");
    }
  };

  /* ──────────────────────────────── */
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
                      /* ⬇️ 면접관 새 질문 수신 → 자막 갱신 */
                      onNewQuestion={(q) => {
                        if (autoQuestion) setCaptionText(`면접관: ${q}`);
                      }}
                      /* 사용자가 답변 완료됐을 때 */
                      onAnswerComplete={async (userText) => {
                        if (autoQuestion) setCaptionText(`이용자: ${userText}`);

                        try {
                          const res = await nextQuestion(sessionId, userText);
                          const nextQ = res.data.question;

                          if (autoQuestion) setCaptionText(`면접관: ${nextQ}`);
                          setQuestionNumber((prev) => prev + 1);

                          /* 마지막 질문이면 */
                          if (res.data.done) {
                            await finalAnswer(sessionId, userText);
                          }
                        } catch (err) {
                          console.error("next_question 실패", err);
                          setCaptionText("네트워크 오류가 발생했습니다.");
                        }
                      }}
                  />
                </div>
              </div>

              {/* 자막 스위치 켜져 있을 때만 표시 */}
              {autoQuestion && <CaptionBox text={captionText} />}
            </div>
        )}
      </>
  );
}

export default Interview;
