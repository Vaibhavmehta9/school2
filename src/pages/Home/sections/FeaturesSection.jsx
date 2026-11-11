import React from "react";
import Card from "../../../components/Card/Card";
import "./FeaturesSection.css";

const features = [
  {
    number: "01",
    icon: "✦",
    title: "Smart Classrooms",
    text: "Interactive digital learning environments equipped with modern pedagogical tools designed for active student engagement.",
  },
  {
    number: "02",
    icon: "◆",
    title: "Sports & Co-Curricular",
    text: "State-level athletics, visual arts, Western & Indian music, debate societies, and outdoor leadership programs.",
  },
  {
    number: "03",
    icon: "✓",
    title: "Safe Residential Campus",
    text: "A 24/7 guarded, caring pastoral environment with dedicated housemasters, infirmary staff, and wellness counsellors.",
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="sherwood-features">
      <div className="sherwood-features__container">
        <header className="sherwood-features__header">
          <span className="sherwood-section-label">ACADEMIC & RESIDENTIAL PILLARS</span>
          <h2 className="sherwood-features__title">The Sherwood Foundation</h2>
          <p className="sherwood-features__subtitle">
            Every aspect of campus life is thoughtfully crafted to foster intellectual rigor,
            moral integrity, and all-round personal growth.
          </p>
        </header>

        <div className="sherwood-features__grid">
          {features.map((item) => (
            <Card
              key={item.number}
              variant="interactive"
              padding="lg"
              className="sherwood-features__card"
            >
              <div className="sherwood-features__card-top">
                <span className="sherwood-features__number">{item.number}</span>
                <span className="sherwood-features__icon" aria-hidden="true">
                  {item.icon}
                </span>
              </div>
              <h3 className="sherwood-features__card-title">{item.title}</h3>
              <p className="sherwood-features__card-text">{item.text}</p>
              <a href="#contact" className="sherwood-features__explore">
                Explore life at Sherwood <span>→</span>
              </a>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

