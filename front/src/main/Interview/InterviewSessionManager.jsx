import React, { useState, useRef, useEffect } from "react";
import MicRecorder from "./asset/Mic/MicRecorder";
import { nextQuestion, saveInterview } from "./api/interview";
import { requestSpeechToText } from "./api/stt";
import { useNavigate } from "react-router-dom";
import UserAnswerDisplay from "./asset/UserAnswerDisplay";
const PHASE = {
  TTS: "tts",
  WAITING: "wait",
  RECORDING: "recording",
  UPLOADING: "uploading",
  COMPLETE: "complete",
};

function InterviewSessionManager({
  sessionId,
  waitTime = 3,
  // allowRetry = true,
  initialQuestion,
  onStatusChange,
  onTimeUpdate,
  onNewQuestion,
  onAnswerComplete,
  onCaptionUpdate,
  jdText,
  pdfText,
  onUserAnswer, // 사용자 답변 전달 콜백
}) {
  const [phase, setPhase] = useState(PHASE.TTS);
  const [answer, setAnswer] = useState("");
  const [question, setQuestion] = useState(initialQuestion);
  const [remainingTime, setRemainingTime] = useState(0);
  const [sttResult, setSttResult] = useState(null);

  const timerRef = useRef(null);
  const recorderRef = useRef(null);
  const audioRef = useRef(null);
  const navigate = useNavigate();
  const sttInProgressRef = useRef(false);
  // 초기 질문 세팅
  useEffect(() => {
    setQuestion(initialQuestion);
    setPhase(PHASE.TTS);
  }, [initialQuestion]);

  useEffect(() => {
    if (!onStatusChange) return;
    // 렌더 직후 안전하게 부모 상태 변경
    const id = requestAnimationFrame(() => onStatusChange(phase));
    return () => cancelAnimationFrame(id);
  }, [phase, onStatusChange]);

  useEffect(() => {
    if (phase === PHASE.TTS && question?.question) {
      console.log("[TTS] 자막:", question.question);
      onCaptionUpdate?.(`면접관: ${question.question}`);
    }

    if (phase === PHASE.TTS && question?.audio_url) {
      const url = question.audio_url.startsWith("http")
        ? question.audio_url
        : "http://localhost:8000" + question.audio_url;
      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onended = () => {
        console.log("[TTS] 오디오 재생 종료, phase WAITING 전환");
        setPhase(PHASE.WAITING);
      };

      audio
        .play()
        .then(() => console.log("[TTS] 오디오 재생 시작!"))
        .catch((err) => {
          if (err.name !== "AbortError") {
            console.error("[TTS] 오디오 play 에러:", err);
            setPhase(PHASE.WAITING);
          }
        });

      return () => {
        audio.pause();
        audioRef.current = null;
      };
    } else {
      audioRef.current?.pause();
      audioRef.current = null;
    }
  }, [phase, question, onCaptionUpdate]);


  // 대기 후 녹음
  useEffect(() => {
    clearInterval(timerRef.current);

    if (phase === PHASE.WAITING) {
      setRemainingTime(waitTime);
      onTimeUpdate?.(waitTime);
      timerRef.current = setInterval(() => {
        setRemainingTime((prev) => {
          onTimeUpdate?.(prev - 1);
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setPhase(PHASE.RECORDING);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    if (phase === PHASE.RECORDING) {
      recorderRef.current?.start?.();
    }

    return () => clearInterval(timerRef.current);
  }, [phase, waitTime, onTimeUpdate]);

  // 녹음 완료 → STT
  const handleRecordingComplete = async (blob) => {
    if (sttInProgressRef.current) {
      console.warn("STT 중복 호출 차단!");
      return;
    }
    sttInProgressRef.current = true; // 첫 진입에만 true

    console.log("🎤 handleRecordingComplete 호출됨!", blob);
    setPhase(PHASE.UPLOADING);
    try {
      const data = await requestSpeechToText(blob);
      setSttResult(data.text);
      // onCaptionUpdate?.(`이용자: ${data.text}`);
      // 사용자 답변을 별도 콜백으로 전달
      onUserAnswer?.(data.text);
      setPhase(PHASE.COMPLETE);
    } catch (err) {
      console.error("STT 오류:", err);
    }
  };

  // phase가 RECORDING이 될 때마다 flag를 초기화
  useEffect(() => {
    if (phase === PHASE.RECORDING) {
      sttInProgressRef.current = false;
    }
  }, [phase]);

  
  // 답변 저장 & 다음 질문 또는 자동 총평
  useEffect(() => {
    if (phase === PHASE.COMPLETE && sttResult) {
      console.log("🔥 nextQuestion API 요청 시작:", { phase, sttResult });
      (async () => {
        try {
          await saveInterview({
            sessionId,
            questionText: question?.question || "",
            answerText: sttResult,
            filterWord: "",
            answerFeedback: "",
          });
          console.log("✅ 답변 저장 성공!");
        } catch (e) {
          alert("저장 실패: " + e.message);
          return;
        }

        try {
          const res = await nextQuestion(sessionId, sttResult, jdText, pdfText);
          console.log("✅ nextQuestion API 응답:", res);
          const data = res.data;

          if (data.final_feedback) {
            alert("면접이 종료되었습니다.\n" + (data.message || ""));
            navigate(`/feedback/${sessionId}`); // <- sessionId 포함하여 이동!
            onAnswerComplete?.(sttResult);
            return;
          }

          // 2-2) 다음 질문이 돌아왔으면
          const { question: q, audio_url, done } = data;
          setQuestion({ question: q, audio_url, done });
          onNewQuestion?.(q);
          setPhase(PHASE.TTS);
        } catch (err) {
          alert("다음 질문 호출 실패: " + err.message);
        }

        setSttResult(null);
        onAnswerComplete?.(sttResult);
      })();
    }
  }, [
    phase,
    sttResult,
    sessionId,
    question,
    onAnswerComplete,
    onNewQuestion,
    navigate,
    jdText,
    pdfText,
  ]);


  return (
    <div className="interview-session">
      <UserAnswerDisplay
        status={phase}
        answer={answer}
        isVisible={true}
        title="내 답변"
        placeholder="답변을 기다리는 중..."
      />
      <MicRecorder
        ref={recorderRef}
        isRecording={phase === PHASE.RECORDING}
        onStop={handleRecordingComplete}
      />
      <MicRecorder
        ref={recorderRef}
        isRecording={phase === PHASE.RECORDING}
        onStop={handleRecordingComplete}
      />
    </div>
  );
}

export default InterviewSessionManager;
