import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Button from "../../../components/Button/Button";
import { isReducedMotion, gsap } from "../../../utils/motion";
import "./AdmissionTimelineSection.css";

const steps = [
  {
    step: "01",
    title: "Online Registration",
    desc: "Complete the candidate profile, upload past academic transcripts, and pay the registration fee.",
  },
  {
    step: "02",
    title: "Entrance Assessment",
    desc: "Online evaluation in English and Mathematics (1 hour per paper) administered after registration.",
  },
  {
    step: "03",
    title: "Panel Interaction",
    desc: "An interview with the candidate and parents conducted by the Principal and Senior Faculty panel.",
  },
  {
    step: "04",
    title: "Offer of Admission",
    desc: "Successful candidates receive a formal admission offer based on combined test and interview merit.",
  },
  {
    step: "05",
    title: "Enrollment & House",
    desc: "Complete fee deposition, medical clearance, and receive house allocation and term opening pack.",
  },
];

export default function AdmissionTimelineSection() {
  const sectionRef = useRef(null);
  const trackRef = useRef(null);
  const progressBarRef = useRef(null);
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  useEffect(() => {
    if (isReducedMotion()) {
      setActiveStepIndex(4);
      return undefined;
    }

    const ctx = gsap.context(() => {
      const isMobile = window.innerWidth <= 768;

      // Animate progress bar fill along the timeline as user scrolls
      gsap.fromTo(
        progressBarRef.current,
        isMobile ? { scaleY: 0 } : { scaleX: 0 },
        {
          scaleX: 1,
          scaleY: 1,
          ease: "none",
          scrollTrigger: {
            trigger: trackRef.current,
            start: "top 75%",
            end: "bottom 60%",
            scrub: 0.5,
            onUpdate: (self) => {
              const currentStep = Math.min(
                steps.length - 1,
                Math.floor(self.progress * steps.length)
              );
              setActiveStepIndex(currentStep);
            },
          },
        }
      );

      // Staggered entrance for steps
      gsap.from(".sherwood-timeline__step", {
        y: 30,
        opacity: 0,
        duration: 0.7,
        stagger: 0.1,
        ease: "power2.out",
        scrollTrigger: {
          trigger: trackRef.current,
          start: "top 85%",
          once: true,
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="admission-process" className="sherwood-timeline" ref={sectionRef}>
      <div className="sherwood-timeline__container">
        <header className="sherwood-timeline__header">
          <span className="sherwood-section-label">ADMISSIONS 2027–28</span>
          <h2 className="sherwood-timeline__title">5-Step Admission Journey</h2>
          <p className="sherwood-timeline__subtitle">
            A transparent, merit-oriented admissions process designed to welcome new Sherwoodians
            into Classes 3 through 9, and Class 11.
          </p>
        </header>

        <div className="sherwood-timeline__track-wrap" ref={trackRef}>
          {/* Continuous progress track and animated gold fill line */}
          <div className="sherwood-timeline__progress-track" aria-hidden="true" />
          <div
            className="sherwood-timeline__progress-bar"
            ref={progressBarRef}
            aria-hidden="true"
          />

          <div className="sherwood-timeline__track">
            {steps.map((item, index) => {
              const isActive = index <= activeStepIndex;
              return (
                <div
                  key={item.step}
                  className={`sherwood-timeline__step ${isActive ? "sherwood-timeline__step--active" : ""}`}
                >
                  <div className="sherwood-timeline__step-marker">
                    <span className="sherwood-timeline__step-num">{item.step}</span>
                  </div>
                  <div className="sherwood-timeline__content">
                    <h3 className="sherwood-timeline__step-title">{item.title}</h3>
                    <p className="sherwood-timeline__step-desc">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="sherwood-timeline__footer">
          <Button as={Link} to="/admission-details" variant="gold" size="md">
            Begin Application Process <span>→</span>
          </Button>
          <Button as={Link} to="/admission-details" variant="outline" size="md">
            View Eligibility &amp; Age Cutoffs
          </Button>
        </div>
      </div>
    </section>
  );
}
