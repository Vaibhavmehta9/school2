import React, { useEffect, useRef } from "react";
import Card from "../../../components/Card/Card";
import { isReducedMotion, gsap } from "../../../utils/motion";
import "./FeaturesSection.css";

const features = [
  {
    number: "01",
    title: "Smart Classrooms & STEM Labs",
    text: "Interactive digital learning environments equipped with modern pedagogical tools designed for active student engagement and ICSE distinction.",
    linkTarget: "#about",
    linkLabel: "Explore Academic Curriculum",
    icon: (
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
        <path d="M6 6h10" />
        <path d="M6 10h10" />
        <path d="M6 14h6" />
        <circle cx="16.5" cy="14.5" r="2.5" />
      </svg>
    ),
  },
  {
    number: "02",
    title: "Character & Moral Leadership",
    text: "Rooted in our 1869 founding motto 'Mereat Quisque Palmam'—nurturing courage, moral integrity, public speaking, and service before self.",
    linkTarget: "#heritage",
    linkLabel: "Discover Character & Traditions",
    icon: (
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m14.5 9-5 2 2 5 3-7z" fill="currentColor" fillOpacity="0.2" />
        <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    number: "03",
    title: "Sports & Mountain Leadership",
    text: "Regattas on Naini Lake, cricket on Horsman field, mountaineering, squash, football, and Western choir for all-round distinction.",
    linkTarget: "#gallery",
    linkLabel: "Explore Sports & Activities",
    icon: (
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
        <path d="M4 22h16" />
        <path d="M10 14.66V17c0 .55-.45 1-1 1H7" />
        <path d="M14 14.66V17c0 .55.45 1 1 1h2" />
        <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
      </svg>
    ),
  },
];

export default function FeaturesSection() {
  const sectionRef = useRef(null);

  useEffect(() => {
    if (isReducedMotion()) return undefined;

    const ctx = gsap.context(() => {
      gsap.from(".sherwood-features__card", {
        y: 45,
        opacity: 0,
        duration: 0.8,
        stagger: 0.12,
        ease: "power2.out",
        scrollTrigger: {
          trigger: ".sherwood-features__grid",
          start: "top 82%",
          once: true,
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="features" className="sherwood-features" ref={sectionRef}>
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
              <a href={item.linkTarget} className="sherwood-features__explore">
                {item.linkLabel} <span>→</span>
              </a>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
