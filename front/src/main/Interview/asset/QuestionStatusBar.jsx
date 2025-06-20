// components/Interview/QuestionStatusBar.jsx
import "./QuestionStatusBar.css";

function QuestionStatusBar({ status, remainingTime }) {
  let icon = null;
  let message = "";
  

  switch (status) {
    case "tts":
      icon = "🔊";
      message = "면접관 질문 재생 중...";
      break;
    case "wait":
      icon = "⏱";
      message = `대기중입니다 `; 
      break;
    case "recording":
      icon = "🎤";
      message = `답변 녹음 중입니다...`;
      break;
    case "uploading":
      icon = "📤";
      message = "답변 제출 및 질문 생성 중입니다";
      break;
    default:
      return null; // 표시 안 함
  }

  return (
    <div className="question-status-bar">
      <span className="icon">{icon}</span>
      <span className="text">{message}</span>
    </div>
  );
}

export default QuestionStatusBar;
