import React, { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getDefaultRouteForRole } from "../auth/cognito";
import { useCognitoAuth } from "../auth/useCognitoAuth";
import { clearSignedOutMarker } from "../auth/signOutState";
import { ROUTES } from "../constants/routes";
import SchoolCrest from "../components/SchoolCrest";
import "../auth/AuthCallback.css";

const REVIEW_PROFILES = [
  {
    role: "parent",
    title: "Parent / Admission Applicant",
    desc: "Parent dashboard, online application form, document upload, and fee payment.",
    defaultRoute: ROUTES.dashboard,
    user: { email: "parent@sherwood.edu.in", name: "Parent Applicant", role: "parent" },
  },
  {
    role: "student",
    title: "Student Portal",
    desc: "Academic grades, timetable, attendance records, study materials, and notices.",
    defaultRoute: ROUTES.studentDashboard,
    user: { email: "student@sherwood.edu.in", name: "Aarav Sharma", role: "student" },
  },
  {
    role: "teacher",
    title: "Teacher Portal",
    desc: "Daily attendance marking, classroom logs, student progress, and curriculum.",
    defaultRoute: ROUTES.teacherDashboard,
    user: { email: "teacher@sherwood.edu.in", name: "Prof. Vikram Sen", role: "teacher" },
  },
  {
    role: "admin",
    title: "Administrative Portal",
    desc: "Institutional controls, admission approvals, user roles, syllabus, and system metrics.",
    defaultRoute: ROUTES.admin(),
    user: { email: "admin@sherwood.edu.in", name: "Principal's Secretariat", role: "admin" },
  },
  {
    role: "vendor",
    title: "Vendor / Partner Portal",
    desc: "Application referral management, lead tracking, and admission funnel analytics.",
    defaultRoute: ROUTES.vendorDashboard,
    user: { email: "vendor@sherwood.edu.in", name: "Admissions Partner", role: "vendor" },
  },
];

export default function Login() {
  const location = useLocation();
  const navigate = useNavigate();
  const { session, setSession } = useCognitoAuth();
  const params = new URLSearchParams(location.search);
  const returnTo = params.get("returnTo") || (params.get("flow") === "admission" ? ROUTES.admissionDetails : "");

  // If already authenticated and visiting /login directly, redirect to destination
  useEffect(() => {
    if (session) {
      const destination = returnTo || getDefaultRouteForRole(session.user?.role || "parent");
      navigate(destination, { replace: true });
    }
  }, [session, returnTo, navigate]);

  const handleSelectRole = (profile) => {
    clearSignedOutMarker();
    if (setSession) {
      setSession(profile.user);
    }
    const destination = returnTo || profile.defaultRoute;
    navigate(destination, { replace: true });
  };

  return (
    <main className="auth-callback-page" aria-live="polite" style={{ minHeight: "100vh", padding: "2.5rem 1rem" }}>
      <section
        className="auth-callback-card"
        style={{
          maxWidth: "600px",
          width: "100%",
          padding: "2.5rem 2rem",
          borderRadius: "var(--radius-lg, 16px)",
          boxShadow: "0 20px 48px rgba(3, 44, 31, 0.15)",
          border: "1px solid rgba(8, 120, 63, 0.15)",
          background: "#ffffff",
          textAlign: "center",
        }}
      >
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
          <SchoolCrest size={64} />
        </div>
        <p style={{ letterSpacing: "1.5px", fontSize: "0.75rem", fontWeight: 700, color: "var(--color-primary, #08783f)", textTransform: "uppercase" }}>
          Sherwood College · Nainital
        </p>
        <h1 style={{ fontFamily: "var(--font-serif, Georgia, serif)", fontSize: "1.85rem", color: "#172b21", margin: "0.25rem 0 0.5rem" }}>
          Portal Authentication
        </h1>
        <p style={{ fontSize: "0.9375rem", color: "#5e7467", marginBottom: "1.5rem", lineHeight: 1.5 }}>
          Select any role below to review its features, workflows, and dashboard:
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", textAlign: "left", marginBottom: "1.5rem" }}>
          {REVIEW_PROFILES.map((profile) => (
            <button
              key={profile.role}
              type="button"
              onClick={() => handleSelectRole(profile)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                padding: "1rem 1.25rem",
                borderRadius: "10px",
                border: "1.5px solid #d7e6db",
                background: "#fcfbf7",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#08783f";
                e.currentTarget.style.background = "#ffffff";
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 6px 16px rgba(8, 120, 63, 0.12)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#d7e6db";
                e.currentTarget.style.background = "#fcfbf7";
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
                <strong style={{ fontSize: "1rem", color: "#054b2d", fontWeight: 700 }}>
                  {profile.title}
                </strong>
                <span style={{ fontSize: "0.85rem", color: "#c59b27", fontWeight: 700 }}>
                  Open {profile.role} portal →
                </span>
              </div>
              <span style={{ fontSize: "0.825rem", color: "#5e7467", marginTop: "0.25rem", lineHeight: 1.45 }}>
                {profile.desc}
              </span>
            </button>
          ))}
        </div>

        <div style={{ paddingTop: "1rem", borderTop: "1px solid #e8efea", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <div style={{ fontSize: "11px", color: "#64748b", background: "#f1f5f9", padding: "8px 12px", borderRadius: "6px" }}>
            🔒 Review Mode Active: AWS Cognito Hosted UI bypassed for instant persona navigation.
          </div>

          <Link
            to="/"
            style={{
              fontSize: "0.875rem",
              color: "#08783f",
              fontWeight: 600,
              textDecoration: "none",
              marginTop: "0.5rem",
            }}
          >
            ← Back to Sherwood College Homepage
          </Link>
        </div>
      </section>
    </main>
  );
}
