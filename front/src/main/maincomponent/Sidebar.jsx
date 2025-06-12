import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { FaHome, FaFileAlt, FaCog, FaUsers } from "react-icons/fa";
import "./css/Sidebar.css";

function Sidebar({ onSpeechClick }) {
  const location = useLocation();
  const currentPath = location.pathname;

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const isTablet = windowWidth <= 1024;
  const sidebarClass = isTablet ? "sidebar tablet" : "sidebar";

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
          <span>프로필</span>
        </div>
        <div className="profile-info">
          <div className="username">사용자네네임</div>
          <div className="email">아이디@naver.com</div>
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
            className={`menu-link ${currentPath === "/speech" ? "active" : ""}`
            }
            onClick={onSpeechClick}
            style={{ cursor: "pointer" }}
          >
            <div className="menu-icon">
              <FaFileAlt />
            </div>
            {!isTablet && <span>스피치연습</span>}
          </div>
        </div>
      </nav>
      <div className="settings-button">
        <FaCog className="settings-icon" />
        {!isTablet && <span>설정</span>}
      </div>
    </div>
  );
}

function MenuItem({ label, icon, to, active, collapsed }) {
  return (
    <li className={active ? "active" : ""}>
      <Link to={to} className="menu-link">
        <div className="menu-icon">{icon}</div>
        {!collapsed && <span>{label}</span>}
      </Link>
    </li>
  );
}

export default Sidebar;
