import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { clearSignedOutMarker } from "../auth/signOutState";
import { useCognitoAuth } from "../auth/useCognitoAuth";
import { REVIEW_PERSONAS } from "../auth/reviewMode";
import { ROUTES } from "../constants/routes";
import SchoolCrest from "../components/SchoolCrest";
import "../auth/AuthCallback.css";

export default function ReviewPersonaPicker() {
  const location = useLocation();
  const navigate = useNavigate();
  const { startReviewPersona } = useCognitoAuth();
  const params = new URLSearchParams(location.search);
  const returnTo = params.get("returnTo") || (params.get("flow") === "admission" ? ROUTES.admissionDetails : "");

  const handleSelectRole = (persona) => {
    clearSignedOutMarker();
    if (startReviewPersona) {
      startReviewPersona(persona);
    }
    const destination = returnTo || persona.defaultRoute;
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
          <div style={{ width: "64px", height: "64px" }}>
            <SchoolCrest />
          </div>
        </div>
        <p style={{ letterSpacing: "1.5px", fontSize: "0.75rem", fontWeight: 700, color: "var(--color-primary, #08783f)", textTransform: "uppercase" }}>
          Sherwood College · Nainital
        </p>
        <h1 style={{ fontFamily: "var(--font-serif, Georgia, serif)", fontSize: "1.85rem", color: "#172b21", margin: "0.25rem 0 0.5rem" }}>
          Portal Authentication
        </h1>
        <p style={{ fontSize: "0.9375rem", color: "#475569", marginBottom: "1.5rem", lineHeight: 1.5 }}>
          Select any role below to review its features, workflows, and dashboard:
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", textAlign: "left", marginBottom: "1.5rem" }}>
          {REVIEW_PERSONAS.map((persona) => (
            <button
              key={persona.role}
              type="button"
              onClick={() => handleSelectRole(persona)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                padding: "1rem 1.25rem",
                borderRadius: "10px",
                border: "1.5px solid #d7e6db",
                background: "#fcfbf7",
                cursor: "pointer",
                transition: "transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease, background-color 0.15s ease",
                minHeight: "44px",
                width: "100%",
                textAlign: "left",
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
              onMouseDown={(e) => {
                e.currentTarget.style.transform = "scale(0.97)";
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onFocus={(e) => {
                e.currentTarget.style.outline = "2px solid #08783f";
                e.currentTarget.style.outlineOffset = "2px";
              }}
              onBlur={(e) => {
                e.currentTarget.style.outline = "none";
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
                <strong style={{ fontSize: "1rem", color: "#054b2d", fontWeight: 700 }}>
                  {persona.title}
                </strong>
                <span style={{ fontSize: "0.875rem", color: "#08783f", fontWeight: 700 }}>
                  Open {persona.role} portal →
                </span>
              </div>
              <span
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 400,
                  color: "#374151",
                  marginTop: "0.35rem",
                  lineHeight: 1.5,
                  textAlign: "left",
                }}
              >
                {persona.desc}
              </span>
            </button>
          ))}
        </div>

        <div style={{ paddingTop: "1rem", borderTop: "1px solid #e8efea", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <div style={{ fontSize: "11px", color: "#475569", background: "#f1f5f9", padding: "8px 12px", borderRadius: "6px" }}>
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
              display: "inline-block",
            }}
          >
            ← Back to Sherwood College Homepage
          </Link>
        </div>
      </section>
    </main>
  );
}

