import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaLaptopCode, FaStar } from "react-icons/fa";
import PersonalizationModal from "./PersonalizationModal"; // 경로 맞게!
import "./css/InterviewTypeSelect.css";
import InterviewSettingsModal from "./InterviewSettingModal";
export default function InterviewTypeSelect({ onClose }) {
  const [showPersonalModal, setShowPersonalModal] = useState(false);
  const [showSettingModal, setShowSettingModal] = useState(false);
  const [personalData, setPersonalData] = useState(null); // 맞춤 정보 저장
  const navigate = useNavigate();
  // IT공통 or Personal 모드 선택 핸들러

  const handleSelect = (mode) => {
    onClose && onClose();
    navigate(`/Interview?mode=${mode}`);
  };

  // PersonalizationModal에서 확인 시
  const handlePersonalConfirm = (data) => {
    setShowPersonalModal(false);
    onClose && onClose();
    // 가장 쉬운 방법: state로 personalData 전달
    navigate("/Interview?mode=personal", { state: { personalData: data } });
  };

  // InterviewSettingsModal에서 시작하기 시
  const handleSettingStart = (settingData) => {
    setShowSettingModal(false);
    onClose && onClose();
    // 실제 면접 시작 로직! (예: navigate("/InterviewSession", { state: { ...personalData, ...settingData } }))
    // 필요시 여기에 추가로 prop/state 넘기기
  };
  return (
    <div className="interview-type-modal-overlay">
      <div className="interview-type-modal">
        <button className="interview-type-close-btn" onClick={onClose}>
          ×
        </button>
        <div className="interview-type-modal-title">모의면접 유형 선택</div>
        <div className="interview-type-modal-desc">
          어떤 모의면접을 연습하시겠어요?
        </div>
        <div className="interview-type-cards">
          <div
            className="interview-type-card"
            onClick={() => handleSelect("common")}
          >
            <div className="interview-type-icon common">
              <FaLaptopCode size={38} />
            </div>
            <div className="interview-type-card-title">IT 공통 모의면접</div>
            <div className="interview-type-card-desc">
              대표 IT 직군 중심 <br />
              실전 면접 질문을 연습할 수 있어요.
            </div>
          </div>
          <div
            className="interview-type-card"
            onClick={() => handleSelect("personal")}
          >
            <div className="interview-type-icon personal">
              <FaStar size={38} />
            </div>
            <div className="interview-type-card-title">
              개인화 맞춤형 모의면접
            </div>
            <div className="interview-type-card-desc">
              내 이력서, JD(채용공고) 등 <br />
              나만의 자료로 질문을 생성해 연습할 수 있어요.
            </div>
          </div>
        </div>
        
        {/* 공통 세팅 모달 (IT공통/개인화 모두에서 사용) */}
        {showPersonalModal && (
          <PersonalizationModal
            onClose={() => setShowPersonalModal(false)}
            onConfirm={handlePersonalConfirm}
          />
        )}
      </div>
    </div>
  );
}
