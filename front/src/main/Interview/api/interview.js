import axios from "axios";
const api = axios.create();

export function createInterviewSession({ session_id, user_id, job_role }) {
    return api.post("/api/interview/init", { session_id, user_id, job_role });
}

export function initSession({ session_id, user_id, job_role ,jdText, pdfText}) {
    return api.post("/api/interview/init_session", { session_id, user_id, job_role ,jdText, pdfText});
}

export function nextQuestion(sessionId, answer,jdText, pdfText) {
    console.log("nextQuestion 파라미터:", { sessionId, answer, jdText, pdfText });
    return api.post("/api/interview/next_question", {
        session_id: sessionId,
        answer,
        jdText, // 없으면 undefined
        pdfText // 없으면 undefined
    });
}

export function finalAnswer(sessionId, answer) {
    return api.post("/api/interview/final_answer", {
        session_id: sessionId,
        answer,
    });
}

export function saveInterview({
    sessionId,
    questionText,
    answerText,
    filterWord,
    answerFeedback,
    }) {
    return api.post("/api/interview/save",{
        interviewId: null,
        sessionId,
        questionText,
        answerText,
        filterWord,
        answerFeedback,
    });
}

export function endSession(sessionId) {
    return api.post("/api/interview/session/end", { sessionId });
}
