// src/main/Interview/Interview.jsx
import { v4 as uuidv4 } from "uuid";
import { initSession, nextQuestion, finalAnswer } from "./api/interview";

import React, { useState, useEffect } from "react";
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

  // ⭐️ 최초 질문(오디오 포함)을 여기에 저장!
  const [firstQuestion, setFirstQuestion] = useState(null);

  // 면접 설정에서 "시작" 버튼 눌렀을 때
  const handleStart = async (settings) => {
    setShowModal(false);
    setAutoQuestion(settings.autoQuestion);
    setWaitTime(settings.waitTime);
    setAllowRetry(settings.allowRetry);
    setJobRole(settings.jobRole);
    try {
      const res = await initSession(sessionId, settings.jobRole);
      setFirstQuestion(res.data); // { question, audio_url }
      if (settings.autoQuestion) {
        setCaptionText(`면접관: ${res.data.question}`);
      }
    } catch (err) {
      console.error("init_session 실패", err);
      setCaptionText("오류가 발생했습니다. 새로고침 해주세요.");
    }
  };

  const openMicCheck = () => setMicCheckOpen(true);
  const closeMicCheck = () => setMicCheckOpen(false);

  useEffect(() => {
    console.log("[Interview] firstQuestion:", firstQuestion);
  }, [firstQuestion]);

  return (
      <>
        {showModal && (
            <InterviewSettingsModal
                onClose={() => setShowModal(false)}
                onStart={handleStart}
                onOpenMicCheck={openMicCheck}
            />
        )}

        {micCheckOpen && <MicCheckModal onClose={closeMicCheck} />}

        {/* 최초 질문이 세팅되어야 진행! */}
        {!showModal && firstQuestion && (
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
                      initialQuestion={firstQuestion} // ⭐️ 최초 질문을 prop으로 전달!
                      onStatusChange={setStatus}
                      onTimeUpdate={setRemainingTime}
                      onNewQuestion={(q) => {
                        if (autoQuestion) setCaptionText(`면접관: ${q}`);
                      }}
                      onAnswerComplete={async (userText) => {
                        if (autoQuestion) setCaptionText(`이용자: ${userText}`);

                        try {
                          const res = await nextQuestion(sessionId, userText);
                          const nextQ = res.data.question;

                          if (autoQuestion) setCaptionText(`면접관: ${nextQ}`);
                          setQuestionNumber((prev) => prev + 1);

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
              {autoQuestion && <CaptionBox text={captionText} />}
            </div>
        )}
      </>
  );
}

export default Interview;
