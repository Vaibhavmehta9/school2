import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import aboutCampus from "../../../assets/about-campus.png";
import Button from "../../../components/Button/Button";
import { isReducedMotion, gsap } from "../../../utils/motion";
import "./AboutSection.css";

export default function AboutSection() {
  const sectionRef = useRef(null);
  const imageFrameRef = useRef(null);
  const badgeRef = useRef(null);

  useEffect(() => {
    if (isReducedMotion()) return undefined;

    const ctx = gsap.context(() => {
      // 1. Welcome header line reveals
      gsap.from(".sherwood-about__welcome-line", {
        y: 40,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: "power2.out",
        scrollTrigger: {
          trigger: ".sherwood-about__welcome",
          start: "top 85%",
          once: true,
        },
      });

      // 2. Story narrative slide up
      gsap.from(".sherwood-about__narrative-item", {
        y: 30,
        opacity: 0,
        duration: 0.8,
        stagger: 0.12,
        ease: "power2.out",
        scrollTrigger: {
          trigger: ".sherwood-about__story-grid",
          start: "top 80%",
          once: true,
        },
      });

      // 3. Image frame clip-path wipe and zoom-out
      if (imageFrameRef.current) {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: imageFrameRef.current,
            start: "top 82%",
            once: true,
          },
        });

        tl.fromTo(
          imageFrameRef.current,
          { clipPath: "polygon(0 0, 0 0, 0 100%, 0 100%)" },
          {
            clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
            duration: 1.1,
            ease: "power3.inOut",
          }
        )
          .fromTo(
            ".sherwood-about__img",
            { scale: 1.12 },
            { scale: 1.0, duration: 1.2, ease: "power2.out" },
            "-=0.9"
          );

        // 4. "Est. 1869" badge slides in last
        if (badgeRef.current) {
          tl.fromTo(
            badgeRef.current,
            { x: 30, opacity: 0 },
            { x: 0, opacity: 1, duration: 0.6, ease: "back.out(1.5)" },
            "-=0.3"
          );
        }
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="about" className="sherwood-about" ref={sectionRef}>
      <div className="sherwood-about__container">
        <header className="sherwood-about__welcome">
          <div className="sherwood-about__welcome-left">
            <span className="sherwood-section-label sherwood-about__welcome-line">
              WELCOME TO SHERWOOD COLLEGE
            </span>
            <h2 className="sherwood-about__welcome-title">
              <span className="sherwood-about__welcome-line">Learning beyond</span>
              <span className="sherwood-about__welcome-line">the classroom.</span>
            </h2>
          </div>
          <div className="sherwood-about__welcome-right sherwood-about__welcome-line">
            <p>
              We nurture confident, compassionate and capable learners through a thoughtful
              blend of colonial heritage, modern technology, and personalized mentorship.
            </p>
            <a href="#features" className="sherwood-about__discover-link">
              Discover our college <span>↗</span>
            </a>
          </div>
        </header>

        <div className="sherwood-about__story-grid">
          <div className="sherwood-about__image-frame" ref={imageFrameRef}>
            <img
              src={aboutCampus}
              alt="A tree-lined entrance to the Sherwood College campus in Nainital"
              loading="lazy"
              width="640"
              height="440"
              className="sherwood-about__img"
            />
            <div className="sherwood-about__badge-overlay" ref={badgeRef}>
              <strong>Est. 1869</strong>
              <small>Nainital, Uttarakhand</small>
            </div>
          </div>

          <div className="sherwood-about__narrative">
            <span className="sherwood-section-label sherwood-about__narrative-item">OUR HERITAGE</span>
            <h2 className="sherwood-about__story-title sherwood-about__narrative-item">About Sherwood College</h2>

            <p className="sherwood-about__narrative-item">
              Nestled at an altitude of over 6,800 feet amidst lush pine forests, Sherwood College
              has stood as a bastion of character building and educational excellence for over a century
              and a half.
            </p>

            <p className="sherwood-about__narrative-item">
              Our close-knit residential community creates transformative opportunities across
              academics, arts, sports, and social service—guiding young women and men to discover
              their unique potential and emerge as empathetic global citizens.
            </p>

            <p className="sherwood-about__narrative-item">
              With dedicated faculty, state-of-the-art laboratory infrastructure, and expansive playing
              fields, we support students through every stage of their holistic development.
            </p>

            <div className="sherwood-about__cta sherwood-about__narrative-item">
              <Button as={Link} to="/admission-details" variant="primary" size="md">
                Discover Sherwood College <span>→</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
