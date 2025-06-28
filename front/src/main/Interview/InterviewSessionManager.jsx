import React, { useState, useRef, useEffect } from "react";
import MicRecorder from "./asset/Mic/MicRecorder";
import { nextQuestion, saveInterview } from "./api/interview";
import { requestSpeechToText } from "./api/stt";
import Timer from "./asset/Timer";
import { endSession } from "./api/interview";

const PHASE = {
  READY: "ready",
  TTS: "tts",
  WAITING: "wait",
  RECORDING: "recording",
  UPLOADING: "uploading",
  COMPLETE: "complete",
};

function InterviewSessionManager({
  sessionId,
  jobRole,
  waitTime = 3,
  allowRetry = true,
  initialQuestion,
  onStatusChange,
  onTimeUpdate,
  onNewQuestion,
  onAnswerComplete,
  onCaptionUpdate, // 추가
  jdText, // optional
  pdfText, // optional
}) {
  const [phase, setPhase] = useState(PHASE.TTS);
  const [question, setQuestion] = useState(initialQuestion);
  const [remainingTime, setRemainingTime] = useState(0);
  const [sttResult, setSttResult] = useState(null);

  const timerRef = useRef(null);
  const recorderRef = useRef(null);
  const audioRef = useRef(null);

  // initialQuestion 동기화
  useEffect(() => {
    setQuestion(initialQuestion);
    setPhase(PHASE.TTS);
  }, [initialQuestion]);

  // 오디오 재생 및 자막 업데이트
  useEffect(() => {
    console.log("[useEffect] phase:", phase, "| question:", question);
    onStatusChange?.(phase);

    // phase가 TTS(질문 오디오)일 때 자막 "면접관: ..."
    if (phase === PHASE.TTS && question?.question) {
      console.log("[TTS] 자막:", question.question);
      onCaptionUpdate?.(`면접관: ${question.question}`);
    }

    if (phase === PHASE.TTS && question?.audio_url) {
      if (audioRef.current) {
        console.log("[TTS] 이전 오디오 중지");
        audioRef.current.pause();
        audioRef.current = null;
      }
      const url = question.audio_url.startsWith("http")
        ? question.audio_url
        : "http://localhost:8000" + question.audio_url;
      console.log("[TTS] 오디오 재생 시도:", url);
      const audio = new Audio(url + "?t=" + Date.now());
      audioRef.current = audio;
      audio.onended = () => {
        console.log("[TTS] 오디오 재생 종료, phase WAITING 전환");
        setPhase(PHASE.WAITING);
      };
      audio.play()
      .then(() => console.log("[TTS] 오디오 재생 시작!"))
      .catch((err) => {
        console.error("[TTS] 오디오 play 에러:", err);
        setPhase(PHASE.WAITING);
      });
    }
  }, [phase, question, onStatusChange, onCaptionUpdate]);

  // 타이머 관리 (WAITING, RECORDING)
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

  // 녹음 완료 → STT 요청
  const handleRecordingComplete = async (blob) => {
    setPhase(PHASE.UPLOADING);
    try {
      const data = await requestSpeechToText(blob);
      setSttResult(data.text);

      // 답변 끝났을 때 자막 "이용자: ..."
      onCaptionUpdate?.(`이용자: ${data.text}`);

      setPhase(PHASE.COMPLETE);
    } catch (err) {
      console.error("STT 오류:", err);
    }
  };

  // 답변 끝나면 후속질문
  useEffect(() => {
    if (phase === PHASE.COMPLETE && sttResult) {
      (async () => {
        // 1. 답변 저장
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
        }
        // 2. 후속 질문 요청
        try {
          const res = await nextQuestion(sessionId, sttResult, jdText, pdfText);
          const { question: q, audio_url, done } = res.data;
          if (done) {
            setQuestion({ question: q, audio_url, done: true });
          } else {
            setQuestion({ question: q, audio_url });
            onNewQuestion?.(q);
            setPhase(PHASE.TTS);
          }
        } catch (err) {
          console.error("next_question 실패", err);
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
    jdText,
    pdfText,
  ]);

  // 다시 답변하기
  const handleRetry = () => {
    // 1) phase를 READY 같은 임시값으로 변경
    setPhase(PHASE.READY);

    // 2) 10~50ms 뒤에 다시 TTS로 변경 (비동기 트리거)
    setTimeout(() => setPhase(PHASE.TTS), 20);
    setRemainingTime(waitTime);

  };

  return (
    <div className="interview-session">
      <MicRecorder
        ref={recorderRef}
        isRecording={phase === PHASE.RECORDING}
        onStop={handleRecordingComplete}
      />
      {phase === PHASE.WAITING && (
        <div className="timer-area">
          <Timer duration={remainingTime} autoStart label="대기시간" />
          {allowRetry && (
            <button className="replay-button" onClick={handleRetry}>
              다시 답변하기
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default InterviewSessionManager;
