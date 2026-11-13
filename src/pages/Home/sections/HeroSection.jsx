import React, { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import SchoolCrest from "../../../components/SchoolCrest";
import Button from "../../../components/Button/Button";
import homeHeroVideo from "../../../assets/home-hero-background.mp4";
import schoolCampusAerial from "../../../assets/sheerwood-campus-aerial-web.jpg";
import { isReducedMotion, fadeInUp } from "../../../utils/motion";
import "./HeroSection.css";

export default function HeroSection({ onOpenCampusFilm, onOpenAdmissionCode }) {
  const heroRef = useRef(null);
  const copyRef = useRef(null);
  const ctaWrapRef = useRef(null);
  const [shouldPlayVideo, setShouldPlayVideo] = useState(false);

  const handleMagneticMove = (e) => {
    if (isReducedMotion()) return;
    const el = ctaWrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    el.style.transform = `translate(${x * 0.15}px, ${y * 0.15 - 2}px)`;
  };

  const handleMagneticLeave = () => {
    const el = ctaWrapRef.current;
    if (!el) return;
    el.style.transform = "";
  };

  useEffect(() => {
    // Only autoplay background video if user does NOT prefer reduced motion and does NOT have Save-Data
    const isSaveData = Boolean(
      navigator.connection && navigator.connection.saveData
    );
    const prefersReduced = isReducedMotion();

    if (!prefersReduced && !isSaveData) {
      setShouldPlayVideo(true);
    }

    if (copyRef.current) {
      fadeInUp(copyRef.current.children, {
        stagger: 0.1,
        y: 20,
        duration: 0.7,
      });
    }
  }, []);

  return (
    <section id="home" className="sherwood-hero" ref={heroRef}>
      <div className="sherwood-hero__background" aria-hidden="true">
        {shouldPlayVideo ? (
          <video
            className="sherwood-hero__video"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster={schoolCampusAerial}
          >
            <source src={homeHeroVideo} type="video/mp4" />
          </video>
        ) : (
          <img
            src={schoolCampusAerial}
            alt=""
            className="sherwood-hero__poster"
            loading="eager"
          />
        )}
        <div className="sherwood-hero__overlay" />
      </div>

      <div className="sherwood-hero__container">
        <div className="sherwood-hero__copy" ref={copyRef}>
          <div className="sherwood-hero__badge">
            <span className="sherwood-hero__badge-dot" />
            Admissions Open for Academic Year 2027–28
          </div>

          <h1 className="sherwood-hero__headline">
            Where young minds<br />
            <em>grow with purpose.</em>
          </h1>

          <p className="sherwood-hero__lead">
            Academic excellence, rooted values and future-ready leadership—all within
            our historic 70-acre campus in the hills of Nainital.
          </p>

          <div className="sherwood-hero__actions">
            <div
              ref={ctaWrapRef}
              onMouseMove={handleMagneticMove}
              onMouseLeave={handleMagneticLeave}
              className="sherwood-hero__cta-magnetic-wrap"
            >
              <Button
                as={Link}
                to="/admission-details"
                variant="gold"
                size="lg"
              >
                Start Admission <span>→</span>
              </Button>
            </div>

            <Button
              variant="secondary"
              size="lg"
              onClick={onOpenAdmissionCode}
              icon={<span aria-hidden="true">▦</span>}
            >
              Scan to Apply
            </Button>

            <Link className="sherwood-hero__login-link" to="/login">
              Already applied? <strong>Login</strong>
            </Link>
          </div>

          <div className="sherwood-hero__metrics">
            <div className="sherwood-hero__metric">
              <strong>150+</strong>
              <small>Years of Heritage</small>
            </div>
            <div className="sherwood-hero__metric-divider" />
            <div className="sherwood-hero__metric">
              <strong>100%</strong>
              <small>Board Pass Record</small>
            </div>
            <div className="sherwood-hero__metric-divider" />
            <div className="sherwood-hero__metric">
              <strong>1:12</strong>
              <small>Faculty to Student Ratio</small>
            </div>
          </div>
        </div>

        <aside className="sherwood-hero__aside" aria-label="Campus Highlights">
          <div className="sherwood-hero__aside-crest-wrap">
            <SchoolCrest className="sherwood-hero__aside-crest" />
          </div>
          <span className="sherwood-hero__aside-eyebrow">ESTABLISHED 1869</span>
          <h2 className="sherwood-hero__aside-title">
            Inspired by<br />the hills.
          </h2>
          <p className="sherwood-hero__aside-desc">
            A sanctuary of learning where tradition meets modern innovation and panoramic Himalayan horizons.
          </p>

          <div className="sherwood-hero__aside-chips">
            <div className="sherwood-hero__chip">
              <strong>70 Acres</strong>
              <small>Lush Campus</small>
            </div>
            <div className="sherwood-hero__chip">
              <strong>ICSE / ISC</strong>
              <small>Curriculum</small>
            </div>
          </div>

          <Button
            variant="outline-gold"
            size="md"
            className="sherwood-hero__aside-btn"
            onClick={onOpenCampusFilm}
            icon={<span aria-hidden="true">▶</span>}
          >
            Watch Campus Film
          </Button>
        </aside>
      </div>
    </section>
  );
}

HeroSection.propTypes = {
  onOpenCampusFilm: PropTypes.func.isRequired,
  onOpenAdmissionCode: PropTypes.func.isRequired,
};

