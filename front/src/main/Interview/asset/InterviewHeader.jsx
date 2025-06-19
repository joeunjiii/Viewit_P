// components/InterviewHeader.jsx
import { useNavigate } from "react-router-dom";
import Timer from "./Timer";

function InterviewHeader({ totalDuration = 600 }) {
  const navigate = useNavigate();

  return (
    
    <div className="interview-header">
       <div className="timer-simple-box">
      <div className="header-left">
        <Timer duration={totalDuration} label="남은시간" mode="text" />
      </div>
      </div>
      <div className="header-spacer" />
      <button className="end-button" onClick={() => navigate("/main")}>
        종료하기
      </button>
    </div>
    
  );
}

export default InterviewHeader;
