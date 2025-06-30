// api/feedback.js
import axios from "axios";

export async function fetchFeedbackResult(sessionId) {
  try {
    // 토큰을 localStorage 등에서 꺼내기
    const token = localStorage.getItem("token");
    const res = await axios.get(`/api/feedback/${sessionId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res.data;
  } catch (e) {
    throw new Error("불러오기 실패");
  }
}
