import React from "react";
import "../css/Questionanswertabs.css";

export default function QuestionAnswerTabs({
  questions = [],
  selectedTab,
  setSelectedTab,
}) {
  // 빈 질문/답변일 때도 question-box는 항상 유지!
  if (!Array.isArray(questions) || questions.length === 0) {
    return (
      <div className="qa-tabs-container">
        <div className="qa-tabs-header" style={{ visibility: "hidden" }}></div>
        <div className="question-box">
          <div className="qa-tabs-empty">질문/답변 데이터가 없습니다.</div>
        </div>
      </div>
    );
  }

  if (selectedTab < 0 || selectedTab >= questions.length) {
    return <div className="qa-tabs-container">선택된 질문이 없습니다.</div>;
  }

  const current = questions[selectedTab];

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
        <button
          onClick={handlePrev}
          className="nav-btn"
          disabled={selectedTab === 0}
        >
          ← 이전
        </button>
        <div className="question-current-number">
          Question {selectedTab + 1} / {questions.length}
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
      <div className="qa-group-box">
        <div className="qa-row-label">Q</div>
        <div className="qa-row-content">{questions[selectedTab].question}</div>
        <hr className="qa-divider" />

        <div className="qa-row-label">A</div>
        <div className="qa-row-content">{questions[selectedTab].answer}</div>

        {questions[selectedTab].feedback && (
          <>
            <div className="qa-row-label">피드백</div>
            <div className="qa-row-content">{questions[selectedTab].feedback}</div>
          </>
        )}
        {current.modelAnswer && (
          <>
            <hr className="qa-divider" />
            <div className="qa-row-label">수정/모범 답변</div>
            <div className="qa-row-content">{current.modelAnswer}</div>
          </>
        )}
      </div>
    </div>
  );
}
