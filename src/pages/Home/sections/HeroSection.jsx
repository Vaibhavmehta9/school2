import React, { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import SchoolCrest from "../../../components/SchoolCrest";
import Button from "../../../components/Button/Button";
import { useAdmissionCta } from "../../../hooks/useAdmissionCta";
import homeHeroVideo from "../../../assets/home-hero-background.mp4";
import schoolCampusAerial from "../../../assets/sheerwood-campus-aerial-web.jpg";
import { isReducedMotion, gsap } from "../../../utils/motion";
import "./HeroSection.css";

export default function HeroSection({ onOpenCampusFilm, onOpenAdmissionCode }) {
  const { targetPath, hasExistingApplication } = useAdmissionCta();
  const heroRef = useRef(null);
  const copyRef = useRef(null);
  const ctaWrapRef = useRef(null);
  const scrollCueRef = useRef(null);
  const videoRef = useRef(null);

  // Counter refs
  const statYearsRef = useRef(null);
  const statPassRef = useRef(null);
  const statRatioRef = useRef(null);
  const statAcresRef = useRef(null);

  const [shouldPlayVideo, setShouldPlayVideo] = useState(false);

  // Pause video when off-screen or when browser tab is hidden
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          video.pause();
        } else if (!document.hidden && shouldPlayVideo) {
          video.play().catch(() => {});
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(video);

    const handleVisibility = () => {
      if (document.hidden) {
        video.pause();
      } else if (shouldPlayVideo) {
        video.play().catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [shouldPlayVideo]);

  // Subtle magnetic pull for hero "Start Admission" CTA (desktop only, no reduced motion)
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
    const isSaveData = Boolean(
      navigator.connection && navigator.connection.saveData
    );
    const prefersReduced = isReducedMotion();

    if (!prefersReduced && !isSaveData) {
      setShouldPlayVideo(true);
    }

    const ctx = gsap.context(() => {
      if (prefersReduced) {
        if (statYearsRef.current) statYearsRef.current.textContent = "150";
        if (statPassRef.current) statPassRef.current.textContent = "100";
        if (statRatioRef.current) statRatioRef.current.textContent = "1:12";
        if (statAcresRef.current) statAcresRef.current.textContent = "70";
        return;
      }

      // 1. Headline line-by-line reveal from mask
      const revealLines = gsap.utils.toArray(".sherwood-hero__reveal-line");
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.fromTo(
        revealLines,
        { yPercent: 120, opacity: 0 },
        { yPercent: 0, opacity: 1, duration: 1, stagger: 0.15, delay: 0.1 }
      )
        .fromTo(
          ".sherwood-hero__lead",
          { y: 24, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.8 },
          "-=0.5"
        )
        .fromTo(
          ".sherwood-hero__actions",
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.7 },
          "-=0.4"
        )
        .fromTo(
          ".sherwood-hero__metrics",
          { y: 16, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.7 },
          "-=0.3"
        )
        .fromTo(
          ".sherwood-hero__aside",
          { y: 30, opacity: 0, scale: 0.98 },
          { y: 0, opacity: 1, scale: 1, duration: 0.9 },
          "-=0.6"
        );

      // 2. Count-up numbers (150+, 100%, 1:12, 70 Acres)
      const countUp = (targetEl, targetVal, duration = 1.6) => {
        if (!targetEl) return;
        const counterObj = { val: 0 };
        gsap.to(counterObj, {
          val: targetVal,
          duration,
          ease: "power2.out",
          scrollTrigger: {
            trigger: targetEl,
            start: "top 95%",
            once: true,
          },
          onUpdate: () => {
            targetEl.textContent = Math.floor(counterObj.val);
          },
          onComplete: () => {
            targetEl.textContent = targetVal;
          },
        });
      };

      countUp(statYearsRef.current, 150, 1.8);
      countUp(statPassRef.current, 100, 1.5);
      countUp(statAcresRef.current, 70, 1.4);
      if (statRatioRef.current) {
        gsap.fromTo(
          statRatioRef.current,
          { opacity: 0, scale: 0.8 },
          { opacity: 1, scale: 1, duration: 0.8, delay: 0.6 }
        );
      }

      // 3. Desktop parallax on background video/image
      if (window.innerWidth > 960) {
        gsap.to(".sherwood-hero__video, .sherwood-hero__poster", {
          yPercent: 12,
          ease: "none",
          scrollTrigger: {
            trigger: heroRef.current,
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
        });
      }

      // 4. Scroll-down cue fade on scroll
      if (scrollCueRef.current) {
        gsap.to(scrollCueRef.current, {
          opacity: 0,
          y: 20,
          ease: "power1.out",
          scrollTrigger: {
            trigger: heroRef.current,
            start: "top top",
            end: "25% top",
            scrub: true,
          },
        });
      }
    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="home" className="sherwood-hero" ref={heroRef}>
      <div className="sherwood-hero__background" aria-hidden="true">
        {shouldPlayVideo ? (
          <video
            ref={videoRef}
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
            <span className="sherwood-hero__mask-line">
              <span className="sherwood-hero__reveal-line">Where young minds</span>
            </span>
            <span className="sherwood-hero__mask-line">
              <span className="sherwood-hero__reveal-line">
                <em>grow with purpose.</em>
              </span>
            </span>
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
                to={targetPath}
                variant="gold"
                size="lg"
              >
                {hasExistingApplication ? "Continue Application" : "Start Admission"} <span>→</span>
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
              <strong>
                <span ref={statYearsRef}>150</span>+
              </strong>
              <small>Years of Heritage</small>
            </div>
            <div className="sherwood-hero__metric-divider" />
            <div className="sherwood-hero__metric">
              <strong>
                <span ref={statPassRef}>100</span>%
              </strong>
              <small>Board Pass Record</small>
            </div>
            <div className="sherwood-hero__metric-divider" />
            <div className="sherwood-hero__metric">
              <strong ref={statRatioRef}>1:12</strong>
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
              <strong>
                <span ref={statAcresRef}>70</span> Acres
              </strong>
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

      {/* Scroll-down cue that fades on scroll */}
      <div className="sherwood-hero__scroll-cue" ref={scrollCueRef} aria-hidden="true">
        <span>Scroll to explore</span>
        <div className="sherwood-hero__scroll-pill">
          <div className="sherwood-hero__scroll-dot" />
        </div>
      </div>
    </section>
  );
}

HeroSection.propTypes = {
  onOpenCampusFilm: PropTypes.func.isRequired,
  onOpenAdmissionCode: PropTypes.func.isRequired,
};
