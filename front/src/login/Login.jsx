// src/login/Login.jsx
import React, { useEffect } from "react";
import "./css/login.css";

export default function Login() {
  useEffect(() => {
    function handleMessage(event) {
      // [1] 팝업에서 전달받은 메시지 확인
      console.log("[Login] message event:", event.data, "from", event.origin);

      // [2] 보안: origin 체크
      if (event.origin !== window.location.origin) {
        console.warn("[Login] origin mismatch, ignoring message");
        return;
      }

      const { source, accessToken } = event.data || {};
      if (source === "naver" && accessToken) {
        console.log("[Login] got Naver accessToken:", accessToken);

        // [3] 백엔드에 accessToken 전달 (userId, jwt 응답받음)
        fetch("/api/auth/naver", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ accessToken }),
        })
          .then(res => {
            console.log("[Login] /api/auth/naver response status:", res.status);
            if (!res.ok) throw new Error("HTTP " + res.status);
            return res.json();
          })
          .then(data => {
            console.log("[Login] /api/auth/naver response body:", data);
            if (data.token && data.userId) {
              // [4] jwt, userId 모두 저장! (이 부분이 핵심)
              localStorage.setItem("token", data.token);
              localStorage.setItem("userId", data.userId);
              window.location.href = "/main";
            } else {
              alert("로그인 실패: 토큰 또는 userId 없음");
            }
          })
          .catch(err => {
            console.error("[Login] 네트워크 오류 또는 백엔드 에러", err);
            alert("네트워크 오류 발생");
          });
      }
    }

    // [5] postMessage 이벤트 리스너 등록/해제
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // 이미 로그인 되어 있으면 바로 메인으로 이동
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      window.location.href = "/main";
    }
  }, []);

  // 네이버 로그인 버튼 클릭 시 팝업 열기
  const handleLogin = () => {
    window.open(
      "/naver/callback.html", // public/naver/callback.html 경로
      "naverLoginPopup",
      "width=500,height=600,menubar=no,toolbar=no,status=no,scrollbars=yes"
    );
  };

  return (
    <div className="container">
      <div className="login-box">
        <img src="/assets/logo.png" alt="로고" className="login-logo" />
        <div className="horizontal-line" />
        <img
          src="/assets/naver.png"
          alt="네이버 로그인"
          className="naver-login-img"
          style={{ cursor: "pointer" }}
          onClick={handleLogin}
        />
      </div>
    </div>
  );
}