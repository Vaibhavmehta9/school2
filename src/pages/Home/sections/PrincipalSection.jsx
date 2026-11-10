import React, { useState } from "react";
import principalDeskPortrait from "../../../assets/principal-desk-portrait.png";
import Button from "../../../components/Button/Button";
import "./PrincipalSection.css";

export default function PrincipalSection() {
  const [expanded, setExpanded] = useState(false);

  return (
    <section className="sherwood-principal">
      <div className="sherwood-principal__container">
        <div className="sherwood-principal__card">
          <div className="sherwood-principal__portrait-wrap">
            <img
              src={principalDeskPortrait}
              alt="Mr. Amandeep Sandhu, Principal of Sherwood College"
              loading="lazy"
              width="480"
              height="560"
              className="sherwood-principal__portrait"
            />
            <div className="sherwood-principal__portrait-badge">
              <strong>Leadership</strong>
              <small>Sherwood College</small>
            </div>
          </div>

          <div className="sherwood-principal__content">
            <span className="sherwood-section-label">FROM THE PRINCIPAL'S DESK</span>
            <h2 className="sherwood-principal__title">
              Fostering Excellence, Character &amp; Service
            </h2>

            <blockquote className="sherwood-principal__quote">
              “At Sherwood College, every child is encouraged to grow into a confident, compassionate
              and responsible citizen—grounded in sound values and ready to contribute with purpose.”
            </blockquote>

            <p className="sherwood-principal__paragraph">
              Education here is not merely about syllabus completion; it is a transformative journey
              of self-discovery. Through rigorous academics, outdoor adventure in the Kumaon hills,
              and our time-honored house system, we shape independent thinkers with enduring moral strength.
            </p>

            {expanded && (
              <p className="sherwood-principal__paragraph sherwood-principal__paragraph--extra">
                Our distinguished educators create an atmosphere of warmth and high expectations,
                ensuring every student receives the individualized mentorship required to realize their
                fullest potential in higher education and life beyond our gates.
              </p>
            )}

            <div className="sherwood-principal__signature-block">
              <div className="sherwood-principal__sign-info">
                <strong>Mr. Amandeep Sandhu</strong>
                <small>Principal, Sherwood College, Nainital</small>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? "Show Less" : "Read More"} <span>→</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
