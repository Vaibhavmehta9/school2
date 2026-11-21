import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ChatPanel from "../components/ChatPanel/ChatPanel";
import SherwoodBot from "../components/ChatPanel/SherwoodBot";
import { useSherwoodBotMotion } from "../hooks/useSherwoodBotMotion";
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
import MobileApplyBar from "../components/MobileApplyBar/MobileApplyBar";

import "./Home.css";

export default function Home() {
  const navigate = useNavigate();
  const { user, session, signOut } = useCognitoAuth();
  const launcherRef = useRef(null);

  // Modal States - campusFilmOpen defaults to false (prevent auto popup on page load)
  const [campusFilmOpen, setCampusFilmOpen] = useState(false);
  const [admissionCodeOpen, setAdmissionCodeOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Mascot Motion & Lifecycle Hook
  const {
    botState,
    showSpeechBubble,
    dismissSpeechBubble,
    notificationCount,
    isScrolling,
    pupilOffset,
    isWaving,
  } = useSherwoodBotMotion({ isOpen: aiOpen, launcherRef });

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

      {/* 5. Free-Standing SherwoodBot Mascot Launcher & Interactive Speech Bubble */}
      <ChatPanel
        variant="popup"
        isOpen={aiOpen}
        onClose={() => setAiOpen(false)}
        accessToken={session?.accessToken}
        role={user?.role || "guest"}
        user={user}
        triggerRef={launcherRef}
      />

      <div
        className={`sherwood-bot-launcher-container ${aiOpen ? "is-chat-open" : ""} ${
          isScrolling ? "is-scrolling" : ""
        }`.trim()}
      >
        {/* Interactive Speech Bubble */}
        {showSpeechBubble && !aiOpen && (
          <aside
            className="sherwood-bot-speech-bubble"
            role="status"
            aria-live="polite"
          >
            <div className="sherwood-bot-bubble-content">
              <strong>Hi! I'm Sherwood AI.</strong>
              <span>Ask me about admissions.</span>
            </div>
            <button
              type="button"
              className="sherwood-bot-bubble-close"
              onClick={dismissSpeechBubble}
              aria-label="Close message"
            >
              ×
            </button>
            <div className="sherwood-bot-bubble-tail" aria-hidden="true" />
          </aside>
        )}

        {/* Free-Standing Mascot Button */}
        <button
          ref={launcherRef}
          type="button"
          className="sherwood-bot-launcher-btn"
          onClick={() => setAiOpen((isOpen) => !isOpen)}
          aria-expanded={aiOpen}
          aria-haspopup="dialog"
          aria-label="Ask Sherwood AI - open chat assistant"
          title="Ask Sherwood AI - open chat assistant"
        >
          <SherwoodBot
            size={80}
            state={botState}
            isWaving={isWaving}
            pupilOffset={pupilOffset}
            showOnline={true}
            showShadow={true}
            tone="onLight"
          />
          {notificationCount > 0 && !aiOpen && (
            <span className="sherwood-bot-badge" aria-label="1 unread suggestion">
              {notificationCount}
            </span>
          )}
        </button>
      </div>

      {/* 6. Mobile-only Sticky Apply Bar (Appears after hero, never overlaps chat) */}
      <MobileApplyBar />
    </div>
  );
}
