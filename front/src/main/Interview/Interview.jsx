import React, { useState} from "react";
import "./Interview.css";
import InterviewSettingsModal from "./InterviewSettingModal";
import MicCheckModal from "./asset/Mic/MicCheckModal";
import CaptionBox from "./asset/CaptionBox";
import QuestionTabs from "./asset/QuestionTabs";
import InterviewHeader from "./asset/InterviewHeader";
import QuestionStatusBar from "./asset/QuestionStatusBar";
import InterviewSessionManager from "./InterviewSessionManager";

function Interview() {
  const [showModal, setShowModal] = useState(true);
  const [micCheckOpen, setMicCheckOpen] = useState(false);
  const [autoQuestion, setAutoQuestion] = useState(false);
  const [allowRetry, setAllowRetry] = useState(true);
  const [waitTime, setWaitTime] = useState(5);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [captionText, setCaptionText] = useState("면접관: 자기소개 부탁드립니다.");
  const [status, setStatus] = useState("idle");
  const [remainingTime, setRemainingTime] = useState(0);
  //예시데이터 나중에 state로 변경, 추후에 삭제

  const handleStart = (settings) => {
    setShowModal(false);
    setAutoQuestion(settings.autoQuestion);
    setWaitTime(settings.waitTime);
    setAllowRetry(settings.allowRetry);
  };

  return (
    <>
      {showModal && (
        <InterviewSettingsModal
          onClose={() => setShowModal(false)}
          onStart={handleStart}
          onOpenMicCheck={() => setMicCheckOpen(true)}
          onTTSComplete={() => console.log("TTS 끝남")}
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
                <QuestionStatusBar
                  status={status}
                  remainingTime={remainingTime}
                />
              </div>
              <InterviewSessionManager
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
