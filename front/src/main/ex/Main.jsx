import { useState } from "react"
import { useNavigate } from 'react-router-dom';

import "./main.css"
import { FaHome, FaMicrophone, FaFileAlt, FaCog, FaUsers, FaRegFileAlt } from "react-icons/fa"

function Main() {
  const [activeMenu, setActiveMenu] = useState("speech")

  return (
    <div className="app-container">
      {/* 왼쪽 사이드바 */}
      <div className="sidebar">
        <div className="profile-section">
          <div className="profile-icon">
            <span>pro</span>
          </div>
          <div className="profile-info">
            <div className="username">사용자네네임</div>
            <div className="email">아이디@naver.com</div>
          </div>
        </div>

        <nav className="main-nav">
          <ul>
            <li className={activeMenu === "main" ? "active" : ""} onClick={() => setActiveMenu("main")}>
              <FaHome className="menu-icon" />
              <span>메인</span>
            </li>
            <li className={activeMenu === "interview" ? "active" : ""} onClick={() => setActiveMenu("interview")}>
              <FaUsers className="menu-icon" />
              <span>모의면접</span>
            </li>
            <li className={activeMenu === "speech" ? "active" : ""} onClick={() => setActiveMenu("speech")}>
              <FaFileAlt className="menu-icon" />
              <span>스피치연습</span>
            </li>
          </ul>
        </nav>

        <div className="settings-button">
          <FaCog className="settings-icon" />
          <span>설정</span>
        </div>
      </div>

      {/* 메인 콘텐츠 영역 */}
      <div className="main-content">
        <header className="main-header">
          <h1>대충 모의 면접 소개글</h1>
        </header>

        <div className="content-section">
          <div className="section-header">
            <FaMicrophone className="section-icon" />
            <h2>스피치 연습</h2>
          </div>

          <div className="cards-container">
            <div className="card">
              <div className="card-icon">
                <FaUsers />
              </div>
              <div className="card-title">모의면접</div>
            </div>
            <div className="card">
              <div className="card-icon">
                <FaMicrophone />
              </div>
              <div className="card-title">스피치 연습</div>
            </div>
          </div>

          <div className="recent-section">
            <div className="recent-header">
              <FaRegFileAlt className="recent-icon" />
              <h3>최근 스피치</h3>
            </div>
            <div className="recent-item">{/* 최근 스피치 아이템 */}</div>
          </div>

          <div className="feedback-section">
            <div className="feedback-icon">
              <FaUsers />
            </div>
            <div className="feedback-text">이렇게 발표하는건 어떨까요?</div>
          </div>

          <div className="feedback-item">{/* 피드백 아이템 */}</div>
        </div>
      </div>
    </div>
  )
}

export default Main
