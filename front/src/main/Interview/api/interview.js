import axios from "axios";

// 절대로 baseURL 지정 X, proxy만 사용
const api = axios.create({
    headers: { "Content-Type": "application/json" }
});

export function initSession({ session_id, user_id, job_role }) {
    return api.post("/api/interview/init_session", { session_id, user_id, job_role });
}
export function createInterviewSession({ session_id, user_id, job_role }) {
    return api.post("/api/interview/init", { session_id, user_id, job_role });
}
export function nextQuestion(sessionId, answer) {
    return api.post("/api/interview/next_question", { session_id: sessionId, answer });
}
export function finalAnswer(sessionId, answer) {
    return api.post("/api/interview/final_answer", { session_id: sessionId, answer });
}
export function saveInterview(payload) {
    return api.post("/api/interview/save", payload);
}
export function endSession(sessionId) {
    return api.post("/api/interview/session/end", { sessionId });
}
