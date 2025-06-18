// components/Layout.jsx
import React, { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./maincomponent/Sidebar";
import SpeechAlertModal from "./ex/SpeechAlertModal";
import "./Layout.css";

function Layout() {
  const [showSpeechModal, setShowSpeechModal] = useState(false);
  const location = useLocation();
  console.log("🔁 Layout 렌더링됨");
  console.log("현재 경로:", location.pathname);
  const isInterviewPage = location.pathname === "/Interview"; // 실제 Interview 페이지 경로로 변경해주세요

  console.log("인터뷰 페이지인가요?", isInterviewPage);
  return (
    <div className="layout-container">
      {/* Interview 페이지가 아닐 때만 Sidebar 렌더링 */}
      {!isInterviewPage && (
        <Sidebar onSpeechClick={() => setShowSpeechModal(true)} />
      )}

      {showSpeechModal && (
        <SpeechAlertModal onClose={() => setShowSpeechModal(false)} />
      )}
      <main className="content-area">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
