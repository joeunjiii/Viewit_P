import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchUserSessions } from "./asset/user.js";
import "./css/FeedbackHistoryPage.css";

function FeedbackHistoryPage() {
    const [sessions, setSessions] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/login");
            return;
        }
        fetchUserSessions(token).then(data => {
            if (data) {
                const sorted = [...data].sort(
                    (a, b) => new Date(b.started_at) - new Date(a.started_at)
                );
                setSessions(sorted);
            } else setSessions([]);
        });
    }, [navigate]);

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
                    {sessions.length === 0 ? (
                        <li className="feedback-history-empty">
                            피드백 기록이 없습니다.
                        </li>
                    ) : (
                        sessions.map(session => (
                            <li
                                key={session.session_id}
                                className="feedback-history-item"
                                onClick={() => navigate(`/feedback/${session.session_id}`)}
                            >
                                <div className="feedback-history-title">
                                    {session.job_role ? `직무: ${session.job_role}` : "직무 정보 없음"}
                                </div>
                                <div className="feedback-history-date">
                                    {formatDate(session.started_at)}
                                </div>
                            </li>
                        ))
                    )}
                </ul>
            </div>
        </div>
    );
}

export default FeedbackHistoryPage;
