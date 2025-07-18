// components/Layout.jsx
import React, { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./maincomponent/Sidebar";
import SpeechAlertModal from "./ex/SpeechAlertModal";
import "./css/Layout.css";

function Layout() {
  console.log("🔁 Layout 렌더링됨");
  const [showSpeechModal, setShowSpeechModal] = useState(false);
  const location = useLocation();
  const isInterviewPage = location.pathname.includes("/Interview");

  console.log("인터뷰 페이지인가요?", isInterviewPage);
  return (
    <div className="layout-container">
      {!isInterviewPage && <Sidebar />}

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
