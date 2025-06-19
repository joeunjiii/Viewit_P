import React from "react";
import { FaExclamationCircle } from "react-icons/fa";
import "./ResizeAlertModal.css";

export default function ResizeAlertModal() {
  return (
    <div className="resize-alert-bg">
      <div className="resize-alert-modal">
        <div className="resize-alert-icon">
          <FaExclamationCircle size={72} color="#facc16" />
        </div>
        <div className="resize-alert-title">
          화면 크기를 조절해 주세요!
        </div>
        <div className="resize-alert-desc">
          이 서비스는 1500x600 이상 해상도에서만 이용할 수 있습니다.<br />
          창 크기를 키우거나, <b>전체화면(최대화)</b>을 이용해 주세요.
        </div>
      </div>
    </div>
  );
}
