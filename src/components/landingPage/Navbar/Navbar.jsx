import React, { useState } from "react";
import "./Navbar.css";
import LightLogo from "../../../assets/logo.png";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { label: "Home"},
    { label: "Products", hasDropdown: true },
    { label: "Features" },
    { label: "About" },
    { label: "Contact" },
  ];

  return (
    <header className="navbar">
      <div className="navbar-container">
        {/* Logo */}

        <div className="navbar-logo">
          <img src={LightLogo} alt="IGNITE" className="navbar-logo-image" />
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="mobile-menu-toggle"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        {/* Primary Navigation */}
        <nav className={`navbar-nav ${isMenuOpen ? "active" : ""}`}>
          <ul className="nav-items">
            {navItems.map((item, index) => (
              <li key={index} className="nav-item">
                <a
                  href="#"
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
                <div className="nav-hover-indicator"></div>
              </li>
            ))}
          </ul>

          <div className="header-actions">
            <button className="btn btn-login">Login</button>
            <button className="btn btn-get-started">
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
