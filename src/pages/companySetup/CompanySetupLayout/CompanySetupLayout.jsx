import React from 'react';
import logo from '../../../assets/logo.png';
import './CompanySetupLayout.css';

export const SETUP_STEPS = [
  { id: 'company-details', label: 'Company Details' },
  { id: 'address', label: 'Address' },
  { id: 'business-settings', label: 'Business Settings' },
  { id: 'review', label: 'Review' },
  { id: 'account-created', label: 'Account Created' },
];

function CheckIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M2.5 7.2L5.4 10.2L11.5 3.5"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * currentStep: one of SETUP_STEPS[i].id
 * title / subtitle: page heading shown inside the card
 * children: page-specific content (form, review sections, success state...)
 * cardClassName: optional extra class for the card (e.g. to widen the Review page)
 */
function CompanySetupLayout({ currentStep, title, subtitle, children, cardClassName = '' }) {
  const currentIndex = SETUP_STEPS.findIndex((step) => step.id === currentStep);

  return (
    <div className="setup-page">
      <div className="setup-topbar">
        <div className="setup-topbar-inner">
          <img src={logo} alt="IGNITE" className="setup-logo" />

          <ol className="setup-stepper" aria-label="Company setup progress">
            {SETUP_STEPS.map((step, index) => {
              const status =
                index < currentIndex
                  ? 'completed'
                  : index === currentIndex
                  ? 'current'
                  : 'upcoming';

              return (
                <li
                  key={step.id}
                  className={`setup-step setup-step--${status}`}
                  aria-current={status === 'current' ? 'step' : undefined}
                >
                  <span className="setup-step-row">
                    <span className="setup-step-indicator">
                      {status === 'completed' ? <CheckIcon /> : index + 1}
                    </span>
                    <span className="setup-step-label">{step.label}</span>
                  </span>
                  {index < SETUP_STEPS.length - 1 && (
                    <span className="setup-step-connector" aria-hidden="true" />
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      <main className="setup-content">
        <div className={`setup-card ${cardClassName}`.trim()}>
          {(title || subtitle) && (
            <div className="setup-card-header">
              {title && <h1>{title}</h1>}
              {subtitle && <p>{subtitle}</p>}
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}

export default CompanySetupLayout;
