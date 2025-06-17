import React, { useImperativeHandle, forwardRef, useRef } from "react";

const MicRecorder = forwardRef(({ isRecording, onStop }, ref) => {
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);

  useImperativeHandle(ref, () => ({
    stop: () => {
      mediaRecorderRef.current?.stop();
    },
  }));

  const start = async () => {
    streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(streamRef.current, { mimeType: "audio/webm" });

    audioChunksRef.current = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        audioChunksRef.current.push(e.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
      streamRef.current.getTracks().forEach((t) => t.stop());
      onStop(blob);
    };

    mediaRecorder.start();
    mediaRecorderRef.current = mediaRecorder;
  };

  React.useEffect(() => {
    if (isRecording) start();
  }, [isRecording]);

  return null; // 시각화 필요 시 캔버스 추가 가능
});

export default MicRecorder;
