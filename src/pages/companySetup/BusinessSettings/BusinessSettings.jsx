import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import CompanySetupLayout from "../CompanySetupLayout/CompanySetupLayout";
import { useCompanySetup, isEmpty } from "../CompanySetupContext";

import { getCompanyOptions } from "../../../services/api/companyAPI";

import "./BusinessSettings.css";

function BusinessSettings() {
  const navigate = useNavigate();

  const {
    companySetupData,
    updateCompanySetupData,
  } = useCompanySetup();

  const [options, setOptions] = useState({
    financial_years: [],
    currencies: [],
    time_zones: [],
    date_formats: [],
    week_starts_on: [],
  });

  const [optionsLoading, setOptionsLoading] = useState(true);
  const [optionsError, setOptionsError] = useState("");

  const [form, setForm] = useState({
    financialYear: companySetupData.financialYear,
    currency: companySetupData.currency,
    timezone: companySetupData.timezone,
    dateFormat: companySetupData.dateFormat,
    weekStartsOn: companySetupData.weekStartsOn,
  });

  const [errors, setErrors] = useState({});

  /* ------------------------------------------------------------- */
  /* Load options from backend                                     */
  /* ------------------------------------------------------------- */

  useEffect(() => {
    const loadOptions = async () => {
      try {
        setOptionsLoading(true);
        setOptionsError("");

        const response = await getCompanyOptions();

        setOptions({
          financial_years:
            response.data?.financial_years || [],
          currencies:
            response.data?.currencies || [],
          time_zones:
            response.data?.time_zones || [],
          date_formats:
            response.data?.date_formats || [],
          week_starts_on:
            response.data?.week_starts_on || [],
        });
      } catch (error) {
        console.error(
          "Failed to load company options:",
          error
        );

        setOptionsError(
          "Unable to load business settings. Please refresh and try again."
        );
      } finally {
        setOptionsLoading(false);
      }
    };

    loadOptions();
  }, []);

  /* ------------------------------------------------------------- */
  /* Form handlers                                                  */
  /* ------------------------------------------------------------- */

  const handleChange = (field) => (event) => {
    setForm((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));

    setErrors((prev) => ({
      ...prev,
      [field]: "",
    }));
  };

  /* ------------------------------------------------------------- */
  /* Validation                                                     */
  /* ------------------------------------------------------------- */

  const validate = () => {
    const nextErrors = {};

    if (isEmpty(form.financialYear)) {
      nextErrors.financialYear =
        "Please select a financial year.";
    }

    if (isEmpty(form.currency)) {
      nextErrors.currency =
        "Please select a currency.";
    }

    if (isEmpty(form.timezone)) {
      nextErrors.timezone =
        "Please select a time zone.";
    }

    if (isEmpty(form.dateFormat)) {
      nextErrors.dateFormat =
        "Please select a date format.";
    }

    if (isEmpty(form.weekStartsOn)) {
      nextErrors.weekStartsOn =
        "Please select the start of the week.";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  /* ------------------------------------------------------------- */
  /* Navigation                                                     */
  /* ------------------------------------------------------------- */

  const handleBack = () => {
    updateCompanySetupData(form);

    navigate("/company-setup/address");
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!validate()) return;

    updateCompanySetupData(form);

    navigate("/company-setup/review");
  };

  /* ------------------------------------------------------------- */
  /* UI                                                             */
  /* ------------------------------------------------------------- */

  return (
    <CompanySetupLayout
      currentStep="business-settings"
      title="Business Settings"
      subtitle="Configure the basic settings for your workspace."
    >
      <form
        className="setup-form-grid setup-form-grid--single"
        onSubmit={handleSubmit}
        noValidate
      >
        <SelectField
          id="financialYear"
          label="Financial Year"
          required
          placeholder={
            optionsLoading
              ? "Loading financial years..."
              : "Select financial year"
          }
          value={form.financialYear}
          onChange={handleChange("financialYear")}
          options={options.financial_years}
          error={errors.financialYear}
          disabled={optionsLoading}
        />

        <SelectField
          id="currency"
          label="Currency"
          required
          placeholder={
            optionsLoading
              ? "Loading currencies..."
              : "Select currency"
          }
          value={form.currency}
          onChange={handleChange("currency")}
          options={options.currencies}
          error={errors.currency}
          disabled={optionsLoading}
        />

        <SelectField
          id="timezone"
          label="Time Zone"
          required
          placeholder={
            optionsLoading
              ? "Loading time zones..."
              : "Select time zone"
          }
          value={form.timezone}
          onChange={handleChange("timezone")}
          options={options.time_zones}
          error={errors.timezone}
          disabled={optionsLoading}
        />

        <SelectField
          id="dateFormat"
          label="Date Format"
          required
          placeholder={
            optionsLoading
              ? "Loading date formats..."
              : "Select date format"
          }
          value={form.dateFormat}
          onChange={handleChange("dateFormat")}
          options={options.date_formats}
          error={errors.dateFormat}
          disabled={optionsLoading}
        />

        <SelectField
          id="weekStartsOn"
          label="Week Starts On"
          required
          placeholder={
            optionsLoading
              ? "Loading options..."
              : "Select day"
          }
          value={form.weekStartsOn}
          onChange={handleChange("weekStartsOn")}
          options={options.week_starts_on}
          error={errors.weekStartsOn}
          disabled={optionsLoading}
        />

        {optionsError && (
          <p className="setup-error-text">
            {optionsError}
          </p>
        )}

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
            type="submit"
            className="setup-btn setup-btn-primary"
            disabled={optionsLoading}
          >
            {optionsLoading
              ? "Loading..."
              : "Continue"}

            {!optionsLoading && <ArrowIcon />}
          </button>
        </div>
      </form>
    </CompanySetupLayout>
  );
}

/* ------------------------------------------------------------- */
/* Select Field                                                   */
/* ------------------------------------------------------------- */

function SelectField({
  id,
  label,
  required,
  error,
  options,
  placeholder,
  value,
  onChange,
  disabled,
}) {
  return (
    <div
      className={`setup-field ${
        error
          ? "setup-field--error"
          : ""
      }`.trim()}
    >
      <label
        className="setup-label"
        htmlFor={id}
      >
        {label}

        {required && (
          <span
            className="setup-required"
            aria-hidden="true"
          >
            *
          </span>
        )}
      </label>

      <select
        id={id}
        className="setup-select"
        value={value}
        onChange={onChange}
        disabled={disabled}
        data-placeholder={
          value === "" ? "true" : "false"
        }
        aria-required={
          required || undefined
        }
        aria-invalid={Boolean(error)}
        aria-describedby={
          error
            ? `${id}-error`
            : undefined
        }
      >
        <option value="" disabled>
          {placeholder}
        </option>

        {options.map((option) => (
          <option
            key={option}
            value={option}
          >
            {option}
          </option>
        ))}
      </select>

      {error && (
        <p
          id={`${id}-error`}
          className="setup-error-text"
        >
          {error}
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------- */
/* Icons                                                          */
/* ------------------------------------------------------------- */

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

function ArrowIcon() {
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