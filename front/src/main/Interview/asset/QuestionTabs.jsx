function QuestionTabs({ questionNumber }) {
    return (
      <div className="question-tabs">
        <button className="tab selected">질문</button>
        <button className="tab">{`Q${questionNumber}`}</button>
      </div>
    );
  }
  export default QuestionTabs;
  