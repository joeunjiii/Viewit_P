// components/InterviewHeader.jsx
import Timer from "./Timer";
import './css/Interviewheader.css';

function InterviewHeader({ totalDuration = 600, onEndInterview }) {
    return (
        <div className="interview-header">
            <div className="timer-simple-box">
                <div className="header-left">
                    <Timer
                        duration={totalDuration}
                        label="남은시간"
                        mode="text"
                        className="header-timer"
                    />
                </div>
            </div>
            <div className="header-spacer" />
            <button className="end-button" onClick={onEndInterview}>
                종료하기
            </button>
        </div>
    );
}

export default InterviewHeader;
