import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

// Register ScrollTrigger plugin with GSAP
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * Check if the user prefers reduced motion
 */
export function isReducedMotion() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Initialize Lenis smooth scrolling and synchronize with GSAP ScrollTrigger
 */
export function initSmoothScrolling() {
  if (typeof window === "undefined" || isReducedMotion()) {
    return null;
  }

  try {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      smoothWheel: true,
      touchMultiplier: 1.5,
    });

    lenis.on("scroll", ScrollTrigger.update);

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);

    return lenis;
  } catch (err) {
    console.warn("Failed to initialize smooth scrolling:", err);
    return null;
  }
}

/**
 * Animate numbers counting up on scroll into view
 */
export function animateCounter(targetElement, targetValue, duration = 1.8) {
  if (!targetElement || isReducedMotion()) {
    if (targetElement) targetElement.textContent = String(targetValue);
    return;
  }

  const obj = { val: 0 };
  gsap.to(obj, {
    val: targetValue,
    duration,
    ease: "power2.out",
    scrollTrigger: {
      trigger: targetElement,
      start: "top 85%",
      once: true,
    },
    onUpdate: () => {
      targetElement.textContent = Math.floor(obj.val).toLocaleString();
    },
    onComplete: () => {
      targetElement.textContent = targetValue.toLocaleString();
    },
  });
}

/**
 * Animate elements fading in and sliding up gently on scroll
 */
export function fadeInUp(element, vars = {}) {
  if (!element) return null;

  if (isReducedMotion()) {
    gsap.set(element, { opacity: 1, y: 0 });
    return null;
  }

  return gsap.fromTo(
    element,
    { opacity: 0, y: vars.y || 24 },
    {
      opacity: 1,
      y: 0,
      duration: vars.duration || 0.8,
      stagger: vars.stagger || 0.12,
      ease: "power2.out",
      scrollTrigger: {
        trigger: vars.trigger || element,
        start: vars.start || "top 85%",
        once: vars.once !== undefined ? vars.once : true,
      },
    }
  );
}

export { gsap, ScrollTrigger, Lenis };
