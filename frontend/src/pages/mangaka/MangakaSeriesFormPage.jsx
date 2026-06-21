import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import createSeries from "../../services/series/createSeriesService";
import getSeriesById from "../../services/series/getSeriesByIdService";
import upsertProposal from "../../services/series/upsertProposalService";
import submitProposal from "../../services/series/submitProposalService";
import uploadCover from "../../services/series/uploadCoverService";
import Loading from "../../common/Loading/Loading";
import { useToast } from "../../contexts/ToastContext";

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: "8px",
  border: "1px solid #cbd5e1",
  fontSize: "0.95rem",
  boxSizing: "border-box",
};

const labelStyle = {
  display: "block",
  marginBottom: "6px",
  fontWeight: 600,
  fontSize: "0.9rem",
};

const editableStatuses = ["Draft", "Need Revision"];

export default function MangakaSeriesFormPage() {
  const { seriesId } = useParams();
  const isEdit = Boolean(seriesId);
  const navigate = useNavigate();
  const toast = useToast();

  const [isLoading, setIsLoading] = useState(isEdit);
  const [isSaving, setIsSaving] = useState(false);
  const [proposalStatus, setProposalStatus] = useState("Draft");
  const [coverImage, setCoverImage] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    genre: "",
    target_audience: "",
    summary: "",
    characters: "",
    art_style: "",
  });

  const loadSeries = useCallback(async () => {
    if (!isEdit) return;
    setIsLoading(true);
    const result = await getSeriesById(seriesId);
    if (result.success === false) {
      toast.error(result.message);
      setIsLoading(false);
      return;
    }

    const { series, proposal } = result;
    setForm({
      title: series.title || "",
      description: series.description || "",
      genre: series.genre || "",
      target_audience: series.target_audience || "",
      summary: proposal?.summary || "",
      characters: proposal?.characters || "",
      art_style: proposal?.art_style || "",
    });
    setProposalStatus(proposal?.status || "Draft");
    setCoverImage(proposal?.cover_image || "");
    setIsLoading(false);
  }, [isEdit, seriesId, toast]);

  useEffect(() => {
    loadSeries();
  }, [loadSeries]);

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const canEdit = !isEdit || editableStatuses.includes(proposalStatus);

  const handleSave = async (event) => {
    event.preventDefault();
    if (!canEdit && isEdit) {
      toast.error("Không thể sửa khi proposal đang chờ duyệt.");
      return;
    }

    setIsSaving(true);

    if (!isEdit) {
      const result = await createSeries(form);
      if (result.success === false) {
        toast.error(result.message);
        setIsSaving(false);
        return;
      }
      toast.success("Tạo series thành công!");
      navigate(`/mangaka/series/${result.series._id}`);
      setIsSaving(false);
      return;
    }

    const proposalResult = await upsertProposal(seriesId, {
      summary: form.summary,
      characters: form.characters,
      art_style: form.art_style,
    });

    if (proposalResult.success === false) {
      toast.error(proposalResult.message);
      setIsSaving(false);
      return;
    }

    toast.success("Lưu proposal thành công!");
    setProposalStatus(proposalResult.proposal?.status || proposalStatus);
    setIsSaving(false);
  };

  const handleUploadCover = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !seriesId) return;

    const result = await uploadCover(seriesId, file);
    if (result.success === false) {
      toast.error(result.message);
      return;
    }

    setCoverImage(result.cover_image || result.proposal?.cover_image || "");
    toast.success("Upload ảnh bìa thành công!");
  };

  const handleSubmit = async () => {
    if (!seriesId) return;
    const result = await submitProposal(seriesId);
    if (result.success === false) {
      toast.error(result.message);
      return;
    }
    setProposalStatus(result.proposal?.status || "Submitted");
    toast.success("Đã nộp hồ sơ lên hội đồng!");
  };

  if (isLoading) {
    return <Loading text="Đang tải hồ sơ series..." />;
  }

  return (
    <div style={{ maxWidth: "720px" }}>
      <Link
        to="/mangaka/series"
        style={{ color: "#0ea5e9", textDecoration: "none", fontSize: "0.9rem" }}
      >
        ← Quay lại danh sách
      </Link>

      <h1 style={{ margin: "16px 0 8px", fontSize: "1.75rem" }}>
        {isEdit ? "Chi tiết series" : "Tạo series mới"}
      </h1>

      {isEdit && (
        <p style={{ color: "#64748b", marginBottom: "20px" }}>
          Trạng thái proposal: <strong>{proposalStatus}</strong>
        </p>
      )}

      <form
        onSubmit={handleSave}
        style={{
          background: "#fff",
          padding: "24px",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          display: "grid",
          gap: "16px",
        }}
      >
        <div>
          <label style={labelStyle}>Tên series *</label>
          <input
            style={inputStyle}
            value={form.title}
            onChange={handleChange("title")}
            required
            disabled={isEdit}
          />
        </div>

        <div>
          <label style={labelStyle}>Mô tả</label>
          <textarea
            style={{ ...inputStyle, minHeight: "80px" }}
            value={form.description}
            onChange={handleChange("description")}
            disabled={isEdit}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div>
            <label style={labelStyle}>Thể loại</label>
            <input
              style={inputStyle}
              value={form.genre}
              onChange={handleChange("genre")}
              disabled={isEdit}
            />
          </div>
          <div>
            <label style={labelStyle}>Đối tượng độc giả</label>
            <input
              style={inputStyle}
              value={form.target_audience}
              onChange={handleChange("target_audience")}
              disabled={isEdit}
            />
          </div>
        </div>

        {isEdit && (
          <>
            <div>
              <label style={labelStyle}>Tóm tắt truyện *</label>
              <textarea
                style={{ ...inputStyle, minHeight: "100px" }}
                value={form.summary}
                onChange={handleChange("summary")}
                required
                disabled={!canEdit}
              />
            </div>

            <div>
              <label style={labelStyle}>Nhân vật</label>
              <textarea
                style={{ ...inputStyle, minHeight: "80px" }}
                value={form.characters}
                onChange={handleChange("characters")}
                disabled={!canEdit}
              />
            </div>

            <div>
              <label style={labelStyle}>Phong cách hình ảnh</label>
              <input
                style={inputStyle}
                value={form.art_style}
                onChange={handleChange("art_style")}
                disabled={!canEdit}
              />
            </div>

            {canEdit && (
              <div>
                <label style={labelStyle}>Ảnh bìa / concept art</label>
                <input type="file" accept="image/*" onChange={handleUploadCover} />
                {coverImage && (
                  <img
                    src={coverImage}
                    alt="Cover"
                    style={{
                      marginTop: "12px",
                      maxWidth: "200px",
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                    }}
                  />
                )}
              </div>
            )}
          </>
        )}

        {!isEdit && (
          <div>
            <label style={labelStyle}>Tóm tắt truyện</label>
            <textarea
              style={{ ...inputStyle, minHeight: "100px" }}
              value={form.summary}
              onChange={handleChange("summary")}
            />
          </div>
        )}

        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <button
            type="submit"
            disabled={isSaving || (isEdit && !canEdit)}
            style={{
              padding: "10px 20px",
              background: "#0ea5e9",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {isSaving ? "Đang lưu..." : isEdit ? "Lưu proposal" : "Tạo series"}
          </button>

          {isEdit && canEdit && (
            <button
              type="button"
              onClick={handleSubmit}
              style={{
                padding: "10px 20px",
                background: "#16a34a",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Nộp hồ sơ xét duyệt
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
