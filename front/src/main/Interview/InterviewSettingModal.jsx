// src/main/InterviewSettingsModal.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./css/InterviewSettingModal.css";
import { FormControl, InputLabel, Select, MenuItem } from "@mui/material";
function InterviewSettingsModal({ onClose, onStart, onOpenMicCheck }) {
  // 마이크, 직무, 자막, 재답변 허용, 대기 시간 상태
  const [micEnabled] = useState(true);
  const [job, setJob] = useState("backend");
  const [autoQuestion, setAutoQuestion] = useState(false);
  const [allowRetry, setAllowRetry] = useState(true);
  const [waitTime, setWaitTime] = useState(5);

  const navigate = useNavigate();

  // 취소 시 메인으로 이동
  const handleCancel = () => {
    navigate("/main");
  };

  // 설정 완료 시 상위 컴포넌트로 전달
  const handleStartClick = () => {
    onStart({
      micEnabled,
      waitTime,
      jobRole: job,
      autoQuestion,
      allowRetry,
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content modal-settings">
        <h2 className="modal-title">AI 모의면접 설정</h2>

        {/* 마이크 상태 확인 */}
        <div className="section">
          <p>마이크 설정</p>
          <button className="mic-check-button" onClick={onOpenMicCheck}>
            🎤 마이크 상태 확인
          </button>
        </div>

        {/* 대기 시간 선택 */}
        <div className="section">
          <p>대기 시간 설정</p>
          <div className="answer-time-options">
            {[3, 5, 10].map((sec) => (
              <label
                key={sec}
                className={`time-radio ${waitTime === sec ? "selected" : ""}`}
              >
                <input
                  type="radio"
                  name="waitTime"
                  value={sec}
                  checked={waitTime === sec}
                  onChange={() => setWaitTime(sec)}
                />
                {sec}초
              </label>
            ))}
          </div>
        </div>

        {/* 직무 선택 */}
        <FormControl fullWidth size="small" sx={{ mt: 1 }}>
          <InputLabel id="job-select-label">직무 선택</InputLabel>
          <Select
            labelId="job-select-label"
            value={job}
            label="직무 선택"
            onChange={(e) => setJob(e.target.value)}
          >
            <MenuItem value="backend">Back-end 개발자 (Java)</MenuItem>
            <MenuItem value="frontend">Front-end 개발자 (React)</MenuItem>
            <MenuItem value="ai">AI 엔지니어</MenuItem>
          </Select>
        </FormControl>

        {/* 질문 자막 설정 */}
        <div className="section">
          <p>질문 자막 설정</p>
          <label className="switch">
            <input
              type="checkbox"
              checked={autoQuestion}
              onChange={() => setAutoQuestion(!autoQuestion)}
            />
            <span className="slider" />
          </label>
        </div>

        {/* 다시 답변하기 허용 */}
        <div className="section">
          <p>다시 답변하기 허용</p>
          <label className="switch">
            <input
              type="checkbox"
              checked={allowRetry}
              onChange={() => setAllowRetry(!allowRetry)}
            />
            <span className="slider" />
          </label>
        </div>

        {/* 액션 버튼 */}
        <div className="modal-actions">
          <button className="cancel" onClick={handleCancel}>
            취소
          </button>
          <button className="start" onClick={handleStartClick}>
            시작하기
          </button>
        </div>
      </div>
    </div>
  );
}

export default InterviewSettingsModal;
