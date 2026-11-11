import React from "react";
import { Link } from "react-router-dom";
import Button from "../../../components/Button/Button";
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
  return (
    <section id="admission-process" className="sherwood-timeline">
      <div className="sherwood-timeline__container">
        <header className="sherwood-timeline__header">
          <span className="sherwood-section-label">ADMISSIONS 2027–28</span>
          <h2 className="sherwood-timeline__title">5-Step Admission Journey</h2>
          <p className="sherwood-timeline__subtitle">
            A transparent, merit-oriented admissions process designed to welcome new Sherwoodians
            into Classes 3 through 9, and Class 11.
          </p>
        </header>

        <div className="sherwood-timeline__track">
          {steps.map((item, index) => (
            <div key={item.step} className="sherwood-timeline__step">
              <div className="sherwood-timeline__step-marker">
                <span className="sherwood-timeline__step-num">{item.step}</span>
                {index < steps.length - 1 && <span className="sherwood-timeline__line" />}
              </div>
              <div className="sherwood-timeline__content">
                <h3 className="sherwood-timeline__step-title">{item.title}</h3>
                <p className="sherwood-timeline__step-desc">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="sherwood-timeline__footer">
          <Button as={Link} to="/login?flow=admission" variant="gold" size="md">
            Begin Application Process <span>→</span>
          </Button>
          <Button as={Link} to="/admission-details" variant="outline" size="md">
            View Eligibility & Age Cutoffs
          </Button>
        </div>
      </div>
    </section>
  );
}

