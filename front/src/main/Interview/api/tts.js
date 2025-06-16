// api/tts.js
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const requestTTS = async () => {
    try {
      // 👇 TTS 백엔드 호출
      const res = await fetch("http://localhost:8000/interview/start");
      const data = await res.json();
  
      // 1초 텀주고 전달 
      await delay(1000);
      // 👉 mp3 URL 반환
      return data.audio_url; // 예: "/static/audio/intro.mp3"
    } catch (err) {
      console.error("❌ TTS 요청 실패:", err);
      return null;
    }
  };
  