import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import CompanySetupLayout from "../CompanySetupLayout/CompanySetupLayout";
import {
  useCompanySetup,
  isEmpty,
  isValidEmail,
  isValidPhone,
  isValidPostalCode,
  isValidLogoFile,
} from "../CompanySetupContext";
import "./CompanyDetails.css";

const INDUSTRY_OPTIONS = [
  "Technology",
  "Finance & Banking",
  "Healthcare",
  "Manufacturing",
  "Retail & E-commerce",
  "Education",
  "Real Estate",
  "Hospitality",
  "Construction",
  "Other",
];

const COMPANY_SIZE_OPTIONS = [
  "1-10",
  "11-50",
  "51-100",
  "101-500",
  "501-1000",
  "1000+",
];

const COUNTRY_OPTIONS = [
  "India",
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "Germany",
  "Singapore",
  "United Arab Emirates",
  "Other",
];

const STATE_OPTIONS = [
  "Maharashtra",
  "Delhi",
  "Karnataka",
  "Haryana",
  "Tamil Nadu",
  "Telangana",
  "Gujarat",
  "West Bengal",
  "Other",
];

function CompanyDetails() {
  const navigate = useNavigate();
  const { companySetupData, updateCompanySetupData } = useCompanySetup();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    companyName: companySetupData.companyName,
    legalName: companySetupData.legalName,
    industry: companySetupData.industry,
    companySize: companySetupData.companySize,
    companyEmail: companySetupData.companyEmail,
    phone: companySetupData.phone,
    country: companySetupData.country,
    state: companySetupData.state,
    city: companySetupData.city,
    postalCode: companySetupData.postalCode,
  });
  const [logoName, setLogoName] = useState(companySetupData.companyLogoName);
  const [logoError, setLogoError] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
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
      });
    };
    reader.readAsDataURL(file);
  };

  const validate = () => {
    const nextErrors = {};

    if (isEmpty(form.companyName))
      nextErrors.companyName = "Company name is required.";
    if (isEmpty(form.legalName))
      nextErrors.legalName = "Legal / registered name is required.";
    if (isEmpty(form.industry))
      nextErrors.industry = "Please select an industry.";
    if (isEmpty(form.companySize))
      nextErrors.companySize = "Please select a company size.";

    if (!isEmpty(form.companyEmail) && !isValidEmail(form.companyEmail)) {
      nextErrors.companyEmail = "Enter a valid email address.";
    }

    if (isEmpty(form.phone)) {
      nextErrors.phone = "Phone number is required.";
    } else if (!isValidPhone(form.phone)) {
      nextErrors.phone = "Enter a valid phone number.";
    }


    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event) => {
  event.preventDefault();

  const isValid = validate();

  console.log('Form submitted:', form);
  console.log('Validation result:', isValid);
  console.log('Errors:', errors);

  if (!isValid) return;

  updateCompanySetupData(form);

  console.log('Navigating to Address...');

  navigate('/company-setup/address');
};

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
          id="legalName"
          label="Legal / Registered Name"
          required
          placeholder="Enter legal name"
          value={form.legalName}
          onChange={handleChange("legalName")}
          error={errors.legalName}
        />

        <SelectField
          id="industry"
          label="Industry"
          required
          placeholder="Select industry"
          value={form.industry}
          onChange={handleChange("industry")}
          options={INDUSTRY_OPTIONS}
          error={errors.industry}
        />
        <SelectField
          id="companySize"
          label="Company Size"
          required
          placeholder="Select company size"
          value={form.companySize}
          onChange={handleChange("companySize")}
          options={COMPANY_SIZE_OPTIONS}
          error={errors.companySize}
        />

        <Field
          id="companyEmail"
          label="Company Email"
          type="email"
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
          placeholder="Enter phone number"
          value={form.phone}
          onChange={handleChange("phone")}
          error={errors.phone}
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
                  <>
                    <strong>Click to upload</strong>
                  </>
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

        <div className="setup-field setup-field--full setup-actions setup-actions--end">
          <button
            type="submit"
            className="setup-btn setup-btn-primary"
            disabled={loading}
          >
            {loading ? "Saving..." : "Continue"}
            {!loading && <ArrowIcon />}
          </button>
        </div>
      </form>
    </CompanySetupLayout>
  );
}

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
