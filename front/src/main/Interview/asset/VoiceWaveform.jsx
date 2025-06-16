import React, { useEffect, useRef } from "react";
import WaveSurfer from "wavesurfer.js";
import MicrophonePlugin from "wavesurfer.js/dist/plugin/wavesurfer.microphone.min.js";


function VoiceWaveform() {
  const micWaveformRef = useRef(null); // 면접자
  const audioWaveformRef = useRef(null); // 면접관
  const micWaveSurfer = useRef(null);
  const audioWaveSurfer = useRef(null);

  useEffect(() => {
    // 면접자 파형 (마이크 입력)
    micWaveSurfer.current = WaveSurfer.create({
      container: micWaveformRef.current,
      waveColor: "#91d5ff",
      interact: false,
      cursorWidth: 0,
      height: 80,
      plugins: [
        MicrophonePlugin.create({
          bufferSize: 4096,
          numberOfInputChannels: 1,
          numberOfOutputChannels: 1,
        }),
      ],
    });

    micWaveSurfer.current.microphone.on("deviceReady", () =>
      console.log("🎙️ 마이크 연결됨")
    );
    micWaveSurfer.current.microphone.on("deviceError", (err) =>
      console.error("❌ 마이크 오류:", err)
    );
    micWaveSurfer.current.microphone.start();

    // 면접관 파형 (파일 기반)
    audioWaveSurfer.current = WaveSurfer.create({
      container: audioWaveformRef.current,
      waveColor: "#ffd591",
      progressColor: "#fa8c16",
      cursorWidth: 1,
      height: 80,
    });

    // 예시 URL: 실제로는 질문 음성 파일 또는 TTS 출력 URL 사용
    audioWaveSurfer.current.load("/sample-audio/question1.mp3");

    return () => {
      micWaveSurfer.current.microphone.stop();
      micWaveSurfer.current.destroy();
      audioWaveSurfer.current.destroy();
    };
  }, []);

  return (
    <div className="voice-area">
      <div className="voice-item">
        <div className="voice-label">면접관</div>
        <div className="waveform" ref={audioWaveformRef}>나중에 파형추가</div>
      </div>
      <div className="voice-item">
        <div className="voice-label">면접자</div>
        <div className="waveform" ref={micWaveformRef}>나중에 파형추가</div>
      </div>
    </div>
  );
}

export default VoiceWaveform;
