import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaRegFileAlt } from "react-icons/fa";
import "./css/Recentsection.css";

function RecentSection() {
  const [showAll, setShowAll] = useState(false);
  const [isTablet, setIsTablet] = useState(window.innerWidth <= 1024);
  const navigate = useNavigate();
  // 화면 크기 변화 감지
  useEffect(() => {
    const handleResize = () => {
      setIsTablet(window.innerWidth <= 1024);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  //임시데이터
  const mockResults = [
    {
      id: 1,
      date: "2025-06-03",
      score: 85,
      summary: "톤 안정적이고 전달력 좋음",
    },
    {
      id: 2,
      date: "2025-06-02",
      score: 78,
      summary: "속도 약간 빠름, 결론 명확함",
    },
    {
      id: 3,
      date: "2025-06-02",
      score: 78,
      summary: "속도 약간 빠름, 결론 명확함",
    },
    {
      id: 4,
      date: "2025-06-02",
      score: 78,
      summary: "속도 약간 빠름, 결론 명확함",
    },
  ];

  const visibleResults =
    isTablet && !showAll ? mockResults.slice(0, 3) : mockResults;


  return (
    <div className="Recent-section">
      <div className="Recent-header">
        <FaRegFileAlt className="Recent-icon" />
        <h3>최근 기록</h3>
      </div>

      <div className="Recent-list">
      {visibleResults.map((item, index) => {
          const [year, month, day] = item.date.split("-");
          return (
            <div
              className="Recent-card"
              key={item.id}
              style={{ cursor: "pointer" }}
              onClick={() => navigate(`/feedback/${item.id}`)}
              title="분석 결과 보기"
            >
              <div className="Recent-date">{`${year}년 ${month}월 ${day}일`}</div>
              <div className="Recent-label">결과 {index + 1}</div>
            </div>
          );
        })}
      </div>
      {/* 더보기 버튼 */}
      {isTablet && mockResults.length > 3 && (
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
