import React, { useState, useRef, useEffect } from "react";
import MicRecorder from "./asset/Mic/MicRecorder";
import { nextQuestion, saveInterview } from "./api/interview";
import { requestSpeechToText } from "./api/stt";
import { useNavigate } from "react-router-dom";

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
  const [question, setQuestion] = useState(initialQuestion);
  const [remainingTime, setRemainingTime] = useState(0);
  const [sttResult, setSttResult] = useState(null);

  const timerRef = useRef(null);
  const recorderRef = useRef(null);
  const audioRef = useRef(null);
  const navigate = useNavigate();
  // 초기 질문 세팅
  useEffect(() => {
    setQuestion(initialQuestion);
    setPhase(PHASE.TTS);
  }, [initialQuestion]);

  // TTS 재생
  useEffect(() => {
    console.log("[useEffect] phase:", phase, "| question:", question);
    onStatusChange?.(phase);

    // TTS phase 자막 출력
    if (phase === PHASE.TTS && question?.question) {
      console.log("[TTS] 자막:", question.question);
      onCaptionUpdate?.(`면접관: ${question.question}`);
    }

    // 오디오 재생
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
          // AbortError는 무시
          if (err.name !== "AbortError") {
            console.error("[TTS] 오디오 play 에러:", err);
            setPhase(PHASE.WAITING);
          }
        });

      // cleanup 함수: 이 effect가 다시 실행되거나 unmount될 때 호출됨
      return () => {
        audio.pause();
        audioRef.current = null;
      };
    } else {
      // TTS phase가 아니면 이전 오디오 정지
      audioRef.current?.pause();
      audioRef.current = null;
    }
  }, [phase, question, onStatusChange, onCaptionUpdate]);

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

  // 답변 저장 & 다음 질문 또는 자동 총평
  useEffect(() => {
    if (phase === PHASE.COMPLETE && sttResult) {
      (async () => {
        try {
          await saveInterview({
            sessionId,
            questionText: question?.question || "",
            answerText: sttResult,
            filterWord: "",
            answerFeedback: "",
          });
        } catch (e) {
          alert("저장 실패: " + e.message);
          return;
        }

        try {
          const res = await nextQuestion(sessionId, sttResult, jdText, pdfText);
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

  // const handleRetry = () => {
  //   // 1) phase를 READY 같은 임시값으로 변경
  //   setPhase(PHASE.READY);

  //   // 2) 10~50ms 뒤에 다시 TTS로 변경 (비동기 트리거)
  //   setTimeout(() => setPhase(PHASE.TTS), 20);
  //   setRemainingTime(waitTime);
  // };

  return (
    <div className="interview-session">
      <MicRecorder
        ref={recorderRef}
        isRecording={phase === PHASE.RECORDING}
        onStop={handleRecordingComplete}
      />
    </div>
  );
}

export default InterviewSessionManager;
