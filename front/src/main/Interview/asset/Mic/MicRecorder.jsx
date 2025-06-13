// components/asset/Mic/MicRecorder.jsx
import React, { useState } from "react";
import { ReactMic } from "react-mic";
import axios from "axios";

function MicRecorder() {
  const [record, setRecord] = useState(false);
  const [sttText, setSttText] = useState("");
  const [loading, setLoading] = useState(false);

  const startRecording = () => setRecord(true);
  const stopRecording = () => setRecord(false);

  const onStop = async (recordedBlob) => {
    console.log("녹음 끝:", recordedBlob);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("audio", recordedBlob.blob, "speech.wav");

      const res = await axios.post("http://localhost:8000/stt", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSttText(res.data.text);
    } catch (err) {
      console.error("STT 요청 실패:", err);
      setSttText("STT 요청 실패");
    }

    setLoading(false);
  };

  return (
    <div style={{ textAlign: "center" }}>
      <ReactMic
        record={record}
        onStop={onStop}
        strokeColor="#4caf50"
        backgroundColor="#e8f5e9"
        mimeType="audio/wav"
        className="sound-wave"
      />
      <div style={{ marginTop: "20px" }}>
        <button onClick={startRecording} disabled={record}>🎙 녹음 시작</button>
        <button onClick={stopRecording} disabled={!record}>🛑 녹음 종료</button>
      </div>
      {loading && <p>⏳ 음성 인식 중...</p>}
      {sttText && <p>📝 인식 결과: {sttText}</p>}
    </div>
  );
}

export default MicRecorder;
