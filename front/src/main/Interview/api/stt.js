// src/api/stt.js

// FastAPI 서버로 STT 파일 보내기
export async function requestSpeechToText(blob) {
    const formData = new FormData();
    formData.append("audio", blob, "answer.webm");

    // "http://localhost:8000/interview/stt" 대신!
    const res = await fetch("/api/stt/", {
        method: "POST",
        body: formData,
    });

    if (!res.ok) throw new Error("STT 변환 실패");
    return res.json(); // { text: 변환 텍스트 }
}
