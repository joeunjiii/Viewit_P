import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MainContent from "./maincomponent/MainContent";
import MainHeader from "./maincomponent/MainHeader";
import { getUserInfoFromToken } from "./maincomponent/asset/getUserInfoFromToken"; // 유틸
import { fetchLatestUserSessions } from "./maincomponent/asset/user.js";
import "./css/main.css";

function Main() {
  const [sessions, setSessions] = useState([]);
  const navigate = useNavigate();
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    fetchLatestUserSessions(token).then(data => {
      setSessions(data || []);
    });
  }, []);
 

  return (
    <div className="main-wrapper">
      <MainHeader/>
      <MainContent sessions={sessions} /> {/* 세션 넘겨줌 */}
    </div>
  );
}

export default Main;
