// components/Interview/QuestionStatusBar.jsx
import {Volume2,Clock,Mic,UploadCloud,Hourglass} from "lucide-react";
import "./css/QuestionStatusBar.css";

function QuestionStatusBar({ status, remainingTime, small }) {
  let icon = null;
  let message = "";

  switch (status) {
    case "tts":
      icon = <Volume2 className="qs-icon lucide-blue animate-pulse" size={20} />;
      message = "면접관 질문 재생 중";
      break;
    case "wait":
      icon = <Hourglass className="qs-icon lucide-amber animate-spin" size={20} />;
      message = "대기중입니다";
      break;
    case "recording":
      icon = <Mic className="qs-icon lucide-red animate-pulse" size={20} />;
      message = "답변 녹음 중입니다";
      break;
    case "uploading":
      icon = <UploadCloud className="qs-icon lucide-green animate-bounce" size={20} />;
      message = "답변 제출 및 질문 생성 중입니다";
      break;
    default:
      return null;
  }
  
  const className = [
    "question-status-bar",
    status,
    small ? "small" : "",
    status === "uploading" ? "wide-message" : ""  // 추가!
  ].join(" ");

  return (


    <div className={className}>
      {icon}
      <span className="qs-text">{message}</span>
    </div>
  );
}

export default QuestionStatusBar;
