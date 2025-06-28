import axios from "axios";

// 메인화면용 (최신 5개만)
export async function fetchLatestUserSessions(token) {
  try {
    const response = await axios.get("http://localhost:8000/api/user/sessions/latest", {
      headers: {
        Authorization: `Bearer ${token}`,
      }
      // params 필요 없음!
    });
    console.log("✅ 세션 데이터:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ 최신 세션 불러오기 실패", error);
    return null;
  }
}

// user.js

export async function fetchInterviewHistory(token, limit = 5, offset = 0) {
  try {
    console.log("🪪 보낼 토큰:", token);
    const response = await axios.get("http://localhost:8000/api/user/sessions/history", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: { limit, offset }
    });
    console.log("✅ 세션 데이터:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ 세션 불러오기 실패", error);
    return null;
  }
}

