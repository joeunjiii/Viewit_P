import QuestionStatusBar from "./QuestionStatusBar";

function QuestionTabs({ current, total, status, remainingTime }) {
  return (
    <div className="question-tabs">
      <div className="qt-tabs-group">
        <div className="qt-main-tab">질문</div>
        {[...Array(total)].map((_, i) => (
          <div
            key={i}
            className={`qt-tab${current === i ? " qt-tab-selected" : ""}`}
          >
            {`Q${i + 1}`}
          </div>
        ))}
        <QuestionStatusBar status={status} remainingTime={remainingTime} small />

      </div>
     
    </div>
  );
}

export default QuestionTabs;
