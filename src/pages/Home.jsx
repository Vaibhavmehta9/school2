import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ChatPanel from "../components/ChatPanel/ChatPanel";
import SherwoodAIAvatar from "../components/ChatPanel/SherwoodAIAvatar";
import { useCognitoAuth } from "../auth/useCognitoAuth";
import { initSmoothScrolling } from "../utils/motion";

// Modular Section Components
import Navbar from "./Home/sections/Navbar";
import HeroSection from "./Home/sections/HeroSection";
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
  const [isScrollingMobile, setIsScrollingMobile] = useState(false);

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

  // Collapse launcher label on mobile during scroll to save viewport space
  useEffect(() => {
    let scrollTimeout;
    const handleScroll = () => {
      setIsScrollingMobile(true);
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        setIsScrollingMobile(false);
      }, 400);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(scrollTimeout);
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
      {/* 1. Sticky Navigation */}
      <Navbar user={user} signOut={signOut} />

      {/* 2. Main Institutional Content */}
      <main id="main-content">
        <HeroSection
          onOpenCampusFilm={() => setCampusFilmOpen(true)}
          onOpenAdmissionCode={() => setAdmissionCodeOpen(true)}
        />
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
        className={`sherwood-ai-launcher ${hasAttentionPulse ? "attention-pulse" : ""} ${isScrollingMobile ? "scrolling-collapsed" : ""}`.trim()}
        onClick={() => setAiOpen((isOpen) => !isOpen)}
        aria-expanded={aiOpen}
        aria-haspopup="dialog"
        aria-label="Open Sherwood AI Admissions Assistant"
      >
        <span className="sherwood-ai-launcher-icon" aria-hidden="true">
          <SherwoodAIAvatar size={34} state={aiOpen ? "speaking" : "idle"} />
        </span>
        <span className="sherwood-ai-launcher-text">Ask Sherwood AI</span>
      </button>
    </div>
  );
}
