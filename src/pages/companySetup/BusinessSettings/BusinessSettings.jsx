import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CompanySetupLayout from '../CompanySetupLayout/CompanySetupLayout';
import { useCompanySetup, isEmpty } from '../CompanySetupContext';
import './BusinessSettings.css';

const FINANCIAL_YEAR_OPTIONS = ['January - December', 'April - March', 'July - June'];

const CURRENCY_OPTIONS = [
  'INR - Indian Rupee',
  'USD - US Dollar',
  'EUR - Euro',
  'GBP - British Pound',
];

const TIMEZONE_OPTIONS = [
  'Asia/Kolkata',
  'UTC',
  'America/New_York',
  'America/Los_Angeles',
  'Europe/London',
];

const DATE_FORMAT_OPTIONS = ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'];

const WEEK_START_OPTIONS = ['Monday', 'Sunday'];

function BusinessSettings() {
  const navigate = useNavigate();
  const { companySetupData, updateCompanySetupData } = useCompanySetup();

  const [form, setForm] = useState({
    financialYear: companySetupData.financialYear,
    currency: companySetupData.currency,
    timezone: companySetupData.timezone,
    dateFormat: companySetupData.dateFormat,
    weekStartsOn: companySetupData.weekStartsOn,
  });
  const [errors, setErrors] = useState({});

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const nextErrors = {};
    if (isEmpty(form.financialYear)) nextErrors.financialYear = 'Please select a financial year.';
    if (isEmpty(form.currency)) nextErrors.currency = 'Please select a currency.';
    if (isEmpty(form.timezone)) nextErrors.timezone = 'Please select a time zone.';
    if (isEmpty(form.dateFormat)) nextErrors.dateFormat = 'Please select a date format.';
    if (isEmpty(form.weekStartsOn)) nextErrors.weekStartsOn = 'Please select the start of the week.';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleBack = () => {
    updateCompanySetupData(form);
    navigate('/company-setup/address');
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!validate()) return;

    updateCompanySetupData(form);
    navigate('/company-setup/review');
  };

  return (
    <CompanySetupLayout
      currentStep="business-settings"
      title="Business Settings"
      subtitle="Configure the basic settings for your workspace."
    >
      <form className="setup-form-grid setup-form-grid--single" onSubmit={handleSubmit} noValidate>
        <SelectField
          id="financialYear"
          label="Financial Year"
          required
          placeholder="Select financial year"
          value={form.financialYear}
          onChange={handleChange('financialYear')}
          options={FINANCIAL_YEAR_OPTIONS}
          error={errors.financialYear}
        />
        <SelectField
          id="currency"
          label="Currency"
          required
          placeholder="Select currency"
          value={form.currency}
          onChange={handleChange('currency')}
          options={CURRENCY_OPTIONS}
          error={errors.currency}
        />
        <SelectField
          id="timezone"
          label="Time Zone"
          required
          placeholder="Select time zone"
          value={form.timezone}
          onChange={handleChange('timezone')}
          options={TIMEZONE_OPTIONS}
          error={errors.timezone}
        />
        <SelectField
          id="dateFormat"
          label="Date Format"
          required
          placeholder="Select date format"
          value={form.dateFormat}
          onChange={handleChange('dateFormat')}
          options={DATE_FORMAT_OPTIONS}
          error={errors.dateFormat}
        />
        <SelectField
          id="weekStartsOn"
          label="Week Starts On"
          required
          placeholder="Select day"
          value={form.weekStartsOn}
          onChange={handleChange('weekStartsOn')}
          options={WEEK_START_OPTIONS}
          error={errors.weekStartsOn}
        />

        <div className="setup-actions">
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

export default BusinessSettings;
