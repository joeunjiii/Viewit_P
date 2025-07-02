// src/main/InterviewSettingsModal.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./css/InterviewSettingModal.css";
import { FormControl, InputLabel, Select, MenuItem } from "@mui/material";
function InterviewSettingsModal({ onClose, onStart, onOpenMicCheck }) {
  // 마이크, 직무, 자막, 재답변 허용, 대기 시간 상태
  const [micEnabled] = useState(true);
  const [job, setJob] = useState("backend");
  // 기존 autoQuestion -> captionEnabled로 변경
  const [captionEnabled, setCaptionEnabled] = useState(true); // 기본값 ON
  // const [autoQuestion, setAutoQuestion] = useState(false);

  const [allowRetry, setAllowRetry] = useState(true);
  const [waitTime, setWaitTime] = useState(5);

  const navigate = useNavigate();
  const [voiceOptions, setVoiceOptions] = useState([]);
  const [interviewerVoice, setInterviewerVoice] = useState("");

  // 목소리 옵션 백엔드에서 불러오기
  useEffect(() => {
    axios
      .get("/api/tts/voice-options")
      .then((res) => {
        setVoiceOptions(res.data);
        if (res.data.length > 0) {
          setInterviewerVoice(res.data[0].id); // 여기가 실제 기본값 결정 위치
        }
      })
      .catch(() => {
        setVoiceOptions([]);
      });
  }, []);

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
      // autoQuestion,
      allowRetry,
      interviewerVoice,
      captionEnabled,
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

        {/* 목소리 선택
        <FormControl fullWidth size="small" sx={{ mt: 2 }}>
          <InputLabel id="voice-select-label">목소리 선택</InputLabel>
          <Select
            labelId="voice-select-label"
            value={interviewerVoice}
            label="목소리 선택"
            onChange={(e) => setInterviewerVoice(e.target.value)}
            disabled={voiceOptions.length === 0}
          >
            {voiceOptions.length === 0 ? (
              <MenuItem value="">목소리 옵션 없음</MenuItem>
            ) : (
              voiceOptions.map((v) => (
                <MenuItem key={v.id} value={v.id}>
                  {v.label}
                </MenuItem>
              ))
            )}
          </Select>
        </FormControl> */}

        {/* 질문 자막 설정 */}
        <div className="section">
          <p>질문 자막 설정</p>
          <label className="switch">
            <input
              type="checkbox"
              // checked={autoQuestion}
              // onChange={() => setAutoQuestion(!autoQuestion)}
              checked={captionEnabled}
              onChange={() => setCaptionEnabled(!captionEnabled)}
            />
            <span className="slider" />
          </label>
        </div>

        {/* 다시 답변하기 허용 */}
        {/* <div className="section">
          <p>다시 답변하기 허용</p>
          <label className="switch">
            <input
              type="checkbox"
              checked={allowRetry}
              onChange={() => setAllowRetry(!allowRetry)}
            />
            <span className="slider" />
          </label>
        </div> */}

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
