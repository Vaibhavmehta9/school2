import React from "react";
import { Link } from "react-router-dom";
import SchoolCrest from "../../../components/SchoolCrest";
import "./FooterSection.css";

export default function FooterSection() {
  return (
    <footer id="contact" className="sherwood-footer">
      <div className="sherwood-footer__container">
        <div className="sherwood-footer__grid">
          {/* Brand & Contact */}
          <div className="sherwood-footer__col sherwood-footer__col--brand">
            <div className="sherwood-footer__brand">
              <SchoolCrest className="sherwood-footer__crest" />
              <div>
                <strong>Sherwood</strong>
                <small>College • Nainital</small>
              </div>
            </div>
            <p className="sherwood-footer__tagline">
              Nurturing knowledge, character, and leadership in the Himalayas since 1869.
            </p>
            <address className="sherwood-footer__address">
              <span>◎ Sherwood College, Ayarpatta Hill, Nainital, Uttarakhand 263002</span>
              <span>▯ +91 98765 43210</span>
              <span>✉ admissions@sherwood.edu.in</span>
            </address>
          </div>

          {/* Admissions */}
          <div className="sherwood-footer__col">
            <h3>Admissions</h3>
            <ul>
              <li><a href="#admission-process">Admission Process</a></li>
              <li><Link to="/login?flow=admission">Online Application 2027–28</Link></li>
              <li><Link to="/admission-details">Eligibility &amp; Age Cutoffs</Link></li>
              <li><Link to="/track-application">Track Application Status</Link></li>
            </ul>
          </div>

          {/* Academics & Student Life */}
          <div className="sherwood-footer__col">
            <h3>Academics</h3>
            <ul>
              <li><a href="#about">Our Learning Philosophy</a></li>
              <li><a href="#features">Smart Classrooms &amp; Labs</a></li>
              <li><a href="#features">Sports &amp; Outdoor Leadership</a></li>
              <li><a href="#gallery">Campus Life Gallery</a></li>
            </ul>
          </div>

          {/* Institutional & Help */}
          <div className="sherwood-footer__col">
            <h3>College Portals</h3>
            <ul>
              <li><Link to="/login">Portal Login (Students / Parents)</Link></li>
              <li><Link to="/ai-assistant">Ask Sherwood AI Assistant</Link></li>
              <li><Link to="/calendar">College Calendar</Link></li>
              <li><a href="#contact">Contact Admissions Office</a></li>
            </ul>
          </div>
        </div>

        <div className="sherwood-footer__bottom">
          <p>© {new Date().getFullYear()} Sherwood College, Nainital. All rights reserved.</p>
          <div className="sherwood-footer__legal">
            <a href="#terms">Privacy Policy</a>
            <span>•</span>
            <a href="#terms">Terms &amp; Conditions</a>
            <span>•</span>
            <a href="#terms">ICSE &amp; ISC Affiliated</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

