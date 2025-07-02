// components/Interview/QuestionStatusBar.jsx
import "./css/QuestionStatusBar.css";

function QuestionStatusBar({ status, remainingTime, small }) {
  let icon = null;
  let message = "";

  switch (status) {
    case "tts":
      icon = "🔊";
      message = "면접관 질문 재생 중";
      break;
    case "wait":
      icon = "⏱";
      message = `대기중입니다 `;
      break;
    case "recording":
      icon = "🎤";
      message = `답변 녹음 중입니다`;
      break;
    case "uploading":
      icon = "📤";
      message = "답변 제출 및 질문 생성 중입니다";
      break;
    default:
      return null; // 표시 안 함
  }
   // small일 때 클래스 추가
  const className = [
    "question-status-bar",
    status,
    small ? "small" : ""
  ].join(" ");

  return (

    
    <div className={className}>
      <span className="qs-icon">{icon}</span>
      <span className="qs-text">{message}</span>
    </div>
  );
}

export default QuestionStatusBar;
