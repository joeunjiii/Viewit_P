import React, { useState, useEffect, useRef } from "react";
import { ReactMic } from "react-mic";
import "./MicCheckModal.css";

function MicCheckModal({ onClose }) {
  const [record, setRecord] = useState(false);
  const [status, setStatus] = useState("");
  const [micAvailable, setMicAvailable] = useState(null); // null: 확인중, true: 가능, false: 불가능
  const [deviceList, setDeviceList] = useState([]);
  const [isInitializing, setIsInitializing] = useState(true);
  const [showReactMic, setShowReactMic] = useState(false);
  const micTestRef = useRef(null);

  // 컴포넌트 마운트 시 완전한 오류 핸들링 설정
  useEffect(() => {
    // 전역 오류 핸들러 - 가장 강력한 예외처리
    const handleGlobalError = (event) => {
      const errorMessage = event.error?.message || event.reason?.message || "";

      if (
        errorMessage.includes("device not found") ||
        errorMessage.includes("Requested device not found") ||
        errorMessage.includes("No audio devices found") ||
        errorMessage.toLowerCase().includes("microphone")
      ) {
        console.warn("전역 오류 핸들러: 마이크 관련 오류 감지", errorMessage);

        setMicAvailable(false);
        setShowReactMic(false);
        setRecord(false);
        setStatus(
          "❌ 마이크 장치 오류가 감지되었습니다. 마이크를 확인해주세요."
        );

        // 오류 전파 중단
        event.preventDefault();
        event.stopPropagation();
        return false;
      }
    };

    const handleUnhandledRejection = (event) => {
      const errorMessage = event.reason?.message || event.reason || "";

      if (
        typeof errorMessage === "string" &&
        (errorMessage.includes("device not found") ||
          errorMessage.includes("Requested device not found"))
      ) {
        console.warn("Unhandled rejection: 마이크 관련 오류", errorMessage);

        setMicAvailable(false);
        setShowReactMic(false);
        setRecord(false);
        setStatus("❌ 마이크 장치에 접근할 수 없습니다.");

        // Promise rejection 처리
        event.preventDefault();
        return false;
      }
    };

    // 오류 핸들러 등록
    window.addEventListener("error", handleGlobalError, true);
    window.addEventListener(
      "unhandledrejection",
      handleUnhandledRejection,
      true
    );

    // 초기 장치 확인
    checkInitialDeviceStatus();

    return () => {
      window.removeEventListener("error", handleGlobalError, true);
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection,
        true
      );
    };
  }, []);

  // 초기 장치 상태 확인 - 더 안전한 방식
  const checkInitialDeviceStatus = async () => {
    setIsInitializing(true);
    setShowReactMic(false);

    try {
      // 1단계: 브라우저 지원 여부 확인
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        throw new Error("브라우저가 미디어 장치 접근을 지원하지 않습니다.");
      }

      // 2단계: 장치 목록 확인
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputDevices = devices.filter(
        (device) => device.kind === "audioinput"
      );

      setDeviceList(audioInputDevices);

      if (audioInputDevices.length === 0) {
        setMicAvailable(false);
        setStatus("❌ 마이크 장치가 연결되어 있지 않습니다.");
        return;
      }

      // 3단계: 실제 마이크 접근 테스트
      try {
        const testStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            deviceId: audioInputDevices[0].deviceId
              ? { exact: audioInputDevices[0].deviceId }
              : undefined,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

        if (
          testStream &&
          testStream.active &&
          testStream.getAudioTracks().length > 0
        ) {
          testStream.getTracks().forEach((track) => track.stop());

          setMicAvailable(true);
          setStatus(
            `🎤 ${audioInputDevices.length}개의 마이크 장치가 정상적으로 감지되었습니다.`
          );

          // 마이크가 정상적으로 작동하는 경우에만 ReactMic 표시
          setTimeout(() => {
            setShowReactMic(true);
          }, 500);
        } else {
          throw new Error("마이크 스트림 생성 실패");
        }
      } catch (streamError) {
        console.error("마이크 스트림 테스트 실패:", streamError);
        setMicAvailable(false);

        if (streamError.name === "NotAllowedError") {
          setStatus(
            "❌ 마이크 권한이 거부되었습니다. 브라우저 설정에서 마이크 권한을 허용해주세요."
          );
        } else {
          setStatus(
            "❌ 마이크에 접근할 수 없습니다. 다른 애플리케이션에서 사용 중이거나 장치에 문제가 있을 수 있습니다."
          );
        }
      }
    } catch (error) {
      console.error("초기 장치 확인 오류:", error);
      setMicAvailable(false);
      setStatus(
        "❌ 장치 상태를 확인할 수 없습니다. 브라우저나 장치를 확인해주세요."
      );
    } finally {
      setIsInitializing(false);
    }
  };

  const handleCheck = async () => {
    if (!micAvailable) {
      setStatus("❌ 마이크가 사용 가능하지 않습니다. 장치를 확인해주세요.");
      return;
    }

    setStatus("🎧 마이크 테스트 중...");
    setRecord(false);

    try {
      // ReactMic를 사용하기 전에 한 번 더 검증
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      if (!stream || !stream.active) {
        throw new Error("마이크 스트림을 시작할 수 없습니다.");
      }

      stream.getTracks().forEach((track) => track.stop());

      // 안전한 녹음 시작 - try-catch로 한번 더 감싸기
      setTimeout(() => {
        try {
          if (micAvailable && showReactMic) {
            setRecord(true);
            setTimeout(() => {
              setRecord(false);
              setStatus("✅ 마이크 입력 감지됨 (정상입니다)");
            }, 3000);
          } else {
            setStatus(
              "❌ 마이크 상태가 변경되었습니다. 새로고침을 시도해주세요."
            );
          }
        } catch (recordError) {
          console.error("녹음 시작 오류:", recordError);
          setRecord(false);
          setStatus("❌ 녹음을 시작할 수 없습니다. 장치를 확인해주세요.");
        }
      }, 500);
    } catch (error) {
      console.error("❌ 마이크 테스트 오류:", error);
      setRecord(false);

      let errorMessage = "❌ 마이크 테스트에 실패했습니다.";

      if (
        error.name === "NotFoundError" ||
        error.name === "DevicesNotFoundError"
      ) {
        errorMessage =
          "❌ 마이크 장치를 찾을 수 없습니다. 마이크 연결을 확인해주세요.";
        setMicAvailable(false);
        setShowReactMic(false);
      } else if (error.name === "NotAllowedError") {
        errorMessage =
          "❌ 마이크 권한이 거부되었습니다. 브라우저 설정을 확인해주세요.";
      } else if (error.name === "NotReadableError") {
        errorMessage = "❌ 마이크가 다른 애플리케이션에서 사용 중입니다.";
      }

      setStatus(errorMessage);
    }
  };

  const handleStop = (recordedBlob) => {
    console.log("녹음 종료:", recordedBlob);

    // ✅ Blob 객체를 다운로드 가능하게 처리
    const url = URL.createObjectURL(recordedBlob.blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = "mic_test.wav"; // 다운로드될 파일 이름
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url); // 메모리 해제
  };

  const handleError = (error) => {
    console.error("ReactMic 오류:", error);
    setRecord(false);
    setMicAvailable(false);
    setShowReactMic(false);

    let errorMessage = "❌ 녹음 중 오류가 발생했습니다.";

    if (error && error.message) {
      if (
        error.message.includes("device not found") ||
        error.message.includes("Requested device not found") ||
        error.message.includes("No audio devices found")
      ) {
        errorMessage =
          "❌ 마이크 장치를 찾을 수 없습니다. 장치 연결을 확인하고 페이지를 새로고침해주세요.";
      }
    }

    setStatus(errorMessage);
  };

  const handleClose = () => {
    setRecord(false);
    setStatus("");
    onClose();
  };

  const handleRefresh = () => {
    setStatus("🔄 장치 상태 확인 중...");
    setShowReactMic(false);
    checkInitialDeviceStatus();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>마이크 상태 확인</h3>

        {/* 초기화 중 표시 */}
        {isInitializing && (
          <div style={{ textAlign: "center", padding: "20px" }}>
            <p>🔄 장치 상태 확인 중...</p>
          </div>
        )}

        {/* 장치 정보 표시 */}
        {!isInitializing && micAvailable && deviceList.length > 0 && (
          <div
            style={{
              marginBottom: "10px",
              fontSize: "12px",
              color: "#666",
              backgroundColor: "#f5f5f5",
              padding: "8px",
              borderRadius: "4px",
            }}
          >
            <strong>감지된 마이크:</strong>
            <br />
            {deviceList.map((device, index) => (
              <div key={index}>
                • {device.label || `마이크 장치 ${index + 1}`}
              </div>
            ))}
          </div>
        )}

        {/* ReactMic 컴포넌트 - 완전히 안전한 상태에서만 표시 */}
        {showReactMic && micAvailable && !isInitializing && (
          <div style={{ position: "relative" }}>
            <ReactMic
              record={record}
              onStop={handleStop}
              onError={handleError}
              className="sound-wave"
              strokeColor="#26a69a"
              backgroundColor="#e0f7fa"
              mimeType="audio/wav"
              bufferSize={4096}
              sampleRate={44100}
            />
          </div>
        )}

        {/* 장치 없음 또는 오류 상태 안내 */}
        {!isInitializing && micAvailable === false && (
          <div
            style={{
              padding: "20px",
              backgroundColor: "#ffebee",
              border: "1px solid #f44336",
              borderRadius: "4px",
              marginBottom: "10px",
            }}
          >
            <p
              style={{
                margin: "0 0 10px 0",
                color: "#d32f2f",
                fontWeight: "bold",
              }}
            >
              🚫 마이크를 사용할 수 없습니다
            </p>
            <ul
              style={{
                fontSize: "12px",
                color: "#666",
                margin: 0,
                paddingLeft: "16px",
              }}
            >
              <li>마이크가 컴퓨터에 제대로 연결되어 있는지 확인</li>
              <li>다른 프로그램에서 마이크를 사용하고 있지 않은지 확인</li>
              <li>브라우저에서 마이크 권한이 허용되어 있는지 확인</li>
              <li>페이지를 새로고침하거나 브라우저를 재시작</li>
            </ul>
          </div>
        )}

        <p
          style={{
            color: status.includes("❌")
              ? "red"
              : status.includes("✅")
              ? "green"
              : "black",
            minHeight: "20px",
          }}
        >
          {status}
        </p>

        <div className="modal-actions">
          <button onClick={handleClose}>닫기</button>
          <button
            onClick={handleCheck}
            disabled={
              record || !micAvailable || isInitializing || !showReactMic
            }
          >
            {record ? "테스트 중..." : "마이크 테스트"}
          </button>
          <button onClick={handleRefresh} disabled={record || isInitializing}>
            장치 새로고침
          </button>
        </div>
      </div>
    </div>
  );
}

export default MicCheckModal;
