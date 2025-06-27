import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./css/Feedbackresult.css";
import FeedbackJobTable from "./asset/FeedbackJobTable";
import FeedbackSoftskills from "./asset/FeedbackSoftskills";
import FeedbackSummary from "./asset/FeedbackSummary";
import QuestionAnswerTabs from "./asset/QuestionAnswerTabs";
import ActionButton from "./asset/ActionButton";
import { fetchFeedbackResult } from "./feedback/api/feedback";



function FeedbackResult() {
  const [selectedTab, setSelectedTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);
  const navigate = useNavigate();
  const { sessionId } = useParams(); // /feedback/:sessionId 같은 라우팅이면 사용
  
  useEffect(() => {
    if (!sessionId) return;  // undefined면 API 호출하지 않음
    async function fetchData() {
      setLoading(true);
      try {
        // sessionId에 맞는 데이터 불러오기
        const data = await fetchFeedbackResult(sessionId);
        setFeedback(data);
      } catch (e) {
        alert("피드백 결과를 불러오지 못했습니다.");
      }
      setLoading(false);
    }
    fetchData();
  }, [sessionId]);

  if (loading || !feedback) {
    return <div className="feedback-layout">로딩중...</div>;
  }
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
              name={feedback.name}
              date={feedback.date}
              job={feedback.job}
            />
          </section>

          <section className="feedback-summary-row">
            <div className="feedback-summary-card">
              <FeedbackSummary summary={feedback.summary} />
              <FeedbackSoftskills
                strengths={feedback.strengths}
                weaknesses={feedback.weaknesses}
              />
            </div>
          </section>

          <section className="feedback-question-row">
            <QuestionAnswerTabs
               questions={feedback.questions}
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
