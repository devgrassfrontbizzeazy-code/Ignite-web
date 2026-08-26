import React from "react";
import "./Hero.css";
import heroImage from "../../../assets/landing/hero.png";
import secureIcon from "../../../assets/landing/secure.png";
import accessIcon from "../../../assets/landing/access.png";
import scalableIcon from "../../../assets/landing/scalable.png";

const Hero = () => {
  return (
    <section className="hero-section">
      {/* Decorative green lines at bottom */}
      <div className="hero-decoration">
        <svg
          className="decoration-lines"
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
        >
          <path
            d="M 0 60 Q 360 20, 720 60 T 1440 60"
            stroke="#007565"
            strokeWidth="3"
            fill="none"
          />
          <path
            d="M 0 80 Q 360 40, 720 80 T 1440 80"
            stroke="#007565"
            strokeWidth="2"
            fill="none"
            opacity="0.6"
          />
          <path
            d="M 0 100 Q 360 60, 720 100 T 1440 100"
            stroke="#007565"
            strokeWidth="1.5"
            fill="none"
            opacity="0.4"
          />
        </svg>
      </div>

      <div className="hero-body">
        {/* Hero Copy - Left Section */}
        <div className="hero-copy">
          {/* Eyebrow Pill */}
          <div className="eyebrow-pill">
            <span className="eyebrow">ONE PLATFORM. CONNECTED OPERATIONS.</span>
          </div>

          {/* Hero Headline */}
          <h1 className="hero-headline">
            <span className="headline-nowrap">A connected platform</span> for managing <span className="highlight-green">people</span>,{" "}
            <span className="highlight">sales</span> and business operations.
          </h1>

          {/* Hero Description */}
          <p className="hero-description">
            IGNITE brings your workforce and field sales operations together in
            one platform to streamline processes, improve visibility and drive
            better outcomes.
          </p>

          {/* Hero Actions */}
          <div className="hero-actions">
            <button className="cta-primary">
              Get Started
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path
                  d="M3.75 9H14.25M14.25 9L9.75 4.5M14.25 9L9.75 13.5"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button className="cta-secondary">
              Explore Solutions
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path
                  d="M9 3.75V14.25M9 14.25L4.5 9.75M9 14.25L13.5 9.75"
                  stroke="#071629"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

          {/* Trust Points */}
          <div className="trust-points">
            <div className="trust-badge trust-secure">
              <div className="badge-icon">
                <img src={secureIcon} alt="" />
              </div>
              <span className="badge-label">Secure & Reliable</span>
            </div>

            <div className="separator"></div>

            <div className="trust-badge trust-access">
              <div className="badge-icon">
                <img src={accessIcon} alt="" />
              </div>
              <span className="badge-label">Role-based Access</span>
            </div>

            <div className="separator"></div>

            <div className="trust-badge trust-scalable">
              <div className="badge-icon">
                <img src={scalableIcon} alt="" />
              </div>
              <span className="badge-label">Scalable Platform</span>
            </div>
          </div>
        </div>

        {/* Product Visual Stage - Right Section */}
        <div className="product-visual-stage">
          {/* Desktop Dashboard - using placeholder */}
          <div className="desktop-mockup">
            <img
              src={heroImage}
              alt="IGNITE Dashboard - Desktop View"
              className="desktop-image"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;