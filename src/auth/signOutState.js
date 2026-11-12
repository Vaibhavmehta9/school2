const SIGNED_OUT_KEY = "sherwood.cognito.signed-out";
const LOGOUT_BROADCAST_CHANNEL = "sherwood_auth_sync";

// Module-level synchronous flag: immediately prevents React components from auto-redirecting to login
let isSigningOut = false;

export function getIsSigningOut() {
  return isSigningOut;
}

export function setIsSigningOut(val) {
  isSigningOut = Boolean(val);
}

function safeStorage(callback) {
  try {
    if (typeof window !== "undefined") {
      if (window.sessionStorage) callback(window.sessionStorage);
      if (window.localStorage) callback(window.localStorage);
    }
  } catch {
    // Private browsing or storage policies must never prevent user logout.
  }
}

export function markSignedOut() {
  isSigningOut = true;
  try {
    window.sessionStorage?.setItem(SIGNED_OUT_KEY, "true");
    // Also set in localStorage with a timestamp so 'storage' events trigger across tabs
    window.localStorage?.setItem(SIGNED_OUT_KEY, String(Date.now()));
  } catch {
    // Fallback if storage access is restricted
  }
}

export function wasSignedOut() {
  if (isSigningOut) return true;
  try {
    return (
      window.sessionStorage?.getItem(SIGNED_OUT_KEY) === "true" ||
      Boolean(window.localStorage?.getItem(SIGNED_OUT_KEY))
    );
  } catch {
    return false;
  }
}

export function clearSignedOutMarker() {
  isSigningOut = false;
  try {
    window.sessionStorage?.removeItem(SIGNED_OUT_KEY);
    window.localStorage?.removeItem(SIGNED_OUT_KEY);
  } catch {
    // Storage access fallback
  }
}

export function clearBrowserAuthStorage() {
  safeStorage((storage) => {
    const keys = Array.from({ length: storage.length }, (_, index) => storage.key(index)).filter(Boolean);
    keys.forEach((key) => {
      if (
        key.startsWith("oidc.user:") ||
        key === "sheerwood.local.user" ||
        key === "sheerwood.cognito.session" ||
        key.startsWith("sheerwood.cognito.transaction.")
      ) {
        storage.removeItem(key);
      }
    });
  });
}

/**
 * Broadcast logout to other open browser tabs
 */
export function broadcastLogout() {
  try {
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      const channel = new BroadcastChannel(LOGOUT_BROADCAST_CHANNEL);
      channel.postMessage({ type: "LOGOUT", timestamp: Date.now() });
      channel.close();
    }
  } catch {
    // Storage event acts as fallback
  }
}

/**
 * Listen for logout events from other tabs and invoke callback
 */
export function initCrossTabLogout(onRemoteLogout) {
  if (typeof window === "undefined") return () => {};

  let channel = null;
  try {
    if ("BroadcastChannel" in window) {
      channel = new BroadcastChannel(LOGOUT_BROADCAST_CHANNEL);
      channel.onmessage = (event) => {
        if (event.data?.type === "LOGOUT") {
          setIsSigningOut(true);
          clearBrowserAuthStorage();
          onRemoteLogout();
        }
      };
    }
  } catch {
    channel = null;
  }

  const handleStorageEvent = (event) => {
    if (event.key === SIGNED_OUT_KEY && event.newValue) {
      setIsSigningOut(true);
      clearBrowserAuthStorage();
      onRemoteLogout();
    }
  };

  window.addEventListener("storage", handleStorageEvent);

  return () => {
    if (channel) {
      try {
        channel.close();
      } catch {
        // Ignored
      }
    }
    window.removeEventListener("storage", handleStorageEvent);
  };
}
