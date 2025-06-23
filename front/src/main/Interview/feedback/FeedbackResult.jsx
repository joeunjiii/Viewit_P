import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./css/Feedbackresult.css"; // 스타일은 따로 분리
import FeedbackJobTable from "./asset/FeedbackJobTable";
import FeedbackSummarySoftskills from "./asset/FeedbackSummarySoftskills";
import QuestionAnswerTabs from "./asset/QuestionAnswerTabs";
import ActionButton from "./asset/ActionButton";
const dummy = {
  job: "백엔드 개발자",
  fillerWords: "음..., 그..., 일단..., 약간...",
  summary:
    "면접 전반적으로 차분하고 논리적이었으나, 구체적 사례가 부족했습니다.",
  softSkills: [
    { skill: "논리 전달력", level: "강점" },
    { skill: "자신감", level: "약점" },
    { skill: "표현력", level: "보통" },
    { skill: "경청", level: "강점" },
  ],
  questions: [
    {
      question: "자신의 강점에 대해 말씀해 주세요.",
      answer:
        "저는 꼼꼼하게 일하는 것을 강점으로 생각합니다. 음... 일단 빠르게 적응하는 편이구요...",
      filler: ["음...", "일단"],
      modelAnswer:
        "저의 강점은 빠른 적응력과 꼼꼼함입니다. 예를 들어 이전 프로젝트에서 새로운 기술을 익혀서... 등",
    },
    // 추가 질문
  ],
};

function FeedbackResult() {
  const [selectedTab, setSelectedTab] = useState(0);
  const navigate = useNavigate();

  return (
    <div className="feedback-layout">
      <main className="feedback-main">
        <section className="feedback-header">
          <h2>AI 분석결과</h2>
          <ActionButton onClick={() => navigate("/main")}>확인</ActionButton>
        </section>
        <hr></hr>

        {/* 직무 / 불필요한 단어 */}
        <section className="feedback-info-row">
          <FeedbackJobTable />
        </section>

        {/* 총평/소프트스킬 */}
        <section className="feedback-summary-row">
          <FeedbackSummarySoftskills
            summary="면접 전반적으로 차분하고 논리적이었으나, 구체적 사례가 부족했습니다."
            strengths={["업무 이해도", "긍정성", "발음 정확도", "침착성"]}
            weaknesses={["발화 속도"]}
          />
        </section>

        {/* 질문별 답변 */}
        <section className="feedback-question-row">
          <QuestionAnswerTabs
            questions={dummy.questions}
            selectedTab={selectedTab}
            setSelectedTab={setSelectedTab}
          />
        </section>

      
      </main>
    </div>
  );
}

export default FeedbackResult;
