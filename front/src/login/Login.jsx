import "./login.css";
import { useNavigate } from "react-router-dom";


function Login() {
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate("/main"); // 메인 페이지로 이동
  };
  return (
    <div className="container">
      <div className="login-box">
        <img
          src="/assets/logo.png"  // 또는 외부 URL 사용 가능
          alt="로고"
          className="login-logo"
        />
        <div className="horizontal-line"></div>
        <button className="naver-button" onClick={handleLogin}>
          <img
            src="https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/ae/c9/ec/aec9ecca-cdbc-0de4-d0bb-2dc45cb43373/AppIcon-0-0-1x_U007epad-0-1-0-sRGB-0-85-220.png/230x0w.webp"
            alt="Naver"
            className="naver-icon"
          />
          네이버로 로그인
        </button>
      </div>
    </div>
  );
}

export default Login;
