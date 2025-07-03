import React, { useState, useRef, useEffect } from "react";
import MicRecorder from "./asset/Mic/MicRecorder";
import { nextQuestion, saveInterview, endSession } from "./api/interview";  // ★ 종료 API 호출 import
import { requestSpeechToText } from "./api/stt";
import { useNavigate } from "react-router-dom";

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
                                   initialQuestion,
                                   onStatusChange,
                                   onTimeUpdate,
                                   onNewQuestion,
                                   onAnswerComplete,
                                   onCaptionUpdate,
                                   jdText,
                                   pdfText,
                                 }) {
  const [phase, setPhase] = useState(PHASE.TTS);            // 현재 단계 상태 관리
  const [question, setQuestion] = useState(initialQuestion); // 현재 질문 상태
  const [remainingTime, setRemainingTime] = useState(0);     // 녹음 대기 시간 카운트
  const [sttResult, setSttResult] = useState(null);          // 음성 인식 결과 저장

  const timerRef = useRef(null);       // 타이머 관리용 ref
  const recorderRef = useRef(null);    // 녹음기 관리용 ref
  const audioRef = useRef(null);       // TTS 오디오 관리용 ref
  const navigate = useNavigate();      // 페이지 이동용 훅

  // 초기 질문 세팅: initialQuestion이 바뀌면 질문과 단계 초기화
  useEffect(() => {
    setQuestion(initialQuestion);
    setPhase(PHASE.TTS);
  }, [initialQuestion]);

  // TTS 재생: phase가 TTS일 때 음성 재생 및 캡션 업데이트
  useEffect(() => {
    onStatusChange?.(phase);

    if (phase === PHASE.TTS && question?.question) {
      onCaptionUpdate?.(`면접관: ${question.question}`);
    }

    if (phase === PHASE.TTS && question?.audio_url) {
      audioRef.current?.pause();

      // 로컬 서버 경로 또는 외부 URL에 따라 오디오 경로 처리
      const url = question.audio_url.startsWith("http")
          ? question.audio_url
          : "http://localhost:8000" + question.audio_url;

      const audio = new Audio(url);
      audioRef.current = audio;
      // 재생 완료 후 대기 단계로 전환
      audio.onended = () => setPhase(PHASE.WAITING);
      audio.play().catch(() => setPhase(PHASE.WAITING));
    }
  }, [phase, question, onStatusChange, onCaptionUpdate]);

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
      onCaptionUpdate?.(`이용자: ${data.text}`);
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
        <MicRecorder
            ref={recorderRef}
            isRecording={phase === PHASE.RECORDING}
            onStop={handleRecordingComplete}
        />
      </div>
  );
}

export default InterviewSessionManager;
