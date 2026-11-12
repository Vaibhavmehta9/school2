import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { clearSignedOutMarker } from "../auth/signOutState";
import SchoolCrest from "../components/SchoolCrest";
import Button from "../components/Button/Button";
import "../auth/AuthCallback.css";

export default function SignedOut() {
  const navigate = useNavigate();

  const handleSignInAgain = () => {
    clearSignedOutMarker();
    navigate("/login");
  };

  const handleBackToWebsite = () => {
    clearSignedOutMarker();
    navigate("/");
  };

  return (
    <main className="auth-callback-page" role="main" aria-labelledby="signed-out-title">
      <section className="auth-callback-card">
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
          <SchoolCrest size={64} />
        </div>
        <p>SHERWOOD COLLEGE</p>
        <h1 id="signed-out-title">You have signed out</h1>
        <div className="auth-callback-status" role="status">
          Your secure session has been terminated safely. Thank you for visiting Sherwood College.
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "24px" }}>
          <Button
            variant="primary"
            size="md"
            onClick={handleSignInAgain}
            style={{ width: "100%" }}
          >
            Sign in again
          </Button>

          <Button
            as={Link}
            to="/"
            variant="secondary"
            size="md"
            onClick={handleBackToWebsite}
            style={{ width: "100%" }}
          >
            Back to website
          </Button>
        </div>
      </section>
    </main>
  );
}

