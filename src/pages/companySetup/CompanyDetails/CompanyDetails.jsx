import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import CompanySetupLayout from "../CompanySetupLayout/CompanySetupLayout";
import {
  useCompanySetup,
  isEmpty,
  isValidEmail,
  isValidPhone,
  isValidLogoFile,
} from "../CompanySetupContext";

import { getCompanyOptions } from "../../../services/api/companyAPI";

import "./CompanyDetails.css";

function CompanyDetails() {
  const navigate = useNavigate();

  const { companySetupData, updateCompanySetupData } = useCompanySetup();

  const fileInputRef = useRef(null);

  const [options, setOptions] = useState({
    industries: [],
    company_types: [],
  });

  const [optionsLoading, setOptionsLoading] = useState(true);
  const [optionsError, setOptionsError] = useState("");

  const [form, setForm] = useState({
    companyName: companySetupData.companyName,
    companyCode: companySetupData.companyCode,
    companyLogoName: companySetupData.companyLogoName,
    companyLogoDataUrl: companySetupData.companyLogoDataUrl,
    industry: companySetupData.industry,
    companyEmail: companySetupData.companyEmail,
    phone: companySetupData.phone,
    website: companySetupData.website,
    companyType: companySetupData.companyType,
    registrationNumber: companySetupData.registrationNumber,
  });

  const [logoName, setLogoName] = useState(companySetupData.companyLogoName);

  const [logoError, setLogoError] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  /* ------------------------------------------------------------- */
  /* Load company options from backend                             */
  /* ------------------------------------------------------------- */

  useEffect(() => {
    const loadOptions = async () => {
      try {
        setOptionsLoading(true);
        setOptionsError("");

        const data = await getCompanyOptions();

        setOptions({
          industries: data.data?.industries || [],
          company_types: data.data?.company_types || [],
        });
      } catch (error) {
        console.error("Failed to load company options:", error);

        setOptionsError(
          "Unable to load company options. Please refresh and try again.",
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

  const handleLogoSelect = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const result = isValidLogoFile(file);

    if (!result.valid) {
      setLogoError(result.message);
      return;
    }

    setLogoError("");
    setLogoName(file.name);

    const reader = new FileReader();

    reader.onload = () => {
      updateCompanySetupData({
        companyLogoName: file.name,
        companyLogoDataUrl: reader.result,
        companyLogoFile: file,
      });
    };

    reader.readAsDataURL(file);
  };

  /* ------------------------------------------------------------- */
  /* Validation                                                     */
  /* ------------------------------------------------------------- */

  const validate = () => {
    const nextErrors = {};

    if (isEmpty(form.companyName)) {
      nextErrors.companyName = "Company name is required.";
    }

    if (isEmpty(form.companyCode)) {
      nextErrors.companyCode = "Company code is required.";
    }

    if (isEmpty(form.industry)) {
      nextErrors.industry = "Please select an industry.";
    }

    if (isEmpty(form.companyEmail)) {
      nextErrors.companyEmail = "Company email is required.";
    } else if (!isValidEmail(form.companyEmail)) {
      nextErrors.companyEmail = "Enter a valid email address.";
    }

    if (isEmpty(form.phone)) {
      nextErrors.phone = "Phone number is required.";
    } else if (!isValidPhone(form.phone)) {
      nextErrors.phone = "Phone number must be exactly 10 digits.";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  /* ------------------------------------------------------------- */
  /* Submit                                                         */
  /* ------------------------------------------------------------- */

  const handleSubmit = (event) => {
    event.preventDefault();

    const isValid = validate();

    if (!isValid) return;

    updateCompanySetupData(form);

    navigate("/company-setup/address");
  };

  /* ------------------------------------------------------------- */
  /* UI                                                             */
  /* ------------------------------------------------------------- */

  return (
    <CompanySetupLayout
      currentStep="company-details"
      title="Company Details"
      subtitle="Let's start with the basic information about your company."
    >
      <form className="setup-form-grid" onSubmit={handleSubmit} noValidate>
        <Field
          id="companyName"
          label="Company Name"
          required
          placeholder="Enter company name"
          value={form.companyName}
          onChange={handleChange("companyName")}
          error={errors.companyName}
        />

        <Field
          id="companyCode"
          label="Company Code"
          required
          placeholder="Enter company code"
          value={form.companyCode}
          onChange={handleChange("companyCode")}
          error={errors.companyCode}
        />

        <SelectField
          id="industry"
          label="Industry"
          required
          placeholder="Select industry"
          value={form.industry}
          onChange={handleChange("industry")}
          options={options.industries}
          error={errors.industry}
        />

        <SelectField
          id="companyType"
          label="Company Type"
          placeholder="Select company type"
          value={form.companyType}
          onChange={handleChange("companyType")}
          options={options.company_types}
          error={errors.companyType}
        />

        <Field
          id="companyEmail"
          label="Company Email"
          type="email"
          required
          placeholder="Enter company email"
          value={form.companyEmail}
          onChange={handleChange("companyEmail")}
          error={errors.companyEmail}
        />

        <Field
          id="phone"
          label="Phone"
          required
          type="tel"
          inputMode="numeric"
          maxLength={10}
          placeholder="Enter 10-digit phone number"
          value={form.phone}
          onChange={(event) => {
            const value = event.target.value.replace(/\D/g, "").slice(0, 10);

            setForm((prev) => ({
              ...prev,
              phone: value,
            }));

            setErrors((prev) => ({
              ...prev,
              phone: "",
            }));
          }}
          error={errors.phone}
        />

        <Field
          id="website"
          label="Website"
          type="url"
          placeholder="https://example.com"
          value={form.website}
          onChange={handleChange("website")}
          error={errors.website}
        />

        <Field
          id="registrationNumber"
          label="GST/CIN/Registration No."
          placeholder="Enter registration number"
          value={form.registrationNumber}
          onChange={handleChange("registrationNumber")}
          error={errors.registrationNumber}
        />

        <div className="setup-field setup-field--full">
          <label className="setup-label" htmlFor="companyLogo">
            Company Logo
          </label>

          <div
            className="setup-upload"
            role="button"
            tabIndex={0}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                fileInputRef.current?.click();
              }
            }}
          >
            <span className="setup-upload-icon" aria-hidden="true">
              <UploadIcon />
            </span>

            <span>
              <span className="setup-upload-text">
                {logoName ? (
                  <span className="setup-upload-preview">{logoName}</span>
                ) : (
                  <strong>Click to upload</strong>
                )}
              </span>

              <span className="setup-upload-hint" style={{ display: "block" }}>
                PNG, JPG or SVG (max. 2MB)
              </span>
            </span>

            <input
              ref={fileInputRef}
              id="companyLogo"
              type="file"
              accept=".png,.jpg,.jpeg,.svg"
              className="setup-upload-input"
              aria-label="Upload company logo"
              onChange={handleLogoSelect}
            />
          </div>

          {logoError && <p className="setup-error-text">{logoError}</p>}
        </div>

        {optionsError && <p className="setup-error-text">{optionsError}</p>}

        <div className="setup-field setup-field--full setup-actions setup-actions--end">
          <button
            type="submit"
            className="setup-btn setup-btn-primary"
            disabled={loading || optionsLoading}
          >
            {loading || optionsLoading ? "Loading..." : "Continue"}

            {!loading && !optionsLoading && <ArrowIcon />}
          </button>
        </div>
      </form>
    </CompanySetupLayout>
  );
}

/* ------------------------------------------------------------- */
/* Reusable Field                                                */
/* ------------------------------------------------------------- */

function Field({ id, label, required, error, ...inputProps }) {
  return (
    <div className={`setup-field ${error ? "setup-field--error" : ""}`.trim()}>
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

/* ------------------------------------------------------------- */
/* Reusable Select                                               */
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
}) {
  return (
    <div className={`setup-field ${error ? "setup-field--error" : ""}`.trim()}>
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
        data-placeholder={value === "" ? "true" : "false"}
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

/* ------------------------------------------------------------- */
/* Icons                                                          */
/* ------------------------------------------------------------- */

function UploadIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M10 13V4M10 4L6.5 7.5M10 4l3.5 3.5"
        stroke="#00A375"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M3.5 13.5V15a1.5 1.5 0 001.5 1.5h10a1.5 1.5 0 001.5-1.5v-1.5"
        stroke="#00A375"
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

export default CompanyDetails;
