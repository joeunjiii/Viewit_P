import React,{useState} from "react";
import SectionHeader from "./SectionHeader";
import RecentSection from "./RecentSection";
import SpeechAlertModal from "../ex/SpeechAlertModal";
import { FaUsers, FaMicrophone } from "react-icons/fa";
import { Link } from "react-router-dom";
import "./css/Maincontent.css";

function MainContent() {
  const [showModal, setShowModal] = useState(false);

  const handleSpeechClick = () => {
    setShowModal(true);
  };

  return (
    <div className="main-content">
      <header className="main-header">
        <div className="explain">
          <h1>AI 모의면접 서비스 소개</h1>
          <br />
          <h2>
            AI 모의면접은 사용자의 음성 답변을 실시간으로 분석하여, 실제 면접과
            유사한 환경에서 효과적으로 면접 연습을 할 수 있도록 도와주는 훈련
            서비스입니다.
          </h2>
        </div>
      </header>

      <div className="content-section">
        <SectionHeader />

        <div className="cards-container">
          <Link to="/Interview" className="card">
            <div className="card-icon">
              <FaUsers />
            </div>
            <div className="card-title">모의면접</div>
          </Link>

          <div className="card" onClick={handleSpeechClick}>
            <div className="card-icon">
              <FaMicrophone />
            </div>
            <div className="card-title">스피치 연습</div>
          </div>
        </div>

        <RecentSection />

        <div className="feedback-section">
          <div className="feedback-icon">
            <FaUsers />
          </div>
          <div className="feedback-text">이렇게 발표하는건 어떨까요?</div>
        </div>

        <div className="feedback-list">
          <div
            className="feedback-card"
            onClick={() => alert("피드백 1 클릭됨")}
          >
            수정예정
          </div>
          <div
            className="feedback-card"
            onClick={() => alert("피드백 2 클릭됨")}
          >
            수정예정
          </div>
          <div
            className="feedback-card"
            onClick={() => alert("피드백 3 클릭됨")}
          >
            수정예정
          </div>
        </div>
      </div>
      {showModal && <SpeechAlertModal onClose={() => setShowModal(false)} />}
    </div>
    
  );
  
}

export default MainContent;
