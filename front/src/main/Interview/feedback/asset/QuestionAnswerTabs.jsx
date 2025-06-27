import React from "react";
import "../css/Questionanswertabs.css";

export default function QuestionAnswerTabs({ questions, selectedTab, setSelectedTab }) {
  const handlePrev = () => {
    if (selectedTab > 0) setSelectedTab(selectedTab - 1);
  };

  const handleNext = () => {
    if (selectedTab < questions.length - 1) setSelectedTab(selectedTab + 1);
  };

  return (
    <div className="qa-tabs-container">
      {/* 상단 탭 & 버튼 */}
      <div className="qa-tabs-header">
        <button onClick={handlePrev} className="nav-btn" disabled={selectedTab === 0}>
          ← 이전
        </button>
        <div className="question-tabs">
          {questions.map((q, idx) => (
            <button
              key={idx}
              className={selectedTab === idx ? "active" : ""}
              onClick={() => setSelectedTab(idx)}
            >
              Question {idx + 1}
            </button>
          ))}
        </div>
        <button
          onClick={handleNext}
          className="nav-btn"
          disabled={selectedTab === questions.length - 1}
        >
          다음 →
        </button>
      </div>

      {/* 답변 박스 */}
      <div className="question-box">
        <div className="q-label">Q</div>
        <div className="q-text">{questions[selectedTab].question}</div>

        <div className="a-label">A</div>
        <div className="a-text">{questions[selectedTab].answer}</div>

        <div className="model-label">수정/모범 답변</div>
        <div className="model-text">{questions[selectedTab].modelAnswer}</div>
      </div>
    </div>
  );
}
