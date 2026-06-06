import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";

import approvePage from "../../services/page/approvePageService";
import updatePageVersion from "../../services/page/updatePageVersionService";

import RequirePermission from "../../components/security/RequirePermission";
import UploadPagesDropzone from "../../components/page/UploadPagesDropzone/UploadPagesDropzone";
import PageGallery from "../../components/page/PageGallery/PageGallery";
import { useToast } from "../../contexts/ToastContext";
import Loading from "../../common/Loading/Loading";

export default function PageManagementPage() {
  const { chapterId } = useParams();
  const toast = useToast();

  const [pages, setPages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchPages = async () => {
    setIsLoading(true);
    // Tạm mock data với ĐÚNG 4 TRẠNG THÁI CỦA BẠN
    setPages([
      { _id: "p1", page_number: 1, status: "Draft", image_url: "" },
      { _id: "p2", page_number: 2, status: "In Progress", image_url: "" },
      { _id: "p3", page_number: 3, status: "Ready For Review", image_url: "" },
      { _id: "p4", page_number: 4, status: "Approved", image_url: "" },
    ]);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchPages();
  }, [chapterId]);

  const handleUploadSuccess = () => fetchPages();

  const handleStatusChange = async (pageId, newStatus) => {
    setIsLoading(true);
    const result = await approvePage(pageId, newStatus);
    setIsLoading(false);

    if (result.success === false) {
      toast.error(`Chuyển sang ${newStatus} thất bại: ` + result.message);
    } else {
      toast.success(`Đã cập nhật trạng thái thành: ${newStatus}`);
      fetchPages();
    }
  };

  const handleUpdateVersion = async (pageId, file) => {
    setIsLoading(true);
    const result = await updatePageVersion(pageId, file);
    setIsLoading(false);

    if (result.success === false) {
      toast.error("Cập nhật thất bại: " + result.message);
    } else {
      toast.success("Đã tải lên phiên bản mới!");
      fetchPages();
    }
  };

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      {isLoading && <Loading text="Đang xử lý..." />}

      <header style={{ marginBottom: "24px" }}>
        <Link
          to={`/series/1/chapters`}
          style={{
            textDecoration: "none",
            color: "#64748b",
            display: "inline-block",
          }}
        >
          ← Quay lại danh sách Chapter
        </Link>
        <h1 style={{ margin: 0, fontSize: "24px" }}>Quản lý Bản thảo</h1>
      </header>

      <RequirePermission required="CAN_UPLOAD_PAGE">
        <UploadPagesDropzone
          chapterId={chapterId}
          onUploadSuccess={handleUploadSuccess}
        />
      </RequirePermission>

      <div
        style={{
          background: "white",
          padding: "20px",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
        }}
      >
        <PageGallery
          pages={pages}
          onChangeStatus={handleStatusChange}
          onUpdateVersion={handleUpdateVersion}
        />
      </div>
    </div>
  );
}
