// src/login/Login.jsx
import React, { useEffect } from "react";
import "./login.css";

export default function Login() {
  useEffect(() => {
    function handleMessage(e) {
      if (e.origin !== window.location.origin) return;
      const { source, accessToken } = e.data || {};
      if (source === "naver" && accessToken) {
        // 받은 토큰으로 백엔드 인증
        fetch("/api/auth/naver", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accessToken }),
        })
            .then(res => {
              if (res.ok) window.location.href = "/main";
              else alert("로그인 실패");
            })
            .catch(() => alert("네트워크 오류"));
      }
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const handleLogin = () => {
    window.open(
        "/naver/callback.html",          // ← 콜백 페이지만 팝업
        "naverLoginPopup",
        "width=500,height=600,menubar=no,toolbar=no,status=no,scrollbars=yes"
    );
  };

  return (
      <div className="container">
        <div className="login-box">
          <img src="/assets/logo.png" alt="로고" className="login-logo" />
          <div className="horizontal-line" />
          <button className="naver-button" onClick={handleLogin}>
            <img
                src="https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/ae/c9/ec/aec9ecca-cdbc-0de4-d0bb-2dc45cb43373/AppIcon-0-0-1x_U007epad-0-1-0-sRGB-0-85-220.png/230x0w.webp"
                alt="네이버 로그인"
                className="naver-icon"
            />
            네이버로 로그인
          </button>
        </div>
      </div>
  );
}
