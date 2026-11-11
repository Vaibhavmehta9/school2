import React from "react";
import { Link } from "react-router-dom";
import Button from "../../../components/Button/Button";
import "./AdmissionCtaSection.css";

export default function AdmissionCtaSection() {
  return (
    <>
      <section id="admission" className="sherwood-cta">
        <div className="sherwood-cta__container">
          <span className="sherwood-cta__eyebrow">2027–28 ADMISSIONS NOW OPEN</span>
          <h2 className="sherwood-cta__title">
            Your child’s next great<br />chapter starts here.
          </h2>
          <p className="sherwood-cta__lead">
            Join a 150-year legacy of leadership, courage, and intellectual achievement in the serene hills of Nainital.
          </p>
          <div className="sherwood-cta__actions">
            <Button as={Link} to="/login?flow=admission" variant="gold" size="lg">
              Apply for Admission <span>→</span>
            </Button>
            <Button as={Link} to="/track-application" variant="outline-gold" size="lg">
              Track Application Status
            </Button>
          </div>
        </div>
      </section>

      <section className="sherwood-social" aria-labelledby="follow-us-title">
        <div className="sherwood-social__container">
          <h3 id="follow-us-title" className="sherwood-social__title">Connect with Sherwood College</h3>
          <div className="sherwood-social__links">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="sherwood-social__link"
              aria-label="Follow Sherwood College on Facebook"
            >
              f
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="sherwood-social__link"
              aria-label="Follow Sherwood College on Twitter/X"
            >
              𝕏
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="sherwood-social__link"
              aria-label="Follow Sherwood College on LinkedIn"
            >
              in
            </a>
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              className="sherwood-social__link"
              aria-label="Follow Sherwood College on YouTube"
            >
              ▶
            </a>
          </div>
        </div>
      </section>
    </>
  );
}

