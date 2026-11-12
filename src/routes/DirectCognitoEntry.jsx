import { Navigate } from "react-router-dom";
import { ROUTES } from "../constants/routes";

// In review mode, redirect direct entry directly to /login with admission details returnTo
export default function DirectCognitoEntry() {
  return <Navigate to={`/login?returnTo=${encodeURIComponent(ROUTES.admissionDetails)}`} replace />;
}
