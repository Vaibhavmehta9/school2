/**
 * Review Mode Configuration & Mock Data Engine
 * 
 * Active ONLY in development or when VITE_REVIEW_MODE is explicitly enabled.
 * Production builds tree-shake this module out entirely.
 */

export const isReviewModeEnabled = () => {
  return import.meta.env.VITE_REVIEW_MODE === "true";
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
  adminMedia: [
    {
      id: 1,
      kind: "tour",
      title: "Campus Walkthrough & Heritage",
      slug: "campus-walkthrough-heritage",
      summary: "Explore the historic 45-acre Ayarpatta campus, Gothic architecture, and tranquil hillside setting.",
      description: "Take an aerial and pedestrian journey through Sherwood College, established in 1869 in Nainital.",
      category: "Campus",
      chapter_order: 1,
      sort_order: 1,
      video_provider: "youtube",
      video_id: "H3Xw_2g4E4c",
      video_url: "https://www.youtube.com/watch?v=H3Xw_2g4E4c",
      poster_url: "https://i.ytimg.com/vi/H3Xw_2g4E4c/hqdefault.jpg",
      duration_seconds: 320,
      link_url: "/#admissions",
      link_label: "Schedule a Campus Visit",
      status: "published",
      featured: true,
      demo: true,
      source_credit: "Public Nainital Heritage Footage (Demo)",
      has_students: false,
      consent_confirmed: true,
    },
    {
      id: 2,
      kind: "tour",
      title: "Classrooms & Innovation Labs",
      slug: "classrooms-innovation-labs",
      summary: "State-of-the-art science laboratories, digital learning suites, and focused academic environments.",
      description: "Discover Sherwood's academic wing with advanced physics, chemistry, biology and computer learning facilities.",
      category: "Academics",
      chapter_order: 2,
      sort_order: 2,
      video_provider: "youtube",
      video_id: "dQw4w9WgXcQ",
      video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      poster_url: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
      duration_seconds: 245,
      link_url: "/#admissions",
      link_label: "View Academic Curriculum",
      status: "published",
      featured: false,
      demo: true,
      source_credit: "Sample Educational Video (Demo)",
      has_students: false,
      consent_confirmed: true,
    },
    {
      id: 3,
      kind: "tour",
      title: "Hostel Life & Pastoral Care",
      slug: "hostel-life-pastoral-care",
      summary: "A warm, structured boarding experience fostering lifelong camaraderie and self-reliance.",
      description: "Tour the residential houses, dining halls, study dormitories and common recreational lounges.",
      category: "Boarding",
      chapter_order: 3,
      sort_order: 3,
      video_provider: "youtube",
      video_id: "kJQP7kiw5Fk",
      video_url: "https://www.youtube.com/watch?v=kJQP7kiw5Fk",
      poster_url: "https://i.ytimg.com/vi/kJQP7kiw5Fk/hqdefault.jpg",
      duration_seconds: 280,
      link_url: "/#admissions",
      link_label: "Boarding Guide",
      status: "published",
      featured: false,
      demo: true,
      source_credit: "Sample Campus Tour (Demo)",
      has_students: false,
      consent_confirmed: true,
    },
    {
      id: 4,
      kind: "tour",
      title: "Sports Grounds & Pavilion",
      slug: "sports-grounds-pavilion",
      summary: "Cricket field, football grounds, indoor badminton, squash courts, and athletic tracks.",
      description: "Sherwood's rich sporting heritage with Olympic-standard facilities nestled in the pine hills.",
      category: "Sports",
      chapter_order: 4,
      sort_order: 4,
      video_provider: "youtube",
      video_id: "fJ9rUzIMcZQ",
      video_url: "https://www.youtube.com/watch?v=fJ9rUzIMcZQ",
      poster_url: "https://i.ytimg.com/vi/fJ9rUzIMcZQ/hqdefault.jpg",
      duration_seconds: 210,
      link_url: "/#admissions",
      link_label: "Explore Athletics",
      status: "published",
      featured: false,
      demo: true,
      source_credit: "Sample Sports Reel (Demo)",
      has_students: false,
      consent_confirmed: true,
    },
    {
      id: 5,
      kind: "event",
      title: "Annual Sports Day 2026",
      slug: "annual-sports-day-2026",
      summary: "Inter-house athletics competition, marching contingent, and award ceremony on the main pavilion.",
      description: "Experience the vibrant spirit of Sherwoodians competing in track and field events with parents and alumni cheering.",
      category: "Sports",
      start_at: "2026-10-15T09:00:00+05:30",
      end_at: "2026-10-15T17:00:00+05:30",
      location: "Main Sports Pavilion, Sherwood College",
      video_provider: "youtube",
      video_id: "H3Xw_2g4E4c",
      video_url: "https://www.youtube.com/watch?v=H3Xw_2g4E4c",
      poster_url: "https://i.ytimg.com/vi/H3Xw_2g4E4c/hqdefault.jpg",
      duration_seconds: 180,
      status: "published",
      featured: true,
      sort_order: 1,
      demo: true,
      source_credit: "Public College Highlights (Demo)",
      has_students: false,
      consent_confirmed: true,
    },
    {
      id: 6,
      kind: "event",
      title: "Founder's Day Celebration & Play",
      slug: "founders-day-celebration-play",
      summary: "Commemorating our 1869 founding with solemn chapel services, musical recitals, and dramatic theater.",
      description: "The annual Founder's Day tradition brings together students, faculty, and distinguished Old Sherwoodians worldwide.",
      category: "Heritage",
      start_at: "2026-06-05T10:00:00+05:30",
      end_at: "2026-06-06T18:00:00+05:30",
      location: "Milman Hall & College Chapel",
      video_provider: "youtube",
      video_id: "dQw4w9WgXcQ",
      video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      poster_url: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
      duration_seconds: 240,
      status: "published",
      featured: true,
      sort_order: 2,
      demo: true,
      source_credit: "Sample Theater Highlight (Demo)",
      has_students: false,
      consent_confirmed: true,
    },
    {
      id: 7,
      kind: "event",
      title: "Science & Innovation Conclave 2026",
      slug: "science-innovation-conclave-2026",
      summary: "Student project exhibitions, robotics demonstrations, and keynote lectures by leading scientists.",
      description: "Fostering inquiring scientific minds with hands-on robotics workshops, green energy prototypes, and space science displays.",
      category: "Academics",
      start_at: "2026-11-20T10:00:00+05:30",
      end_at: "2026-11-20T16:00:00+05:30",
      location: "Science Complex & Innovation Labs",
      video_provider: "youtube",
      video_id: "kJQP7kiw5Fk",
      video_url: "https://www.youtube.com/watch?v=kJQP7kiw5Fk",
      poster_url: "https://i.ytimg.com/vi/kJQP7kiw5Fk/hqdefault.jpg",
      duration_seconds: 150,
      status: "published",
      featured: false,
      sort_order: 3,
      demo: true,
      source_credit: "Sample Science Fair Reel (Demo)",
      has_students: false,
      consent_confirmed: true,
    },
    {
      id: 8,
      kind: "event",
      title: "Inter-House Music & Debating Trophy",
      slug: "inter-house-music-debating-trophy",
      summary: "Annual parliamentary debating and choral competition between the four historic houses.",
      description: "Witness high-energy parliamentary debates and harmonious vocal choral performances judged by visiting adjudicators.",
      category: "Culture",
      start_at: "2026-12-02T11:00:00+05:30",
      end_at: "2026-12-02T16:00:00+05:30",
      location: "Milman Hall, Sherwood College",
      video_provider: "youtube",
      video_id: "fJ9rUzIMcZQ",
      video_url: "https://www.youtube.com/watch?v=fJ9rUzIMcZQ",
      poster_url: "https://i.ytimg.com/vi/fJ9rUzIMcZQ/hqdefault.jpg",
      duration_seconds: 200,
      status: "published",
      featured: false,
      sort_order: 4,
      demo: true,
      source_credit: "Sample Debating Trophy (Demo)",
      has_students: false,
      consent_confirmed: true,
    },
  ],
};

