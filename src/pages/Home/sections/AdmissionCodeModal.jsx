import React, { useEffect } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import Button from "../../../components/Button/Button";
import "./AdmissionCodeModal.css";

export default function AdmissionCodeModal({ isOpen, onClose }) {
  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const targetUrl = typeof window !== "undefined"
    ? `${window.location.origin}/#start-admission`
    : "/#start-admission";

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=${encodeURIComponent(targetUrl)}`;

  return (
    <div className="sherwood-modal-wrap">
      <button
        className="sherwood-modal-backdrop"
        type="button"
        onClick={onClose}
        aria-label="Close admission QR dialog"
      />
      <section
        className="sherwood-modal-box sherwood-modal-box--qr"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admission-qr-title"
      >
        <div className="sherwood-qr-modal__body">
          <button
            type="button"
            className="sherwood-qr-modal__close"
            onClick={onClose}
            aria-label="Close dialog"
          >
            ×
          </button>

          <span className="sherwood-section-label">ADMISSIONS PORTAL ACCESS</span>
          <h2 id="admission-qr-title" className="sherwood-qr-modal__title">
            Scan to Apply via Mobile
          </h2>
          <p className="sherwood-qr-modal__desc">
            Point your smartphone camera at this QR code to access the responsive Sherwood College
            Admissions Welcome portal on your device.
          </p>

          <div className="sherwood-qr-modal__frame">
            <img
              src={qrImageUrl}
              alt="QR Code for Sherwood College Admissions Welcome Portal"
              width="240"
              height="240"
              className="sherwood-qr-modal__img"
            />
          </div>

          <div className="sherwood-qr-modal__actions">
            <Button
              as={Link}
              to="/new-user-dashboard"
              variant="primary"
              size="md"
              onClick={onClose}
            >
              Continue on this Device <span>→</span>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

AdmissionCodeModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};
