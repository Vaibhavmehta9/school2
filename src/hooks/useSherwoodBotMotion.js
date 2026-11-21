import { useEffect, useRef, useState } from "react";

/**
 * useSherwoodBotMotion
 *
 * Handles rich motion states for the free-standing mascot launcher:
 * - Session-based intro and greeting wave
 * - Interactive speech bubble with auto-hide and dismiss
 * - Throttled desktop eye-cursor following
 * - Idle repeat wave every 35s (max 3 times)
 * - Scroll-based attention nudge at 50% scroll depth
 * - Active scroll compacting (scale down to 0.85 while scrolling)
 * - Full respect for prefers-reduced-motion and document visibility
 */
export function useSherwoodBotMotion({ isOpen, launcherRef }) {
  const [botState, setBotState] = useState("idle"); // 'idle' | 'greeting' | 'hover' | 'speaking' | 'thinking'
  const [showSpeechBubble, setShowSpeechBubble] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [pupilOffset, setPupilOffset] = useState({ x: 0, y: 0 });
  const [isWaving, setIsWaving] = useState(false);

  const idleTimerRef = useRef(null);
  const waveCountRef = useRef(0);
  const scrollTimeoutRef = useRef(null);
  const animationFrameRef = useRef(null);

  // 1. Session-based Greeting & Intro
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check reduced motion preference
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const hasGreeted = sessionStorage.getItem("sherwood_bot_greeted");
    if (!hasGreeted && !isOpen) {
      // Intro delay: 1.8 seconds after load
      const introTimer = setTimeout(() => {
        setBotState("greeting");
        setIsWaving(true);
        setShowSpeechBubble(true);
        sessionStorage.setItem("sherwood_bot_greeted", "true");

        // Stop waving after 3.6s
        const waveTimer = setTimeout(() => {
          setIsWaving(false);
          setBotState("idle");
        }, 3600);

        // Auto-hide speech bubble after 6 seconds
        const bubbleTimer = setTimeout(() => {
          setShowSpeechBubble(false);
        }, 6500);

        return () => {
          clearTimeout(waveTimer);
          clearTimeout(bubbleTimer);
        };
      }, 1800);

      return () => clearTimeout(introTimer);
    }
  }, [isOpen]);

  // 2. Hide speech bubble immediately when chat dialog opens
  useEffect(() => {
    if (isOpen) {
      setShowSpeechBubble(false);
      setNotificationCount(0);
      setIsWaving(false);
    }
  }, [isOpen]);

  // 3. Periodic Idle Wave (Every ~35 seconds, max 3 repeats per session)
  useEffect(() => {
    if (isOpen) return;

    const scheduleNextWave = () => {
      idleTimerRef.current = setTimeout(() => {
        if (waveCountRef.current < 3 && !isOpen && document.visibilityState === "visible") {
          setIsWaving(true);
          waveCountRef.current += 1;

          setTimeout(() => {
            setIsWaving(false);
            scheduleNextWave();
          }, 3200);
        }
      }, 35000);
    };

    scheduleNextWave();

    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [isOpen]);

  // 4. Scroll Depth Attention Nudge (at 50% scroll depth)
  useEffect(() => {
    if (isOpen) return;

    const handleScrollDepth = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight <= 0) return;
      const progress = window.scrollY / scrollHeight;

      if (progress >= 0.5) {
        const hasNudged = sessionStorage.getItem("sherwood_bot_nudged");
        if (!hasNudged && !isOpen) {
          sessionStorage.setItem("sherwood_bot_nudged", "true");
          setNotificationCount(1);
          setIsWaving(true);
          setTimeout(() => setIsWaving(false), 3000);
        }
      }
    };

    window.addEventListener("scroll", handleScrollDepth, { passive: true });
    return () => window.removeEventListener("scroll", handleScrollDepth);
  }, [isOpen]);

  // 5. Active Scrolling Detection (scale down to 0.85, fade bubble, restore after 1.5s idle)
  useEffect(() => {
    const onScroll = () => {
      setIsScrolling(true);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, 1500);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, []);

  // 6. Throttled Desktop Cursor Following (Fine Pointer Only)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const isFinePointer = window.matchMedia("(pointer: fine)").matches;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!isFinePointer || prefersReducedMotion || isOpen) return;

    const onMouseMove = (e) => {
      if (!launcherRef.current) return;

      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);

      animationFrameRef.current = requestAnimationFrame(() => {
        const rect = launcherRef.current?.getBoundingClientRect();
        if (!rect) return;

        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const dx = e.clientX - centerX;
        const dy = e.clientY - centerY;
        const dist = Math.hypot(dx, dy);

        // Only react when cursor is within 450px
        if (dist < 450 && dist > 10) {
          const maxOffset = 2.5; // Max 2.5px pupil travel
          const angle = Math.atan2(dy, dx);
          const factor = Math.min(dist / 200, 1);
          setPupilOffset({
            x: Math.round(Math.cos(angle) * maxOffset * factor * 10) / 10,
            y: Math.round(Math.sin(angle) * maxOffset * factor * 10) / 10,
          });
        } else {
          setPupilOffset({ x: 0, y: 0 });
        }
      });
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isOpen, launcherRef]);

  const dismissSpeechBubble = (e) => {
    if (e) e.stopPropagation();
    setShowSpeechBubble(false);
  };

  return {
    botState,
    setBotState,
    showSpeechBubble,
    dismissSpeechBubble,
    notificationCount,
    isScrolling,
    pupilOffset,
    isWaving,
  };
}

