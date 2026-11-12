import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "react-oidc-context";
import { deriveRole } from "./cognito";
import { CognitoAuthContext } from "./CognitoAuthContext";
import { setAdmissionStorageOwner } from "../services/admission";
import {
  broadcastLogout,
  clearBrowserAuthStorage,
  getIsSigningOut,
  initCrossTabLogout,
  markSignedOut,
  setIsSigningOut,
} from "./signOutState";

// Configurable inactivity timeout (default 20 minutes)
const TIMEOUT_MINUTES = Math.max(1, Number(import.meta.env.VITE_INACTIVITY_TIMEOUT_MINUTES) || 20);
const INACTIVITY_TIMEOUT_MS = TIMEOUT_MINUTES * 60_000;
const WARNING_LEAD_MS = 60_000; // Warning shown 60s before sign-out
const activityEvents = ["pointerdown", "pointermove", "keydown", "touchstart", "wheel", "scroll"];

export function CognitoAuthProvider({ children }) {
  const auth = useAuth();
  const inactivityTimerRef = useRef(null);
  const warningTimerRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const lastActivityRef = useRef(Date.now());

  // Inactivity warning modal states
  const [showInactivityWarning, setShowInactivityWarning] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState(60);
  const staySignedInBtnRef = useRef(null);

  // Local user for developer/demo switching - NO automatic login on localhost!
  const [localUser, setLocalUserState] = useState(() => {
    try {
      const stored = localStorage.getItem("sheerwood.local.user");
      if (stored) return JSON.parse(stored);
      return null;
    } catch {
      return null;
    }
  });

  const setLocalUser = useCallback((user) => {
    if (user) {
      localStorage.setItem("sheerwood.local.user", JSON.stringify(user));
    } else {
      localStorage.removeItem("sheerwood.local.user");
    }
    setLocalUserState(user);
  }, []);

  const session = useMemo(() => {
    // If sign-out is in progress, treat session as null immediately
    if (getIsSigningOut()) {
      return null;
    }

    const profile = auth.user?.profile || null;
    if (profile) {
      return {
        accessToken: auth.user.access_token,
        idToken: auth.user.id_token,
        expiresAt: auth.user.expires_at ? auth.user.expires_at * 1000 : 0,
        user: {
          email: profile.email || profile["cognito:username"] || "",
          name: profile.name || profile.given_name || profile.email || "User",
          role: deriveRole(profile),
          claims: profile,
        },
      };
    }

    if (localUser) {
      return {
        accessToken: "local-dev-token",
        idToken: "local-dev-token",
        expiresAt: Date.now() + 86400000,
        user: {
          email: localUser.email,
          name: localUser.name,
          role: localUser.role || "parent",
          claims: {
            sub: `local-${localUser.role || "parent"}-sub`,
            email: localUser.email,
            role: localUser.role || "parent",
          },
        },
      };
    }

    return null;
  }, [auth.user, localUser]);

  useEffect(() => {
    setAdmissionStorageOwner(session?.user?.claims?.sub || session?.user?.email);
  }, [session]);

  const signOut = useCallback(() => {
    // 1. Immediately set the synchronous signing out flag and marker
    setIsSigningOut(true);
    markSignedOut();

    // 2. Broadcast logout to other tabs
    broadcastLogout();

    // 3. Purge all auth items from localStorage and sessionStorage synchronously
    setLocalUser(null);
    clearBrowserAuthStorage();
    setAdmissionStorageOwner("");

    // 4. Fire-and-forget oidc-client-ts user removal without awaiting (page unloads immediately)
    try {
      auth.removeUser().catch(() => {});
    } catch {
      // Ignored during page unload
    }

    // 5. Determine target sign-out destination
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const logoutUri = import.meta.env.VITE_COGNITO_LOGOUT_URI?.trim() || `${origin}/signed-out`;
    const cognitoDomain = import.meta.env.VITE_COGNITO_DOMAIN?.trim();
    const clientId = import.meta.env.VITE_COGNITO_CLIENT_ID?.trim();

    if (auth.user) {
      if (!cognitoDomain || !clientId) {
        // Clear message if env values are missing instead of using stale hardcoded IDs
        window.location.replace(`${logoutUri}?warning=cognito_env_missing`);
        return;
      }

      const normalizedDomain = cognitoDomain.startsWith("http")
        ? cognitoDomain.replace(/\/+$/, "")
        : `https://${cognitoDomain.replace(/\/+$/, "")}`;

      const targetUrl = `${normalizedDomain}/logout?client_id=${encodeURIComponent(clientId)}&logout_uri=${encodeURIComponent(logoutUri)}`;
      window.location.replace(targetUrl);
    } else {
      window.location.replace(logoutUri);
    }
  }, [auth, setLocalUser]);

  // Listen for logout triggered in other browser tabs
  useEffect(() => {
    const cleanup = initCrossTabLogout(() => {
      setLocalUser(null);
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const logoutUri = import.meta.env.VITE_COGNITO_LOGOUT_URI?.trim() || `${origin}/signed-out`;
      window.location.replace(logoutUri);
    });
    return cleanup;
  }, [setLocalUser]);

  // ---------------------------------------------------------------------------
  // Inactivity Monitoring & 60-Second Warning Modal
  // ---------------------------------------------------------------------------
  const resetInactivityTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    setShowInactivityWarning(false);
    window.clearInterval(countdownIntervalRef.current);
  }, []);

  useEffect(() => {
    if (!session) {
      setShowInactivityWarning(false);
      window.clearTimeout(inactivityTimerRef.current);
      window.clearTimeout(warningTimerRef.current);
      window.clearInterval(countdownIntervalRef.current);
      return undefined;
    }

    lastActivityRef.current = Date.now();

    const triggerWarning = () => {
      // If a file upload or active transfer is in progress, defer timeout automatically
      if (typeof window !== "undefined" && (window.__sherwood_active_transfer || window.__sherwood_active_payment)) {
        lastActivityRef.current = Date.now();
        scheduleChecks();
        return;
      }

      setShowInactivityWarning(true);
      setCountdownSeconds(60);

      window.clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = window.setInterval(() => {
        setCountdownSeconds((prev) => {
          if (prev <= 1) {
            window.clearInterval(countdownIntervalRef.current);
            signOut();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    };

    const scheduleChecks = () => {
      window.clearTimeout(inactivityTimerRef.current);
      window.clearTimeout(warningTimerRef.current);

      const elapsed = Date.now() - lastActivityRef.current;
      const warningDelay = Math.max(0, INACTIVITY_TIMEOUT_MS - WARNING_LEAD_MS - elapsed);
      const signoutDelay = Math.max(0, INACTIVITY_TIMEOUT_MS - elapsed);

      warningTimerRef.current = window.setTimeout(triggerWarning, warningDelay);
      inactivityTimerRef.current = window.setTimeout(signOut, signoutDelay);
    };

    const recordActivity = () => {
      if (!showInactivityWarning) {
        lastActivityRef.current = Date.now();
        scheduleChecks();
      }
    };

    const checkVisibility = () => {
      if (document.visibilityState === "visible" && !showInactivityWarning) {
        scheduleChecks();
      }
    };

    activityEvents.forEach((eventName) => window.addEventListener(eventName, recordActivity, { passive: true }));
    document.addEventListener("visibilitychange", checkVisibility);
    scheduleChecks();

    return () => {
      window.clearTimeout(inactivityTimerRef.current);
      window.clearTimeout(warningTimerRef.current);
      window.clearInterval(countdownIntervalRef.current);
      activityEvents.forEach((eventName) => window.removeEventListener(eventName, recordActivity));
      document.removeEventListener("visibilitychange", checkVisibility);
    };
  }, [session, signOut, showInactivityWarning]);

  // Focus trap for inactivity warning
  useEffect(() => {
    if (showInactivityWarning) {
      setTimeout(() => staySignedInBtnRef.current?.focus(), 50);

      const handleKey = (e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          resetInactivityTimer();
        }
      };
      window.addEventListener("keydown", handleKey);
      return () => window.removeEventListener("keydown", handleKey);
    }
    return undefined;
  }, [showInactivityWarning, resetInactivityTimer]);

  const value = useMemo(() => ({
    session,
    user: session?.user || null,
    isLoading: auth.isLoading,
    isConfigured: Boolean(auth.settings?.authority && auth.settings?.client_id),
    signIn: (returnTo = "", extraParams = {}) =>
      auth.signinRedirect({
        state: { returnTo },
        extraQueryParams: extraParams,
      }),
    signOut,
    setSession: setLocalUser,
    setLocalUser,
  }), [auth, session, signOut, setLocalUser]);

  return (
    <CognitoAuthContext.Provider value={value}>
      {children}

      {/* Accessible Inactivity Warning Modal */}
      {showInactivityWarning && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="inactivity-warning-title"
          aria-describedby="inactivity-warning-desc"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99999,
            display: "grid",
            placeItems: "center",
            padding: "16px",
            background: "rgba(3, 54, 32, 0.65)",
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            style={{
              width: "min(440px, 100%)",
              background: "#ffffff",
              borderRadius: "16px",
              padding: "28px 24px",
              boxShadow: "0 20px 48px rgba(0, 0, 0, 0.3)",
              border: "1px solid #d7e6db",
              textAlign: "center",
              fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                background: "#fef3c7",
                color: "#b45309",
                display: "grid",
                placeItems: "center",
                margin: "0 auto 16px",
                fontSize: "24px",
              }}
            >
              ⏳
            </div>
            <h2
              id="inactivity-warning-title"
              style={{ margin: "0 0 8px", fontSize: "1.25rem", color: "#172b21", fontWeight: 700 }}
            >
              Session Timeout Warning
            </h2>
            <p
              id="inactivity-warning-desc"
              style={{ margin: "0 0 20px", fontSize: "0.925rem", color: "#5e7467", lineHeight: 1.5 }}
            >
              You have been inactive. For your security, your session will automatically terminate in{" "}
              <strong style={{ color: "#b91c1c", fontSize: "1.1rem" }}>{countdownSeconds}s</strong>.
            </p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
              <button
                ref={staySignedInBtnRef}
                type="button"
                onClick={resetInactivityTimer}
                style={{
                  minHeight: "44px",
                  padding: "10px 22px",
                  borderRadius: "8px",
                  border: "none",
                  background: "#08783f",
                  color: "#ffffff",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Stay signed in
              </button>
              <button
                type="button"
                onClick={signOut}
                style={{
                  minHeight: "44px",
                  padding: "10px 18px",
                  borderRadius: "8px",
                  border: "1.5px solid #d7e6db",
                  background: "#ffffff",
                  color: "#64748b",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Sign out now
              </button>
            </div>
          </div>
        </div>
      )}
    </CognitoAuthContext.Provider>
  );
}
