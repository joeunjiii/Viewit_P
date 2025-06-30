import React, { useState, useEffect } from "react";
import RecentSection from "./RecentSection";
import SpeechAlertModal from "../ex/SpeechAlertModal";
import InterviewTypeSelect from "../Interview/InterviewTypeSelect";
import { FaUsers } from "react-icons/fa";
import { Link } from "react-router-dom";
import "./css/Maincontent.css";
import feedbackImg3x from "./css/img/images1.jpg";
import feedbackImg1x from "./css/img/images3.jpg";
import { fetchLatestUserSessions } from "./asset/user";
function MainContent() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      // 토큰 없으면 로그인 처리 등
      setLoading(false);
      return;
    }
    // fetch 함수 예시
    fetchLatestUserSessions(token).then((data) => {
      setSessions(data || []);
      setLoading(false);
    });
  }, []);
  return (
    <div className="main-content">
      <div className="content-section">
        <div className="cards-container">
          <Link
            to=""
            className="card"
            onClick={(e) => {
              e.preventDefault(); // 페이지 이동 방지
              setShowTypeModal(true);
            }}
          >
            <div className="card-icon"></div>
            <div className="card-title">모의면접</div>
            <div className="card-semititle">
              실제 면접처럼 답변하고 나의 강점 알아보기
            </div>
          </Link>
        </div>

        <RecentSection sessions={sessions} loading={loading} />
        <div className="feedback-group">
          <div className="feedback-section">
            <div className="feedback-icon">
              <FaUsers />
            </div>
            <div className="feedback-text">이렇게 발표하는건 어떨까요?</div>
          </div>

          <div className="feedback-list">
            <a
              href="https://brunch.co.kr/@jungdamfounder/54"
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: "none" }}
            >
              <img
                src={feedbackImg3x}
                alt="피드백 1"
                className="feedback-image"
              />
              <div className="feedback-semitext">면접 어떻게 해야할까요?</div>
            </a>

            <a
              href="https://youtu.be/EKYxExHE0B0?si=7WrwQ2wcN86Kohaz"
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: "none" }}
            >
              <img
                src={feedbackImg1x}
                alt="피드백 3"
                className="feedback-image"
              />
              <div className="feedback-semitext">자기소개하는 법</div>
            </a>
          </div>
        </div>
      </div>
      {showModal && <SpeechAlertModal onClose={() => setShowModal(false)} />}
      {showTypeModal && (
        <InterviewTypeSelect onClose={() => setShowTypeModal(false)} />
      )}
    </div>
  );
}

export default MainContent;
