// api/feedback.js
import axios from "axios";

export async function fetchFeedbackResult(sessionId) {
  // 실제로는 sessionId나 userId 등 파라미터에 따라 다르게 호출
  const res = await axios.get(`/api/feedback/${sessionId}`);
  return res.data;
}
