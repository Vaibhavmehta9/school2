import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ROUTE_TITLE_MAP = {
  "/": { title: "Sherwood College, Nainital | Admissions 2027-28", noIndex: false },
  "/gallery": { title: "Campus Gallery | Sherwood College", noIndex: false },
  "/calendar": { title: "Academic Calendar | Sherwood College", noIndex: false },
  "/virtual-tour": { title: "Virtual Campus Tour | Sherwood College", noIndex: false },
  "/apply": { title: "Apply for Admission | Sherwood College", noIndex: false },
  "/register": { title: "Apply for Admission | Sherwood College", noIndex: false },
  "/track-application": { title: "Track Application Status | Sherwood College", noIndex: false },
  "/ai-assistant": { title: "Admissions AI Assistant | Sherwood College", noIndex: false },

  // Private routes (noindex, nofollow)
  "/login": { title: "Portal Login | Sherwood College", noIndex: true },
  "/cognito-entry": { title: "Authenticating | Sherwood College", noIndex: true },
  "/signed-out": { title: "Signed Out | Sherwood College", noIndex: true },
  "/dashboard": { title: "Parent Dashboard | Sherwood College", noIndex: true },
  "/new-user-dashboard": { title: "Application Overview | Sherwood College", noIndex: true },
  "/admission-details": { title: "Admission Form | Sherwood College", noIndex: true },
  "/student-information": { title: "Student Details | Sherwood College", noIndex: true },
  "/parent-guardian": { title: "Guardian Details | Sherwood College", noIndex: true },
  "/application/documents": { title: "Upload Documents | Sherwood College", noIndex: true },
  "/fee-payment": { title: "Fee Payment | Sherwood College", noIndex: true },
  "/application-success": { title: "Submission Confirmed | Sherwood College", noIndex: true },
  "/consent-withdrawal": { title: "Consent Settings | Sherwood College", noIndex: true },
  "/student/dashboard": { title: "Student Portal | Sherwood College", noIndex: true },
  "/teacher/dashboard": { title: "Teacher Portal | Sherwood College", noIndex: true },
  "/vendor/dashboard": { title: "Vendor Portal | Sherwood College", noIndex: true },
};

/**
 * RouteTitleTracker: Mounts inside BrowserRouter to automatically manage
 * document.title and robots meta tag on route transitions and browser history navigation.
 */
export default function RouteTitleTracker() {
  const location = useLocation();

  useEffect(() => {
    const pathname = location.pathname;
    let match = ROUTE_TITLE_MAP[pathname];

    if (!match) {
      if (pathname.startsWith("/admin")) {
        match = { title: "Admin Portal | Sherwood College", noIndex: true };
      } else if (pathname.startsWith("/application/")) {
        match = { title: "Admission Application | Sherwood College", noIndex: true };
      } else {
        match = { title: "Sherwood College, Nainital | Admissions 2027-28", noIndex: false };
      }
    }

    document.title = match.title;

    let robotsMeta = document.querySelector('meta[name="robots"]');
    if (!robotsMeta) {
      robotsMeta = document.createElement("meta");
      robotsMeta.setAttribute("name", "robots");
      document.head.appendChild(robotsMeta);
    }
    robotsMeta.setAttribute("content", match.noIndex ? "noindex, nofollow" : "index, follow");
  }, [location.pathname]);

  return null;
}
