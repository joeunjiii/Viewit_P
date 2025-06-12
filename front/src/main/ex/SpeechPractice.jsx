import React, { useState } from "react";
import SpeechAlertModal from "./SpeechAlertModal";

function SpeechPractice() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div>
      <button onClick={() => setShowModal(true)} className="speech-button">
        스피치 연습
      </button>
      {showModal && <SpeechAlertModal onClose={() => setShowModal(false)} />}
    </div>
  );
}

export default SpeechPractice;
