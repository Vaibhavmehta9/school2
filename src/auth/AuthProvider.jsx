import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "react-oidc-context";
import { deriveRole } from "./cognito";
import { CognitoAuthContext } from "./CognitoAuthContext";
import { setAdmissionStorageOwner } from "../services/admission";
import { clearBrowserAuthStorage, markSignedOut } from "./signOutState";

const INACTIVITY_TIMEOUT_MS = 15 * 60_000; // 15 minutes of inactivity before auto-logout
const activityEvents = ["pointerdown", "pointermove", "keydown", "touchstart", "wheel", "scroll"];

export function CognitoAuthProvider({ children }) {
  const auth = useAuth();
  const inactivityTimerRef = useRef(null);
  const lastActivityRef = useRef(Date.now());

  const [localUser, setLocalUserState] = useState(() => {
    try {
      const stored = localStorage.getItem("sheerwood.local.user");
      if (stored) return JSON.parse(stored);
      // On localhost, default to parent applicant so admissions and dashboards work without Cognito redirect_mismatch
      if (
        typeof window !== "undefined" &&
        (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
      ) {
        const defaultLocal = { email: "parent@sherwood.edu.in", name: "Parent Applicant", role: "parent" };
        localStorage.setItem("sheerwood.local.user", JSON.stringify(defaultLocal));
        return defaultLocal;
      }
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

  const signOut = useCallback(async () => {
    setLocalUser(null);
    try {
      await auth.removeUser();
    } catch {
      // Continue even if browser store is already cleared
    }
    markSignedOut();
    clearBrowserAuthStorage();
    setAdmissionStorageOwner("");

    if (auth.user) {
      const clientId = import.meta.env.VITE_COGNITO_CLIENT_ID || "2oii9hos09ek2r06iasb4otbgg";
      const logoutUri = import.meta.env.VITE_COGNITO_LOGOUT_URI || `${window.location.origin}/`;
      const cognitoDomain = import.meta.env.VITE_COGNITO_DOMAIN || "https://us-east-1pgsbc8uit.auth.us-east-1.amazoncognito.com";
      window.location.replace(`${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`);
    } else {
      window.location.replace("/");
    }
  }, [auth, setLocalUser]);

  useEffect(() => {
    if (!session) return undefined;

    let hasSignedOut = false;
    lastActivityRef.current = Date.now();

    const signOutForInactivity = () => {
      if (hasSignedOut) return;
      hasSignedOut = true;
      void signOut();
    };

    const scheduleInactivityCheck = () => {
      window.clearTimeout(inactivityTimerRef.current);
      const remainingTime = INACTIVITY_TIMEOUT_MS - (Date.now() - lastActivityRef.current);
      inactivityTimerRef.current = window.setTimeout(
        remainingTime <= 0 ? signOutForInactivity : scheduleInactivityCheck,
        Math.max(remainingTime, 0),
      );
    };

    const recordActivity = () => {
      lastActivityRef.current = Date.now();
      scheduleInactivityCheck();
    };

    const checkVisibility = () => {
      if (document.visibilityState === "visible") scheduleInactivityCheck();
    };

    activityEvents.forEach((eventName) => window.addEventListener(eventName, recordActivity, { passive: true }));
    document.addEventListener("visibilitychange", checkVisibility);
    scheduleInactivityCheck();

    return () => {
      window.clearTimeout(inactivityTimerRef.current);
      activityEvents.forEach((eventName) => window.removeEventListener(eventName, recordActivity));
      document.removeEventListener("visibilitychange", checkVisibility);
    };
  }, [session, signOut]);

  const value = useMemo(() => ({
    session,
    user: session?.user || null,
    isLoading: auth.isLoading,
    isConfigured: Boolean(auth.settings?.authority && auth.settings?.client_id),
    signIn: (returnTo = "") => auth.signinRedirect({ state: { returnTo } }),
    signOut,
    setSession: setLocalUser,
    setLocalUser,
  }), [auth, session, signOut, setLocalUser]);

  return <CognitoAuthContext.Provider value={value}>{children}</CognitoAuthContext.Provider>;
}
