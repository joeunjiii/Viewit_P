import { UploadCloud } from "lucide-react";
import "../css/UploadingLoading.css";
function UploadingLoading() {
  return (
    <div className="uploading-loading-wrap">
      <UploadCloud className="uploading-icon" />
      <div className="loading-message">
        면접 종료 중입니다.
      </div>
    </div>
  );
}
export default UploadingLoading;