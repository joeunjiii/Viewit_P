import axios from "axios"; // 또는 axios 직접 import해서 써도 됨

/**
 * JD 텍스트와 PDF를 업로드하는 API 요청
 * @param {string} jobDesc - JD 텍스트
 * @param {File|null} pdfFile - 업로드할 PDF 파일
 * @returns {Promise<object>} 서버 응답
 */
export function uploadJDAndPDF(jobDesc, pdfFile) {
  // 1. 파일 크기 체크 (예: 10MB 제한)
  const maxFileSize = 10 * 1024 * 1024; // 10MB
  if (pdfFile && pdfFile.size > maxFileSize) {
    throw new Error(`파일 크기가 너무 큽니다. 최대 ${maxFileSize / 1024 / 1024}MB까지 업로드 가능합니다.`);
  }

  // 2. JD 텍스트 길이 체크 (예: 50KB 제한)
  const maxTextSize = 50 * 1024; // 50KB
  if (jobDesc && new Blob([jobDesc]).size > maxTextSize) {
    throw new Error(`텍스트가 너무 깁니다. 최대 ${maxTextSize / 1024}KB까지 입력 가능합니다.`);
  }

  const formData = new FormData();
  formData.append("jd_text", jobDesc || "");
  if (pdfFile) {
    formData.append("file", pdfFile);
  }
  return axios.post("/api/jd/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    // 3. 타임아웃 설정 (큰 파일 업로드 시간 고려)
    timeout: 300000, // 5분
    // 4. maxContentLength 설정 (클라이언트 측 제한)
    maxContentLength: 50 * 1024 * 1024, // 50MB
    maxBodyLength: 50 * 1024 * 1024, // 50MB
  });
}
