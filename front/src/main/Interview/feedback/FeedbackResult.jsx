import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./css/Feedbackresult.css";
import FeedbackJobTable from "./asset/FeedbackJobTable";
import FeedbackSoftskills from "./asset/FeedbackSoftskills";
import FeedbackSummary from "./asset/FeedbackSummary";
import QuestionAnswerTabs from "./asset/QuestionAnswerTabs";
import ActionButton from "./asset/ActionButton";

// 실제 피드백 연동 전용 더미 질문 데이터
const dummyQuestions = [
  {
    question: "자신의 강점에 대해 말씀해 주세요.",
    answer:
      "저는 꼼꼼하게 일하는 것을 강점으로 생각합니다. 음... 일단 빠르게 적응하는 편이구요...",
    filler: ["음...", "일단"],
    modelAnswer:
      "저의 강점은 빠른 적응력과 꼼꼼함입니다. 예를 들어 이전 프로젝트에서 새로운 기술을 익혀서... 등",
  },
];

function FeedbackResult() {
  const [selectedTab, setSelectedTab] = useState(0);
  const navigate = useNavigate();

  return (
    <div className="feedback-layout">
      <main className="feedback-main">
        <div className="feedback-card">
          <section className="feedback-header">
            <h2>AI 분석결과</h2>
            <ActionButton onClick={() => navigate("/main")}>확인</ActionButton>
          </section>
          <hr />

          <section className="feedback-info-row">
            <FeedbackJobTable
              name="홍길동"
              date="2025-06-27"
              job="백엔드 개발자"
            />
          </section>

          <section className="feedback-summary-row">
            <div className="feedback-summary-card">
              <FeedbackSummary summary="면접 전반적으로 차분하고 논리적이었으나, 구체적 사례가 부족했습니다." />
              <FeedbackSoftskills
                strengths={["업무 이해도", "긍정성", "발음 정확도", "침착성"]}
                weaknesses={["발화 속도"]}
              />
            </div>
          </section>

          <section className="feedback-question-row">
            <QuestionAnswerTabs
              questions={dummyQuestions}
              selectedTab={selectedTab}
              setSelectedTab={setSelectedTab}
            />
          </section>
        </div>
      </main>
    </div>
  );
}

export default FeedbackResult;
