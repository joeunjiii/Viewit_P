import { useImperativeHandle, forwardRef, useRef, useEffect,useCallback } from "react";

  const MicRecorder = forwardRef(({ isRecording, onStop }, ref) => {
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationIdRef = useRef(null);
  const SILENCE_THRESHOLD = 0.01; // 무음 기준 (볼륨 크기)
  const SILENCE_DURATION = 3000; // 무음이 3초 지속되면 종료ㄴ

  useImperativeHandle(ref, () => ({
    stop: () => {
      mediaRecorderRef.current?.stop();
    },
  }));

  const startSilenceDetection = () => {
    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(streamRef.current);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;

    source.connect(analyser);
    const buffer = new Uint8Array(analyser.fftSize);
    let silentTime = 0;
    let lastTime = Date.now();

    const check = () => {
      analyser.getByteTimeDomainData(buffer);
      const rms = Math.sqrt(buffer.reduce((acc, val) => {
        const norm = (val - 128) / 128;
        return acc + norm * norm;
      }, 0) / buffer.length);

      const now = Date.now();
      if (rms < SILENCE_THRESHOLD) {
        silentTime += now - lastTime;
      } else {
        silentTime = 0;
      }

      if (silentTime >= SILENCE_DURATION) {
        mediaRecorderRef.current?.stop();
      } else {
        animationIdRef.current = requestAnimationFrame(check);
      }

      lastTime = now;
    };

    check();
    audioContextRef.current = audioContext;
    analyserRef.current = analyser;
  };

  const stopSilenceDetection = () => {
    cancelAnimationFrame(animationIdRef.current);
    analyserRef.current?.disconnect();
    audioContextRef.current?.close();
  };

  const start = useCallback(async () => {
    streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(streamRef.current, { mimeType: "audio/webm" });
    audioChunksRef.current = [];
  
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        audioChunksRef.current.push(e.data);
      }
    };
  
    mediaRecorder.onstop = () => {
      stopSilenceDetection();
      const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
      streamRef.current.getTracks().forEach((t) => t.stop());
      onStop(blob);
    };
  
    mediaRecorder.start();
    mediaRecorderRef.current = mediaRecorder;
    startSilenceDetection();
  }, [onStop]); // 의존성으로 onStop만 있으면 됨
  

  useEffect(() => {
    if (isRecording) start(); //  녹음 시작
  
    return () => {
      stopSilenceDetection(); //  무음 감지 해제
      streamRef.current?.getTracks().forEach((t) => t.stop()); // 마이크 정리
    };
  }, [isRecording, start]); //  start 누락 시 경고 발생

  return null;
});

export default MicRecorder;
