import React, { useEffect, useRef, useState } from "react";
import principalDeskPortrait from "../../../assets/principal-desk-portrait.png";
import Button from "../../../components/Button/Button";
import { isReducedMotion, gsap } from "../../../utils/motion";
import "./PrincipalSection.css";

export default function PrincipalSection() {
  const [expanded, setExpanded] = useState(false);
  const sectionRef = useRef(null);
  const portraitRef = useRef(null);
  const quoteBarRef = useRef(null);

  useEffect(() => {
    if (isReducedMotion()) return undefined;

    const ctx = gsap.context(() => {
      // 1. Portrait clip-path reveal from the left
      if (portraitRef.current) {
        gsap.fromTo(
          portraitRef.current,
          { clipPath: "inset(0% 100% 0% 0%)" },
          {
            clipPath: "inset(0% 0% 0% 0%)",
            duration: 1.1,
            ease: "power3.inOut",
            scrollTrigger: {
              trigger: portraitRef.current,
              start: "top 80%",
              once: true,
            },
          }
        );
      }

      // 2. Gold quote bar grows downward
      if (quoteBarRef.current) {
        gsap.fromTo(
          quoteBarRef.current,
          { scaleY: 0 },
          {
            scaleY: 1,
            duration: 0.9,
            ease: "power2.out",
            scrollTrigger: {
              trigger: quoteBarRef.current,
              start: "top 85%",
              once: true,
            },
          }
        );
      }

      // 3. Staggered reveal for quote and paragraphs
      gsap.from(".sherwood-principal__reveal-item", {
        y: 25,
        opacity: 0,
        duration: 0.75,
        stagger: 0.12,
        ease: "power2.out",
        scrollTrigger: {
          trigger: ".sherwood-principal__content",
          start: "top 82%",
          once: true,
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section className="sherwood-principal" ref={sectionRef}>
      <div className="sherwood-principal__container">
        <div className="sherwood-principal__card">
          <div className="sherwood-principal__portrait-wrap" ref={portraitRef}>
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
            <span className="sherwood-section-label sherwood-principal__reveal-item">
              FROM THE PRINCIPAL'S DESK
            </span>
            <h2 className="sherwood-principal__title sherwood-principal__reveal-item">
              Fostering Excellence, Character &amp; Service
            </h2>

            <blockquote className="sherwood-principal__quote sherwood-principal__reveal-item">
              <span className="sherwood-principal__quote-bar" ref={quoteBarRef} aria-hidden="true" />
              “At Sherwood College, every child is encouraged to grow into a confident, compassionate
              and responsible citizen—grounded in sound values and ready to contribute with purpose.”
            </blockquote>

            <p className="sherwood-principal__paragraph sherwood-principal__reveal-item">
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

            <div className="sherwood-principal__signature-block sherwood-principal__reveal-item">
              <div className="sherwood-principal__sign-info">
                <strong>Mr. Amandeep Sandhu</strong>
                <small>Principal, Sherwood College, Nainital</small>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setExpanded(!expanded)}
                aria-expanded={expanded}
              >
                {expanded ? "Read Less" : "Read Full Address"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
