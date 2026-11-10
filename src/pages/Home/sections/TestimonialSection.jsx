import React from "react";
import amitabhTestimonial from "../../../assets/amitabh-testimonial.png";
import "./TestimonialSection.css";

export default function TestimonialSection() {
  return (
    <section className="sherwood-testimonial" aria-labelledby="alumni-testimonial-heading">
      <div className="sherwood-testimonial__container">
        <div className="sherwood-testimonial__card">
          <div className="sherwood-testimonial__person">
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

          <div className="sherwood-testimonial__body">
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
