// components/InterviewSettingsModal.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./InterviewSettingModal.css";
import { FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import MicCheckModal from "./asset/Mic/MicCheckModal";

function InterviewSettingsModal({ onClose, onStart, onOpenMicCheck }) {
  const [micEnabled, setMicEnabled] = useState(true); // 마이크상태
  const [answerTime, setAnswerTime] = useState(10); // 답변 시간 상태
  const [job, setJob] = useState("Back-end 개발자(Java)"); // 직무 유형 상태
  const [autoQuestion, setAutoQuestion] = useState(false); // 질문
  const [micCheckOpen, setMicCheckOpen] = useState(false); //마이크모달창 상태
  const [allowRetry, setAllowRetry] = useState(true); //다시답변버튼 상태
  const navigate = useNavigate();

  console.log("✅ 선택된 answerTime:", answerTime);
  const handleCancel = () => {
    navigate("/main");
  };

  const handleStart = () => {
    onStart({
      micEnabled,
      answerTime,
      job,
      autoQuestion,
      allowRetry,
    });
  };

  
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>마이크 설정</h3>

        {/* 🎤 마이크 상태 확인 버튼 */}
        <button className="mic-check-button" onClick={onOpenMicCheck}>
          🎤 마이크 상태 확인
        </button>

        <div className="section">
          <p>답변 시간 설정</p>
          <div className="answer-time-options">
            {[10, 20, 30].map((time) => (
              <label
                key={time}
                className={`time-radio ${
                  answerTime === time ? "selected" : ""
                }`}
              >
                <input
                  type="radio"
                  name="answerTime"
                  value={time}
                  checked={answerTime === time}
                  onChange={(e) => setAnswerTime(Number(e.target.value))}
                />
                {time}초
              </label>
            ))}
          </div>
        </div>

        <FormControl fullWidth size="small" sx={{ mt: 1 }}>
          <InputLabel id="job-select-label">직무 선택</InputLabel>
          <Select
            labelId="job-select-label"
            value={job}
            label="직무 선택"
            onChange={(e) => setJob(e.target.value)}
            sx={{
              backgroundColor: "white",
              borderRadius: 1,
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: "#4caf50",
              },
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: "#45a049",
              },
            }}
          >
            <MenuItem value="backend">Back-end 개발자 (Java)</MenuItem>
            <MenuItem value="frontend">Front-end 개발자 (React)</MenuItem>
            <MenuItem value="ai">AI 엔지니어</MenuItem>
          </Select>
        </FormControl>

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

        <div className="modal-actions">
          <button className="cancel" onClick={handleCancel}>
            취소
          </button>
          <button className="start" onClick={handleStart}>
            시작하기
          </button>
        </div>
      </div>
    </div>
  );
}

export default InterviewSettingsModal;
