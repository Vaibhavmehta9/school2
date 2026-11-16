import React from "react";
import "./MarqueeBanner.css";

const MARQUEE_ITEMS = [
  "EST. 1869 · NAINITAL, UTTARAKHAND",
  "MEREAT QUISQUE PALMAM (“LET EACH MERIT HIS PRIZE”)",
  "150+ YEARS OF RESIDENTIAL HERITAGE",
  "100% ICSE & ISC BOARD PASS RECORD",
  "70-ACRE HISTORIC MOUNTAIN ESTATE",
  "1:12 FACULTY-STUDENT MENTORSHIP RATIO",
  "ADMISSIONS OPEN FOR ACADEMIC YEAR 2027–28",
];

export default function MarqueeBanner() {
  return (
    <div
      className="sherwood-marquee"
      role="region"
      aria-label="Sherwood College Key Distinctions Ticker"
    >
      <div className="sherwood-marquee__track" tabIndex={0} role="region" aria-label="Ticker: scroll or pause by focusing or hovering">
        <div className="sherwood-marquee__content" aria-hidden="true">
          {MARQUEE_ITEMS.map((item, index) => (
            <span key={`a-${index}`} className="sherwood-marquee__item">
              <span className="sherwood-marquee__dot" />
              {item}
            </span>
          ))}
        </div>
        {/* Duplicate track for seamless infinite marquee loop */}
        <div className="sherwood-marquee__content" aria-hidden="true">
          {MARQUEE_ITEMS.map((item, index) => (
            <span key={`b-${index}`} className="sherwood-marquee__item">
              <span className="sherwood-marquee__dot" />
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

