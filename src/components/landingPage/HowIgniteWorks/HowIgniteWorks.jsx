import React from 'react';
import './HowIgniteWorks.css';

export default function HowIgniteWorks() {
  const steps = [
    {
      number: '01',
      title: 'Select',
      desc: ['Choose the solution', 'that fits your', 'business needs.'],
      icon: '/images/How IGNITE Works/Process/Icon/Select.svg',
      accentColor: 'teal',
    },
    {
      number: '02',
      title: 'Configure',
      desc: ['Configure your', 'organization and', 'business settings.'],
      icon: '/images/How IGNITE Works/Process/Icon/Configure.svg',
      accentColor: 'teal',
    },
    {
      number: '03',
      title: 'Onboard',
      desc: ['Onboard your team', 'and assign the', 'right access.'],
      icon: '/images/How IGNITE Works/Process/Icon/Onboard.svg',
      accentColor: 'orange',
    },
    {
      number: '04',
      title: 'Operate',
      desc: ['Run your operations', 'and monitor what', 'matters.'],
      icon: '/images/How IGNITE Works/Process/Icon/Operate.svg',
      accentColor: 'teal',
    },
  ];

  return (
    <section className="how-ignite-works" aria-label="How IGNITE Works">
      {/* Background Decorative Dots on Sides */}
      <img
        src="/images/Business Value/Background Dots.svg"
        alt=""
        className="hiw__bg-dots hiw__bg-dots--left"
        aria-hidden="true"
      />
      <img
        src="/images/Business Value/Background Dots.svg"
        alt=""
        className="hiw__bg-dots hiw__bg-dots--right"
        style={{ transform: 'scaleX(-1)' }}
        aria-hidden="true"
      />

      <div className="hiw__container">
        {/* Section Header */}
        <div className="hiw__header">
          <div className="hiw__eyebrow-wrap">
            <span className="hiw__eyebrow">HOW IGNITE WORKS</span>
            <div className="hiw__eyebrow-line" aria-hidden="true" />
          </div>

          <h2 className="hiw__title">
            <span className="hiw__title-dark">Simple steps </span>
            <span className="hiw__title-green">to run your business better</span>
          </h2>

          <p className="hiw__description">
            Get started in minutes and streamline your operations in four easy steps.
          </p>
        </div>

        {/* Process Flow Cards & Connectors */}
        <div className="hiw__process-flow">
          {/* Connector dashed line & 3 arrow badges */}
          <div className="hiw__connector" aria-hidden="true">
            <div className="hiw__connector-line" />
            <div className="hiw__arrow-badge hiw__arrow-badge--1">
              <img
                src="/images/How IGNITE Works/Vector.svg"
                alt=""
                className="hiw__arrow-icon"
              />
            </div>
            <div className="hiw__arrow-badge hiw__arrow-badge--2">
              <img
                src="/images/How IGNITE Works/Vector.svg"
                alt=""
                className="hiw__arrow-icon"
              />
            </div>
            <div className="hiw__arrow-badge hiw__arrow-badge--3">
              <img
                src="/images/How IGNITE Works/Vector.svg"
                alt=""
                className="hiw__arrow-icon"
              />
            </div>
          </div>

          {/* 4 Process Cards */}
          {steps.map((step) => (
            <div key={step.number} className="hiw__step-card-wrap">
              {/* Floating Top Medallion */}
              <div className="hiw__medallion">
                <img
                  src={step.icon}
                  alt=""
                  className="hiw__medallion-icon"
                  aria-hidden="true"
                />
              </div>

              {/* Card Body */}
              <div className="hiw__card-body">
                <div
                  className={`hiw__step-num ${
                    step.accentColor === 'orange'
                      ? 'hiw__step-num--orange'
                      : 'hiw__step-num--teal'
                  }`}
                >
                  {step.number}
                </div>

                <div
                  className={`hiw__accent-bar ${
                    step.accentColor === 'orange'
                      ? 'hiw__accent-bar--orange'
                      : 'hiw__accent-bar--teal'
                  }`}
                  aria-hidden="true"
                />

                <h3 className="hiw__step-title">{step.title}</h3>

                <p className="hiw__step-desc">
                  {step.desc.map((line, idx) => (
                    <React.Fragment key={idx}>
                      {line}
                      {idx < step.desc.length - 1 && <br />}
                    </React.Fragment>
                  ))}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
