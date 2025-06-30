import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { fetchInterviewHistory } from "./asset/user.js";
import "./css/FeedbackHistoryPage.css";

function FeedbackHistoryPage() {
  const [sessions, setSessions] = useState([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const loaderRef = useRef(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const navigate = useNavigate();
  const limit = 5;

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    const loadSessions = async () => {
      if (offset === 0) setInitialLoading(true);
      setLoading(true);
  
      try {
        const data = await fetchInterviewHistory(token, limit, offset);
        if (Array.isArray(data)) {
          // 1) sessions 추가 병합
          setSessions((prev) => {
            const combined = [...prev, ...data];
            // 중복 제거
            const unique = Array.from(
              new Map(combined.map((item) => [item.session_id, item])).values()
            );
            return unique;
          });
          // 2) 더 불러올 게 있는지 판단
          if (data.length < limit) {
            setHasMore(false);
          }
        } else {
          // API 에러 등으로 배열이 아니면 로딩 끝
          setHasMore(false);
        }
      } catch (error) {
        console.error("피드백 기록 불러오기 오류:", error);
        setHasMore(false);
      } finally {
        setLoading(false);
        if (offset === 0) setInitialLoading(false);
      }
    };
  
    if (hasMore) loadSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offset]);
  

  // 바닥 감지 → offset 증가
  useEffect(() => {
    if (!hasMore || loading) return;
    const observer = new window.IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setOffset((prev) => prev + limit);
      }
    });
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading]);

  function formatDate(isoString) {
    if (!isoString) return "-";
    return isoString.replace("T", " ").substring(0, 16);
  }

  return (
    <div className="feedback-history-page">
      <div className="feedback-history-box">
        <h2 className="feedback-history-title-inside">모의면접 피드백 결과</h2>
        <hr className="feedback-history-divider" />
        <ul className="feedback-history-list">
          {initialLoading ? (
            Array.from({ length: limit }).map((_, i) => (
              <li className="skeleton-item" key={i}>
                <div className="skeleton-title" />
                <div className="skeleton-date" />
              </li>
            ))
          ) : sessions.length === 0 && !hasMore ? (
            <li className="feedback-history-empty">피드백 기록이 없습니다.</li>
          ) : (
            sessions.map((session) => (
              <li
                key={session.session_id}
                className="feedback-history-item"
                onClick={() => navigate(`/feedback/${session.session_id}`)}
              >
                <div className="feedback-history-title">
                  {session.job_role
                    ? `직무: ${session.job_role}`
                    : "직무 정보 없음"}
                </div>
                <div className="feedback-history-date">
                  {formatDate(session.started_at)}
                </div>
              </li>
            ))
          )}
        </ul>

        {/* 바닥 감지용 */}
        {hasMore && (
          <div ref={loaderRef} style={{ height: 36, textAlign: "center" }}>
            {loading && !initialLoading && <span style={{ color: "#bbb" }}>로딩 중...</span>}
          </div>
        )}
      </div>
    </div>
  );
}

export default FeedbackHistoryPage;
