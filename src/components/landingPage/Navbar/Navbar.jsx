import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Navbar.css";
import LightLogo from "../../../assets/logo.png";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const navItems = [
    { label: "Home", path: "/" },
    { label: "Products", path: "#our-solutions" },
    { label: "Features", path: "#core-capabilities" },
    { label: "About", path: "#business-value" },
    { label: "Contact", path: "/contact" },
  ];

  return (
    <header className="navbar">
      <div className="navbar-container">
        <div className="navbar-logo">
          <img src={LightLogo} alt="IGNITE" className="navbar-logo-image" />
        </div>

        <button
          className={`mobile-menu-toggle ${isMenuOpen ? "active" : ""}`}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-expanded={isMenuOpen}
          aria-label="Toggle navigation menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <nav className={`navbar-nav ${isMenuOpen ? "active" : ""}`}>
          <ul className="nav-items">
            {navItems.map((item, index) => (
              <li key={index} className="nav-item">
                {item.path.startsWith("#") ? (
                  <a
                    href={item.path}
                    onClick={(e) => {
                      e.preventDefault();

                      const sectionId = item.path.substring(1);
                      const section = document.getElementById(sectionId);

                      if (section) {
                        section.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        });
                      }

                      setIsMenuOpen(false);
                    }}
                    className={`nav-link ${item.active ? "active" : ""}`}
                  >
                    <span className="nav-label">{item.label}</span>

                    {item.hasDropdown && (
                      <svg
                        className="chevron-icon"
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                      >
                        <path
                          d="M3 4.5L6 7.5L9 4.5"
                          stroke="#08172A"
                          strokeWidth="1.35"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </a>
                ) : (
                  <Link
                    to={item.path}
                    onClick={() => setIsMenuOpen(false)}
                    className={`nav-link ${item.active ? "active" : ""}`}
                  >
                    <span className="nav-label">{item.label}</span>
                  </Link>
                )}

                <div className="nav-hover-indicator"></div>
              </li>
            ))}
          </ul>

          <div className="header-actions">
            <button
              className="btn btn-login"
              onClick={() => navigate("/login")}
            >
              Login
            </button>
            <button
              className="btn btn-get-started"
              onClick={() => navigate("/signup")}
            >
              Get Started
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
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
