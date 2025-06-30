import React, { useState, useRef, useEffect } from "react";
import MicRecorder from "./asset/Mic/MicRecorder";
import { nextQuestion, saveInterview } from "./api/interview";
import { requestSpeechToText } from "./api/stt";
import Timer from "./asset/Timer";
import { endSession } from "./api/interview";
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
                                   allowRetry = true,
                                   initialQuestion,
                                   onStatusChange,
                                   onTimeUpdate,
                                   onNewQuestion,
                                   onAnswerComplete,
                                   onCaptionUpdate,
                                   jdText,
                                   pdfText,
                                 }) {
  const [phase, setPhase] = useState(PHASE.TTS);
  const [question, setQuestion] = useState(initialQuestion);
  const [remainingTime, setRemainingTime] = useState(0);
  const [sttResult, setSttResult] = useState(null);

  const timerRef = useRef(null);
  const recorderRef = useRef(null);
  const audioRef = useRef(null);

  // 초기 질문 세팅
  useEffect(() => {
    setQuestion(initialQuestion);
    setPhase(PHASE.TTS);
  }, [initialQuestion]);

  // TTS 재생
  useEffect(() => {
    console.log("[useEffect] phase:", phase, "| question:", question);
    onStatusChange?.(phase);

    if (phase === PHASE.TTS && question?.question) {
      console.log("[TTS] 자막:", question.question);
      onCaptionUpdate?.(`면접관: ${question.question}`);
    }

    if (phase === PHASE.TTS && question?.audio_url) {
      audioRef.current?.pause();
      const url = question.audio_url.startsWith("http")
          ? question.audio_url
          : "http://localhost:8000" + question.audio_url;
      const audio = new Audio(url);
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

  // 대기 후 녹음
  useEffect(() => {
    clearInterval(timerRef.current);

    if (phase === PHASE.WAITING) {
      setRemainingTime(waitTime);
      onTimeUpdate?.(waitTime);
      timerRef.current = setInterval(() => {
        setRemainingTime(prev => {
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
  const handleRecordingComplete = async blob => {
    setPhase(PHASE.UPLOADING);
    try {
      const data = await requestSpeechToText(blob);
      setSttResult(data.text);
      onCaptionUpdate?.(`이용자: ${data.text}`);
      setPhase(PHASE.COMPLETE);
    } catch (err) {
      console.error("STT 오류:", err);
    }
  };

  // 답변 저장 & 다음 질문 또는 자동 총평
  useEffect(() => {
    if (phase === PHASE.COMPLETE && sttResult) {
      (async () => {
        // 1) 답변 저장
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

        // 2) next_question 호출 (마지막 질문 포함)
        try {
          const res = await nextQuestion(sessionId, sttResult, jdText, pdfText);
          const data = res.data;

          // 2-1) 자동 총평이 포함되어 돌아왔으면
          if (data.final_feedback) {
            alert("면접이 종료되었습니다.\n" + (data.message || ""));
            navigate("/feedback-result", {
              state: {
                feedback: data.final_feedback,
                history: data.history || [],
              },
            });
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
