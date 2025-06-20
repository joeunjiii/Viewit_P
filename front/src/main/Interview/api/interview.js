import api from "./apiClient";

export function initSession(sessionId, jobRole) {
    const payload = {
        session_id: sessionId,
        job_role: jobRole,
    };
    console.log("initSession payload:", payload); // 여기서 undefined 뜨면 위쪽에서 잘못 전달
    return api.post("/api/interview/init_session", payload);
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

