import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FaHome,
  FaCog,
  FaUsers,
  FaMicrophone,
  FaUserCircle,
} from "react-icons/fa";
import "./css/Sidebar.css";
import { getUserInfoFromToken } from "./asset/getUserInfoFromToken";
function Sidebar({ onSpeechClick }) {
  const location = useLocation();
  const currentPath = location.pathname;
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const isTablet = windowWidth <= 1024;
  const sidebarClass = isTablet ? "sidebar tablet" : "sidebar";
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // 1. 토큰이 있는지 확인해서 상태관리
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");

  const navigate = useNavigate();
  useEffect(() => {
    const userInfo = getUserInfoFromToken();
    if (userInfo) {
      setUsername(userInfo.name);
      setEmail(userInfo.email);
    } else {
      setUsername("");
      setEmail("");
      // 인증 실패시 로그인 페이지로 이동(선택)
      // navigate("/login");
    }
  }, []);
  useEffect(() => {
    
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [token, navigate]);

  const handleLogout = () => {
    // 🔐 프론트에서 토큰 제거 + 메인 이동
    localStorage.removeItem("token"); // 예시
    window.location.href = "/";
  };

  return (
    <div className={sidebarClass}>
      {/* 로고 */}
      <div className="logo-section">
        <Link to="/main">
          <img src="/assets/logo.png" alt="로고" className="sidebar-logo" />
        </Link>
      </div>

      <div className="profile-section">
        <div className="profile-icon">
          <FaUserCircle size={60} color="#bfcbe7" />
        </div>
        <div className="profile-info">
          <div className="username">{username || "로그인 필요"}</div>
          <div className="email">{email}</div>
        </div>
      </div>

      <nav className="main-nav">
        <div className="menu-list">
          <Link
            to="/main"
            className={`menu-link ${currentPath === "/main" ? "active" : ""}`}
          >
            <div className="menu-icon">
              <FaHome />
            </div>
            {!isTablet && <span>메인</span>}
          </Link>

          <Link
            to="/interview"
            className={`menu-link ${
              currentPath === "/interview" ? "active" : ""
            }`}
          >
            <div className="menu-icon">
              <FaUsers />
            </div>
            {!isTablet && <span>모의면접</span>}
          </Link>

          <div
            to="/speech"
            className={`menu-link ${currentPath === "/speech" ? "active" : ""}`}
            onClick={onSpeechClick}
            style={{ cursor: "pointer" }}
          >
            <div className="menu-icon">
              <FaMicrophone />
            </div>
            {!isTablet && <span>스피치연습</span>}
          </div>
        </div>
      </nav>

      <div className="settings-button" onClick={() => setShowLogoutModal(true)}>
        <FaCog className="settings-icon" />
        {!isTablet && <span>설정</span>}
      </div>
      {/* 로그아웃 모달 */}
      {showLogoutModal && (
        <div className="logout-modal-overlay">
          <div className="logout-modal">
            <h3 className="logout-title">로그아웃 하시겠습니까?</h3>
            <div className="logout-actions">
              <button
                className="logout-cancel"
                onClick={() => setShowLogoutModal(false)}
              >
                취소
              </button>
              <button className="logout-confirm" onClick={handleLogout}>
                로그아웃
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Sidebar;
