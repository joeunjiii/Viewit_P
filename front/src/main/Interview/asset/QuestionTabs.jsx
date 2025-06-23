function QuestionTabs({ current, total }) {
  return (
    <div className="question-tabs">
      <div className="tab main-tab">질문</div>
      {[...Array(total)].map((_, i) => (
        <div
          key={i}
          className={current === i ? "tab2 tab2-selected" : "tab2"}
        >{`Q${i + 1}`}</div>
      ))}
    </div>
  );
}
export default QuestionTabs;