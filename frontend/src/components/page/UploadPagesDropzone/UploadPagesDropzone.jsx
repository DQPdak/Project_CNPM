import React, { useState } from "react";
import uploadPages from "../../../services/page/uploadPagesService";
import { useToast } from "../../../contexts/ToastContext";
import Loading from "../../../common/Loading/Loading";
import "./UploadPagesDropzone.css";

export default function UploadPagesDropzone({ chapterId, onUploadSuccess }) {
  const toast = useToast();
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (files.length > 50) {
      toast.error("Vượt quá giới hạn. Vui lòng chỉ chọn tối đa 50 file.");
      return;
    }
    setIsUploading(true);
    try {
      const result = await uploadPages(chapterId, files);
      if (result.success) {
        toast.success(`Đã tải lên thành công ${files.length} trang.`);
        e.target.value = null;
        onUploadSuccess();
      } else {
        toast.error("Lỗi tải ảnh: " + result.message);
      }
    } catch (error) {
      toast.error(error.message || "Không thể tải bản thảo lên server.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="upload-zone-wrapper">
      {isUploading && <Loading text="Đang tải bản thảo lên server..." />}
      <div className="zone-label">Khu vực tác giả</div>
      <label className="upload-dropzone">
        <div className="upload-content">
          <span className="upload-text">
            Nhấn vào đây để <b>TẢI LÊN BẢN THẢO</b>
          </span>
          <span className="upload-subtext">
            Cho phép chọn nhiều ảnh, tối đa 50 file
          </span>
        </div>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileChange}
          disabled={isUploading}
          className="hidden-input"
        />
      </label>
    </div>
  );
}
