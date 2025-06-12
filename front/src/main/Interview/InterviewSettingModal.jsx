// components/InterviewSettingsModal.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./InterviewSettingModal.css";
import { FormControl, InputLabel, Select, MenuItem } from "@mui/material";

function InterviewSettingsModal({ onClose, onStart }) {
  const [micEnabled, setMicEnabled] = useState(true);
  const [answerTime, setAnswerTime] = useState(10);
  const [job, setJob] = useState("Back-end 개발자(Java)");
  const [autoQuestion, setAutoQuestion] = useState(false);

  // 모달창 켜질때 기본값 입력
  useEffect(() => {
    setMicEnabled(true);
    setAnswerTime(10);
    setJob("backend");
    setAutoQuestion(false);
  }, []);

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>마이크 설정</h3>
        <label className="switch">
          <input
            type="checkbox"
            checked={micEnabled}
            onChange={() => setMicEnabled(!micEnabled)}
          />
          <span className="slider" />
        </label>

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
                  onChange={() => setAnswerTime(time)}
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

        <div className="modal-actions">
          <button className="cancel" onClick={() => onClose()}>
            취소
          </button>
          <button
            className="start"
            onClick={() =>
              onStart({ micEnabled, answerTime, job, autoQuestion })
            }
          >
            시작하기
          </button>
        </div>
      </div>
    </div>
  );
}

export default InterviewSettingsModal;
