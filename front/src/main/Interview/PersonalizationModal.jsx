import React, { useRef, useState } from "react";
import { uploadJDAndPDF } from "./api/personalization";
import "./css/PersonalizationModal.css";
import LoadingModal from "./asset/LoadingModal";
export default function PersonalizationModal({ onClose, onConfirm }) {
  const [jobDesc, setJobDesc] = useState("");
  const [pdfFile, setPdfFile] = useState(null);
  const fileInputRef = useRef();
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalysisDone, setIsAnalysisDone] = useState(false); // 분석 완료 모달
  const [analysisResult, setAnalysisResult] = useState(null); // 백엔드에서 받은 데이터
  // PDF 선택 시 파일명 저장
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setPdfFile(e.target.files[0]);
    } else {
      setPdfFile(null);
    }
  };

  const handleConfirm = async ({ jobDesc, pdfFile }) => {
    if (!jobDesc && !pdfFile) {
      alert("JD 설명 또는 PDF 파일 중 하나 이상 입력해 주세요.");
      return;
    }
    setIsLoading(true); // 분석 중 모달 열기

    try {
      const res = await uploadJDAndPDF(jobDesc, pdfFile);
      console.log("JD 업로드 성공:", res.data);
      setIsLoading(false);
      setIsAnalysisDone(true); // 분석 완료 모달 열기
      setAnalysisResult(res.data); // 분석 결과 저장

      // PDF 업로드 했을 때만 "분석 완료" 모달 열기
      if (pdfFile) {
        setIsAnalysisDone(true);
        setAnalysisResult(res.data);
      } else {
        // 텍스트만 보냈으면 바로 다음 단계로 넘김
        if (onConfirm) onConfirm(res.data);
      }
      // 이후 질문 생성 or 처리
    } catch (err) {
      setIsLoading(false);
      console.error("업로드 실패", err.message);
    }
  };
  return (
    <div className="personal-modal-overlay">
      {isLoading && (
        <LoadingModal message="PDF 분석 중입니다. 잠시만 기다려주세요..." />
      )}
      {isAnalysisDone && (
        <div className="modal-bg">
          <div className="modal-box">
            <div style={{ fontSize: 22, fontWeight: 500, marginBottom: 24 }}>
              PDF 분석이 완료되었습니다!
            </div>
            <button
              className="modal-btn"
              onClick={() => {
                setIsAnalysisDone(false);
                if (onConfirm) onConfirm(analysisResult);
              }}
            >
              완료
            </button>
          </div>
        </div>
      )}
      <div className="personal-modal-content">
        <div className="personal-modal-title">맞춤형 질문 업로드</div>
        <div className="personal-modal-desc">
          지원하고 싶은 직무나 회사에 맞는 <b>Job Description</b>을 입력하고,
          <br />
          관련 PDF(이력서/경험/포트폴리오 등)를 첨부해 주세요.
          <br />
          (둘 중 하나만 입력해도 됩니다)
        </div>

        {/* Job Description 입력창 */}
        <div className="personal-form-group">
          <label className="personal-label" htmlFor="job-desc-input">
            Job Description
          </label>
          <textarea
            id="job-desc-input"
            className="personal-textarea"
            rows={5}
            placeholder="지원하는 직무/역할 설명, 주요 요구사항 등
            예)           
  직무유형
  • 정규직 (수습기간 3개월)
  주요업무
  • 사내 프론트엔드 신규개발 및 유지보수(React)를 담당합니다.
  • React, TypeScript 등 다양한 웹 기술을 이용해 신규 어플리케이션을 개발합니다.
  자격요건
  • React 개발 실무 경력 3년 이상 또는 그에 준하는 역량을 보유하신 분을 찾습니다.
  • HTML, CSS, JavaScript, Next.js, Zustand, TypeScript에 대한 이해가 있으신 분을 찾습니다.
  • HTTP 통신에 대해 기본적인 이해가 있으신 분을 찾습니다.
  • Git 등 협업 툴 사용 경험이 있으신 분을 찾습니다.
  • 단순히 주어진 개발만 하기보다는 주도적인 커뮤니케이션 능력과 빠른 실행력을 갖추신 분을 찾습니다.
"
            value={jobDesc}
            onChange={(e) => setJobDesc(e.target.value)}
          />
        </div>

        {/* PDF 파일 첨부 */}
        <div className="personal-form-group">
          <label className="personal-label" htmlFor="pdf-upload-input">
            PDF 파일 첨부(포트폴리오 PDF파일을 첨부해주세요)
          </label>
          <input
            id="pdf-upload-input"
            className="personal-input"
            type="file"
            accept="application/pdf"
            style={{ display: "none" }}
            ref={fileInputRef}
            onChange={handleFileChange}
          />
          <div className="personal-file-upload-row">
            <button
              className="personal-upload-btn"
              type="button"
              onClick={() =>
                fileInputRef.current && fileInputRef.current.click()
              }
            >
              PDF 업로드
            </button>
            <span className="personal-file-name">
              {pdfFile ? pdfFile.name : "선택된 파일 없음"}
            </span>
          </div>
        </div>

        {/* 액션버튼 */}
        <div className="personal-modal-actions">
          <button className="personal-cancel-btn" onClick={onClose}>
            취소
          </button>
          <button
            className="personal-confirm-btn"
            onClick={() => handleConfirm({ jobDesc, pdfFile })}
          >
            질문 생성
          </button>
        </div>
      </div>
    </div>
  );
}
