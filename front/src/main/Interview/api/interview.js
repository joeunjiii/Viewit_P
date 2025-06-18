import api from "./apiClient";

export function initSession(sessionId, jobRole) {
    return api.post("/api/interview/init_session", {
        session_id: sessionId,
        job_role: jobRole
    });
}

export function nextQuestion(sessionId, answer) {
    return api.post("/api/interview/next_question", {
        session_id: sessionId,
        answer
    });
}

export function finalAnswer(sessionId, answer) {
    return api.post("/api/interview/final_answer", {
        session_id: sessionId,
        answer
    });
}
