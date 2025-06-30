import axios from "axios";

// baseURL은 proxy로 처리 (주석 참고)
const api = axios.create({
    headers: { "Content-Type": "application/json" }
});

export function initSession({ session_id, user_id, job_role, jdText, pdfText }) {
    return api.post("/api/interview/init_session", { session_id, user_id, job_role, jdText, pdfText });
}
export function createInterviewSession({ session_id, user_id, job_role }) {
    return api.post("/api/interview/init", { session_id, user_id, job_role });
}
export function nextQuestion(sessionId, answer, jdText, pdfText) {
    return api.post("/api/interview/next_question", {
        session_id: sessionId,
        answer,
        jdText,
        pdfText
    });
}

export function saveInterview(payload) {
    return api.post("/api/interview/save", payload);
}