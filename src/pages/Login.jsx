import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getCognitoConfigurationError, getDefaultRouteForRole } from "../auth/cognito";
import { useCognitoAuth } from "../auth/useCognitoAuth";
import Button from "../components/Button/Button";
import "../auth/AuthCallback.css";

const DEMO_PROFILES = [
  {
    role: "parent",
    title: "Parent / Admission Applicant",
    desc: "Complete online admission, track application, or view parent dashboard.",
    defaultRoute: "/admission-details",
    user: { email: "parent@sherwood.edu.in", name: "Parent Applicant", role: "parent" },
  },
  {
    role: "student",
    title: "Student Portal",
    desc: "View academic records, attendance, report cards, and notices.",
    defaultRoute: "/student-dashboard",
    user: { email: "student@sherwood.edu.in", name: "Aarav Sharma", role: "student" },
  },
  {
    role: "teacher",
    title: "Teacher Portal",
    desc: "Manage marks, daily attendance, class logs, and curriculum.",
    defaultRoute: "/teacher",
    user: { email: "teacher@sherwood.edu.in", name: "Prof. Vikram Sen", role: "teacher" },
  },
  {
    role: "admin",
    title: "Administrative Portal",
    desc: "Institutional controls, admission approvals, and analytics.",
    defaultRoute: "/admin",
    user: { email: "admin@sherwood.edu.in", name: "Principal's Secretariat", role: "admin" },
  },
];

export default function Login() {
  const location = useLocation();
  const navigate = useNavigate();
  const { session, signIn, isConfigured, setSession } = useCognitoAuth();
  const params = new URLSearchParams(location.search);
  const returnTo = params.get("returnTo") || (params.get("flow") === "admission" ? "/admission-details" : "");
  const hasStartedSignIn = useRef(false);
  const [error, setError] = useState("");

  const isLocalHost =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

  // If already authenticated and visiting /login directly, redirect to destination
  useEffect(() => {
    if (session) {
      const destination = returnTo || getDefaultRouteForRole(session.user?.role || "parent");
      navigate(destination, { replace: true });
    }
  }, [session, returnTo, navigate]);

  // In production (not localhost), auto-start Cognito sign-in if configured
  useEffect(() => {
    if (session || isLocalHost || !isConfigured || hasStartedSignIn.current) return;

    hasStartedSignIn.current = true;
    signIn(returnTo).catch((reason) => {
      setError(reason.message || "Cognito sign-in could not be started.");
      hasStartedSignIn.current = false;
    });
  }, [isConfigured, isLocalHost, returnTo, session, signIn]);

  const handleSelectRole = (profile) => {
    if (setSession) {
      setSession(profile.user);
    }
    const destination = returnTo || profile.defaultRoute;
    navigate(destination, { replace: true });
  };

  const handleCognitoSignIn = () => {
    hasStartedSignIn.current = true;
    signIn(returnTo).catch((reason) => {
      setError(reason.message || "Cognito sign-in could not be started.");
      hasStartedSignIn.current = false;
    });
  };

  // If not on localhost and loading Cognito redirect
  if (!isLocalHost && !error && isConfigured && !session) {
    return (
      <main className="auth-callback-page" aria-live="polite">
        <section className="auth-callback-card">
          <p>SHERWOOD COLLEGE</p>
          <h1>Redirecting securely…</h1>
          <div className="auth-callback-status">Opening secure Cognito authentication portal…</div>
        </section>
      </main>
    );
  }

  return (
    <main className="auth-callback-page" aria-live="polite" style={{ minHeight: "100vh", padding: "2rem 1rem" }}>
      <section
        className="auth-callback-card"
        style={{
          maxWidth: "580px",
          width: "100%",
          padding: "2.5rem 2rem",
          borderRadius: "var(--radius-lg, 14px)",
          boxShadow: "var(--shadow-xl, 0 20px 40px rgba(5,75,45,0.12))",
          border: "1px solid var(--color-border-subtle, #d8e2dc)",
          background: "#fff",
          textAlign: "center",
        }}
      >
        <div
          className="auth-callback-crest"
          aria-hidden="true"
          style={{
            margin: "0 auto 1rem",
            background: "var(--color-primary, #054b2d)",
            color: "var(--color-accent, #c9a84c)",
            display: "grid",
            placeItems: "center",
            fontWeight: 800,
            fontSize: "1.5rem",
          }}
        >
          S
        </div>
        <p style={{ letterSpacing: "1.5px", fontSize: "0.75rem", fontWeight: 700, color: "var(--color-primary, #054b2d)", textTransform: "uppercase" }}>
          Sherwood College · Nainital
        </p>
        <h1 style={{ fontFamily: "var(--font-heading, 'Playfair Display', serif)", fontSize: "1.75rem", color: "var(--color-text, #1b2e25)", margin: "0.25rem 0 0.5rem" }}>
          Portal Authentication
        </h1>
        <p style={{ fontSize: "0.9375rem", color: "var(--color-text-muted, #4b5e54)", marginBottom: "1.75rem", lineHeight: 1.5 }}>
          {isLocalHost
            ? "Choose your account role to access admissions or portals directly:"
            : "Sign in with your verified institutional credentials:"}
        </p>

        {error && (
          <div className="auth-callback-status error" role="alert" style={{ marginBottom: "1.5rem" }}>
            {error}
          </div>
        )}

        {!isConfigured && (
          <div className="auth-callback-status error" role="alert" style={{ marginBottom: "1.5rem" }}>
            {getCognitoConfigurationError()}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem", textAlign: "left", marginBottom: "1.75rem" }}>
          {DEMO_PROFILES.map((profile) => (
            <button
              key={profile.role}
              type="button"
              onClick={() => handleSelectRole(profile)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                padding: "1rem 1.25rem",
                borderRadius: "var(--radius-md, 8px)",
                border: "1.5px solid var(--color-border-subtle, #e2e8e4)",
                background: "var(--color-surface, #fcfbf7)",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--color-primary, #08783f)";
                e.currentTarget.style.background = "#fff";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--color-border-subtle, #e2e8e4)";
                e.currentTarget.style.background = "var(--color-surface, #fcfbf7)";
                e.currentTarget.style.transform = "none";
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
                <strong style={{ fontSize: "1rem", color: "var(--color-primary, #054b2d)", fontWeight: 700 }}>
                  {profile.title}
                </strong>
                <span style={{ fontSize: "0.8125rem", color: "var(--color-accent, #c9a84c)", fontWeight: 600 }}>
                  Enter →
                </span>
              </div>
              <span style={{ fontSize: "0.8125rem", color: "var(--color-text-muted, #5f7166)", marginTop: "0.25rem" }}>
                {profile.desc}
              </span>
            </button>
          ))}
        </div>

        <div style={{ paddingTop: "1rem", borderTop: "1px solid var(--color-border-subtle, #e2e8e4)", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={handleCognitoSignIn}
            style={{ width: "100%" }}
          >
            Sign in via Amazon Cognito (Hosted UI)
          </Button>

          <Link
            to="/"
            style={{
              fontSize: "0.875rem",
              color: "var(--color-text-muted, #5f7166)",
              textDecoration: "none",
              marginTop: "0.25rem",
            }}
          >
            ← Back to Sherwood College Homepage
          </Link>
        </div>
      </section>
    </main>
  );
}
