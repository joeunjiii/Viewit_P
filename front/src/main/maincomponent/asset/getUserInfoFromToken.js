import { jwtDecode } from "jwt-decode";

/**
 * localStorage에서 JWT 토큰을 읽어서 유저 정보(name, email)를 추출합니다.
 * @returns {null|{name: string, email: string, payload: object, token: string}}
 */
export function getUserInfoFromToken() {
  const token = localStorage.getItem("token");
  //토큰확인 콘솔창
  // console.log("유저 토큰: " + token);
  if (!token) {
    window.location.href = "/login";
    return null;
  }

  try {
    const payload = jwtDecode(token);
    // name: 페이로드에 name이 있으면 사용, 없으면 "사용자"
    // email: sub(표준) 또는 email 필드 우선
    const name = payload.name || "사용자";
    const email = payload.sub || payload.email || "";
    return { name, email, payload, token };
  } catch (e) {
    console.error("JWT 디코딩 실패", e);
    window.location.href = "/login"
    return null;
  }
}
