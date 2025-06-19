// src/login/Login.jsx
import React, { useEffect } from "react";
import "./login.css";

export default function Login() {
  useEffect(() => {
    function handleMessage(event) {
      // 1) 메시지 수신 확인용 로그
      console.log("[Login] message event:", event.data, "from", event.origin);

      // 2) 보안: 반드시 origin 체크 (팝업과 같은 출처인지)
      if (event.origin !== window.location.origin) {
        console.warn("[Login] origin mismatch, ignoring message");
        return;
      }

      const { source, accessToken } = event.data || {};
      if (source === "naver" && accessToken) {
        console.log("[Login] got Naver accessToken:", accessToken);

        // 3) 백엔드에 토큰 전달 (proxy 활용)
        fetch("/api/auth/naver", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",              // 쿠키 기반 인증 쓰려면 필요
          body: JSON.stringify({ accessToken }),
        })
            .then(res => {
              console.log("[Login] /api/auth/naver response status:", res.status);
              if (!res.ok) throw new Error("HTTP " + res.status);
              return res.json();
            })
            .then(data => {
              console.log("[Login] /api/auth/naver response body:", data);
              if (data.token) {
                localStorage.setItem("token", data.token);
                window.location.href = "/main";
              } else {
                alert("로그인 실패: 토큰이 없습니다.");
              }
            })
            .catch(err => {
              console.error("[Login] 네트워크 오류 또는 백엔드 에러", err);
              alert("네트워크 오류 발생");
            });
      }
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const handleLogin = () => {
    window.open(
        "/naver/callback.html",          // public/naver/callback.html 경로
        "naverLoginPopup",
        "width=500,height=600,menubar=no,toolbar=no,status=no,scrollbars=yes"
    );
  };
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      // ✅ 토큰이 있으면 바로 메인 페이지로 이동
      window.location.href = "/main";
    }
  }, []);
  
  return (
      <div className="container">
        <div className="login-box">
          <img src="/assets/logo.png" alt="로고" className="login-logo" />
          <div className="horizontal-line" />
          <button className="naver-button" onClick={handleLogin}>
            <img
                src="/assets/naver.png"
                alt="네이버 로그인"
                className="naver-icon"
            />
            네이버 로그인
          </button>
        </div>
      </div>
  );
}
