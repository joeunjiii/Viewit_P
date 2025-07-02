
export default function AnswerCaption({ text }) {
    return (
      <div className="answer-caption">
        <span className="answer-label">지원자:</span> {text}
      </div>
    );
  }