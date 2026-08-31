import React from "react";
import "./BusinessValue.css";
import { Link } from "react-router-dom";

export default function BusinessValue() {
  const valueCards = [
    {
      id: "efficiency",
      icon: "/images/Business Value/Efficiency Icon.svg",
      modifier: "ignite-bv__card--teal",
      title: "Operational\nEfficiency",
      desc: "Reduce repetitive administrative activities and improve process consistency.",
    },
    {
      id: "visibility",
      icon: "/images/Business Value/Visibility Icon.svg",
      modifier: "ignite-bv__card--orange",
      title: "Improved\nVisibility",
      desc: "Provide managers with a clearer view of relevant business activity.",
    },
    {
      id: "coordination",
      icon: "/images/Business Value/Coordination Icon.svg",
      modifier: "ignite-bv__card--mint",
      title: "Better\nCoordination",
      desc: "Connect teams and processes through a common platform.",
    },
    {
      id: "information",
      icon: "/images/Business Value/Information Icon.svg",
      modifier: "ignite-bv__card--purple",
      title: "Faster Access to\nInformation",
      desc: "Make relevant operational information easier to access and manage.",
    },
    {
      id: "growth",
      icon: "/images/Business Value/Growth Icon.svg",
      modifier: "ignite-bv__card--peach",
      title: "Structured\nGrowth",
      desc: "Provide a technology foundation that can support your organization’s changing requirements.",
    },
  ];

  return (
    <section
      className="ignite-business-value"
      id="business-value"
      aria-label="Business Value"
    >
      {/* Background Decorative Dots */}
      <img
        src="/images/Business Value/Background Dots.svg"
        alt=""
        className="ignite-bv__bg-dots"
        aria-hidden="true"
      />

      <div className="ignite-bv__container">
        {/* Header */}
        <div className="ignite-bv__header">
          <div className="ignite-bv__tag-wrap">
            <span className="ignite-bv__tag">BUSINESS VALUE</span>
            <div className="ignite-bv__tag-line" aria-hidden="true" />
          </div>

          <h2 className="ignite-bv__title">
            <span className="ignite-bv__title-main">Better operations. </span>
            <span className="ignite-bv__title-accent">Stronger outcomes.</span>
          </h2>

          <p className="ignite-bv__subtitle">
            IGNITE helps you streamline processes, improve visibility and
            connect your teams
            <br />
            so your business can grow with confidence.
          </p>
        </div>

        {/* 5 Cards Row */}
        <div className="ignite-bv__cards-grid">
          {valueCards.map((card) => (
            <div key={card.id} className={`ignite-bv__card ${card.modifier}`}>
              <div className="ignite-bv__card-icon-wrap">
                <img src={card.icon} alt="" className="ignite-bv__card-icon" />
              </div>
              <h3 className="ignite-bv__card-title">
                {card.title.split("\n").map((line, i) => (
                  <React.Fragment key={i}>
                    {line}
                    {i === 0 && <br />}
                  </React.Fragment>
                ))}
              </h3>
              <p className="ignite-bv__card-desc">{card.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA Banner Section */}
        <div className="ignite-cta-banner">
          {/* Ambient Glow / Art */}
          <div className="ignite-cta-banner__dots-art" aria-hidden="true" />

          {/* Left CTA Text Content */}
          <div className="ignite-cta-banner__left">
            <div className="ignite-cta-banner__title-wrap">
              <h2 className="ignite-cta-banner__title">
                <span className="ignite-cta-banner__title-white">
                  Ready to explore{" "}
                </span>
                <span className="ignite-cta-banner__title-green">IGNITE?</span>
              </h2>
              <div
                className="ignite-cta-banner__title-line"
                aria-hidden="true"
              />
            </div>

            <p className="ignite-cta-banner__subtitle">
              Take the next step toward smarter operations and
              <br />a more connected business.
            </p>

            {/* Action Buttons */}
            <div className="ignite-cta-banner__actions">
              <Link
                to="/subscription-plan"
                className="ignite-cta-banner__btn ignite-cta-banner__btn--primary"
              >
                <span>Get Started</span>
                <img
                  src="/images/Business Value/Arrow Right.svg"
                  alt=""
                  className="ignite-cta-banner__btn-arrow"
                />
              </Link>

              <Link
                to="/contact"
                className="ignite-cta-banner__btn ignite-cta-banner__btn--secondary"
              >
                <span>Contact Us</span>
                <img
                  src="/images/Business Value/Arrow Right.svg"
                  alt=""
                  className="ignite-cta-banner__btn-arrow"
                />
              </Link>
            </div>

            {/* Badges */}
            <div className="ignite-cta-banner__badges">
              <div className="ignite-cta-banner__badge">
                <img
                  src="/images/Business Value/Frame-1.svg"
                  alt=""
                  className="ignite-cta-banner__badge-icon"
                />
                <span>Secure &amp; Reliable</span>
              </div>

              <div
                className="ignite-cta-banner__badge-divider"
                aria-hidden="true"
              />

              <div className="ignite-cta-banner__badge">
                <img
                  src="/images/Business Value/Frame-2.svg"
                  alt=""
                  className="ignite-cta-banner__badge-icon"
                />
                <span>Built for Growth</span>
              </div>

              <div
                className="ignite-cta-banner__badge-divider"
                aria-hidden="true"
              />

              <div className="ignite-cta-banner__badge">
                <img
                  src="/images/Business Value/Frame.svg"
                  alt=""
                  className="ignite-cta-banner__badge-icon"
                />
                <span>We’re Here to Help</span>
              </div>
            </div>
          </div>

          {/* Right Devices Mockup Image */}
          <div className="ignite-cta-banner__right">
            <img
              src="/images/Business Value/Icon/bg_removal [Background removed].png"
              alt="IGNITE Web Dashboard and Mobile Application Interface"
              className="ignite-cta-banner__mockup-img"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
