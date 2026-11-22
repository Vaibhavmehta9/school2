// The backend AI service (backend/data/school_faq.json) serves as the single source of truth.
// Offline shortcuts previously hardcoded in the frontend bundle are bypassed to ensure
// real-time consistency with backend FAQ edits.
import { API_ROUTES } from "../constants/routes";

export async function getAdminUsers(accessToken) {
  if (import.meta.env.VITE_REVIEW_MODE === "true" && accessToken === "review-mock-token") {
    const { REVIEW_MOCK_DATA } = await import("../auth/reviewMode");
    return REVIEW_MOCK_DATA.adminUsers;
  }
  const response = await fetch(API_ROUTES.adminUsers, { headers: { Authorization: `Bearer ${accessToken}` } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.detail || "Users could not be loaded.");
  return data;
}

export async function updateAdminUserRole(accessToken, userId, user) {
  const response = await fetch(`${API_ROUTES.adminUsers}/${encodeURIComponent(userId)}`, { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` }, body: JSON.stringify({ role: user.role, full_name: user.full_name, email: user.email }) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.detail || "User role could not be updated.");
  return data;
}

export async function createAdminUser(accessToken, user) {
  const response = await fetch(API_ROUTES.adminUsers, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      password: user.password || undefined,
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.detail || "User could not be created.");
  return data;
}

export async function getAdminSettings(accessToken) {
  return getAdminData(API_ROUTES.adminSettings, accessToken, "Settings could not be loaded.");
}

export async function updateRegistrationFee(accessToken, amount) {
  const response = await fetch(`${API_ROUTES.adminSettings}/registration-fee`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ amount: Number(amount) }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.detail || "Registration fee could not be updated.");
  return data;
}

export function getAdminSyllabus(accessToken) {
  return getAdminData(API_ROUTES.adminSyllabus, accessToken, "Entrance-test syllabus could not be loaded.");
}

export async function saveAdminSyllabus(accessToken, item) {
  const isExisting = Boolean(item.id);
  const response = await fetch(isExisting ? `${API_ROUTES.adminSyllabus}/${encodeURIComponent(item.id)}` : API_ROUTES.adminSyllabus, {
    method: isExisting ? "PATCH" : "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ subject: item.subject, details: item.details, sort_order: Number(item.sort_order) || 0, active: Boolean(item.active) }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.detail || "Syllabus item could not be saved.");
  return data;
}

export async function deleteAdminSyllabus(accessToken, syllabusId) {
  const response = await fetch(`${API_ROUTES.adminSyllabus}/${encodeURIComponent(syllabusId)}`, { method: "DELETE", headers: { Authorization: `Bearer ${accessToken}` } });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.detail || "Syllabus item could not be deleted.");
  }
}

export async function getAdminMedia(accessToken, params = {}) {
  const query = new URLSearchParams();
  if (params.kind) query.set("kind", params.kind);
  if (params.status) query.set("status", params.status);
  if (params.category) query.set("category", params.category);
  if (params.search) query.set("search", params.search);
  if (params.include_deleted) query.set("include_deleted", "true");
  if (params.limit) query.set("limit", String(params.limit));
  if (params.offset) query.set("offset", String(params.offset));

  const qs = query.toString();
  const url = `${API_ROUTES.adminMedia}${qs ? `?${qs}` : ""}`;

  if (import.meta.env.VITE_REVIEW_MODE === "true" && accessToken === "review-mock-token") {
    const { REVIEW_MOCK_DATA } = await import("../auth/reviewMode");
    const all = REVIEW_MOCK_DATA.adminMedia || [];
    let filtered = [...all];
    if (params.include_deleted) {
      filtered = filtered.filter((i) => Boolean(i.deleted_at));
    } else {
      filtered = filtered.filter((i) => !i.deleted_at);
      if (params.kind) filtered = filtered.filter((i) => i.kind === params.kind);
      if (params.status) filtered = filtered.filter((i) => i.status === params.status);
      if (params.category) filtered = filtered.filter((i) => i.category === params.category);
      if (params.search) {
        const q = params.search.toLowerCase();
        filtered = filtered.filter((i) => (i.title || "").toLowerCase().includes(q) || (i.summary || "").toLowerCase().includes(q) || (i.location || "").toLowerCase().includes(q));
      }
    }
    return {
      items: filtered,
      total: filtered.length,
      stats: {
        total_active: all.filter((i) => !i.deleted_at).length,
        published_count: all.filter((i) => i.status === "published" && !i.deleted_at).length,
        draft_count: all.filter((i) => i.status === "draft" && !i.deleted_at).length,
        archived_count: all.filter((i) => i.status === "archived" && !i.deleted_at).length,
        deleted_count: all.filter((i) => Boolean(i.deleted_at)).length,
        tour_count: all.filter((i) => i.kind === "tour" && !i.deleted_at).length,
        event_count: all.filter((i) => i.kind === "event" && !i.deleted_at).length,
      },
    };
  }

  const response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.detail || "Media items could not be loaded.");
  return data;
}

export async function createAdminMedia(accessToken, payload) {
  const response = await fetch(API_ROUTES.adminMedia, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.detail || "Media item could not be created.");
  return data;
}

export async function updateAdminMedia(accessToken, id, payload) {
  const response = await fetch(API_ROUTES.adminMediaItem(id), {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.detail || "Media item could not be updated.");
  return data;
}

export async function deleteAdminMedia(accessToken, id) {
  const response = await fetch(API_ROUTES.adminMediaItem(id), {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.detail || "Media item could not be deleted.");
  return data;
}

export async function restoreAdminMedia(accessToken, id) {
  const response = await fetch(API_ROUTES.adminMediaRestore(id), {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.detail || "Media item could not be restored.");
  return data;
}

export async function publishAdminMedia(accessToken, id) {
  const response = await fetch(API_ROUTES.adminMediaPublish(id), {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.detail || "Media item could not be published.");
  return data;
}

export async function unpublishAdminMedia(accessToken, id) {
  const response = await fetch(API_ROUTES.adminMediaUnpublish(id), {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.detail || "Media item could not be unpublished.");
  return data;
}

export async function reorderAdminMedia(accessToken, items) {
  const response = await fetch(API_ROUTES.adminMediaReorder, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ items }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.detail || "Media items could not be reordered.");
  return data;
}

export async function validateVideoUrl(accessToken, videoUrl) {
  const response = await fetch(API_ROUTES.adminMediaValidateVideo, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ video_url: videoUrl }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.detail || "Video URL could not be validated.");
  return data;
}

export async function uploadMediaCover(accessToken, file) {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch(API_ROUTES.adminMediaUploadCover, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: formData,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.detail || "Cover image could not be uploaded.");
  return data;
}

export async function getPublicTourChapters() {
  const response = await fetch(API_ROUTES.publicTour);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.detail || "Tour chapters could not be loaded.");
  return data;
}

export async function getPublicEvents(params = {}) {
  const query = new URLSearchParams();
  if (params.category) query.set("category", params.category);
  if (params.featured) query.set("featured", "true");
  const qs = query.toString();
  const url = `${API_ROUTES.publicEvents}${qs ? `?${qs}` : ""}`;
  const response = await fetch(url);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.detail || "Events could not be loaded.");
  return data;
}

export async function getPublicEvent(slug) {
  const response = await fetch(API_ROUTES.publicEvent(slug));
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.detail || "Event details could not be loaded.");
  return data;
}

export function getAdminVendors(accessToken) {
  return getAdminData(API_ROUTES.adminVendors, accessToken, "Vendor accounts could not be loaded.");
}

export async function createAdminVendor(accessToken, vendor) {
  const response = await fetch(API_ROUTES.adminVendors, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ full_name: vendor.full_name, email: vendor.email, vendor_id: vendor.vendor_id }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.detail || "Vendor login could not be created.");
  return data;
}

export async function updateAdminVendorStatus(accessToken, vendorId, enabled) {
  const response = await fetch(`${API_ROUTES.adminVendors}/${encodeURIComponent(vendorId)}/status?enabled=${Boolean(enabled)}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.detail || "Vendor status could not be updated.");
  return data;
}

export function getVendorDashboard(accessToken) {
  return getAdminData(API_ROUTES.vendorDashboard, accessToken, "Vendor dashboard could not be loaded.");
}

export async function getAdminDocuments(accessToken) {
  if (import.meta.env.VITE_REVIEW_MODE === "true" && accessToken === "review-mock-token") {
    const { REVIEW_MOCK_DATA } = await import("../auth/reviewMode");
    return REVIEW_MOCK_DATA.adminDocuments;
  }
  const response = await fetch(API_ROUTES.adminDocuments, { headers: { Authorization: `Bearer ${accessToken}` } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.detail || "Documents could not be loaded.");
  return data;
}

export async function reviewAdminDocument(accessToken, documentId, decision, reason = "") {
  const response = await fetch(`${API_ROUTES.adminDocuments}/${encodeURIComponent(documentId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ decision, reason }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.detail || "Document review could not be saved.");
  return data;
}

export async function downloadAdminDocument(accessToken, documentId, fallbackFileName = "admission-document") {
  if (import.meta.env.VITE_REVIEW_MODE === "true" && accessToken === "review-mock-token") {
    return {
      blob: new Blob(["Sample downloaded document for review mode."], { type: "text/plain" }),
      fileName: `${fallbackFileName}.txt`,
    };
  }
  const response = await fetch(`${API_ROUTES.adminDocuments}/${encodeURIComponent(documentId)}/download`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.detail || "Document could not be downloaded.");
  }

  const contentDisposition = response.headers.get("content-disposition") || "";
  const fileNameMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
  return { blob: await response.blob(), fileName: fileNameMatch?.[1] || fallbackFileName };
}

export async function deleteAdminDocument(accessToken, documentId) {
  const response = await fetch(`${API_ROUTES.adminDocuments}/${encodeURIComponent(documentId)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.detail || "Document could not be deleted.");
  }
}

export async function getAdminAdmissions(accessToken) {
  if (import.meta.env.VITE_REVIEW_MODE === "true" && accessToken === "review-mock-token") {
    const { REVIEW_MOCK_DATA } = await import("../auth/reviewMode");
    return REVIEW_MOCK_DATA.adminAdmissions;
  }
  const response = await fetch(API_ROUTES.adminAdmissions, { headers: { Authorization: `Bearer ${accessToken}` } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.detail || "Admissions could not be loaded.");
  return data;
}

export async function deleteAdminAdmission(accessToken, applicationId) {
  const response = await fetch(API_ROUTES.adminAdmission(applicationId), {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.detail || "Admission application could not be deleted.");
  }
}

export async function getAdminAdmissionPayments(accessToken, applicationId) {
  const response = await fetch(API_ROUTES.adminAdmissionPayments(applicationId), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.detail || "Payment details could not be loaded.");
  return data;
}

export function getAdminAdmissionFunnel(accessToken) {
  return getAdminData(API_ROUTES.adminAdmissionFunnel, accessToken, "Admission tracking could not be loaded.");
}

async function getAdminData(url, accessToken, errorMessage) {
  if (import.meta.env.VITE_REVIEW_MODE === "true" && accessToken === "review-mock-token") {
    const { REVIEW_MOCK_DATA } = await import("../auth/reviewMode");
    if (url.includes("/admin/settings")) return REVIEW_MOCK_DATA.adminSettings;
    if (url.includes("/admin/syllabus")) return REVIEW_MOCK_DATA.adminSyllabus;
    if (url.includes("/admin/vendors")) return REVIEW_MOCK_DATA.adminVendors;
    if (url.includes("/vendor/dashboard")) return REVIEW_MOCK_DATA.vendorDashboard;
    if (url.includes("/admin/admission-funnel")) return { total_leads: 42, active_applications: 18, pending_documents: 6, approved: 14 };
    if (url.includes("/admin/students")) return [];
    if (url.includes("/admin/teachers")) return [];
    if (url.includes("/admin/classes")) return [];
    if (url.includes("/admin/attendance")) return [];
    return {};
  }
  const response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.detail || errorMessage);
  return data;
}

export function getAdminStudents(accessToken) {
  return getAdminData(API_ROUTES.adminStudents, accessToken, "Students could not be loaded.");
}

export function getAdminTeachers(accessToken) {
  return getAdminData(API_ROUTES.adminTeachers, accessToken, "Teachers could not be loaded.");
}

export function getAdminClasses(accessToken) {
  return getAdminData(API_ROUTES.adminClasses, accessToken, "Class allocations could not be loaded.");
}

export function getAdminAttendance(accessToken) {
  return getAdminData(API_ROUTES.adminAttendance, accessToken, "Attendance could not be loaded.");
}

export async function decideAdminAdmission(accessToken, applicationId, decision, { classSection = null, sectionAllocation = null, adminRemark = "" } = {}) {
  const response = await fetch(API_ROUTES.applicationDecision(applicationId), {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ decision, class_section: classSection, section_allocation: sectionAllocation, admin_remark: adminRemark }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.detail || "Admission decision could not be saved.");
  return data;
}

export function formatErrorDetail(detail, fallback = "AI service is temporarily unavailable. Please try again shortly.") {
  if (!detail) return fallback;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail.map((err) => (typeof err === "object" && err?.msg ? `${err.loc ? err.loc.filter((l) => l !== "body").join(".") + ": " : ""}${err.msg}` : String(err))).join("; ") || fallback;
  }
  if (typeof detail === "object") {
    return detail.message || detail.msg || JSON.stringify(detail);
  }
  return String(detail);
}

function sanitizeHistoryForApi(history) {
  if (!Array.isArray(history)) return [];
  return history
    .slice(-6)
    .map((turn) => ({
      role: turn.role === "user" ? "user" : "assistant",
      // Cap at 1000 chars so long assistant answers (e.g. fee tables) never trip backend max_length validation
      content: String(turn.content || turn.text || "").trim().slice(0, 1000),
    }))
    .filter((turn) => turn.content.length > 0);
}

export async function askSchoolAI(input, options = {}) {
  const message = typeof input === "string" ? input : input?.message || input?.prompt || "";
  const history = (typeof input === "object" ? input?.history : options?.history) || [];
  const accessToken = (typeof input === "object" ? input?.accessToken : options?.accessToken) || null;

  const headers = { "Content-Type": "application/json" };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  const response = await fetch(API_ROUTES.aiChat, {
    method: "POST",
    headers,
    body: JSON.stringify({
      message: message.trim(),
      history: sanitizeHistoryForApi(history),
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(formatErrorDetail(data.detail));
    error.status = response.status;
    throw error;
  }
  return data.answer;
}

export async function warmupBackend() {
  try {
    const healthUrl = `${API_BASE_URL}/health`;
    await fetch(healthUrl, { method: "GET", cache: "no-store" });
  } catch {
    // Non-blocking background warmup
  }
}

export async function streamSchoolAI({
  message,
  history = [],
  accessToken = null,
  signal,
  isFirstRequest = false,
  onWarmingUp,
  onChunk,
  onFinish,
  onError,
  onDemoFlag,
  onChips,
  onMetadata,
  onStatus,
}) {
  const headers = { "Content-Type": "application/json" };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  // Non-streaming fallback (used for Cloudflare Quick Tunnels that do not support SSE streaming)
  if (import.meta.env.VITE_CHAT_STREAMING === "false") {
    try {
      const response = await fetch(API_ROUTES.aiChat, {
        method: "POST",
        headers,
        signal,
        body: JSON.stringify({
          message: message.trim(),
          history: sanitizeHistoryForApi(history),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const error = new Error(formatErrorDetail(data.detail));
        error.status = response.status;
        if (onError) onError(error);
        throw error;
      }
      const answer = data.answer || "";
      if (data.is_demo !== undefined && onDemoFlag) onDemoFlag(Boolean(data.is_demo));
      if (data.chips && onChips) onChips(data.chips);
      if ((data.show_actions !== undefined || data.intent !== undefined) && onMetadata) {
        onMetadata({ showActions: Boolean(data.show_actions), intent: data.intent });
      }
      if (onChunk && answer) onChunk(answer, answer);
      if (onFinish) onFinish(answer);
      return answer;
    } catch (err) {
      if (signal?.aborted) return "";
      if (onError) onError(err);
      throw err;
    }
  }

  const localController = new AbortController();
  if (signal) {
    if (signal.aborted) {
      localController.abort();
    } else {
      signal.addEventListener("abort", () => localController.abort(), { once: true });
    }
  }

  let firstTokenTimer = null;
  let inactivityTimer = null;
  let overallTimer = null;
  let warmUpTimer = null;
  let firstTokenReceived = false;

  const clearAllTimers = () => {
    if (firstTokenTimer) {
      clearTimeout(firstTokenTimer);
      firstTokenTimer = null;
    }
    if (inactivityTimer) {
      clearTimeout(inactivityTimer);
      inactivityTimer = null;
    }
    if (overallTimer) {
      clearTimeout(overallTimer);
      overallTimer = null;
    }
    if (warmUpTimer) {
      clearTimeout(warmUpTimer);
      warmUpTimer = null;
    }
  };

  const triggerTimeout = (timerType) => {
    clearAllTimers();
    const timeoutError = new Error("This is taking longer than expected. Please try again.");
    timeoutError.isTimeout = true;
    timeoutError.timerType = timerType;
    try {
      localController.abort(timeoutError);
    } catch {
      // Ignore abort errors
    }
    if (onError) onError(timeoutError);
    throw timeoutError;
  };

  // 1. Overall timeout: 90s for first request (cold start), 45s for subsequent requests
  const overallLimit = isFirstRequest ? 90000 : 45000;
  overallTimer = setTimeout(() => triggerTimeout("overall"), overallLimit);

  // 2. First-token timeout: 60s for first request (cold start), 15s for subsequent requests
  const firstTokenLimit = isFirstRequest ? 60000 : 15000;
  firstTokenTimer = setTimeout(() => triggerTimeout("first-token"), firstTokenLimit);

  // 3. Warm-up notification timer: 8s
  warmUpTimer = setTimeout(() => {
    if (!firstTokenReceived && onWarmingUp) {
      onWarmingUp();
    }
  }, 8000);

  // 4. Inactivity timeout: 20s (resets on every incoming byte/chunk)
  const resetInactivityTimer = () => {
    if (inactivityTimer) clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => triggerTimeout("inactivity"), 20000);
  };
  resetInactivityTimer();

  let response;
  try {
    response = await fetch(API_ROUTES.aiChatStream, {
      method: "POST",
      headers,
      signal: localController.signal,
      body: JSON.stringify({
        message: message.trim(),
        history: sanitizeHistoryForApi(history),
      }),
    });
  } catch (fetchErr) {
    clearAllTimers();
    if (signal?.aborted || localController.signal.aborted) {
      if (fetchErr.isTimeout) throw fetchErr;
      return "";
    }
    const error = new Error("Could not connect to the school assistant. Please check your network connection.");
    error.isNetwork = true;
    if (onError) onError(error);
    throw error;
  }

  if (!response.ok) {
    clearAllTimers();
    const data = await response.json().catch(() => ({}));
    let msg = formatErrorDetail(data.detail);
    if (response.status === 429) {
      msg = "Too many requests. Please wait 60 seconds before asking again.";
    } else if (response.status >= 500) {
      msg = "The Sherwood AI service is currently unavailable. Please check back shortly.";
    }
    const error = new Error(msg);
    error.status = response.status;
    if (onError) onError(error);
    throw error;
  }

  // Gracefully handle non-stream JSON responses (if returned by a proxy or fallback)
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    clearAllTimers();
    const data = await response.json().catch(() => ({}));
    const answer = data.answer || "";
    if (data.is_demo !== undefined && onDemoFlag) onDemoFlag(Boolean(data.is_demo));
    if (data.chips && onChips) onChips(data.chips);
    if ((data.show_actions !== undefined || data.intent !== undefined) && onMetadata) {
      onMetadata({ showActions: Boolean(data.show_actions), intent: data.intent });
    }
    if (onChunk && answer) onChunk(answer, answer);
    if (onFinish) onFinish(answer);
    return answer;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullAnswer = "";
  let doneReceived = false;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      resetInactivityTimer();
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n\n");
      buffer = lines.pop() || "";

      for (const block of lines) {
        const line = block.trim();
        if (!line.startsWith("data:")) continue;
        const payload = line.replace(/^data:\s*/, "").trim();

        if (payload === "[DONE]") {
          doneReceived = true;
          clearAllTimers();
          if (onFinish) onFinish(fullAnswer);
          return fullAnswer;
        }

        try {
          const parsed = JSON.parse(payload);

          // Safely ignore unknown event types or status events (e.g. {"status":"thinking"})
          // MUST NEVER appear as text or clear the first-token timer
          if (parsed.status) {
            if (onStatus) onStatus(parsed.status);
            continue;
          }

          if (parsed.error) {
            clearAllTimers();
            const err = new Error(parsed.error);
            if (onError) onError(err);
            throw err;
          }

          if (parsed.chunk) {
            // First token received: clear first-token timer
            if (!firstTokenReceived) {
              firstTokenReceived = true;
              if (firstTokenTimer) {
                clearTimeout(firstTokenTimer);
                firstTokenTimer = null;
              }
            }
            fullAnswer += parsed.chunk;
            if (onChunk) onChunk(parsed.chunk, fullAnswer);
          }

          if (parsed.is_demo !== undefined && onDemoFlag) {
            onDemoFlag(Boolean(parsed.is_demo));
          }

          if (parsed.chips && onChips) {
            onChips(parsed.chips);
          }

          if ((parsed.show_actions !== undefined || parsed.intent !== undefined) && onMetadata) {
            onMetadata({ showActions: Boolean(parsed.show_actions), intent: parsed.intent });
          }
        } catch (parseErr) {
          if (payload.includes("error")) throw parseErr;
        }
      }
    }

    clearAllTimers();

    // Stream finished without [DONE] or yielded no content
    if (!doneReceived || !fullAnswer || !fullAnswer.trim()) {
      if (!fullAnswer || !fullAnswer.trim()) {
        const emptyErr = new Error("I couldn't fetch a response right now. Please try again.");
        emptyErr.isEmptyResponse = true;
        if (onError) onError(emptyErr);
        throw emptyErr;
      }
    }
  } catch (streamErr) {
    clearAllTimers();
    if (signal?.aborted || localController.signal.aborted) {
      if (streamErr.isTimeout) throw streamErr;
      return fullAnswer;
    }
    if (onError) onError(streamErr);
    throw streamErr;
  } finally {
    clearAllTimers();
  }

  if (onFinish) onFinish(fullAnswer);
  return fullAnswer;
}

async function otpRequest(path, payload) {
  const response = await fetch(API_ROUTES.otp(path), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.detail || "OTP service is unavailable. Please try again shortly.");
  return data;
}

export function toE164PhoneNumber(phoneNumber) {
  const digits = phoneNumber.replace(/\D/g, "");
  if (phoneNumber.trim().startsWith("+")) return `+${digits}`;
  return digits.length === 10 ? `+91${digits}` : `+${digits}`;
}

export function requestMobileOtp(phoneNumber) {
  return otpRequest("request", { phone_number: toE164PhoneNumber(phoneNumber) });
}

export function verifyMobileOtp(phoneNumber, otp) {
  return otpRequest("verify", { phone_number: toE164PhoneNumber(phoneNumber), otp });
}

export function requestEmailOtp(email) {
  return otpRequest("email/request", { email: email.trim().toLowerCase() });
}

export function verifyEmailOtp(email, otp) {
  return otpRequest("email/verify", { email: email.trim().toLowerCase(), otp });
}
