import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./css/Feedbackresult.css";
import FeedbackJobTable from "./asset/FeedbackJobTable";
import FeedbackSoftskills from "./asset/FeedbackSoftskills";
import FeedbackSummary from "./asset/FeedbackSummary";
import QuestionAnswerTabs from "./asset/QuestionAnswerTabs";
import ActionButton from "./asset/ActionButton";
import { fetchFeedbackResult } from "./api/feedback";
import { formatDateTime } from "../../../utils/date";
import LoadingModal from "../asset/LoadingModal";


function FeedbackResult() {
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);
  const { sessionId } = useParams(); // /feedback/:sessionId 같은 라우팅이면 사용

  useEffect(() => {
    if (!sessionId) return;
    let mounted = true;
    async function fetchData() {
      setLoading(true);
      try {
        // "최소 1초 로딩" 약속
        const [data] = await Promise.all([
          fetchFeedbackResult(sessionId),
          new Promise((res) => setTimeout(res, 500)),
        ]);
        console.log("AI 피드백 API 결과:", data);
        if (mounted) setFeedback(data);
      } catch (e) {
        if (mounted) alert("피드백 결과를 불러오지 못했습니다.");
      }

      if (mounted) setLoading(false);
    }
    fetchData();
    return () => {
      mounted = false;
    };
  }, [sessionId]);

  if (loading) {
    return <LoadingModal message="AI 피드백 결과를 불러오고 있습니다" />;
  }
  if (!feedback) {
    return <div className="feedback-layout">피드백 데이터가 없습니다.</div>;
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
              date={formatDateTime(feedback.date)}
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
