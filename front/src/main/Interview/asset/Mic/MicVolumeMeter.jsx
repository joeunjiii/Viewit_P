// components/asset/Mic/MicVolumeMeter.jsx
import React, { useEffect, useRef, useState } from "react";
import "./MicVolumeMeter.css";

function MicVolumeMeter() {
  const [volume, setVolume] = useState(0);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const animationFrameIdRef = useRef(null);

  useEffect(() => {
    let mediaStream = null;

    const startMic = async () => {
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const audioContext = new AudioContext();
        audioContextRef.current = audioContext;

        const source = audioContext.createMediaStreamSource(mediaStream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;

        analyserRef.current = analyser;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        dataArrayRef.current = dataArray;

        source.connect(analyser);

        const updateVolume = () => {
          analyser.getByteTimeDomainData(dataArray);
          let sum = 0;
          for (let i = 0; i < bufferLength; i++) {
            const v = dataArray[i] - 128;
            sum += v * v;
          }
          const rms = Math.sqrt(sum / bufferLength);
          const volumePercent = Math.min(100, Math.round((rms / 128) * 100));
          setVolume(volumePercent);
          animationFrameIdRef.current = requestAnimationFrame(updateVolume);
        };

        updateVolume();
      } catch (err) {
        console.error("마이크 접근 오류:", err);
      }
    };

    startMic();

    return () => {
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
      if (mediaStream) mediaStream.getTracks().forEach((track) => track.stop());
    };
  }, []);

  return (
    <div className="volume-meter-wrapper">
      <div className="volume-bar-background">
        <div
          className="volume-bar-fill"
          style={{
            width: `${volume}%`,
            backgroundColor: volume > 20 ? "#4caf50" : "#e53935",
          }}
        ></div>
      </div>
      <p className="volume-text">입력 음량: {volume}%</p>
    </div>
  );
}

export default MicVolumeMeter;
  