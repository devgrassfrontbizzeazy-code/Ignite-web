import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CompanySetupLayout from '../CompanySetupLayout/CompanySetupLayout';
import { useCompanySetup, isEmpty, isValidPostalCode } from '../CompanySetupContext';
import './Address.css';

const COUNTRY_OPTIONS = [
  'India',
  'United States',
  'United Kingdom',
  'Canada',
  'Australia',
  'Germany',
  'Singapore',
  'United Arab Emirates',
  'Other',
];

const STATE_OPTIONS = [
  'Maharashtra',
  'Delhi',
  'Karnataka',
  'Haryana',
  'Tamil Nadu',
  'Telangana',
  'Gujarat',
  'West Bengal',
  'Other',
];

function Address() {
  const navigate = useNavigate();
  const { companySetupData, updateCompanySetupData } = useCompanySetup();

  const [form, setForm] = useState({
    addressLine1: companySetupData.addressLine1,
    addressLine2: companySetupData.addressLine2,
    addressCountry: companySetupData.addressCountry,
    addressState: companySetupData.addressState,
    addressCity: companySetupData.addressCity,
    addressPostalCode: companySetupData.addressPostalCode,
  });
  const [errors, setErrors] = useState({});

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const nextErrors = {};

    if (isEmpty(form.addressLine1)) nextErrors.addressLine1 = 'Address line 1 is required.';
    if (isEmpty(form.addressCountry)) nextErrors.addressCountry = 'Please select a country.';
    if (isEmpty(form.addressState)) nextErrors.addressState = 'Please select a state / province.';
    if (isEmpty(form.addressCity)) nextErrors.addressCity = 'City is required.';

    if (isEmpty(form.addressPostalCode)) {
      nextErrors.addressPostalCode = 'Postal / zip code is required.';
    } else if (!isValidPostalCode(form.addressPostalCode)) {
      nextErrors.addressPostalCode = 'Enter a valid postal / zip code.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleBack = () => {
    updateCompanySetupData(form);
    navigate('/company-setup/company-details');
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!validate()) return;

    updateCompanySetupData(form);
    navigate('/company-setup/business-settings');
  };

  return (
    <CompanySetupLayout
      currentStep="address"
      title="Business Address"
      subtitle="Tell us where your company is located."
    >
      <form className="setup-form-grid" onSubmit={handleSubmit} noValidate>
        <div className="setup-field setup-field--full">
          <Field
            id="addressLine1"
            label="Address Line 1"
            required
            placeholder="Street address, P.O. box"
            value={form.addressLine1}
            onChange={handleChange('addressLine1')}
            error={errors.addressLine1}
          />
        </div>

        <div className="setup-field setup-field--full">
          <Field
            id="addressLine2"
            label="Address Line 2"
            placeholder="Apartment, suite, floor (optional)"
            value={form.addressLine2}
            onChange={handleChange('addressLine2')}
            error={errors.addressLine2}
          />
        </div>

        <SelectField
          id="addressCountry"
          label="Country"
          required
          placeholder="Select country"
          value={form.addressCountry}
          onChange={handleChange('addressCountry')}
          options={COUNTRY_OPTIONS}
          error={errors.addressCountry}
        />
        <SelectField
          id="addressState"
          label="State / Province"
          required
          placeholder="Select state"
          value={form.addressState}
          onChange={handleChange('addressState')}
          options={STATE_OPTIONS}
          error={errors.addressState}
        />

        <Field
          id="addressCity"
          label="City"
          required
          placeholder="Enter city"
          value={form.addressCity}
          onChange={handleChange('addressCity')}
          error={errors.addressCity}
        />
        <Field
          id="addressPostalCode"
          label="Postal / Zip Code"
          required
          placeholder="Enter postal code"
          value={form.addressPostalCode}
          onChange={handleChange('addressPostalCode')}
          error={errors.addressPostalCode}
        />

        <div className="setup-field setup-field--full setup-actions">
          <button type="button" className="setup-btn setup-btn-secondary" onClick={handleBack}>
            <BackArrowIcon />
            Back
          </button>
          <button type="submit" className="setup-btn setup-btn-primary">
            Continue
            <ArrowIcon />
          </button>
        </div>
      </form>
    </CompanySetupLayout>
  );
}

function Field({ id, label, required, error, ...inputProps }) {
  return (
    <div className={`setup-field ${error ? 'setup-field--error' : ''}`.trim()}>
      <label className="setup-label" htmlFor={id}>
        {label}
        {required && (
          <span className="setup-required" aria-hidden="true">
            *
          </span>
        )}
      </label>
      <input
        id={id}
        className="setup-input"
        aria-required={required || undefined}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        {...inputProps}
      />
      {error && (
        <p id={`${id}-error`} className="setup-error-text">
          {error}
        </p>
      )}
    </div>
  );
}

function SelectField({ id, label, required, error, options, placeholder, value, onChange }) {
  return (
    <div className={`setup-field ${error ? 'setup-field--error' : ''}`.trim()}>
      <label className="setup-label" htmlFor={id}>
        {label}
        {required && (
          <span className="setup-required" aria-hidden="true">
            *
          </span>
        )}
      </label>
      <select
        id={id}
        className="setup-select"
        value={value}
        onChange={onChange}
        data-placeholder={value === '' ? 'true' : 'false'}
        aria-required={required || undefined}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      {error && (
        <p id={`${id}-error`} className="setup-error-text">
          {error}
        </p>
      )}
    </div>
  );
}

function BackArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
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

function ArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M3 8h10M9 4l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default Address;
