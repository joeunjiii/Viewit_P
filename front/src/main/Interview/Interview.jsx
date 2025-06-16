import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import InterviewSettingsModal from "./InterviewSettingModal";
import MicCheckModal from "./asset/Mic/MicCheckModal";
import Timer from "./asset/Timer";
import Question from "./asset/Question";
import CaptionBox from "./asset/CaptionBox";
import VoiceWaveform from "./asset/VoiceWaveform";
import QuestionTabs from "./asset/QuestionTabs";
import "./Interview.css";
import { requestNextTTSQuestion } from "./api/tts";

function Interview() {
  const [showModal, setShowModal] = useState(true);
  const [micCheckOpen, setMicCheckOpen] = useState(false);
  const [autoQuestion, setAutoQuestion] = useState(false); //자막 상태
  const [allowRetry, setAllowRetry] = useState(true);
  const [timerKey, setTimerKey] = useState(0); // Timer 리셋용
  const [waitTime, setWaitTime] = useState(5);
  const [questionNumber, setQuestionNumber] = useState(1); // Q1부터
  const [isWaiting, setIsWaiting] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState("");

  const navigate = useNavigate();

  //나중에 삭제
  const handleWaitComplete = () => {
    console.log("🛑 대기 시간 종료"); // ✅ 이름 일치하게 정의해두었는지 확인!
  };

  //예시데이터 나중에 state로 변경, 추후에 삭제
  const [captionText, setCaptionText] = useState(
    "면접관: 자기소개 부탁드립니다.길어짐확인길어짐확인길어짐확인길어짐확인길어짐확인길어짐확인길어짐확인길어짐확인길어짐확인길어짐확인길어짐확인길어짐확인길어짐확인길어짐확인길어짐확인길어짐확인길어짐확인길어짐확인길어짐확인길어짐확인길어짐확인길어짐확인길어짐확인길어짐확인길어짐확인길어짐확인길어짐확인길어짐확인길어짐확인길어짐확인길어짐확인길어짐확인길어짐확인길어짐확인길어짐확인길어짐확인길어짐확인길어짐확인길어짐확인길어짐확인길어짐확인길어짐확인길어짐확인길어짐확인길어짐확인길어짐확인"
  );

  const handleStart = (settings) => {
    console.log("시작 설정:", settings);
    setShowModal(false);
    setAutoQuestion(settings.autoQuestion);
    setWaitTime(settings.waitTime);
    setAllowRetry(settings.allowRetry);
    if (settings.micEnabled) {
      // 마이크 접근 시도
    }
  };

  //다음질문 TTS
  const handleNextQuestion = async () => {
    const result = await requestNextTTSQuestion();
    if (!result) return;
  
    const { audioUrl, question } = result;
    setCurrentQuestion(question);
  
    const audio = new Audio("http://localhost:8000" + audioUrl);
    audio.play();
  };

  useEffect(() => {
    if (!showModal) {
      const startMic = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
          });
          // 오디오 처리
        } catch (err) {
          console.error("🎤 Interview 페이지에서 마이크 접근 실패:", err);
        }
      };
      startMic();
    }
  }, [showModal]);

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
          {/* 상단 섹션 */}
          <div className="interview-header">
            <div className="header-left">
              <Timer duration={600} label="답변시간" mode="text" />
            </div>
            <div className="header-spacer" />
            <button className="end-button" onClick={() => navigate("/main")}>
              종료하기
            </button>
          </div>

          {/* 본문 섹션 */}
          <div className="interview-section-body">
            {/* 좌측: 질문 탭 */}
            <QuestionTabs questionNumber={questionNumber} />

            {/* 본문 2단 영역 */}
            <div className="interview-body">
              {/* 왼쪽: 음성 파형 */}
              <VoiceWaveform />
              {/* 타이머 */}
              <div className="timer-area">
                <Timer
                  duration={waitTime}
                  onComplete={handleWaitComplete}
                  label="대기시간"
                />
                {allowRetry && (
                  <button
                    className="replay-button"
                    onClick={() => window.location.reload()}
                  >
                    다시 답변하기
                  </button>
                )}
              </div>
            </div>
          </div>
          {autoQuestion && <CaptionBox text={captionText} />}
        </div>
      )}

      {/* 나중에 지우기  */}
      <div style={{ marginTop: "40px", padding: "0 32px" }}>
        <h4>🔈 테스트용 음성 업로드</h4>
        <input
          type="file"
          accept=".wav"
          onChange={async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const formData = new FormData();
            formData.append("audio", file);

            try {
              const res = await fetch("http://localhost:8000/interview/stt", {
                method: "POST",
                body: formData,
              });
              const data = await res.json();
              console.log("📝 변환된 텍스트:", data.text);
            } catch (error) {
              console.error("업로드 실패:", error);
            }
          }}
        />
      </div>
    </>
  );
}

export default Interview;
