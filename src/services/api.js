import { getSchoolInformationAnswer } from "./schoolInformation";
import { API_ROUTES } from "../constants/routes";

export async function getAdminUsers(accessToken) {
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

export async function askSchoolAI(input, options = {}) {
  const message = typeof input === "string" ? input : input?.message || input?.prompt || "";
  const history = (typeof input === "object" ? input?.history : options?.history) || [];
  const accessToken = (typeof input === "object" ? input?.accessToken : options?.accessToken) || null;

  // Offline / instant exact match shortcut only when there is no prior conversation history
  if (history.length === 0) {
    const instant = getSchoolInformationAnswer(message);
    if (instant) return instant;
  }

  const headers = { "Content-Type": "application/json" };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  const response = await fetch(API_ROUTES.aiChat, {
    method: "POST",
    headers,
    body: JSON.stringify({
      message: message.trim(),
      history: history.slice(-6).map((turn) => ({ role: turn.role, content: turn.content || turn.text || "" })),
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

export async function streamSchoolAI({ message, history = [], accessToken = null, signal, onChunk, onFinish, onError }) {
  if (history.length === 0) {
    const instant = getSchoolInformationAnswer(message);
    if (instant) {
      if (onChunk) onChunk(instant, instant);
      if (onFinish) onFinish(instant);
      return instant;
    }
  }

  const headers = { "Content-Type": "application/json" };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  let response;
  try {
    response = await fetch(API_ROUTES.aiChatStream, {
      method: "POST",
      headers,
      signal,
      body: JSON.stringify({
        message: message.trim(),
        history: history.slice(-6).map((turn) => ({ role: turn.role, content: turn.content || turn.text || "" })),
      }),
    });
  } catch {
    if (signal?.aborted) return "";
    const error = new Error("Could not connect to the school assistant. Please check your network connection.");
    error.isNetwork = true;
    if (onError) onError(error);
    throw error;
  }

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const error = new Error(formatErrorDetail(data.detail));
    error.status = response.status;
    if (onError) onError(error);
    throw error;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullAnswer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n\n");
      buffer = lines.pop() || "";

      for (const block of lines) {
        const line = block.trim();
        if (!line.startsWith("data:")) continue;
        const payload = line.replace(/^data:\s*/, "").trim();
        if (payload === "[DONE]") {
          if (onFinish) onFinish(fullAnswer);
          return fullAnswer;
        }
        try {
          const parsed = JSON.parse(payload);
          if (parsed.error) {
            const err = new Error(parsed.error);
            if (onError) onError(err);
            throw err;
          }
          if (parsed.chunk) {
            fullAnswer += parsed.chunk;
            if (onChunk) onChunk(parsed.chunk, fullAnswer);
          }
        } catch (parseErr) {
          if (payload.includes("error")) throw parseErr;
        }
      }
    }
  } catch (streamErr) {
    if (signal?.aborted) return fullAnswer;
    if (onError) onError(streamErr);
    throw streamErr;
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
