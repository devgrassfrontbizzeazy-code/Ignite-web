import React from 'react';
import './CoreCapabilities.css';

export default function CoreCapabilities() {
  const capabilities = [
    {
      number: '01',
      title: ['Centralized', 'Management'],
      desc: ['Manage all your people,', 'processes and data in', 'one secure and unified', 'platform.'],
      icon: '/images/Core Capabilities/Centralized.svg',
    },
    {
      number: '02',
      title: ['Role-Based', 'Access'],
      desc: ['Ensure the right access', 'for the right people', 'with granular roles and', 'permissions.'],
      icon: '/images/Core Capabilities/Access.svg',
    },
    {
      number: '03',
      title: ['Workflow', 'Management'],
      desc: ['Automate approvals', 'and streamline your', 'business workflows', 'across teams.'],
      icon: '/images/Core Capabilities/Workflow.svg',
    },
    {
      number: '04',
      title: ['Operational', 'Visibility'],
      desc: ['Get real-time insights', 'and analytics to make', 'faster, data-driven', 'decisions.'],
      icon: '/images/Core Capabilities/Visibility.svg',
    },
    {
      number: '05',
      title: ['Web & Mobile', 'Accessibility'],
      desc: ['Access IGNITE anytime,', 'anywhere on any', 'device with a seamless', 'experience.'],
      icon: '/images/Core Capabilities/Responsive.svg',
    },
    {
      number: '06',
      title: ['Scalable', 'Platform'],
      desc: ['A future-ready platform', 'that grows with your', 'business and adapts', 'to your needs.'],
      icon: '/images/Core Capabilities/Scalable.svg',
    },
  ];

  return (
    <section className="core-capabilities" aria-label="Core Capabilities">
      {/* Decorative Background Dots on Sides */}
      <img
        src="/images/Business Value/Background Dots.svg"
        alt=""
        className="cc__bg-dots cc__bg-dots--left"
        aria-hidden="true"
      />
      <img
        src="/images/Business Value/Background Dots.svg"
        alt=""
        className="cc__bg-dots cc__bg-dots--right"
        style={{ transform: 'scaleX(-1)' }}
        aria-hidden="true"
      />

      <div className="cc__container">
        {/* Section Header */}
        <div className="cc__header">
          <div className="cc__eyebrow-wrap">
            <span className="cc__eyebrow">CORE CAPABILITIES</span>
            <div className="cc__eyebrow-line" aria-hidden="true" />
          </div>

          <h2 className="cc__title">
            <span className="cc__title-dark">Powerful capabilities. </span>
            <span className="cc__title-green">Built for impact.</span>
          </h2>

          <p className="cc__description">
            IGNITE is designed with core capabilities that help you manage your business
            <br />
            more efficiently, securely and intelligently.
          </p>
        </div>

        {/* 6 Capability Cards Grid */}
        <div className="cc__cards-grid">
          {capabilities.map((item) => (
            <div key={item.number} className="cc__card">
              {/* Icon */}
              <div className="cc__icon-wrap">
                <img
                  src={item.icon}
                  alt=""
                  className="cc__icon"
                  aria-hidden="true"
                />
              </div>

              {/* Accent Line */}
              <div className="cc__accent-line" aria-hidden="true" />

              {/* Title */}
              <h3 className="cc__card-title">
                {item.title.map((line, idx) => (
                  <React.Fragment key={idx}>
                    {line}
                    {idx < item.title.length - 1 && <br />}
                  </React.Fragment>
                ))}
              </h3>

              {/* Description */}
              <p className="cc__card-desc">
                {item.desc.map((line, idx) => (
                  <React.Fragment key={idx}>
                    {line}
                    {idx < item.desc.length - 1 && <br />}
                  </React.Fragment>
                ))}
              </p>

              {/* Flexible Spacer to push number badge to bottom */}
              <div className="cc__card-spacer" aria-hidden="true" />

              {/* Number Badge */}
              <div className="cc__number-badge">
                <span className="cc__number-text">{item.number}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Decorative Bottom Wave Curve */}
      <div className="cc__bottom-curve" aria-hidden="true">
        <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
          <path d="M0 40 Q 360 80 720 40 T 1440 40" stroke="#D9F1ED" strokeWidth="2" fill="none" />
        </svg>
      </div>
    </section>
  );
}
