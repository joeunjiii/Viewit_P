import { useState, useCallback } from 'react';

export const useInterviewFlow = () => {
  // === 면접 흐름 제어 상태 ===
  const [showModal, setShowModal] = useState(true); // InterviewSettingsModal 표시 여부 (초기값 true)
  const [showWelcome, setShowWelcome] = useState(false); // WelcomeMessage 표시 여부
  const [interviewSettings, setInterviewSettings] = useState(null); // 설정 모달에서 받은 면접 설정

  // === 면접 설정 모달에서 '설정하기' 버튼 클릭 시 호출될 함수 ===
  // InterviewSettingsModal -> Interview (onStart prop) -> useInterviewFlow (handleStartSettings)
  const handleStartSettings = useCallback((settings) => {
    console.log("Hooks: 설정 모달 완료 -> WelcomeMessage 표시");
    setShowModal(false); // 설정 모달 닫기
    setInterviewSettings(settings); // 받은 설정 값 저장
    setShowWelcome(true); // WelcomeMessage 표시
  }, []);

  // === WelcomeMessage에서 '바로 시작하기' 버튼 클릭 시 호출될 함수 ===
  // WelcomeMessage -> Interview (onStart prop) -> useInterviewFlow (handleWelcomeStart)
  const handleWelcomeStart = useCallback(() => {
    console.log("Hooks: WelcomeMessage 완료 -> 실제 면접 시작");
    setShowWelcome(false); // WelcomeMessage 닫기
    // 이 시점에서 Interview 컴포넌트의 조건부 렌더링에 의해 InterviewSessionManager가 활성화됨
  }, []);

  // === MicCheckModal 제어 상태 (필요하다면 여기에 추가) ===
  // MicCheckModal은 InterviewSettingsModal에서 직접 제어하므로
  // 여기서는 직접적인 로직이 필요 없을 수 있지만,
  // Interview 컴포넌트에서 이 훅의 값을 사용할 수 있도록 반환.
  const [micCheckOpen, setMicCheckOpen] = useState(false);
  const handleOpenMicCheck = useCallback(() => setMicCheckOpen(true), []);
  const handleCloseMicCheck = useCallback(() => setMicCheckOpen(false), []);


  return {
    // 상태 값들
    showModal,
    showWelcome,
    micCheckOpen,
    interviewSettings, // InterviewSessionManager에 전달할 설정값

    // 흐름 제어 함수들
    handleStartSettings,
    handleWelcomeStart,
    handleOpenMicCheck, // InterviewSettingsModal에서 MicCheckModal을 열기 위한 함수
    handleCloseMicCheck, // MicCheckModal을 닫기 위한 함수
    // Note: MicCheckModal의 onClose는 직접 Modal에서 호출되므로,
    // 이곳의 handleCloseMicCheck가 필수는 아닐 수 있지만,
    // 일관된 관리를 위해 포함했습니다.
  };
};