/**
 * Review Mode Configuration & Mock Data Engine
 * 
 * Active ONLY in development or when VITE_REVIEW_MODE is explicitly enabled.
 * Production builds tree-shake this module out entirely.
 */

export const isReviewModeEnabled = () => {
  return Boolean(import.meta.env.DEV || import.meta.env.VITE_REVIEW_MODE === "true");
};

export const REVIEW_SESSION_KEY = "sheerwood.review.session";
export const REVIEW_MOCK_TOKEN = "review-mock-token";

export const REVIEW_PERSONAS = [
  {
    role: "parent",
    title: "Parent / Admission Applicant",
    desc: "Parent dashboard, online application form, document upload, and fee payment.",
    defaultRoute: "/new-user-dashboard",
    user: {
      name: "Review Parent",
      email: "review.parent@sherwood.edu.in",
      role: "parent",
    },
  },
  {
    role: "student",
    title: "Student Portal",
    desc: "Academic grades, timetable, attendance records, study materials, and notices.",
    defaultRoute: "/student/dashboard",
    user: {
      name: "Review Student",
      email: "review.student@sherwood.edu.in",
      role: "student",
    },
  },
  {
    role: "teacher",
    title: "Teacher Portal",
    desc: "Daily attendance marking, classroom logs, student progress, and curriculum.",
    defaultRoute: "/teacher/dashboard",
    user: {
      name: "Review Teacher",
      email: "review.teacher@sherwood.edu.in",
      role: "teacher",
    },
  },
  {
    role: "admin",
    title: "Administrative Portal",
    desc: "Institutional controls, admission approvals, user roles, syllabus, and system metrics.",
    defaultRoute: "/admin/dashboard",
    user: {
      name: "Review Admin",
      email: "review.admin@sherwood.edu.in",
      role: "admin",
    },
  },
  {
    role: "vendor",
    title: "Vendor / Partner Portal",
    desc: "Application referral management, lead tracking, and admission funnel analytics.",
    defaultRoute: "/vendor/dashboard",
    user: {
      name: "Review Vendor",
      email: "review.vendor@sherwood.edu.in",
      role: "vendor",
    },
  },
];

export function getStoredReviewSession() {
  if (typeof window === "undefined" || !isReviewModeEnabled()) return null;
  try {
    const raw = window.sessionStorage?.getItem(REVIEW_SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (session && session.isReview && session.expiresAt > Date.now()) {
      return session;
    }
    window.sessionStorage?.removeItem(REVIEW_SESSION_KEY);
    return null;
  } catch {
    return null;
  }
}

export function createReviewSession(persona) {
  if (typeof window === "undefined" || !isReviewModeEnabled()) return null;
  const session = {
    isReview: true,
    accessToken: REVIEW_MOCK_TOKEN,
    idToken: REVIEW_MOCK_TOKEN,
    expiresAt: Date.now() + 86400000,
    user: {
      name: persona.user.name,
      email: persona.user.email,
      role: persona.role,
      claims: {
        sub: `review-${persona.role}-sub`,
        name: persona.user.name,
        email: persona.user.email,
        role: persona.role,
      },
    },
  };
  try {
    window.sessionStorage?.setItem(REVIEW_SESSION_KEY, JSON.stringify(session));
  } catch {}
  return session;
}

export function clearReviewSession() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage?.removeItem(REVIEW_SESSION_KEY);
  } catch {}
}

/**
 * Realistic Mock Data for Review Mode (no real PII, no backend calls)
 */
export const REVIEW_MOCK_DATA = {
  parentAdmissionStatus: {
    application: {
      application_number: "SHER-2027-0482",
      student_name: "Kabir Sharma",
      desired_class: "Class 8",
      parent_mobile: "+91 98765 43210",
      status: "under_verification",
      documents_status: "under_verification",
      submitted_at: "2027-06-10T10:00:00Z",
      form_data: {
        admissionDetails: { class: "Class 8", currentClass: "Class 7" },
        student: {
          firstName: "Kabir",
          lastName: "Sharma",
          birthDate: "2013-05-14",
          placeOfBirth: "Nainital",
          motherTongue: "Hindi",
          howHeard: "Alumni Recommendation",
        },
        guardians: {
          father: {
            fullName: "Rajesh Sharma",
            mobile: "+91 98765 43210",
            email: "review.parent@sherwood.edu.in",
          },
        },
      },
    },
    document_summary: { required: 5, uploaded: 4, verified: 3, under_verification: 1, reupload_required: 0 },
    documents: [
      { id: "doc-1", document_key: "birth-certificate", file_name: "sample_birth_certificate.pdf", status: "verified" },
      { id: "doc-2", document_key: "report-card", file_name: "sample_report_card_class7.pdf", status: "verified" },
      { id: "doc-3", document_key: "aadhaar-card", file_name: "sample_aadhaar_card.pdf", status: "verified" },
      { id: "doc-4", document_key: "student-photo", file_name: "sample_student_photo.jpg", status: "under_verification" },
    ],
  },
  adminDocuments: [
    { id: "doc-1", application_number: "SHER-2027-0482", student_name: "Kabir Sharma", document_key: "birth-certificate", file_name: "sample_birth_certificate.pdf", status: "verified", submitted_at: "2027-06-10T10:00:00Z" },
    { id: "doc-2", application_number: "SHER-2027-0482", student_name: "Kabir Sharma", document_key: "report-card", file_name: "sample_report_card_class7.pdf", status: "under_verification", submitted_at: "2027-06-10T10:05:00Z" },
    { id: "doc-3", application_number: "SHER-2027-0511", student_name: "Meera Sen", document_key: "aadhaar-card", file_name: "sample_aadhaar_card.pdf", status: "uploaded", submitted_at: "2027-06-11T14:20:00Z" },
  ],
  adminAdmissions: [
    { application_number: "SHER-2027-0482", student_name: "Kabir Sharma", desired_class: "Class 8", parent_mobile: "+91 98765 43210", status: "under_verification", documents_status: "under_verification", submitted_at: "2027-06-10T10:00:00Z" },
    { application_number: "SHER-2027-0511", student_name: "Meera Sen", desired_class: "Class 5", parent_mobile: "+91 98123 45678", status: "submitted", documents_status: "uploaded", submitted_at: "2027-06-11T14:20:00Z" },
    { application_number: "SHER-2027-0390", student_name: "Arjun Nair", desired_class: "Class 11", parent_mobile: "+91 97234 56789", status: "approved", documents_status: "documents_verified", submitted_at: "2027-06-08T09:15:00Z" },
  ],
  adminUsers: [
    { id: "u-1", email: "admin@sherwood.edu.in", full_name: "Principal's Secretariat", role: "admin" },
    { id: "u-2", email: "teacher@sherwood.edu.in", full_name: "Prof. Vikram Sen", role: "teacher" },
    { id: "u-3", email: "admissions@sherwood.edu.in", full_name: "Admissions Officer", role: "admin" },
  ],
  adminSettings: {
    registration_fee: 5000,
    academic_year: "2027-2028",
    admissions_open: true,
  },
  adminSyllabus: [
    { id: "syl-1", subject: "English", details: "Comprehension, Essay Writing, Grammar & Vocabulary (Class 8 Level)", sort_order: 1, active: true },
    { id: "syl-2", subject: "Mathematics", details: "Arithmetic, Algebra, Geometry & Mensuration", sort_order: 2, active: true },
    { id: "syl-3", subject: "General Science", details: "Physics, Chemistry and Biology Fundamentals", sort_order: 3, active: true },
  ],
  adminVendors: [
    { id: "v-1", vendor_id: "SHER-VEND-01", full_name: "Review Vendor Partner", email: "vendor@sherwood.edu.in", is_enabled: true },
    { id: "v-2", vendor_id: "SHER-VEND-02", full_name: "Doon Education Agency", email: "doon.edu@example.com", is_enabled: true },
  ],
  vendorDashboard: {
    vendor: {
      full_name: "Review Vendor Partner",
      email: "review.vendor@sherwood.edu.in",
      vendor_id: "SHER-VEND-01",
    },
    referral_path: "/apply?source=vendor&token=SHER-VEND-01",
    summary: { applications: 18, submitted: 14, approved: 8 },
    applications: [
      { application_number: "SHER-2027-0104", student_name: "Ananya Verma", desired_class: "Class 6", submitted_at: "2027-06-01T09:30:00Z", status: "approved" },
      { application_number: "SHER-2027-0158", student_name: "Rohan Mehra", desired_class: "Class 9", submitted_at: "2027-06-05T14:15:00Z", status: "under_verification" },
      { application_number: "SHER-2027-0210", student_name: "Devika Nair", desired_class: "Class 11", submitted_at: "2027-06-08T11:00:00Z", status: "submitted" },
    ],
  },
};

