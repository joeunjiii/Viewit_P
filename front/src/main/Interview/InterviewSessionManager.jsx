import React, { useState, useRef, useEffect } from "react";
import MicRecorder from "./asset/Mic/MicRecorder";
import { nextQuestion, saveInterview, endSession } from "./api/interview";  // ★ 종료 API 호출 import
import { requestSpeechToText } from "./api/stt";
import { useNavigate } from "react-router-dom";
import UserAnswerDisplay from "./asset/UserAnswerDisplay";
import QuestionStatusBar from "./asset//QuestionStatusBar";

const PHASE = {
  TTS: "tts",           // TTS 재생 중
  WAITING: "wait",      // 녹음 전 대기 중
  RECORDING: "recording",// 녹음 중
  UPLOADING: "uploading",// 녹음 데이터 업로드 중
  COMPLETE: "complete",  // STT 완료 및 응답 대기 상태
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

  const timerRef = useRef(null);       // 타이머 관리용 ref
  const recorderRef = useRef(null);    // 녹음기 관리용 ref
  const audioRef = useRef(null);       // TTS 오디오 관리용 ref
  const navigate = useNavigate();      // 페이지 이동용 훅

  // 초기 질문 세팅: initialQuestion이 바뀌면 질문과 단계 초기화
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
          console.error("[TTS] 오디오 play 에러:", err);
          setPhase(PHASE.WAITING);
        });
    }
  }, [phase, question, onCaptionUpdate]);


  // 녹음 전 대기 및 녹음 시작
  useEffect(() => {
    clearInterval(timerRef.current);

    if (phase === PHASE.WAITING) {
      setRemainingTime(waitTime);
      onTimeUpdate?.(waitTime);

      // 1초 간격으로 카운트다운, 0 되면 녹음 시작
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

    // 녹음 단계에서는 녹음 시작
    if (phase === PHASE.RECORDING) {
      recorderRef.current?.start?.();
    }

    // 컴포넌트 언마운트 또는 phase 변경 시 타이머 클리어
    return () => clearInterval(timerRef.current);
  }, [phase, waitTime, onTimeUpdate]);

  // 녹음 완료 시 호출: STT API 호출 및 결과 처리
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

  // 답변 저장 & 다음 질문 요청 또는 면접 종료 처리
  useEffect(() => {
    if (phase === PHASE.COMPLETE && sttResult) {
      (async () => {
        try {
          // 1. 답변 저장 API 호출
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
          // 2. 다음 질문 또는 종료 여부 판단 API 호출
          const res = await nextQuestion(sessionId, sttResult, jdText, pdfText);
          const data = res.data;

          // 3. done === true 이면 면접 종료 처리 (종료 API 호출 및 피드백 페이지 이동)
          if (data.done === true) {
            alert("면접이 종료되었습니다.\n" + (data.message || ""));
            await endSession(sessionId);  // 종료 API 호출
            navigate(`/feedback/${sessionId}`); // 피드백 결과 페이지로 이동
            onAnswerComplete?.(sttResult);
            return; // 이후 로직 중단
          }

          // 4. done이 false면 다음 질문 세팅 및 TTS 재생 단계로 전환
          const { question: q, audio_url, done } = data;
          setQuestion({ question: q, audio_url, done });
          onNewQuestion?.(q);
          setPhase(PHASE.TTS);
        } catch (err) {
          alert("다음 질문 호출 실패: " + err.message);
        }

        // 상태 초기화
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
      
      <UserAnswerDisplay status={phase} answer={sttResult} isVisible={true} />
      <MicRecorder
        ref={recorderRef}
        isRecording={phase === PHASE.RECORDING}
        onStop={handleRecordingComplete}
      />
    </div>
  );
}

export default InterviewSessionManager;
