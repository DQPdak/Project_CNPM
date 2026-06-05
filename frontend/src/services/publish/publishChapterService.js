const API_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const publishChapter = async (chapterId, releaseIssueId = null) => {
  try {
    const payload = releaseIssueId ? { release_issue_id: releaseIssueId } : {};

    const res = await fetch(`${API_URL}/publish/chapter/${chapterId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        status: res.status,
        message: data.message || "Không đủ điều kiện xuất bản",
        unapprovedPages_count: data.unapprovedPages_count || 0,
      };
    }
    return data;
  } catch (err) {
    return { success: false, message: "Lỗi server", error: err };
  }
};

export default publishChapter;
