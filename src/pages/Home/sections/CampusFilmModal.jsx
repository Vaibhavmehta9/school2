import React, { useEffect } from "react";
import PropTypes from "prop-types";
import campusFilm from "../../../assets/campus-film.mp4";
import "./CampusFilmModal.css";

export default function CampusFilmModal({ isOpen, onClose }) {
  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="sherwood-modal-wrap">
      <button
        className="sherwood-modal-backdrop"
        type="button"
        onClick={onClose}
        aria-label="Close campus film"
      />
      <section
        className="sherwood-modal-box sherwood-modal-box--film"
        role="dialog"
        aria-modal="true"
        aria-labelledby="campus-film-title"
      >
        <header className="sherwood-modal-header">
          <div className="sherwood-modal-header__info">
            <span className="sherwood-modal-icon" aria-hidden="true">▶</span>
            <div>
              <h2 id="campus-film-title" className="sherwood-modal-title">
                Sherwood College Campus Film
              </h2>
              <small className="sherwood-modal-subtitle">
                A glimpse into collegiate life, traditions, and the Nainital hills
              </small>
            </div>
          </div>
          <button
            type="button"
            className="sherwood-modal-close"
            onClick={onClose}
            aria-label="Close dialog"
          >
            ×
          </button>
        </header>

        <div className="sherwood-modal-body">
          <video
            controls
            autoPlay
            playsInline
            preload="metadata"
            className="sherwood-film-video"
          >
            <source src={campusFilm} type="video/mp4" />
            Your browser does not support embedded HTML5 video.
          </video>
        </div>

        <footer className="sherwood-modal-footer">
          <a
            className="sherwood-modal-tour-link"
            href="#contact"
            onClick={onClose}
          >
            Arrange an in-person campus visit <span>→</span>
          </a>
        </footer>
      </section>
    </div>
  );
}

CampusFilmModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

