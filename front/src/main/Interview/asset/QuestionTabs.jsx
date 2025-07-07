import QuestionStatusBar from "./QuestionStatusBar";
import "./css/QuestionTabs.css";

function QuestionTabs({ current, total, status, remainingTime }) {
  return (
    <div className="question-tabs">
      <div className="qt-tabs-group">
        <div className="qt-main-tab">질문</div>
        <div className="qt-tab-list">
                    {[...Array(total)].map((_, i) => (
            <div
              key={i}
              className={`qt-tab${current === i + 1 ? " qt-tab-selected" : ""}`}
            >
              <span className="qt-tab-text">
                {`Q${current}`}
              </span>
            </div>
          ))}
        </div>
        <QuestionStatusBar status={status} remainingTime={remainingTime} small />
      </div>
    </div>
  );
}

export default QuestionTabs;
