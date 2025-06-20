// src/api/stt.js

//fastapi서버로 보내는 코드
export async function requestSpeechToText(blob) {
    const formData = new FormData();
    formData.append("audio", blob, "answer.webm");
    const res = await fetch("http://localhost:8000/api/stt", {
      method: "POST",
      body: formData,
    });
    if (!res.ok) throw new Error("STT 변환 실패");
    return res.json(); // { text: 변환 텍스트}
  }
  