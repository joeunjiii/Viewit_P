import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaRegFileAlt } from "react-icons/fa";
import LoadingSpinner from "./asset/LoadingSpinner";
import "./css/Recentsection.css";

function RecentSection({ sessions = [], loading }) {
  const [showAll, setShowAll] = useState(false);
  const [isTablet, setIsTablet] = useState(window.innerWidth <= 1024);
  const navigate = useNavigate();
  const visibleResults = isTablet && !showAll ? sessions.slice(0, 3) : sessions;

  // 화면 크기 변화 감지
  useEffect(() => {
    const handleResize = () => {
      setIsTablet(window.innerWidth <= 1024);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 로딩 중이면 스피너 표시
  if (loading) {
    return <LoadingSpinner message="데이터를 불러오는 중입니다" />;
  }
  return (
    <div className="Recent-section">
      <div className="Recent-header">
        <FaRegFileAlt className="Recent-icon" />
        <h3>최근 기록</h3>
      </div>

      <div className="Recent-list">
        {visibleResults.length === 0 ? (
          <div
            className="Recent-card"
            style={{ color: "#bbb", padding: "24px" }}
          >
            기록이 없습니다.
          </div>
        ) : (
          visibleResults.map((item, index) => {
            // 날짜 가공
            const dateStr = item.started_at || item.date;
            const [year, month, day] = dateStr
              ? dateStr.split("T")[0].split("-")
              : ["-", "-", "-"];
            return (
              <div
                className="Recent-card"
                key={item.session_id}
                style={{ cursor: "pointer" }}
                onClick={() => navigate(`/feedback/${item.session_id}`)}
                title="분석 결과 보기"
              >
                {/* 상단: 날짜 + 직무 */}
                <div className="Recent-card-info">
                  <div className="Recent-date">{`${year}년 ${month}월 ${day}일`}</div>
                  <div className="Recent-label">
                    직무: {item.job_role || "-"}
                  </div>
                </div>
                
                {/* 하단: 질문 개수 버튼 뱃지 */}
                <div className="Recent-card-badges">
                  <button type="button" className="Recent-badge">
                    질문 {item.question_count ?? 0}개
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
      {/* 더보기 버튼 */}
      {isTablet && sessions.length > 3 && (
        <button
          className="recent-toggle-btn"
          onClick={() => setShowAll(!showAll)}
        >
          {showAll ? "간단히 보기" : "더 보기 +"}
        </button>
      )}
    </div>
  );
}

export default RecentSection;
