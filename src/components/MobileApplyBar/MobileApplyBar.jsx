import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Button from "../Button/Button";
import { useAdmissionCta } from "../../hooks/useAdmissionCta";
import "./MobileApplyBar.css";

export default function MobileApplyBar() {
  const { targetPath, hasExistingApplication } = useAdmissionCta();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Appear after scrolling past hero (~450px)
      const shouldShow = window.scrollY > 450;
      setVisible(shouldShow);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!visible) return null;

  return (
    <aside
      className="sherwood-mobile-apply-bar"
      role="region"
      aria-label="Mobile Quick Apply Bar"
    >
      <div className="sherwood-mobile-apply-bar__content">
        <div className="sherwood-mobile-apply-bar__label">
          <span className="sherwood-mobile-apply-bar__dot" aria-hidden="true" />
          <div className="sherwood-mobile-apply-bar__text">
            <strong>Admissions 2027–28</strong>
            <small>Classes 3–9 &amp; 11</small>
          </div>
        </div>

        <Button
          as={Link}
          to={targetPath}
          variant="gold"
          size="sm"
          className="sherwood-mobile-apply-bar__btn"
        >
          {hasExistingApplication ? "Continue Application" : "Apply 2027–28"} <span>→</span>
        </Button>
      </div>
    </aside>
  );
}

