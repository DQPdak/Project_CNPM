import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import createSeries from "../../services/series/createSeriesService";
import getSeriesById from "../../services/series/getSeriesByIdService";
import upsertProposal from "../../services/series/upsertProposalService";
import submitProposal from "../../services/series/submitProposalService";
import uploadCover from "../../services/series/uploadCoverService";
import Loading from "../../common/Loading/Loading";
import { useToast } from "../../contexts/ToastContext";
import "./MangakaSeriesFormPage.css"; // Đã import file CSS mới

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
    toast.success("Đã nộp thành công!");
  };

  if (isLoading) {
    return <Loading text="Đang tải dữ liệu series..." />;
  }

  return (
    <div className="mangaka-form-wrapper">
      <Link to="/mangaka/series" className="back-link">
        Quay lại danh sách
      </Link>

      <h1 className="page-title">
        {isEdit ? "Chi tiết series" : "Tạo series mới"}
      </h1>

      {isEdit && (
        <p className="status-text">
          Trạng thái proposal:{" "}
          <span className="status-badge">{proposalStatus}</span>
        </p>
      )}

      <form onSubmit={handleSave} className="neo-form">
        <div className="form-group">
          <label className="neo-label">Tên series *</label>
          <input
            className="neo-input"
            value={form.title}
            onChange={handleChange("title")}
            required
            disabled={isEdit}
          />
        </div>

        <div className="form-group">
          <label className="neo-label">Mô tả ngắn</label>
          <textarea
            className="neo-input textarea-short"
            value={form.description}
            onChange={handleChange("description")}
            disabled={isEdit}
          />
        </div>

        <div className="grid-2-cols">
          <div className="form-group">
            <label className="neo-label">Thể loại</label>
            <input
              className="neo-input"
              value={form.genre}
              onChange={handleChange("genre")}
              disabled={isEdit}
            />
          </div>
          <div className="form-group">
            <label className="neo-label">Độc giả mục tiêu</label>
            <input
              className="neo-input"
              value={form.target_audience}
              onChange={handleChange("target_audience")}
              disabled={isEdit}
            />
          </div>
        </div>

        {isEdit && (
          <>
            <div className="form-group">
              <label className="neo-label">Tóm tắt truyện *</label>
              <textarea
                className="neo-input textarea-tall"
                value={form.summary}
                onChange={handleChange("summary")}
                required
                disabled={!canEdit}
              />
            </div>

            <div className="form-group">
              <label className="neo-label">Nhân vật</label>
              <textarea
                className="neo-input textarea-short"
                value={form.characters}
                onChange={handleChange("characters")}
                disabled={!canEdit}
              />
            </div>

            <div className="form-group">
              <label className="neo-label">Phong cách hình ảnh</label>
              <input
                className="neo-input"
                value={form.art_style}
                onChange={handleChange("art_style")}
                disabled={!canEdit}
              />
            </div>

            {canEdit && (
              <div className="form-group">
                <label className="neo-label">Ảnh bìa / Concept art</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUploadCover}
                  className="neo-file-input"
                />
                {coverImage && (
                  <img
                    src={coverImage}
                    alt="Cover"
                    className="cover-image-preview"
                  />
                )}
              </div>
            )}
          </>
        )}

        {!isEdit && (
          <div className="form-group">
            <label className="neo-label">Tóm tắt truyện</label>
            <textarea
              className="neo-input textarea-tall"
              value={form.summary}
              onChange={handleChange("summary")}
            />
          </div>
        )}

        <div className="form-actions">
          <button
            type="submit"
            disabled={isSaving || (isEdit && !canEdit)}
            className="btn-primary"
          >
            {isSaving ? "Đang lưu..." : isEdit ? "Lưu proposal" : "Tạo series"}
          </button>

          {isEdit && canEdit && (
            <button
              type="button"
              onClick={handleSubmit}
              className="btn-success"
            >
              Nộp xin duyệt
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
