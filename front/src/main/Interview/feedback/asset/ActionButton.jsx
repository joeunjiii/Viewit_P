import React from "react";
import "../css/ActionButton.css"; // 스타일 분리

export default function ActionButton({ children, onClick, type = "button", ...rest }) {
  return (
    <button className="action-btn" type={type} onClick={onClick} {...rest}>
      {children}
    </button>
  );
}
