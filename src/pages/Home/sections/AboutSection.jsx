import React from "react";
import { Link } from "react-router-dom";
import aboutCampus from "../../../assets/about-campus.png";
import Button from "../../../components/Button/Button";
import "./AboutSection.css";

export default function AboutSection() {
  return (
    <section id="about" className="sherwood-about">
      <div className="sherwood-about__container">
        <header className="sherwood-about__welcome">
          <div className="sherwood-about__welcome-left">
            <span className="sherwood-section-label">WELCOME TO SHERWOOD COLLEGE</span>
            <h2 className="sherwood-about__welcome-title">
              Learning beyond<br />the classroom.
            </h2>
          </div>
          <div className="sherwood-about__welcome-right">
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
          <div className="sherwood-about__image-frame">
            <img
              src={aboutCampus}
              alt="A tree-lined entrance to the Sherwood College campus in Nainital"
              loading="lazy"
              width="640"
              height="440"
              className="sherwood-about__img"
            />
            <div className="sherwood-about__badge-overlay">
              <strong>Est. 1869</strong>
              <small>Nainital, Uttarakhand</small>
            </div>
          </div>

          <div className="sherwood-about__narrative">
            <span className="sherwood-section-label">OUR HERITAGE</span>
            <h2 className="sherwood-about__story-title">About Sherwood College</h2>

            <p>
              Nestled at an altitude of over 6,800 feet amidst lush pine forests, Sherwood College
              has stood as a bastion of character building and educational excellence for over a century
              and a half.
            </p>

            <p>
              Our close-knit residential community creates transformative opportunities across
              academics, arts, sports, and social service—guiding young women and men to discover
              their unique potential and emerge as empathetic global citizens.
            </p>

            <p>
              With dedicated faculty, state-of-the-art laboratory infrastructure, and expansive playing
              fields, we support students through every stage of their holistic development.
            </p>

            <div className="sherwood-about__cta">
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
