import React, { useState } from "react";
import RecentSection from "./RecentSection";
import SpeechAlertModal from "../ex/SpeechAlertModal";
import { FaUsers, FaMicrophone } from "react-icons/fa";
import { Link } from "react-router-dom";
import "./css/Maincontent.css";
import feedbackImg3x from "./css/img/images1.jpg";
import feedbackImg2x from "./css/img/images2.png";
import feedbackImg1x from "./css/img/images3.jpg";
function MainContent() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="main-content">
      <div className="content-section">
        <div className="cards-container">
          <Link to="/Interview" className="card">
            <div className="card-icon"></div>
            <div className="card-title">모의면접</div>
            <div className="card-semititle">
              실제 면접처럼 답변하고 나의 강점 알아보기
            </div>
          </Link>
        </div>

        <RecentSection />

        <div className="feedback-section">
          <div className="feedback-icon">
            <FaUsers />
          </div>
          <div className="feedback-text">이렇게 발표하는건 어떨까요?</div>
        </div>

        <div className="feedback-list">
          <div className="feedback-list">
            {/* 첫 번째 이미지 */}
            <div>
              <img
                src={feedbackImg3x}
                alt="피드백 1"
                className="feedback-image"
              />
              <div className="feedback-semitext">면접 어떻게해야할까요?</div>
            </div>

            <div>
              <img
                src={feedbackImg1x}
                alt="피드백 3"
                className="feedback-image"
              />
              <div className="feedback-semitext">멋지게 인사하는법</div>
            </div>
          </div>
        </div>
      </div>
      {showModal && <SpeechAlertModal onClose={() => setShowModal(false)} />}
    </div>
  );
}

export default MainContent;
