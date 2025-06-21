const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const requestTTS = async () => {
  try {
    // 👇 반드시 상대 경로!
    const res = await fetch("/api/tts/start");
    const data = await res.json();

    await delay(1000);
    return data.audio_url; // 예: "/static/audio/intro.mp3"
  } catch (err) {
    console.error("❌ TTS 요청 실패:", err);
    return null;
  }
};

export const requestNextTTSQuestion = async () => {
  try {
    const res = await fetch("/api/tts/next");
    const data = await res.json();

    return {
      audioUrl: data.audio_url,
      question: data.question,
    };
  } catch (err) {
    console.error("❌ 다음 질문 요청 실패:", err);
    return null;
  }
};
