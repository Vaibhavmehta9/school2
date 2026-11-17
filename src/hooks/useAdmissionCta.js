import { useEffect, useState } from "react";
import { useCognitoAuth } from "../auth/useCognitoAuth";
import { getCurrentAdmissionStatus } from "../services/admission";

export function useAdmissionCta() {
  const { session, user } = useCognitoAuth();
  const [hasExistingApplication, setHasExistingApplication] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState(null);
  const [applicationNumber, setApplicationNumber] = useState(null);
  const [loading, setLoading] = useState(Boolean(session?.accessToken));

  useEffect(() => {
    if (!session?.accessToken || user?.role !== "parent") {
      setHasExistingApplication(false);
      setApplicationStatus(null);
      setApplicationNumber(null);
      setLoading(false);
      return;
    }

    let isMounted = true;
    getCurrentAdmissionStatus(session.accessToken)
      .then((status) => {
        if (!isMounted) return;
        const app = status?.application;
        if (app?.application_number) {
          setHasExistingApplication(true);
          setApplicationStatus(app.status || "draft");
          setApplicationNumber(app.application_number);
        } else {
          setHasExistingApplication(false);
          setApplicationStatus(null);
          setApplicationNumber(null);
        }
      })
      .catch(() => {
        if (isMounted) {
          setHasExistingApplication(false);
          setApplicationStatus(null);
          setApplicationNumber(null);
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [session?.accessToken, user?.role]);

  // Signed-out visitors go to sign-in / registration and return to admission-details
  const targetPath = session
    ? "/admission-details"
    : `/login?returnTo=${encodeURIComponent("/admission-details")}`;

  const ctaLabel = hasExistingApplication ? "Continue Application" : "Start Application";

  return {
    targetPath,
    ctaLabel,
    hasExistingApplication,
    applicationStatus,
    applicationNumber,
    loading,
    session,
    user,
  };
}
