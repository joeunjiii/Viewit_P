import React, { useEffect, useState } from "react";
import axios from "axios";
import { getUserInfoFromToken } from "./asset/getUserInfoFromToken";

function FeedbackSessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userInfo = getUserInfoFromToken();
    if (!userInfo) return;

    axios
      .get("http://localhost:8000/api/user/sessions", {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      })
      .then((res) => {
        setSessions(res.data);
      })
      .catch((err) => {
        console.error("세션 조회 실패:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>로딩 중...</div>;

  return (
    <div>
      <h2>내 세션 목록</h2>
      {sessions.length === 0 ? (
        <p>세션이 없습니다.</p>
      ) : (
        sessions.map((s) => (
          <div key={s.session_id}>
            {s.date} - {s.job_role}
          </div>
        ))
      )}
    </div>
  );
}

export default FeedbackSessions;
