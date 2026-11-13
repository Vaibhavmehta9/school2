import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ChatPanel from "../components/ChatPanel/ChatPanel";
import SherwoodAIAvatar from "../components/ChatPanel/SherwoodAIAvatar";
import { useCognitoAuth } from "../auth/useCognitoAuth";
import { initSmoothScrolling, ScrollTrigger } from "../utils/motion";

// Modular Section Components
import Navbar from "./Home/sections/Navbar";
import HeroSection from "./Home/sections/HeroSection";
import MarqueeBanner from "./Home/sections/MarqueeBanner";
import AboutSection from "./Home/sections/AboutSection";
import FeaturesSection from "./Home/sections/FeaturesSection";
import AdmissionTimelineSection from "./Home/sections/AdmissionTimelineSection";
import PrincipalSection from "./Home/sections/PrincipalSection";
import TestimonialSection from "./Home/sections/TestimonialSection";
import GallerySection from "./Home/sections/GallerySection";
import EventsSection from "./Home/sections/EventsSection";
import AdmissionCtaSection from "./Home/sections/AdmissionCtaSection";
import FooterSection from "./Home/sections/FooterSection";
import CampusFilmModal from "./Home/sections/CampusFilmModal";
import AdmissionCodeModal from "./Home/sections/AdmissionCodeModal";

import "./Home.css";

export default function Home() {
  const navigate = useNavigate();
  const { user, session, signOut } = useCognitoAuth();
  const launcherRef = useRef(null);

  // Modal States - campusFilmOpen defaults to false (prevent auto popup on page load)
  const [campusFilmOpen, setCampusFilmOpen] = useState(false);
  const [admissionCodeOpen, setAdmissionCodeOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [hasAttentionPulse, setHasAttentionPulse] = useState(false);
  const [isScrolledCompact, setIsScrolledCompact] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const idleTimerRef = useRef(null);
  const scrollTimerRef = useRef(null);

  // Track global scroll progress for top gold progress bar
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight > 0) {
        setScrollProgress(Math.min(1, Math.max(0, scrollTop / scrollHeight)));
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Refresh ScrollTrigger after component mount and asset loading
  useEffect(() => {
    const timer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  // Soft attention pulse after 8 seconds (once per session)
  useEffect(() => {
    try {
      const alreadyPulsed = sessionStorage.getItem("sherwood_ai_pulsed");
      if (!alreadyPulsed) {
        const timer = setTimeout(() => {
          setHasAttentionPulse(true);
          sessionStorage.setItem("sherwood_ai_pulsed", "true");
          setTimeout(() => setHasAttentionPulse(false), 2600);
        }, 8000);
        return () => clearTimeout(timer);
      }
    } catch {
      // Storage unavailable in restricted mode
    }
    return undefined;
  }, []);

  // Collapse launcher to 56px icon-only circle during scroll; re-expand after 2s of idleness
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolledCompact(true);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);

      scrollTimerRef.current = setTimeout(() => {
        idleTimerRef.current = setTimeout(() => {
          setIsScrolledCompact(false);
        }, 2000);
      }, 150);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    };
  }, []);

  // Smooth inertial scrolling setup
  useEffect(() => {
    const lenis = initSmoothScrolling();
    return () => {
      if (lenis) lenis.destroy();
    };
  }, []);

  // Hash-based redirect for mobile scanning
  useEffect(() => {
    if (window.location.hash === "#start-admission") {
      navigate("/new-user-dashboard", { replace: true });
    }
  }, [navigate]);

  return (
    <div className="sherwood-home-page">
      {/* Top Gold Scroll Progress Bar */}
      <div
        className="sherwood-scroll-progress-bar"
        style={{ transform: `scaleX(${scrollProgress})` }}
        aria-hidden="true"
      />

      {/* 1. Sticky Navigation */}
      <Navbar user={user} signOut={signOut} />

      {/* 2. Main Institutional Content */}
      <main id="main-content">
        <HeroSection
          onOpenCampusFilm={() => setCampusFilmOpen(true)}
          onOpenAdmissionCode={() => setAdmissionCodeOpen(true)}
        />
        <MarqueeBanner />
        <AboutSection />
        <FeaturesSection />
        <AdmissionTimelineSection />
        <PrincipalSection />
        <TestimonialSection />
        <GallerySection />
        <EventsSection />
        <AdmissionCtaSection />
      </main>

      {/* 3. Institutional Footer */}
      <FooterSection />

      {/* 4. On-demand Modals */}
      <CampusFilmModal
        isOpen={campusFilmOpen}
        onClose={() => setCampusFilmOpen(false)}
      />

      <AdmissionCodeModal
        isOpen={admissionCodeOpen}
        onClose={() => setAdmissionCodeOpen(false)}
      />

      {/* 5. Sherwood AI Assistant Panel & Accessible Floating Launcher */}
      <ChatPanel
        variant="popup"
        isOpen={aiOpen}
        onClose={() => setAiOpen(false)}
        accessToken={session?.accessToken}
        role={user?.role || "guest"}
        triggerRef={launcherRef}
      />

      <button
        ref={launcherRef}
        type="button"
        className={`sherwood-ai-launcher ${hasAttentionPulse ? "attention-pulse" : ""} ${isScrolledCompact ? "compact-circle" : ""}`.trim()}
        onClick={() => setAiOpen((isOpen) => !isOpen)}
        aria-expanded={aiOpen}
        aria-haspopup="dialog"
        aria-label="Ask Sherwood Admissions AI Assistant"
      >
        <span className="sherwood-ai-launcher-icon" aria-hidden="true">
          <SherwoodAIAvatar size={34} state={aiOpen ? "speaking" : "idle"} />
        </span>
        <span className="sherwood-ai-launcher-text">Ask Sherwood AI</span>
      </button>
    </div>
  );
}
