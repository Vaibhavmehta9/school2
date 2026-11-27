function resolveApiBaseUrl() {
  // If running in the browser on Vercel, always use the local relative '/api' proxy.
  // This routes through Vercel's vercel.json rewrite to Render, completely eliminating
  // cross-origin CORS issues and avoiding any hardcoded environment variable mismatch.
  if (typeof window !== "undefined" && window.location.hostname.endsWith(".vercel.app")) {
    return "/api";
  }

  const raw = import.meta.env.VITE_API_BASE_URL;
  if (!raw) {
    return "/api";
  }

  const cleaned = raw.replace(/\/$/, "");
  // Ensure the base URL includes /api so all API_ROUTES map cleanly to FastAPI routers
  return cleaned.endsWith("/api") ? cleaned : `${cleaned}/api`;
}

const API_BASE_URL = resolveApiBaseUrl();

export const ROUTES = {
  home: "/",
  login: "/login",
  register: "/register",
  gallery: "/gallery",
  calendar: "/calendar",
  dashboard: "/dashboard",
  newUserDashboard: "/new-user-dashboard",
  studentDashboard: "/student/dashboard",
  admissionDetails: "/admission-details",
  studentInformation: "/student-information",
  parentGuardian: "/parent-guardian",
  application: (stage) => `/application/${stage}`,
  applicationDocuments: "/application/documents",
  applicationSuccess: "/application-success",
  consentWithdrawal: "/consent-withdrawal",
  feePayment: "/fee-payment",
  trackApplication: "/track-application",
  aiAssistant: "/ai-assistant",
  admin: (screen = "dashboard") => `/admin/${screen}`,
  teacherDashboard: "/teacher/dashboard",
  vendorDashboard: "/vendor/dashboard",
  signedOut: "/signed-out",
};

export const API_ROUTES = {
  adminUsers: `${API_BASE_URL}/admin/users-roles`,
  adminStudents: `${API_BASE_URL}/admin/students`,
  adminTeachers: `${API_BASE_URL}/admin/teachers`,
  adminClasses: `${API_BASE_URL}/admin/classes`,
  adminAttendance: `${API_BASE_URL}/admin/attendance`,
  adminDocuments: `${API_BASE_URL}/admin/documents`,
  adminAdmissions: `${API_BASE_URL}/admin/admissions`,
  adminAdmission: (applicationId) => `${API_BASE_URL}/admin/admissions/${encodeURIComponent(applicationId)}`,
  adminAdmissionPayments: (applicationId) => `${API_BASE_URL}/admin/admissions/${encodeURIComponent(applicationId)}/payments`,
  adminAdmissionFunnel: `${API_BASE_URL}/admin/admission-funnel`,
  adminVendors: `${API_BASE_URL}/admin/vendors`,
  adminSettings: `${API_BASE_URL}/admin/settings`,
  adminSyllabus: `${API_BASE_URL}/admin/syllabus`,
  adminMedia: `${API_BASE_URL}/admin/media`,
  adminMediaItem: (id) => `${API_BASE_URL}/admin/media/${encodeURIComponent(id)}`,
  adminMediaPublish: (id) => `${API_BASE_URL}/admin/media/${encodeURIComponent(id)}/publish`,
  adminMediaUnpublish: (id) => `${API_BASE_URL}/admin/media/${encodeURIComponent(id)}/unpublish`,
  adminMediaReorder: `${API_BASE_URL}/admin/media/reorder`,
  adminMediaValidateVideo: `${API_BASE_URL}/admin/media/validate-video`,
  adminMediaUploadCover: `${API_BASE_URL}/admin/media/upload-cover`,
  adminMediaRestore: (id) => `${API_BASE_URL}/admin/media/${encodeURIComponent(id)}/restore`,
  publicTour: `${API_BASE_URL}/tour`,
  publicEvents: `${API_BASE_URL}/events`,
  publicEvent: (slug) => `${API_BASE_URL}/events/${encodeURIComponent(slug)}`,
  vendorDashboard: `${API_BASE_URL}/vendor/dashboard`,
  applicationDecision: (applicationId) => `${API_BASE_URL}/applications/${encodeURIComponent(applicationId)}/decision`,
  aiChat: `${API_BASE_URL}/ai/chat`,
  aiChatStream: `${API_BASE_URL}/ai/chat/stream`,
  otp: (action) => `${API_BASE_URL}/auth/otp/${action}`,
};

export { API_BASE_URL };
