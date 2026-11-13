import React, { useEffect, useRef } from "react";
import amitabhTestimonial from "../../../assets/amitabh-testimonial.png";
import { isReducedMotion, gsap } from "../../../utils/motion";
import "./TestimonialSection.css";

export default function TestimonialSection() {
  const sectionRef = useRef(null);
  const cardRef = useRef(null);

  useEffect(() => {
    if (isReducedMotion()) return undefined;

    const ctx = gsap.context(() => {
      // 1. Dark green card scales in slightly on scroll
      if (cardRef.current) {
        gsap.fromTo(
          cardRef.current,
          { scale: 0.94, opacity: 0, y: 30 },
          {
            scale: 1,
            opacity: 1,
            y: 0,
            duration: 0.9,
            ease: "power2.out",
            scrollTrigger: {
              trigger: cardRef.current,
              start: "top 82%",
              once: true,
            },
          }
        );
      }

      // 2. Quote reveals line by line
      gsap.from(".sherwood-testimonial__reveal-item", {
        y: 20,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: "power2.out",
        scrollTrigger: {
          trigger: cardRef.current,
          start: "top 80%",
          once: true,
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section className="sherwood-testimonial" ref={sectionRef} aria-labelledby="alumni-testimonial-heading">
      <div className="sherwood-testimonial__container">
        <div className="sherwood-testimonial__card" ref={cardRef}>
          <div className="sherwood-testimonial__person sherwood-testimonial__reveal-item">
            <img
              src={amitabhTestimonial}
              alt="Amitabh Bachchan, distinguished Sherwood alumnus"
              loading="lazy"
              width="140"
              height="140"
              className="sherwood-testimonial__avatar"
            />
            <div className="sherwood-testimonial__identity">
              <h3 id="alumni-testimonial-heading">Amitabh Bachchan</h3>
              <p>Distinguished Alumnus • Legendary Actor</p>
              <span className="sherwood-testimonial__school-tag">Sherwoodian</span>
            </div>
          </div>

          <div className="sherwood-testimonial__body sherwood-testimonial__reveal-item">
            <span className="sherwood-testimonial__quote-mark" aria-hidden="true">“</span>
            <blockquote className="sherwood-testimonial__quote">
              The college that influenced me most was Sherwood College in Nainital.
              It taught me to be independent, fearless, loyal and truthful—values that,
              I think, have stayed with me through life.
            </blockquote>
          </div>
        </div>
      </div>
    </section>
  );
}
