import React from 'react';
import { useNavigate } from 'react-router-dom';
import CompanySetupLayout from '../CompanySetupLayout/CompanySetupLayout';
import './AccountCreated.css';

function AccountCreated() {
  const navigate = useNavigate();

  return (
    <CompanySetupLayout currentStep="account-created" cardClassName="setup-card--centered">
      <div className="success-icon" aria-hidden="true">
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M9 20.5L16 27.5L31 12.5"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <h1 className="success-heading">Your workspace is ready!</h1>
      <p className="success-subtitle">Your company has been set up successfully.</p>
      <p className="success-note">
        You can now start inviting your team and explore IGNITE.
      </p>

      <button
        type="button"
        className="setup-btn setup-btn-primary success-btn"
        onClick={() => navigate('/dashboard')}
      >
        Go to Dashboard
      </button>
    </CompanySetupLayout>
  );
}

export default AccountCreated;
