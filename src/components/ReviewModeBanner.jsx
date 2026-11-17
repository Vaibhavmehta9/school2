import React from "react";
import { useNavigate } from "react-router-dom";
import { useCognitoAuth } from "../auth/useCognitoAuth";

const isReviewEnabled = import.meta.env.VITE_REVIEW_MODE === "true";

export default function ReviewModeBanner() {
  const navigate = useNavigate();
  const { session, exitReviewMode } = useCognitoAuth();

  // Only render if review mode is enabled and an active review session exists
  if (!isReviewEnabled || !session?.isReview) {
    return null;
  }

  const roleLabel = (session.user?.role || "persona").toUpperCase();

  const handleSwitchPersona = () => {
    navigate("/login");
  };

  const handleExitReview = () => {
    if (exitReviewMode) {
      exitReviewMode();
    }
    navigate("/");
  };

  return (
    <aside
      className="review-mode-sticky-banner"
      role="region"
      aria-label="Review mode notification"
      style={{
        position: "sticky",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 99998,
        background: "linear-gradient(90deg, #92400e 0%, #b45309 50%, #78350f 100%)",
        color: "#ffffff",
        padding: "8px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "10px",
        boxShadow: "0 2px 10px rgba(0, 0, 0, 0.2)",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        fontSize: "13px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
        <span
          style={{
            background: "#fef3c7",
            color: "#92400e",
            fontWeight: 800,
            fontSize: "11px",
            padding: "2px 8px",
            borderRadius: "4px",
            letterSpacing: "0.5px",
          }}
        >
          REVIEW MODE
        </span>
        <span style={{ fontWeight: 600 }}>
          Viewing as: <u>{session.user?.name || roleLabel}</u> ({roleLabel})
        </span>
        <span style={{ opacity: 0.85, fontSize: "12px" }}>
          — Not real authentication. Sample data only.
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <button
          type="button"
          onClick={handleSwitchPersona}
          style={{
            background: "#ffffff",
            color: "#92400e",
            border: "none",
            borderRadius: "6px",
            padding: "5px 12px",
            fontSize: "12px",
            fontWeight: 700,
            cursor: "pointer",
            minHeight: "32px",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.15)",
          }}
          aria-label="Switch persona"
        >
          <span aria-hidden="true">⇄ </span>Switch persona
        </button>
        <button
          type="button"
          onClick={handleExitReview}
          aria-label="Exit review mode"
          style={{
            background: "rgba(0, 0, 0, 0.25)",
            color: "#ffffff",
            border: "1px solid rgba(255, 255, 255, 0.4)",
            borderRadius: "6px",
            padding: "5px 12px",
            fontSize: "12px",
            fontWeight: 600,
            cursor: "pointer",
            minHeight: "32px",
          }}
        >
          <span aria-hidden="true">✕ </span>Exit review mode
        </button>
      </div>
    </aside>
  );
}
