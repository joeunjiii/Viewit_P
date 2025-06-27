import React, { useEffect, useState } from "react";
import MainContent from "./maincomponent/MainContent";
import MainHeader from "./maincomponent/MainHeader";
import { getUserInfoFromToken } from "./maincomponent/asset/getUserInfoFromToken"; // 유틸
import { fetchUserSessions } from "./maincomponent/asset/user"; // 세션 조회 API 함수
import "./css/main.css";

function Main() {
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    const userInfo = getUserInfoFromToken();
    if (!userInfo) return;

    // 세션 목록 API 호출
    fetchUserSessions(userInfo.token).then(setSessions).catch((e) => {
      console.error("세션 불러오기 실패", e);
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
