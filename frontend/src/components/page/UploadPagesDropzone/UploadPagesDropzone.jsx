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
      toast.error("Vuot qua gioi han. Vui long chi chon toi da 50 file.");
      return;
    }

    setIsUploading(true);

    try {
      const result = await uploadPages(chapterId, files);
      if (result.success) {
        toast.success(`Da tai len thanh cong ${files.length} trang.`);
        e.target.value = null;
        onUploadSuccess();
      } else {
        toast.error("Loi tai anh: " + result.message);
      }
    } catch (error) {
      toast.error(error.message || "Khong the tai ban thao len server.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="upload-zone-wrapper">
      {isUploading && <Loading text="Dang tai ban thao len server..." />}
      <div className="zone-label">Khu vuc tac gia</div>
      <label className="upload-dropzone">
        <div className="upload-content">
          <span className="upload-text">
            Nhan vao day de <b>tai len ban thao</b>
          </span>
          <span className="upload-subtext">
            Cho phep chon nhieu anh, toi da 50 file
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
