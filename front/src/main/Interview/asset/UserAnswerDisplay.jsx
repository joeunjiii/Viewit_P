import React from "react";
import { Mic, Clock, Pause, CheckCircle, MessageCircle } from "lucide-react";
import "./css/UserAnswerDisplay.css";

const UserAnswerDisplay = ({
  answer,
  isVisible = true,
  title = "내 답변",
  placeholder = "답변을 기다리는 중...",
  status = "idle",
}) => {


  if (!isVisible) return null;

  const getStatusConfig = () => {
    switch (status) {
      case "tts":
        return {
          icon: MessageCircle,
          message: "면접관이 질문하고 있습니다...",
          iconClass: "icon-blue",
          containerClass: "status-blue",
        };
      case "wait":
        return {
          icon: Pause,
          message: "답변 대기 중입니다",
          iconClass: "icon-gray",
          containerClass: "status-gray",
        };
      case "recording":
        return {
          icon: Mic,
          message: "음성을 인식하고 있습니다...",
          iconClass: "icon-red animate-pulse",
          containerClass: "status-red",
        };
      case "uploading":
        return {
          icon: Clock,
          message: "답변을 처리하고 있습니다...",
          iconClass: "icon-amber animate-spin",
          containerClass: "status-amber",
        };
      case "complete":
        return {
          icon: CheckCircle,
          message: "답변이 완료되었습니다",
          iconClass: "icon-green animate-bounce",
          containerClass: "status-green",
        };
      default:
        return {
          icon: MessageCircle,
          message: placeholder,
          iconClass: "icon-gray",
          containerClass: "status-gray",
        };
    }
  };

  const hasAnswer =
    status === "complete" || (answer && answer.trim().length > 0);

  const config = getStatusConfig();
  const IconComponent = config.icon;

  return (
    <div
      className={`user-answer-container ${hasAnswer ? "" : config.containerClass
        }`}
    >
      <div className="user-answer-header">
        <span className="user-answer-title">{title}</span>
      </div>
      <div className="user-answer-content">
        {/* 답변 완료 */}
        {hasAnswer ? (
          <div className="user-answer-done">
            <CheckCircle className="icon-green animate-bounce" size={20} />
            <span className="user-answer-done-text">답변이 완료되었습니다</span>
          </div>
        ) : (
          <div className="user-answer-status">
            <IconComponent className={config.iconClass} size={20} />
            <span
              className={
                "user-answer-status-text" +
                (status === "wait" ? " blinking" : "")
              }
            >
              {config.message}
            </span>
            {status === "recording" && (
              <div className="user-answer-recording-dots">
                <div className="dot" style={{ animationDelay: "0ms" }}></div>
                <div className="dot" style={{ animationDelay: "150ms" }}></div>
                <div className="dot" style={{ animationDelay: "300ms" }}></div>
              </div>
            )}
            {status === "uploading" && (
              <div className="user-answer-uploading-dots">
                <div
                  className="dot-amber"
                  style={{ animationDelay: "0ms" }}
                ></div>
                <div
                  className="dot-amber"
                  style={{ animationDelay: "100ms" }}
                ></div>
                <div
                  className="dot-amber"
                  style={{ animationDelay: "200ms" }}
                ></div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserAnswerDisplay;
