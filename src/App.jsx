import React, { Suspense, useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import OidcReturnRedirect from "./routes/OidcReturnRedirect";
import RouteTitleTracker from "./components/RouteTitleTracker";
import { captureReferralAttribution } from "./services/admission";
import "./pages/AdmissionMobile.css";

// Lazy-loaded banner only included when VITE_REVIEW_MODE is explicitly "true".
const ReviewModeBanner = (import.meta.env.VITE_REVIEW_MODE === "true")
  ? React.lazy(() => import("./components/ReviewModeBanner"))
  : () => null;

export default function App() {
  useEffect(() => {
    captureReferralAttribution();
  }, []);

  return (
    <BrowserRouter>
      <RouteTitleTracker />
      <Suspense fallback={null}>
        <ReviewModeBanner />
      </Suspense>
      <OidcReturnRedirect />
      <AppRoutes />
    </BrowserRouter>
  );
}
