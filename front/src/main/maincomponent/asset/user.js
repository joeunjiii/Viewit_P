import axios from "axios";

export async function fetchUserSessions(token) {
  try {
    console.log("🪪 보낼 토큰:", token); // 토큰 출력 확인
    const response = await axios.get("http://localhost:8000/api/user/sessions", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log("✅ 세션 데이터:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ 세션 불러오기 실패", error);
    return null; // 실패 시 null 리턴
  }
}
