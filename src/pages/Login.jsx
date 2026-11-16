import React, { Suspense, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getDefaultRouteForRole, isCognitoConfigured, startCognitoSignIn } from "../auth/cognito";
import { useCognitoAuth } from "../auth/useCognitoAuth";
import { ROUTES } from "../constants/routes";
import SchoolCrest from "../components/SchoolCrest";
import "../auth/AuthCallback.css";

const isReview = Boolean(import.meta.env.DEV || import.meta.env.VITE_REVIEW_MODE === "true");

// Lazy-load the review picker only in development or when VITE_REVIEW_MODE=true.
// In standard production builds, Rollup completely dead-code eliminates this branch.
const ReviewPersonaPicker = (import.meta.env.DEV || import.meta.env.VITE_REVIEW_MODE === "true")
  ? React.lazy(() => import("./ReviewPersonaPicker"))
  : null;

export default function Login() {
  const location = useLocation();
  const navigate = useNavigate();
  const { session } = useCognitoAuth();
  const params = new URLSearchParams(location.search);
  const returnTo = params.get("returnTo") || (params.get("flow") === "admission" ? ROUTES.admissionDetails : "");

  // Real authenticated users visiting /login are redirected to their destination dashboard.
  // Review mode sessions are NOT auto-redirected so the user can freely switch personas.
  useEffect(() => {
    if (session && !session.isReview) {
      const destination = returnTo || getDefaultRouteForRole(session.user?.role || "parent");
      navigate(destination, { replace: true });
    }
  }, [session, returnTo, navigate]);

  // When review mode is active, render the persona picker
  if (isReview && ReviewPersonaPicker) {
    return (
      <Suspense
        fallback={
          <main className="auth-callback-page">
            <section className="auth-callback-card">
              <SchoolCrest size={64} />
              <p>SHERWOOD COLLEGE</p>
              <h1>Loading persona navigation…</h1>
            </section>
          </main>
        }
      >
        <ReviewPersonaPicker />
      </Suspense>
    );
  }

  // Production Login View (Real Cognito Authentication)
  const handleCognitoSignIn = () => {
    startCognitoSignIn(returnTo);
  };

  const configured = isCognitoConfigured();

  return (
    <main className="auth-callback-page" style={{ minHeight: "100vh", padding: "2.5rem 1rem" }}>
      <section
        className="auth-callback-card"
        style={{
          maxWidth: "500px",
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
          <div style={{ width: "64px", height: "64px" }}>
            <SchoolCrest />
          </div>
        </div>
        <p style={{ letterSpacing: "1.5px", fontSize: "0.75rem", fontWeight: 700, color: "var(--color-primary, #08783f)", textTransform: "uppercase" }}>
          Sherwood College · Nainital
        </p>
        <h1 style={{ fontFamily: "var(--font-serif, Georgia, serif)", fontSize: "1.85rem", color: "#172b21", margin: "0.25rem 0 0.5rem" }}>
          Portal Sign In
        </h1>
        <p style={{ fontSize: "0.9375rem", color: "#5e7467", marginBottom: "1.5rem", lineHeight: 1.5 }}>
          Sign in securely using Sherwood College credentials through AWS Cognito.
        </p>

        {configured ? (
          <button
            type="button"
            onClick={handleCognitoSignIn}
            style={{
              width: "100%",
              minHeight: "44px",
              padding: "12px 24px",
              background: "#08783f",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              fontSize: "15px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Continue with AWS Cognito →
          </button>
        ) : (
          <div style={{ background: "#fef3c7", color: "#92400e", padding: "12px", borderRadius: "8px", fontSize: "13px" }}>
            Cognito configuration is required for production login. Set VITE_COGNITO_DOMAIN and VITE_COGNITO_CLIENT_ID.
          </div>
        )}

        <div style={{ marginTop: "1.5rem", paddingTop: "1rem", borderTop: "1px solid #e8efea" }}>
          <Link
            to="/"
            style={{
              fontSize: "0.875rem",
              color: "#08783f",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            ← Back to Sherwood College Homepage
          </Link>
        </div>
      </section>
    </main>
  );
}
