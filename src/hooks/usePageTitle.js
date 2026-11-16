import { useEffect } from "react";

const BASE_TITLE = "Sherwood College";

/**
 * Custom lightweight React hook to set per-page browser titles and robots meta.
 * @param {string} title - Page title to display in browser tab
 * @param {object} options - Options object
 * @param {boolean} options.noIndex - Whether this page is private and should set noindex, nofollow
 */
export function usePageTitle(title, { noIndex = false } = {}) {
  useEffect(() => {
    const prevTitle = document.title;
    if (title) {
      document.title = title.includes(BASE_TITLE) ? title : `${title} | ${BASE_TITLE}`;
    }

    let robotsMeta = document.querySelector('meta[name="robots"]');
    let createdRobotsMeta = false;

    if (!robotsMeta) {
      robotsMeta = document.createElement("meta");
      robotsMeta.setAttribute("name", "robots");
      document.head.appendChild(robotsMeta);
      createdRobotsMeta = true;
    }

    const prevRobots = robotsMeta.getAttribute("content") || "index, follow";
    robotsMeta.setAttribute("content", noIndex ? "noindex, nofollow" : "index, follow");

    return () => {
      document.title = prevTitle;
      if (robotsMeta) {
        if (!createdRobotsMeta) {
          robotsMeta.setAttribute("content", prevRobots);
        } else if (robotsMeta.parentNode) {
          robotsMeta.parentNode.removeChild(robotsMeta);
        }
      }
    };
  }, [title, noIndex]);
}

export default usePageTitle;

