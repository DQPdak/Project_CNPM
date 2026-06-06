import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import RequirePermission from "../../components/security/RequirePermission";
import PublishScanner from "../../components/publish/PublishScanner/PublishScanner";
import publishChapter from "../../services/publish/publishChapterService";
import { useToast } from "../../contexts/ToastContext";

import "./PublishApprovalPage.css";

const MOCK_SCENARIO = "FAIL_TASKS"; // Các giá trị: 'SUCCESS', 'FAIL_PAGES', 'FAIL_APPROVE', 'FAIL_TASKS', 'FAIL_ANNOTATIONS'

const mockPublishChapterAPI = async () => {
  await new Promise((resolve) => setTimeout(resolve, 500)); // Giả lập mạng chậm 0.5s
  switch (MOCK_SCENARIO) {
    case "FAIL_PAGES":
      return { success: false, message: "Chapter chưa có trang nào" };
    case "FAIL_APPROVE":
      return {
        success: false,
        message: "Không thể xuất bản. Vẫn còn trang truyện chưa được phê duyệt",
      };
    case "FAIL_TASKS":
      return {
        success: false,
        message:
          "Không thể xuất bản. Vẫn còn task chưa hoàn thành trên các trang truyện",
      };
    case "FAIL_ANNOTATIONS":
      return {
        success: false,
        message: "Không thể xuất bản. Vẫn còn annotation chưa được giải quyết",
      };
    case "SUCCESS":
    default:
      return { success: true, message: "Xuất bản chapter thành công" };
  }
};
// =====================================================================

const SCAN_STEPS = [
  { id: "check_pages", label: "Kiểm tra số lượng trang truyện" },
  { id: "check_approve", label: "Kiểm tra trạng thái phê duyệt" },
  { id: "check_tasks", label: "Kiểm tra tiến độ công việc (Tasks)" },
  { id: "check_annotations", label: "Kiểm tra ghi chú (Annotations)" },
];

export default function PublishApprovalPage() {
  const { chapterId } = useParams();
  const toast = useToast();

  const [scanStatus, setScanStatus] = useState("idle");
  const [currentStep, setCurrentStep] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");

  const handleStartPublish = async () => {
    setScanStatus("scanning");
    setCurrentStep(0);
    setErrorMessage("");

    // const result = await publishChapter(chapterId);
    const result = await mockPublishChapterAPI();

    let failAtStep = -1;
    if (!result.success) {
      const msg = result.message.toLowerCase();
      if (msg.includes("chưa có trang")) failAtStep = 0;
      else if (msg.includes("chưa được phê duyệt")) failAtStep = 1;
      else if (msg.includes("task")) failAtStep = 2;
      else if (msg.includes("annotation")) failAtStep = 3;
      else failAtStep = 0;
    }

    for (let i = 0; i < SCAN_STEPS.length; i++) {
      setCurrentStep(i);

      await new Promise((resolve) => setTimeout(resolve, 800));

      if (i === failAtStep) {
        setScanStatus("failed");
        setErrorMessage(result.message);
        toast.error("Xuất bản thất bại! Vui lòng kiểm tra lại điều kiện.");
        return;
      }
    }

    setScanStatus("success");
    toast.success("Tuyệt vời! Chapter đã được xuất bản thành công!");
  };

  return (
    <div className="publish-page-container">
      <header className="publish-page-header">
        <Link to={`/series/1/chapters`} className="publish-back-link">
          ← Quay lại danh sách Chapter
        </Link>
        <h1 className="publish-title">Trạm Xuất Bản Chapter</h1>
        <p className="publish-subtitle">Chapter ID: {chapterId}</p>
      </header>

      {/* Máy quét */}
      <PublishScanner
        steps={SCAN_STEPS}
        currentStep={currentStep}
        scanStatus={scanStatus}
        errorMessage={errorMessage}
      />

      {/* Khu vực Nút bấm */}
      <div className="publish-action-area">
        <RequirePermission required="CAN_PUBLISH_CHAPTER">
          <button
            onClick={handleStartPublish}
            disabled={scanStatus === "scanning" || scanStatus === "success"}
            /* Thêm class động dựa vào trạng thái scanStatus */
            className={`btn-massive-publish state-${scanStatus}`}
          >
            {scanStatus === "scanning"
              ? "ĐANG XỬ LÝ HỆ THỐNG..."
              : scanStatus === "success"
                ? "ĐÃ XUẤT BẢN"
                : scanStatus === "failed"
                  ? "QUÉT LẠI HỆ THỐNG"
                  : "KHỞI ĐỘNG KIỂM TRA & XUẤT BẢN"}
          </button>
        </RequirePermission>
        <p className="publish-warning-note">
          Hành động này sẽ công khai Chapter đến toàn bộ độc giả.
        </p>
      </div>
    </div>
  );
}
