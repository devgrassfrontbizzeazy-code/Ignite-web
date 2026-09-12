
import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./Navbar.css";
import LightLogo from "../../../assets/logo.png";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { label: "Home", path: "/" },
    { label: "Products", path: "#our-solutions" },
    { label: "Features", path: "#core-capabilities" },
    { label: "About", path: "#business-value" },
    { label: "Contact", path: "/contact" },
  ];

  /*
   * HANDLE SECTION NAVIGATION
   *
   * Hash links need special handling because the target
   * sections only exist on the homepage.
   */
  const handleSectionNavigation = (e, sectionId) => {
    e.preventDefault();

    setIsMenuOpen(false);

    /*
     * Already on homepage:
     * Scroll directly to the section.
     */
    if (location.pathname === "/") {
      const section = document.getElementById(sectionId);

      if (section) {
        section.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }

      return;
    }

    /*
     * Coming from another public page such as /contact:
     * Navigate to homepage first.
     */
    navigate("/");

    /*
     * Wait for homepage to render, then scroll
     * to the requested section.
     */
    setTimeout(() => {
      const section = document.getElementById(sectionId);

      if (section) {
        section.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }, 100);
  };

  return (
    <header className="navbar">
      <div className="navbar-container">

        {/* LOGO */}
        <Link
          to="/"
          className="navbar-logo"
          onClick={() => setIsMenuOpen(false)}
          aria-label="IGNITE Home"
        >
          <img
            src={LightLogo}
            alt="IGNITE"
            className="navbar-logo-image"
          />
        </Link>

        {/* MOBILE MENU BUTTON */}
        <button
          className={`mobile-menu-toggle ${
            isMenuOpen ? "active" : ""
          }`}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-expanded={isMenuOpen}
          aria-label="Toggle navigation menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        {/* NAVIGATION */}
        <nav
          className={`navbar-nav ${
            isMenuOpen ? "active" : ""
          }`}
        >
          <ul className="nav-items">
            {navItems.map((item, index) => (
              <li
                key={index}
                className="nav-item"
              >
                {item.path.startsWith("#") ? (
                  <a
                    href={item.path}
                    onClick={(e) =>
                      handleSectionNavigation(
                        e,
                        item.path.substring(1)
                      )
                    }
                    className="nav-link"
                  >
                    <span className="nav-label">
                      {item.label}
                    </span>
                  </a>
                ) : (
                  <Link
                    to={item.path}
                    onClick={() =>
                      setIsMenuOpen(false)
                    }
                    className="nav-link"
                  >
                    <span className="nav-label">
                      {item.label}
                    </span>
                  </Link>
                )}

                <div className="nav-hover-indicator"></div>
              </li>
            ))}
          </ul>

          {/* HEADER ACTIONS */}
          <div className="header-actions">
            <button
              className="btn btn-login"
              onClick={() => {
                setIsMenuOpen(false);
                navigate("/login");
              }}
            >
              Login
            </button>

            <button
              className="btn btn-get-started"
              onClick={() => {
                setIsMenuOpen(false);
                navigate("/signup");
              }}
            >
              Get Started

              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
              >
                <path
                  d="M3.75 9H14.25M14.25 9L9.75 4.5M14.25 9L9.75 13.5"
                  stroke="#071629"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;

