import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import SchoolCrest from "../../../components/SchoolCrest";
import ThemeToggle from "../../../components/ThemeToggle";
import Button from "../../../components/Button/Button";
import { getDefaultRouteForRole } from "../../../auth/cognito";
import "./Navbar.css";

export default function Navbar({ user, signOut }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={`sherwood-navbar ${scrolled ? "sherwood-navbar--scrolled" : ""}`}>
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
                  variant="secondary"
                  size="sm"
                  onClick={() => setMenuOpen(false)}
                >
                  Portal Login
                </Button>
              )}
              <Button
                as={Link}
                to="/admission-details"
                variant="gold"
                size="sm"
                onClick={() => setMenuOpen(false)}
              >
                Apply Now
              </Button>
            </div>
          </nav>

          <div className="sherwood-navbar__desktop-actions">
            <ThemeToggle />
            {user ? (
              <>
                <Button
                  as={Link}
                  to={getDefaultRouteForRole(user.role)}
                  variant="primary"
                  size="sm"
                >
                  My Dashboard
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={signOut}
                >
                  Logout
                </Button>
              </>
            ) : (
              <Button
                as={Link}
                to="/login"
                variant="secondary"
                size="sm"
              >
                Portal Login
              </Button>
            )}
            <Button
              as={Link}
              to="/admission-details"
              variant="gold"
              size="sm"
            >
              Apply 2027–28
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

