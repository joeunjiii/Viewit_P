import React, { useState, useEffect, useCallback } from "react";
import "./MicCheckModal.css";

function MicCheckModal({ onClose }) {
  const [status, setStatus] = useState("");
  const [micAvailable, setMicAvailable] = useState(null);
  const [deviceList, setDeviceList] = useState([]);
  const [isInitializing, setIsInitializing] = useState(true);
  const [stream, setStream] = useState(null);
  const [recording, setRecording] = useState(false);


  const stopStream = useCallback(() => {
    stream?.getTracks().forEach((track) => track.stop());
    setStream(null);
  }, [stream]);
  
  useEffect(() => {
    checkInitialDeviceStatus();
    return () => stopStream();
  }, [stopStream]);

 

  const checkInitialDeviceStatus = async () => {
    setIsInitializing(true);
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter((d) => d.kind === "audioinput");
      setDeviceList(audioInputs);

      if (audioInputs.length === 0) {
        setMicAvailable(false);
        setStatus("❌ 마이크 장치가 없습니다.");
      } else {
        setMicAvailable(true);
        setStatus("🎤 마이크 장치가 감지되었습니다.");
      }
    } catch (err) {
      console.error(err);
      setMicAvailable(false);
      setStatus("❌ 장치 확인 실패");
    } finally {
      setIsInitializing(false);
    }
  };

  const handleCheck = async () => {
    if (!micAvailable) return;
    setStatus("🎧 녹음 시작...");

    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      setStream(s);

      const mediaRecorder = new MediaRecorder(s);

      const chunks = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/wav" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "mic_test.wav";
        a.click();
        URL.revokeObjectURL(url);
        setStatus("✅ 녹음 완료");
        stopStream();
      };

      mediaRecorder.start();
      setRecording(true);

      setTimeout(() => {
        mediaRecorder.stop();
        setRecording(false);
      }, 3000);
    } catch (err) {
      console.error(err);
      setStatus("❌ 마이크 접근 오류");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>마이크 상태 확인</h3>
        {isInitializing ? (
          <p>🔄 장치 상태 확인 중...</p>
        ) : (
          <>
            {micAvailable ? (
              <div className="device-list">
                <strong>감지된 마이크:</strong>
                {deviceList.map((d, i) => (
                  <div key={i}>• {d.label || `마이크 ${i + 1}`}</div>
                ))}
              </div>
            ) : (
              <p>❌ 마이크를 사용할 수 없습니다</p>
            )}
            <p style={{ color: status.includes("❌") ? "red" : "green" }}>
              {status}
            </p>
            <div className="modal-actions">
              <button onClick={onClose}>닫기</button>
              <button
                onClick={handleCheck}
                disabled={!micAvailable || recording}
              >
                {recording ? "테스트 중..." : "마이크 테스트"}
              </button>
              <button onClick={checkInitialDeviceStatus} disabled={recording}>
                장치 새로고침
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default MicCheckModal;
