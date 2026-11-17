import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import SchoolCrest from "../../../components/SchoolCrest";
import ThemeToggle from "../../../components/ThemeToggle";
import Button from "../../../components/Button/Button";
import { getDefaultRouteForRole } from "../../../auth/cognito";
import { useAdmissionCta } from "../../../hooks/useAdmissionCta";
import "./Navbar.css";

export default function Navbar({ user, signOut }) {
  const { targetPath, hasExistingApplication } = useAdmissionCta();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 80);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close account dropdown on click outside or Escape
  useEffect(() => {
    const handlePointerDown = (event) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target)) {
        setAccountMenuOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setAccountMenuOpen(false);
      }
    };

    if (accountMenuOpen) {
      document.addEventListener("mousedown", handlePointerDown);
      document.addEventListener("touchstart", handlePointerDown);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [accountMenuOpen]);

  const userInitial = (user?.name || user?.email || "U").charAt(0).toUpperCase();

  return (
    <header className={`sherwood-navbar ${scrolled ? "sherwood-navbar--scrolled" : "sherwood-navbar--transparent"}`}>
      <div className="sherwood-navbar__container">
        <a className="sherwood-navbar__brand" href="#home">
          <SchoolCrest className="sherwood-navbar__logo" />
          <div className="sherwood-navbar__brand-text">
            <strong>Sherwood</strong>
            <small>College • Nainital</small>
          </div>
        </a>

        <div className="sherwood-navbar__controls">
          <nav
            className={`sherwood-navbar__nav ${menuOpen ? "sherwood-navbar__nav--open" : ""}`}
            aria-label="Main Navigation"
          >
            <a href="#home" onClick={() => setMenuOpen(false)}>Home</a>
            <a href="#about" onClick={() => setMenuOpen(false)}>About</a>
            <a href="#features" onClick={() => setMenuOpen(false)}>Academics</a>
            <a href="#gallery" onClick={() => setMenuOpen(false)}>Gallery</a>
            <a href="#admission" onClick={() => setMenuOpen(false)}>Admissions</a>
            <a href="#contact" onClick={() => setMenuOpen(false)}>Contact</a>

            <div className="sherwood-navbar__mobile-actions">
              {user ? (
                <>
                  <div className="sherwood-navbar__mobile-user">
                    <span className="sherwood-navbar__avatar-circle">{userInitial}</span>
                    <div className="sherwood-navbar__mobile-user-info">
                      <strong>{user.name || "Sherwood Member"}</strong>
                      <small>{user.role || "Portal Member"}</small>
                    </div>
                  </div>
                  <Button
                    as={Link}
                    to={getDefaultRouteForRole(user.role)}
                    variant="primary"
                    size="sm"
                    onClick={() => setMenuOpen(false)}
                  >
                    My Dashboard
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      signOut();
                      setMenuOpen(false);
                    }}
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <Button
                  as={Link}
                  to="/login"
                  variant="outline"
                  size="sm"
                  onClick={() => setMenuOpen(false)}
                >
                  Portal Login
                </Button>
              )}
              <Button
                as={Link}
                to={targetPath}
                variant="gold"
                size="sm"
                onClick={() => setMenuOpen(false)}
              >
                {hasExistingApplication ? "Continue Application" : "Apply 2027–28"}
              </Button>
            </div>
          </nav>

          <div className="sherwood-navbar__desktop-actions">
            <ThemeToggle />

            {user ? (
              <div className="sherwood-navbar__account-dropdown-wrap" ref={accountMenuRef}>
                <button
                  type="button"
                  className="sherwood-navbar__avatar-trigger"
                  onClick={() => setAccountMenuOpen((prev) => !prev)}
                  aria-expanded={accountMenuOpen}
                  aria-haspopup="menu"
                  aria-label={`User account menu for ${user.name || user.email || "user"}`}
                >
                  <span className="sherwood-navbar__avatar-circle">{userInitial}</span>
                  <span className="sherwood-navbar__avatar-name">{user.name?.split(" ")[0] || "Account"}</span>
                  <span className="sherwood-navbar__avatar-caret" aria-hidden="true">▾</span>
                </button>

                {accountMenuOpen && (
                  <div className="sherwood-navbar__dropdown-menu" role="menu">
                    <div className="sherwood-navbar__dropdown-header">
                      <strong>{user.name || "Sherwood Member"}</strong>
                      <small>{user.email || ""}</small>
                      <span className="sherwood-navbar__role-badge">
                        {(user.role || "parent").toUpperCase()}
                      </span>
                    </div>
                    <div className="sherwood-navbar__dropdown-divider" />
                    <Link
                      to={getDefaultRouteForRole(user.role)}
                      className="sherwood-navbar__dropdown-item"
                      role="menuitem"
                      onClick={() => setAccountMenuOpen(false)}
                    >
                      <span aria-hidden="true">🏛️</span> My Dashboard
                    </Link>
                    <button
                      type="button"
                      className="sherwood-navbar__dropdown-item sherwood-navbar__dropdown-item--logout"
                      role="menuitem"
                      onClick={() => {
                        setAccountMenuOpen(false);
                        signOut();
                      }}
                    >
                      <span aria-hidden="true">🚪</span> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Button
                as={Link}
                to="/login"
                variant={scrolled ? "outline" : "outline-gold"}
                size="sm"
                className="sherwood-navbar__login-btn"
              >
                Login
              </Button>
            )}

            <Button
              as={Link}
              to={targetPath}
              variant="gold"
              size="sm"
              className="sherwood-navbar__apply-btn"
            >
              {hasExistingApplication ? "Continue Application" : "Apply 2027–28"}
            </Button>
          </div>

          <button
            className="sherwood-navbar__toggle"
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-expanded={menuOpen}
            aria-label="Toggle navigation menu"
          >
            <span className="sherwood-navbar__toggle-bar" />
            <span className="sherwood-navbar__toggle-bar" />
            <span className="sherwood-navbar__toggle-bar" />
          </button>
        </div>
      </div>
    </header>
  );
}

Navbar.propTypes = {
  user: PropTypes.object,
  signOut: PropTypes.func.isRequired,
};
