import React from "react";
import { useNavigate } from "react-router-dom";
import CompanySetupLayout from "../CompanySetupLayout/CompanySetupLayout";
import { useCompanySetup } from "../CompanySetupContext";
import "./Review.css";

const EMPTY_VALUE = "—";

function display(value) {
  return value && String(value).trim() ? value : EMPTY_VALUE;
}

function Review() {
  const navigate = useNavigate();
  const { companySetupData } = useCompanySetup();
  const d = companySetupData;

  const handleBack = () => navigate("/company-setup/business-settings");
  const handleComplete = () => navigate("/company-setup/account-created");

  return (
    <CompanySetupLayout
      currentStep="review"
      title="Review Your Setup"
      subtitle="Review your company information before completing the setup."
      cardClassName="setup-card--wide"
    >
      <div className="review-sections">
        
        <ReviewSection
          title="Company Details"
          onEdit={() => navigate("/company-setup/company-details")}
          rows={[
            ["Company Name", display(d.companyName)],
            ["Company Code", display(d.companyCode)],
            ["Industry", display(d.industry)],
            ["Company Email", display(d.companyEmail)],
            ["Phone", display(d.phone)],
            ["Website", display(d.website)],
            ["Company Type", display(d.companyType)],
            ["GST/CIN/Registration No.", display(d.registrationNumber)],
            ["Company Logo", display(d.companyLogoName)],
          ]}
        />
       
<ReviewSection
  title="Business Address"
  onEdit={() => navigate('/company-setup/address')}
  rows={[
    ['Full Address', display(d.fullAddress)],
    ['Country', display(d.addressCountry)],
    ['State / Province', display(d.addressState)],
    ['City', display(d.addressCity)],
    ['Pincode', display(d.addressPostalCode)],
    ['Map Location', display(d.mapLocation)],
    ['Latitude', display(d.latitude)],
    ['Longitude', display(d.longitude)],
  ]}
/>


        <ReviewSection
          title="Business Settings"
          onEdit={() => navigate("/company-setup/business-settings")}
          rows={[
            ["Financial Year", display(d.financialYear)],
            ["Currency", display(d.currency)],
            ["Time Zone", display(d.timezone)],
            ["Date Format", display(d.dateFormat)],
            ["Week Starts On", display(d.weekStartsOn)],
          ]}
        />
      </div>

      <div className="setup-actions">
        <button
          type="button"
          className="setup-btn setup-btn-secondary"
          onClick={handleBack}
        >
          <BackArrowIcon />
          Back
        </button>
        <button
          type="button"
          className="setup-btn setup-btn-primary"
          onClick={handleComplete}
        >
          Complete Setup
        </button>
      </div>
    </CompanySetupLayout>
  );
}

function ReviewSection({ title, onEdit, rows }) {
  return (
    <section className="review-section">
      <header className="review-section-header">
        <h2>{title}</h2>
        <button type="button" className="review-edit-btn" onClick={onEdit}>
          Edit
        </button>
      </header>
      <dl className="review-rows">
        {rows.map(([label, value]) => (
          <div className="review-row" key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function BackArrowIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M13 8H3M7 4L3 8l4 4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default Review;
