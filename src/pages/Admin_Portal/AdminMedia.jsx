import { useCallback, useEffect, useRef, useState } from "react";
import { useCognitoAuth } from "../../auth/useCognitoAuth";
import {
  createAdminMedia,
  deleteAdminMedia,
  getAdminMedia,
  publishAdminMedia,
  reorderAdminMedia,
  restoreAdminMedia,
  unpublishAdminMedia,
  updateAdminMedia,
  uploadMediaCover,
  validateVideoUrl,
} from "../../services/api";
import "./AdminMedia.css";

const EMPTY_ITEM = {
  kind: "tour",
  title: "",
  summary: "",
  description: "",
  category: "Campus",
  chapter_order: 1,
  sort_order: 1,
  start_at: "",
  end_at: "",
  location: "",
  video_url: "",
  video_provider: "youtube",
  video_id: "",
  cover_image: "",
  poster_url: "",
  duration_seconds: "",
  link_url: "",
  link_label: "",
  status: "draft",
  featured: false,
  demo: false,
  source_credit: "",
  has_students: false,
  consent_confirmed: false,
};

function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return "";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatISTDate(isoString) {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(d);
  } catch {
    return isoString;
  }
}

function toLocalDatetimeInput(isoString) {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "";
    const pad = (n) => n.toString().padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return "";
  }
}

export default function AdminMedia({ setNotice }) {
  const { session } = useCognitoAuth();
  const token = session?.accessToken;

  const [activeTab, setActiveTab] = useState("tour"); // 'tour' | 'event'
  const [viewDeleted, setViewDeleted] = useState(false);
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({
    total_active: 0,
    published_count: 0,
    draft_count: 0,
    archived_count: 0,
    deleted_count: 0,
    tour_count: 0,
    event_count: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  // Editor Modal State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorItem, setEditorItem] = useState(EMPTY_ITEM);
  const [isNew, setIsNew] = useState(true);
  const [formDirty, setFormDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Video validation state
  const [validatingVideo, setValidatingVideo] = useState(false);
  const [videoValidation, setVideoValidation] = useState(null);
  const [videoError, setVideoError] = useState("");

  // Cover image upload state
  const [uploadingCover, setUploadingCover] = useState(false);
  const [coverError, setCoverError] = useState("");

  // Undo Toast State
  const [undoToast, setUndoToast] = useState(null);
  const undoTimerRef = useRef(null);

  // Live Preview Modal State
  const [previewItem, setPreviewItem] = useState(null);
  const [previewViewport, setPreviewViewport] = useState("desktop"); // 'desktop' | 'mobile'

  // Delete Confirmation State
  const [itemToDelete, setItemToDelete] = useState(null);

  // Fetch Items
  const loadMedia = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const data = await getAdminMedia(token, {
        kind: viewDeleted ? undefined : activeTab,
        status: statusFilter || undefined,
        category: categoryFilter || undefined,
        search: search || undefined,
        include_deleted: viewDeleted,
      });
      setItems(Array.isArray(data.items) ? data.items : []);
      if (data.stats) setStats(data.stats);
    } catch (err) {
      setError(err.message || "Failed to load media items.");
    } finally {
      setLoading(false);
    }
  }, [token, activeTab, viewDeleted, statusFilter, categoryFilter, search]);

  useEffect(() => {
    void loadMedia();
  }, [loadMedia]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    };
  }, []);

  // Open Add Dialog
  const handleOpenAdd = () => {
    const nextOrder = items.length + 1;
    setEditorItem({
      ...EMPTY_ITEM,
      kind: activeTab,
      category: activeTab === "tour" ? "Campus" : "Academics",
      chapter_order: nextOrder,
      sort_order: nextOrder,
    });
    setIsNew(true);
    setFormDirty(false);
    setFormError("");
    setVideoValidation(null);
    setVideoError("");
    setCoverError("");
    setIsEditorOpen(true);
  };

  // Open Edit Dialog
  const handleOpenEdit = (item) => {
    setEditorItem({
      ...item,
      duration_seconds: item.duration_seconds ?? "",
      start_at: item.start_at ? toLocalDatetimeInput(item.start_at) : "",
      end_at: item.end_at ? toLocalDatetimeInput(item.end_at) : "",
      link_url: item.link_url || "",
      link_label: item.link_label || "",
      summary: item.summary || "",
      description: item.description || "",
      location: item.location || "",
      source_credit: item.source_credit || "",
      cover_image: item.cover_image || "",
      poster_url: item.poster_url || "",
      demo: Boolean(item.demo),
      featured: Boolean(item.featured),
      has_students: Boolean(item.has_students),
      consent_confirmed: Boolean(item.consent_confirmed),
    });
    setIsNew(false);
    setFormDirty(false);
    setFormError("");
    setVideoValidation(
      item.video_url
        ? {
            provider: item.video_provider,
            video_id: item.video_id,
            title: item.title,
            thumbnail_url: item.poster_url,
          }
        : null
    );
    setVideoError("");
    setCoverError("");
    setIsEditorOpen(true);
  };

  // Close Editor with dirty check
  const handleCloseEditor = () => {
    if (formDirty) {
      if (!window.confirm("You have unsaved changes. Discard them?")) {
        return;
      }
    }
    setIsEditorOpen(false);
  };

  // Validate Video URL
  const handleValidateVideo = async (urlToValidate) => {
    const url = urlToValidate ?? editorItem.video_url;
    if (!url || !url.trim()) {
      setVideoError("Please enter a valid YouTube or Vimeo link.");
      return;
    }
    setValidatingVideo(true);
    setVideoError("");
    try {
      const result = await validateVideoUrl(token, url.trim());
      setVideoValidation(result);
      setEditorItem((prev) => ({
        ...prev,
        video_url: url.trim(),
        video_provider: result.provider,
        video_id: result.video_id,
        poster_url: prev.poster_url || result.thumbnail_url || "",
        // Autofill title if empty
        title: prev.title.trim() ? prev.title : result.title || prev.title,
        source_credit: prev.source_credit || result.author_name || "",
      }));
      setFormDirty(true);
    } catch (err) {
      setVideoError(err.message || "Could not validate video URL.");
      setVideoValidation(null);
    } finally {
      setValidatingVideo(false);
    }
  };

  // Handle Cover File Upload
  const handleCoverUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    setCoverError("");
    try {
      const result = await uploadMediaCover(token, file);
      setEditorItem((prev) => ({
        ...prev,
        cover_image: result.path,
        poster_url: result.path,
      }));
      setFormDirty(true);
      if (setNotice) setNotice("Cover image uploaded and converted to WebP.");
    } catch (err) {
      setCoverError(err.message || "Failed to upload cover image.");
    } finally {
      setUploadingCover(false);
    }
  };

  // Save Item (Create or Update)
  const handleSaveItem = async (e) => {
    e.preventDefault();
    if (!token) return;

    // Consent check if publishing with students
    if (
      editorItem.status === "published" &&
      editorItem.has_students &&
      !editorItem.consent_confirmed
    ) {
      setFormError("Parental/guardian consent confirmation is required before publishing when students appear.");
      return;
    }

    if (!editorItem.title || editorItem.title.trim().length < 3) {
      setFormError("Title must be at least 3 characters.");
      return;
    }

    setSaving(true);
    setFormError("");

    const payload = {
      kind: editorItem.kind,
      title: editorItem.title.trim(),
      summary: editorItem.summary?.trim() || null,
      description: editorItem.description?.trim() || null,
      category: editorItem.category || "General",
      chapter_order: Number(editorItem.chapter_order) || 1,
      sort_order: Number(editorItem.sort_order) || 1,
      start_at: editorItem.start_at ? new Date(editorItem.start_at).toISOString() : null,
      end_at: editorItem.end_at ? new Date(editorItem.end_at).toISOString() : null,
      location: editorItem.location?.trim() || null,
      video_url: editorItem.video_url?.trim() || null,
      cover_image: editorItem.cover_image?.trim() || null,
      poster_url: editorItem.poster_url?.trim() || null,
      duration_seconds: editorItem.duration_seconds ? Number(editorItem.duration_seconds) : null,
      link_url: editorItem.link_url?.trim() || null,
      link_label: editorItem.link_label?.trim() || null,
      status: editorItem.status,
      featured: Boolean(editorItem.featured),
      demo: Boolean(editorItem.demo),
      source_credit: editorItem.source_credit?.trim() || null,
      has_students: Boolean(editorItem.has_students),
      consent_confirmed: Boolean(editorItem.consent_confirmed),
    };

    try {
      if (isNew) {
        await createAdminMedia(token, payload);
        if (setNotice) setNotice(`Created "${payload.title}".`);
      } else {
        await updateAdminMedia(token, editorItem.id, payload);
        if (setNotice) setNotice(`Updated "${payload.title}".`);
      }
      setIsEditorOpen(false);
      setFormDirty(false);
      await loadMedia();
    } catch (err) {
      setFormError(err.message || "Failed to save item.");
    } finally {
      setSaving(false);
    }
  };

  // Publish / Unpublish Toggle
  const handleTogglePublish = async (item) => {
    if (!token) return;
    try {
      if (item.status === "published") {
        await unpublishAdminMedia(token, item.id);
        if (setNotice) setNotice(`Unpublished "${item.title}".`);
      } else {
        await publishAdminMedia(token, item.id);
        if (setNotice) setNotice(`Published "${item.title}".`);
      }
      await loadMedia();
    } catch (err) {
      setError(err.message || "Could not change status.");
    }
  };

  // Soft Delete with Undo Toast
  const handleDeleteConfirm = async () => {
    if (!itemToDelete || !token) return;
    const target = itemToDelete;
    setItemToDelete(null);
    try {
      await deleteAdminMedia(token, target.id);
      if (setNotice) setNotice(`Deleted "${target.title}".`);
      await loadMedia();

      // Show Undo Toast
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
      setUndoToast(target);
      undoTimerRef.current = setTimeout(() => {
        setUndoToast(null);
      }, 10000);
    } catch (err) {
      setError(err.message || "Failed to delete item.");
    }
  };

  // Restore Item
  const handleRestore = async (id, title) => {
    if (!token) return;
    try {
      await restoreAdminMedia(token, id);
      if (setNotice) setNotice(`Restored "${title || "item"}".`);
      setUndoToast(null);
      await loadMedia();
    } catch (err) {
      setError(err.message || "Failed to restore item.");
    }
  };

  // Reorder Item (Move Up / Down)
  const handleMoveOrder = async (index, direction) => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const newItems = [...items];
    const [moved] = newItems.splice(index, 1);
    newItems.splice(targetIndex, 0, moved);

    // Reassign sequential sort_order / chapter_order
    const reorderPayload = newItems.map((item, idx) => ({
      id: item.id,
      sort_order: idx + 1,
    }));

    setItems(newItems);
    try {
      await reorderAdminMedia(token, reorderPayload);
      if (setNotice) setNotice("Order updated.");
    } catch (err) {
      setError(err.message || "Failed to save new order.");
      await loadMedia();
    }
  };

  // Drag and Drop reordering state
  const dragItem = useRef();
  const dragOverItem = useRef();

  const handleDragStart = (e, position) => {
    dragItem.current = position;
  };

  const handleDragEnter = (e, position) => {
    dragOverItem.current = position;
  };

  const handleDragEnd = async () => {
    if (
      dragItem.current === undefined ||
      dragOverItem.current === undefined ||
      dragItem.current === dragOverItem.current
    ) {
      dragItem.current = undefined;
      dragOverItem.current = undefined;
      return;
    }

    const copy = [...items];
    const draggedItemContent = copy[dragItem.current];
    copy.splice(dragItem.current, 1);
    copy.splice(dragOverItem.current, 0, draggedItemContent);

    dragItem.current = undefined;
    dragOverItem.current = undefined;

    setItems(copy);
    const reorderPayload = copy.map((item, idx) => ({
      id: item.id,
      sort_order: idx + 1,
    }));

    try {
      await reorderAdminMedia(token, reorderPayload);
      if (setNotice) setNotice("Order saved.");
    } catch (err) {
      setError(err.message || "Could not reorder items.");
      await loadMedia();
    }
  };

  // Distinct categories in the loaded list
  const existingCategories = Array.from(
    new Set(items.map((i) => i.category).filter(Boolean))
  );

  return (
    <div className="admin-media-container">
      {/* Top Header & Tab Controls */}
      <div className="admin-media-header-bar">
        <div className="admin-media-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={!viewDeleted && activeTab === "tour"}
            className={`admin-media-tab-btn ${!viewDeleted && activeTab === "tour" ? "active" : ""}`}
            onClick={() => {
              setViewDeleted(false);
              setActiveTab("tour");
            }}
          >
            <span>▶</span> Virtual Tour
            <span className="badge">{stats.tour_count}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={!viewDeleted && activeTab === "event"}
            className={`admin-media-tab-btn ${!viewDeleted && activeTab === "event" ? "active" : ""}`}
            onClick={() => {
              setViewDeleted(false);
              setActiveTab("event");
            }}
          >
            <span>📅</span> Events &amp; Highlights
            <span className="badge">{stats.event_count}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={viewDeleted}
            className={`admin-media-tab-btn ${viewDeleted ? "active" : ""}`}
            onClick={() => setViewDeleted(true)}
          >
            <span>🗑</span> Recently Deleted
            <span className="badge">{stats.deleted_count}</span>
          </button>
        </div>

        <div className="admin-media-header-actions">
          <button
            type="button"
            className="admin-media-btn-secondary"
            onClick={() => void loadMedia()}
            disabled={loading}
            title="Refresh list"
          >
            ↻ Refresh
          </button>
          {!viewDeleted && (
            <button
              type="button"
              className="admin-media-btn-primary"
              onClick={handleOpenAdd}
            >
              + Add {activeTab === "tour" ? "Tour Chapter" : "Campus Event"}
            </button>
          )}
        </div>
      </div>

      {/* Undo Toast Banner */}
      {undoToast && (
        <div className="admin-media-undo-toast" role="status">
          <p>
            <strong>&ldquo;{undoToast.title}&rdquo;</strong> was moved to Recently Deleted.
          </p>
          <div className="actions">
            <button
              type="button"
              className="undo-btn"
              onClick={() => handleRestore(undoToast.id, undoToast.title)}
            >
              Undo
            </button>
            <button
              type="button"
              className="close-btn"
              aria-label="Dismiss toast"
              onClick={() => setUndoToast(null)}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Stats Summary Bar */}
      <div className="admin-media-stats-grid">
        <div className="admin-media-stat-card">
          <span>Active Total</span>
          <strong>{stats.total_active}</strong>
        </div>
        <div className="admin-media-stat-card">
          <span>Published</span>
          <strong style={{ color: "var(--media-green)" }}>{stats.published_count}</strong>
        </div>
        <div className="admin-media-stat-card">
          <span>Drafts</span>
          <strong style={{ color: "#d97706" }}>{stats.draft_count}</strong>
        </div>
        <div className="admin-media-stat-card">
          <span>Archived</span>
          <strong style={{ color: "#475569" }}>{stats.archived_count}</strong>
        </div>
        <div className="admin-media-stat-card">
          <span>In Trash</span>
          <strong style={{ color: "#dc2626" }}>{stats.deleted_count}</strong>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="admin-media-filter-bar">
        <input
          type="search"
          className="admin-media-search-input"
          placeholder="Search by title, summary, or location…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {!viewDeleted && (
          <>
            <select
              className="admin-media-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by status"
            >
              <option value="">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>

            <select
              className="admin-media-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              aria-label="Filter by category"
            >
              <option value="">All Categories</option>
              {existingCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </>
        )}
      </div>

      {error && <div className="admin-media-error-msg">{error}</div>}

      {/* Main Table View (Desktop) */}
      <div className="admin-media-table-container">
        <div className="admin-media-table-scroll">
          <table className="admin-media-table">
            <thead>
              <tr>
                <th style={{ width: "40px" }}>Order</th>
                <th style={{ width: "110px" }}>Media</th>
                <th>Title &amp; Summary</th>
                <th>Category</th>
                {activeTab === "event" && !viewDeleted && <th>Event Schedule &amp; Place</th>}
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan="7" className="admin-media-empty">
                    <p>Loading media items…</p>
                  </td>
                </tr>
              )}
              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan="7" className="admin-media-empty">
                    <p>No media items found matching criteria.</p>
                  </td>
                </tr>
              )}
              {!loading &&
                items.map((item, index) => (
                  <tr
                    key={item.id}
                    className={item.deleted_at ? "is-deleted" : ""}
                    draggable={!viewDeleted}
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragEnter={(e) => handleDragEnter(e, index)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => e.preventDefault()}
                  >
                    {/* Order Controls */}
                    <td>
                      {!viewDeleted ? (
                        <div className="admin-media-order-controls">
                          <button
                            type="button"
                            className="admin-media-reorder-btn"
                            disabled={index === 0}
                            onClick={() => handleMoveOrder(index, "up")}
                            title="Move up"
                            aria-label={`Move ${item.title} up`}
                          >
                            ▲
                          </button>
                          <span className="admin-media-order-badge">
                            {item.chapter_order || item.sort_order || index + 1}
                          </span>
                          <button
                            type="button"
                            className="admin-media-reorder-btn"
                            disabled={index === items.length - 1}
                            onClick={() => handleMoveOrder(index, "down")}
                            title="Move down"
                            aria-label={`Move ${item.title} down`}
                          >
                            ▼
                          </button>
                        </div>
                      ) : (
                        <span className="admin-media-order-badge">#{item.id}</span>
                      )}
                    </td>

                    {/* Thumbnail Cell */}
                    <td>
                      <div className="admin-media-thumb-cell">
                        <img
                          src={item.poster_url || "/assets/images/campus-placeholder.jpg"}
                          alt={item.title}
                          loading="lazy"
                        />
                        {item.video_provider && (
                          <span className="provider-icon">
                            {item.video_provider === "youtube" ? "▶ YT" : "▶ VM"}
                          </span>
                        )}
                        {item.duration_seconds > 0 && (
                          <span className="duration-chip">
                            {formatDuration(item.duration_seconds)}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Title & Summary */}
                    <td>
                      <div className="admin-media-title-group">
                        <strong>{item.title}</strong>
                        {item.summary && <small>{item.summary}</small>}
                        <div className="admin-media-badges-row">
                          {item.demo && <span className="admin-badge demo">Demo content</span>}
                          {item.featured && <span className="admin-badge featured">★ Featured</span>}
                          {item.has_students && (
                            <span className="admin-badge category">
                              {item.consent_confirmed ? "✓ Consent verified" : "⚠ Consent pending"}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td>
                      <span className="admin-badge category">{item.category}</span>
                    </td>

                    {/* Event Dates & Location */}
                    {activeTab === "event" && !viewDeleted && (
                      <td>
                        <div style={{ fontSize: "12px", lineHeight: "1.4" }}>
                          {item.start_at && (
                            <div>
                              <strong>Start:</strong> {formatISTDate(item.start_at)}
                            </div>
                          )}
                          {item.location && (
                            <div style={{ color: "var(--media-muted)", marginTop: "2px" }}>
                              📍 {item.location}
                            </div>
                          )}
                        </div>
                      </td>
                    )}

                    {/* Status Badge */}
                    <td>
                      <span className={`admin-badge ${item.status}`}>
                        {item.status}
                      </span>
                    </td>

                    {/* Row Actions */}
                    <td className="admin-media-actions-cell" style={{ textAlign: "right" }}>
                      <div className="admin-media-actions" style={{ justifyContent: "flex-end" }}>
                        {!viewDeleted ? (
                          <>
                            <button
                              type="button"
                              className="admin-media-action-btn"
                              onClick={() => setPreviewItem(item)}
                              title="Live website preview"
                            >
                              👁 Preview
                            </button>
                            <button
                              type="button"
                              className="admin-media-action-btn"
                              onClick={() => handleOpenEdit(item)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="admin-media-action-btn"
                              onClick={() => handleTogglePublish(item)}
                            >
                              {item.status === "published" ? "Unpublish" : "Publish"}
                            </button>
                            <button
                              type="button"
                              className="admin-media-action-btn delete"
                              onClick={() => setItemToDelete(item)}
                            >
                              Delete
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            className="admin-media-action-btn restore"
                            onClick={() => handleRestore(item.id, item.title)}
                          >
                            ↺ Restore
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Responsive Cards View (Mobile <768px) */}
      <div className="admin-media-mobile-cards">
        {loading && <p className="admin-media-empty">Loading media…</p>}
        {!loading && items.length === 0 && (
          <p className="admin-media-empty">No media items found.</p>
        )}
        {!loading &&
          items.map((item) => (
            <div key={item.id} className="admin-media-card">
              <div className="admin-media-card-top">
                <div className="admin-media-card-thumb">
                  <img
                    src={item.poster_url || "/assets/images/campus-placeholder.jpg"}
                    alt={item.title}
                  />
                  {item.duration_seconds > 0 && (
                    <span className="duration-chip" style={{ position: "absolute", bottom: 2, right: 2, fontSize: 8, background: "#000", color: "#fff", padding: "1px 3px" }}>
                      {formatDuration(item.duration_seconds)}
                    </span>
                  )}
                </div>
                <div className="admin-media-card-info">
                  <strong>{item.title}</strong>
                  <div className="admin-media-badges-row">
                    <span className={`admin-badge ${item.status}`}>{item.status}</span>
                    <span className="admin-badge category">{item.category}</span>
                    {item.demo && <span className="admin-badge demo">Demo</span>}
                  </div>
                </div>
              </div>
              {item.summary && <small style={{ color: "var(--media-muted)", fontSize: 11 }}>{item.summary}</small>}
              <div className="admin-media-card-actions">
                {!viewDeleted ? (
                  <>
                    <button
                      type="button"
                      className="admin-media-action-btn"
                      onClick={() => setPreviewItem(item)}
                    >
                      Preview
                    </button>
                    <button
                      type="button"
                      className="admin-media-action-btn"
                      onClick={() => handleOpenEdit(item)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="admin-media-action-btn"
                      onClick={() => handleTogglePublish(item)}
                    >
                      {item.status === "published" ? "Unpublish" : "Publish"}
                    </button>
                    <button
                      type="button"
                      className="admin-media-action-btn delete"
                      onClick={() => setItemToDelete(item)}
                    >
                      Delete
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="admin-media-action-btn restore"
                    onClick={() => handleRestore(item.id, item.title)}
                  >
                    Restore
                  </button>
                )}
              </div>
            </div>
          ))}
      </div>

      {/* Add / Edit Modal */}
      {isEditorOpen && (
        <div
          className="admin-media-modal-backdrop"
          onClick={handleCloseEditor}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="admin-media-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-media-modal-header">
              <h2>
                {isNew ? "Add" : "Edit"}{" "}
                {editorItem.kind === "tour" ? "Tour Chapter" : "Campus Event"}
              </h2>
              <button
                type="button"
                className="admin-media-modal-close"
                onClick={handleCloseEditor}
                aria-label="Close modal"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSaveItem}>
              <div className="admin-media-modal-body">
                {formError && <div className="admin-media-error-msg">{formError}</div>}

                {/* Video URL Section & Validation */}
                <div className="admin-media-form-section">
                  <h3 className="admin-media-form-section-title">Video Source (YouTube or Vimeo)</h3>
                  <div className="admin-media-field">
                    <label>
                      Video URL
                      <small style={{ fontWeight: "normal" }}>
                        Accepts youtube.com, youtu.be, or vimeo.com
                      </small>
                    </label>
                    <div className="admin-media-video-validate-row">
                      <input
                        type="url"
                        className="admin-media-input"
                        placeholder="https://www.youtube.com/watch?v=..."
                        value={editorItem.video_url || ""}
                        onChange={(e) => {
                          setEditorItem((prev) => ({ ...prev, video_url: e.target.value }));
                          setFormDirty(true);
                        }}
                      />
                      <button
                        type="button"
                        className="admin-media-btn-secondary"
                        disabled={validatingVideo || !editorItem.video_url}
                        onClick={() => handleValidateVideo()}
                      >
                        {validatingVideo ? "Checking…" : "Validate"}
                      </button>
                    </div>
                  </div>

                  {videoError && <div className="admin-media-error-msg">{videoError}</div>}

                  {videoValidation && (
                    <div className="admin-media-video-preview-card">
                      <div className="admin-media-video-preview-thumb">
                        <img
                          src={videoValidation.thumbnail_url || editorItem.poster_url}
                          alt="Video thumbnail"
                        />
                      </div>
                      <div className="admin-media-video-preview-meta">
                        <strong>✓ Valid {videoValidation.provider.toUpperCase()} Video</strong>
                        <small>ID: {videoValidation.video_id}</small>
                        {videoValidation.title && (
                          <small>Title: &ldquo;{videoValidation.title}&rdquo;</small>
                        )}
                        {videoValidation.author_name && (
                          <small>Channel: {videoValidation.author_name}</small>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Primary Content Information */}
                <div className="admin-media-form-section">
                  <h3 className="admin-media-form-section-title">Content &amp; Metadata</h3>

                  <div className="admin-media-field">
                    <label>
                      Title *
                      <span className="char-counter">
                        {editorItem.title?.length || 0} / 120
                      </span>
                    </label>
                    <input
                      type="text"
                      className="admin-media-input"
                      required
                      minLength={3}
                      maxLength={120}
                      value={editorItem.title}
                      onChange={(e) => {
                        setEditorItem((prev) => ({ ...prev, title: e.target.value }));
                        setFormDirty(true);
                      }}
                      placeholder="e.g. Campus Walkthrough & Heritage"
                    />
                  </div>

                  <div className="admin-media-field-row">
                    <div className="admin-media-field">
                      <label>Category</label>
                      <input
                        type="text"
                        className="admin-media-input"
                        value={editorItem.category}
                        onChange={(e) => {
                          setEditorItem((prev) => ({ ...prev, category: e.target.value }));
                          setFormDirty(true);
                        }}
                        placeholder="Campus, Academics, Sports, etc."
                      />
                    </div>

                    <div className="admin-media-field">
                      <label>
                        {editorItem.kind === "tour" ? "Chapter Sequence" : "Display Order"}
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="99"
                        className="admin-media-input"
                        value={editorItem.chapter_order || editorItem.sort_order || 1}
                        onChange={(e) => {
                          const val = Number(e.target.value) || 1;
                          setEditorItem((prev) => ({
                            ...prev,
                            chapter_order: val,
                            sort_order: val,
                          }));
                          setFormDirty(true);
                        }}
                      />
                    </div>

                    <div className="admin-media-field">
                      <label>Duration (Seconds)</label>
                      <input
                        type="number"
                        min="0"
                        max="7200"
                        className="admin-media-input"
                        value={editorItem.duration_seconds}
                        onChange={(e) => {
                          setEditorItem((prev) => ({
                            ...prev,
                            duration_seconds: e.target.value,
                          }));
                          setFormDirty(true);
                        }}
                        placeholder="e.g. 180 (for 3:00)"
                      />
                    </div>
                  </div>

                  {/* Event Schedule Fields */}
                  {editorItem.kind === "event" && (
                    <div className="admin-media-field-row">
                      <div className="admin-media-field">
                        <label>Event Start (IST)</label>
                        <input
                          type="datetime-local"
                          className="admin-media-input"
                          value={editorItem.start_at}
                          onChange={(e) => {
                            setEditorItem((prev) => ({ ...prev, start_at: e.target.value }));
                            setFormDirty(true);
                          }}
                        />
                      </div>
                      <div className="admin-media-field">
                        <label>Event End (IST)</label>
                        <input
                          type="datetime-local"
                          className="admin-media-input"
                          value={editorItem.end_at}
                          onChange={(e) => {
                            setEditorItem((prev) => ({ ...prev, end_at: e.target.value }));
                            setFormDirty(true);
                          }}
                        />
                      </div>
                      <div className="admin-media-field">
                        <label>Location</label>
                        <input
                          type="text"
                          className="admin-media-input"
                          value={editorItem.location}
                          onChange={(e) => {
                            setEditorItem((prev) => ({ ...prev, location: e.target.value }));
                            setFormDirty(true);
                          }}
                          placeholder="e.g. Milman Hall / College Pavilion"
                        />
                      </div>
                    </div>
                  )}

                  <div className="admin-media-field">
                    <label>
                      Short Summary (Parent Card Preview)
                      <span className="char-counter">
                        {editorItem.summary?.length || 0} / 200
                      </span>
                    </label>
                    <textarea
                      className="admin-media-textarea"
                      maxLength={200}
                      rows={2}
                      value={editorItem.summary}
                      onChange={(e) => {
                        setEditorItem((prev) => ({ ...prev, summary: e.target.value }));
                        setFormDirty(true);
                      }}
                      placeholder="Brief overview visible on the carousel card..."
                    />
                  </div>

                  <div className="admin-media-field">
                    <label>
                      Full Description (Detail Modal / Accessibility)
                      <span className="char-counter">
                        {editorItem.description?.length || 0} / 1500
                      </span>
                    </label>
                    <textarea
                      className="admin-media-textarea"
                      maxLength={1500}
                      rows={4}
                      value={editorItem.description}
                      onChange={(e) => {
                        setEditorItem((prev) => ({ ...prev, description: e.target.value }));
                        setFormDirty(true);
                      }}
                      placeholder="Comprehensive background details about this chapter or event..."
                    />
                  </div>

                  <div className="admin-media-field-row">
                    <div className="admin-media-field">
                      <label>Action Link URL (Optional)</label>
                      <input
                        type="text"
                        className="admin-media-input"
                        value={editorItem.link_url}
                        onChange={(e) => {
                          setEditorItem((prev) => ({ ...prev, link_url: e.target.value }));
                          setFormDirty(true);
                        }}
                        placeholder="https://... or /#admissions"
                      />
                    </div>
                    <div className="admin-media-field">
                      <label>Button Label (Optional)</label>
                      <input
                        type="text"
                        className="admin-media-input"
                        value={editorItem.link_label}
                        onChange={(e) => {
                          setEditorItem((prev) => ({ ...prev, link_label: e.target.value }));
                          setFormDirty(true);
                        }}
                        placeholder="e.g. Schedule a Campus Visit"
                      />
                    </div>
                    <div className="admin-media-field">
                      <label>Source / Channel Credit</label>
                      <input
                        type="text"
                        className="admin-media-input"
                        value={editorItem.source_credit}
                        onChange={(e) => {
                          setEditorItem((prev) => ({ ...prev, source_credit: e.target.value }));
                          setFormDirty(true);
                        }}
                        placeholder="e.g. Sherwood College Media Team"
                      />
                    </div>
                  </div>
                </div>

                {/* Optional Custom Cover Upload */}
                <div className="admin-media-form-section">
                  <h3 className="admin-media-form-section-title">
                    Custom Poster Image (Optional)
                  </h3>
                  <small style={{ color: "var(--media-muted)" }}>
                    If no custom image is uploaded, the YouTube/Vimeo video poster is used automatically.
                  </small>
                  <label className="admin-media-dropzone">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleCoverUpload}
                      disabled={uploadingCover}
                    />
                    <p>
                      {uploadingCover
                        ? "Uploading &amp; converting to WebP…"
                        : "Click or Drag to Upload Poster (JPG, PNG, WebP &le; 5MB)"}
                    </p>
                    <small>EXIF stripped automatically for privacy.</small>
                  </label>
                  {coverError && <div className="admin-media-error-msg">{coverError}</div>}
                  {editorItem.poster_url && (
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "8px" }}>
                      <img
                        src={editorItem.poster_url}
                        alt="Current poster"
                        style={{ width: "90px", height: "50px", objectFit: "cover", borderRadius: "6px" }}
                      />
                      <small style={{ color: "var(--media-green)", fontWeight: 700 }}>
                        ✓ Poster set ({editorItem.cover_image ? "Custom WebP upload" : "Video provider thumbnail"})
                      </small>
                    </div>
                  )}
                </div>

                {/* Governance, Consent & Publishing Controls */}
                <div className="admin-media-form-section">
                  <h3 className="admin-media-form-section-title">
                    Publishing Governance &amp; Student Privacy
                  </h3>

                  <div className="admin-media-field-row">
                    <div className="admin-media-field">
                      <label>Publication Status</label>
                      <select
                        className="admin-media-select"
                        value={editorItem.status}
                        onChange={(e) => {
                          setEditorItem((prev) => ({ ...prev, status: e.target.value }));
                          setFormDirty(true);
                        }}
                      >
                        <option value="draft">Draft (Saved internally, hidden from visitors)</option>
                        <option value="published">Published (Live on homepage)</option>
                        <option value="archived">Archived (Unlisted)</option>
                      </select>
                    </div>

                    <div className="admin-media-field">
                      <label>Highlight Status</label>
                      <label className="admin-media-checkbox-row">
                        <input
                          type="checkbox"
                          checked={Boolean(editorItem.featured)}
                          onChange={(e) => {
                            setEditorItem((prev) => ({ ...prev, featured: e.target.checked }));
                            setFormDirty(true);
                          }}
                        />
                        <div>
                          <strong>Featured Item</strong>
                          <small>Prominently placed at front of slider</small>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="admin-media-field-row" style={{ marginTop: "10px" }}>
                    <label className="admin-media-checkbox-row">
                      <input
                        type="checkbox"
                        checked={Boolean(editorItem.demo)}
                        onChange={(e) => {
                          setEditorItem((prev) => ({ ...prev, demo: e.target.checked }));
                          setFormDirty(true);
                        }}
                      />
                      <div>
                        <strong>Demo Content</strong>
                        <small>Shows discreet &ldquo;Demo content&rdquo; badge</small>
                      </div>
                    </label>

                    <label className="admin-media-checkbox-row">
                      <input
                        type="checkbox"
                        checked={Boolean(editorItem.has_students)}
                        onChange={(e) => {
                          setEditorItem((prev) => ({ ...prev, has_students: e.target.checked }));
                          setFormDirty(true);
                        }}
                      />
                      <div>
                        <strong>Identifiable Students / Minors</strong>
                        <small>Check if enrolled students appear</small>
                      </div>
                    </label>
                  </div>

                  {editorItem.has_students && (
                    <label
                      className={`admin-media-checkbox-row consent-required`}
                      style={{ marginTop: "10px" }}
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(editorItem.consent_confirmed)}
                        onChange={(e) => {
                          setEditorItem((prev) => ({
                            ...prev,
                            consent_confirmed: e.target.checked,
                          }));
                          setFormDirty(true);
                        }}
                      />
                      <div>
                        <strong style={{ color: "#92400e" }}>
                          Parental Consent Confirmed (Mandatory for Publishing)
                        </strong>
                        <small>
                          I verify written guardian consent is on file per Sherwood College child safety policy.
                        </small>
                      </div>
                    </label>
                  )}
                </div>
              </div>

              <div className="admin-media-modal-footer">
                <button
                  type="button"
                  className="admin-media-btn-secondary"
                  onClick={handleCloseEditor}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-media-btn-primary"
                  disabled={saving}
                >
                  {saving ? "Saving…" : isNew ? "Create Media Item" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div
          className="admin-media-modal-backdrop"
          onClick={() => setItemToDelete(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="admin-media-modal"
            style={{ maxWidth: "480px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-media-modal-header">
              <h2>Confirm Deletion</h2>
              <button
                type="button"
                className="admin-media-modal-close"
                onClick={() => setItemToDelete(null)}
              >
                ×
              </button>
            </div>
            <div className="admin-media-modal-body">
              <p style={{ margin: 0, fontSize: "14px", lineHeight: "1.5" }}>
                Are you sure you want to delete{" "}
                <strong>&ldquo;{itemToDelete.title}&rdquo;</strong>?
              </p>
              <small style={{ color: "var(--media-muted)", display: "block", marginTop: "8px" }}>
                This item will be soft-deleted and moved to Recently Deleted. You can restore it anytime or use the Undo button.
              </small>
            </div>
            <div className="admin-media-modal-footer">
              <button
                type="button"
                className="admin-media-btn-secondary"
                onClick={() => setItemToDelete(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-media-action-btn delete"
                style={{ padding: "10px 18px", fontSize: "13px" }}
                onClick={handleDeleteConfirm}
              >
                Yes, Delete Item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Preview Modal */}
      {previewItem && (
        <div
          className="admin-media-modal-backdrop"
          onClick={() => setPreviewItem(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="admin-media-modal admin-media-preview-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-media-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <h2>Live Homepage Preview</h2>
                <div className="admin-media-preview-viewport-toggle">
                  <button
                    type="button"
                    className={`admin-media-preview-viewport-btn ${previewViewport === "desktop" ? "active" : ""}`}
                    onClick={() => setPreviewViewport("desktop")}
                  >
                    Desktop View (16:9)
                  </button>
                  <button
                    type="button"
                    className={`admin-media-preview-viewport-btn ${previewViewport === "mobile" ? "active" : ""}`}
                    onClick={() => setPreviewViewport("mobile")}
                  >
                    Mobile Screen (375px)
                  </button>
                </div>
              </div>
              <button
                type="button"
                className="admin-media-modal-close"
                onClick={() => setPreviewItem(null)}
              >
                ×
              </button>
            </div>

            <div className="admin-media-modal-body" style={{ background: "#eef2ef" }}>
              <div className="admin-media-preview-frame-container">
                <div className={`admin-media-preview-viewport-${previewViewport}`}>
                  {/* Simulated Card / Chapter */}
                  <div style={{ position: "relative", width: "100%", aspectRatio: "16 / 9", background: "#0b1a10" }}>
                    <img
                      src={previewItem.poster_url || "/assets/images/campus-placeholder.jpg"}
                      alt={previewItem.title}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 60%)",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "flex-end",
                        padding: previewViewport === "mobile" ? "14px" : "24px",
                        color: "#fff",
                      }}
                    >
                      <div style={{ display: "flex", gap: "6px", marginBottom: "8px" }}>
                        <span style={{ background: "var(--media-green)", color: "#fff", fontSize: "10px", fontWeight: 800, padding: "2px 8px", borderRadius: "10px" }}>
                          {previewItem.category}
                        </span>
                        {previewItem.demo && (
                          <span style={{ background: "#4338ca", color: "#fff", fontSize: "10px", fontWeight: 800, padding: "2px 8px", borderRadius: "10px" }}>
                            Demo content
                          </span>
                        )}
                        {previewItem.duration_seconds > 0 && (
                          <span style={{ background: "rgba(0,0,0,0.6)", color: "#fff", fontSize: "10px", fontWeight: 800, padding: "2px 8px", borderRadius: "10px" }}>
                            ⏱ {formatDuration(previewItem.duration_seconds)}
                          </span>
                        )}
                      </div>
                      <h3 style={{ margin: "0 0 6px", fontSize: previewViewport === "mobile" ? "16px" : "22px", fontFamily: "Georgia, serif" }}>
                        {previewItem.title}
                      </h3>
                      <p style={{ margin: 0, fontSize: previewViewport === "mobile" ? "11px" : "13px", color: "#e2ece5", lineHeight: "1.4" }}>
                        {previewItem.summary}
                      </p>
                    </div>
                  </div>

                  <div style={{ padding: "20px", background: "#fff" }}>
                    {previewItem.kind === "event" && previewItem.start_at && (
                      <p style={{ margin: "0 0 8px", fontSize: "12px", color: "var(--media-deep)", fontWeight: 700 }}>
                        📅 {formatISTDate(previewItem.start_at)}
                        {previewItem.location ? ` • 📍 ${previewItem.location}` : ""}
                      </p>
                    )}
                    {previewItem.description && (
                      <p style={{ margin: "0 0 16px", fontSize: "13px", color: "var(--media-muted)", lineHeight: "1.5" }}>
                        {previewItem.description}
                      </p>
                    )}
                    {previewItem.link_url && (
                      <a
                        href={previewItem.link_url}
                        className="admin-media-btn-primary"
                        style={{ display: "inline-flex", textDecoration: "none" }}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {previewItem.link_label || (previewItem.kind === "tour" ? "Schedule a Campus Visit" : "Learn More")}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="admin-media-modal-footer">
              <button
                type="button"
                className="admin-media-btn-secondary"
                onClick={() => setPreviewItem(null)}
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
