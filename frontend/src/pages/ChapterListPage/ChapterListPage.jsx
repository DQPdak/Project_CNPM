import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

// Import API & UI Components
import getChaptersBySeries from "../../services/chapter/getChaptersBySeriesService";
import RequirePermission from "../../components/security/RequirePermission";
import CreateChapterAction from "../../components/chapter/CreateChapterAction/CreateChapterAction";
import ChapterTable from "../../components/chapter/ChapterTable/ChapterTable";

import { useToast } from "../../contexts/ToastContext";
import Loading from "../../common/Loading/Loading";

export default function ChapterListPage() {
  const { seriesId } = useParams();
  const toast = useToast();
  const [chapters, setChapters] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    // Thay vì gọi fetchChaptersList, ta ép nó dùng dữ liệu giả
    const mockData = [
      {
        _id: "1",
        chapter_number: 1,
        title: "Chương 1: Sự khởi đầu",
        status: "Published",
      },
      {
        _id: "2",
        chapter_number: 2,
        title: "Chương 2: Bí mật của Mangaka",
        status: "Draft",
      },
      {
        _id: "3",
        chapter_number: 3,
        title: "Chương 3: Rắc rối mới",
        status: "Approved",
      },
    ];
    setChapters(mockData);
    setIsLoading(false);
  }, [seriesId]);

  const fetchChaptersList = async () => {
    setIsLoading(true);
    const result = await getChaptersBySeries(seriesId);

    if (result.success) {
      setChapters(result.data);
    } else {
      toast.error("Không thể tải danh sách: " + result.message); // Thay bằng Toast
    }

    setIsLoading(false);
  };

  useEffect(() => {
    fetchChaptersList();
  }, [seriesId]);

  return (
    <div style={{ padding: "0 20px" }}>
      {/* Hiển thị vòng xoay phủ toàn màn hình lúc mới vào trang */}
      {isLoading && <Loading text="Đang tải danh sách Chapter..." />}

      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: "24px" }}>Quản lý Chapter</h1>
          <p style={{ margin: 0, color: "#64748b" }}>Series ID: {seriesId}</p>
        </div>

        <RequirePermission required="CAN_CREATE_CHAPTER">
          <CreateChapterAction
            seriesId={seriesId}
            currentCount={chapters.length}
            onCreatedSuccess={fetchChaptersList}
          />
        </RequirePermission>
      </header>

      {/* Chỉ render bảng khi không loading để tránh giật hình */}
      {!isLoading && <ChapterTable chapters={chapters} />}
    </div>
  );
}
