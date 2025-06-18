// components/Layout.jsx
import React, { useState } from "react";
import { Outlet, useLocation} from "react-router-dom";
import Sidebar from "./maincomponent/Sidebar";
import SpeechAlertModal from "./ex/SpeechAlertModal";
import "./Layout.css";

function Layout() {
  console.log("🔁 Layout 렌더링됨");
  const [showSpeechModal, setShowSpeechModal] = useState(false);
  const location = useLocation();
  
  const hideSidebar = location.pathname.startsWith("/Interview");

  return (
    <div className="layout-container">
      {!hideSidebar && (
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
