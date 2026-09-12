import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import CompanySetupLayout from "../CompanySetupLayout/CompanySetupLayout";
import CompanyEditLayout from "../CompanyEditLayout/CompanyEditLayout";

import { useCompanySetup } from "../CompanySetupContext";
import { getCompany, updateCompany } from "../../../services/api/companyAPI";

import "./CompanyDetails.css";

const initialForm = {
  companyName: "",
  companyCode: "",
  companyLogoName: "",
  companyLogoDataUrl: "",
  companyLogoFile: null,
  industry: "",
  companyEmail: "",
  phone: "",
  website: "",
  companyType: "",
  registrationNumber: "",
};

export default function CompanyDetails({ mode = "setup" }) {
  const navigate = useNavigate();

  const { companySetupData, updateCompanySetupData } = useCompanySetup();

  const [form, setForm] = useState(
    mode === "setup"
      ? {
          ...initialForm,
          ...companySetupData,
        }
      : initialForm,
  );

  const [loading, setLoading] = useState(mode === "edit");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (mode !== "edit") return;

    const loadCompany = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getCompany();
        const data = response?.data || {};

        setForm({
          companyName:
            data?.name || data?.company_name || data?.companyName || "",
          companyCode:
            data?.code || data?.company_code || data?.companyCode || "",
          companyLogoName: data?.logo_name || data?.company_logo_name || "",
          companyLogoDataUrl:
            data?.logo ||
            data?.logo_url ||
            data?.company_logo ||
            data?.companyLogo ||
            "",
          companyLogoFile: null,
          industry: data?.industry || "",
          companyEmail:
            data?.company_email || data?.companyEmail || data?.email || "",
          phone: data?.phone || data?.phone_number || "",
          website: data?.website || "",
          companyType: data?.company_type || data?.companyType || "",
          registrationNumber:
            data?.registration_no ||
            data?.registrationNumber ||
            data?.registration_number ||
            "",
        });
      } catch (err) {
        console.error("Failed to load company details:", err);
        setError(
          err?.response?.data?.detail || "Unable to load company details.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadCompany();
  }, [mode]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLogoChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onloadend = () => {
      setForm((prev) => ({
        ...prev,
        companyLogoName: file.name,
        companyLogoDataUrl: reader.result,
        companyLogoFile: file,
      }));
    };

    reader.readAsDataURL(file);
  };

  const validateForm = () => {
    if (!form.companyName.trim()) {
      setError("Company name is required.");
      return false;
    }

    if (!form.companyCode.trim()) {
      setError("Company code is required.");
      return false;
    }

    if (!form.industry.trim()) {
      setError("Industry is required.");
      return false;
    }

    if (!form.companyEmail.trim()) {
      setError("Company email is required.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (!validateForm()) return;

    if (mode === "setup") {
      updateCompanySetupData(form);
      navigate("/company-setup/address");
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        name: form.companyName,
        code: form.companyCode,
        industry: form.industry,
        company_email: form.companyEmail,
        phone: form.phone,
        website: form.website,
        company_type: form.companyType,
        registration_no: form.registrationNumber,
      };

      const updatedCompany = await updateCompany(payload);

      updateCompanySetupData({
        ...form,
        ...(updatedCompany || {}),
      });

      navigate("/organization-overview");
    } catch (err) {
      console.error("Failed to update company details:", err);

      const backendError = err?.response?.data;

      if (typeof backendError === "string") {
        setError(backendError);
      } else if (backendError?.detail) {
        setError(backendError.detail);
      } else {
        setError("Unable to save company details.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="company-edit-loading">Loading company details...</div>
    );
  }

  if (mode === "edit") {
    return (
      <CompanyEditLayout
        eyebrow="Organization"
        title="Company Details"
        description="Update your company's basic information, contact details, and registration information."
        onSubmit={handleSubmit}
        submitting={submitting}
      >
        {error && <div className="company-form-error">{error}</div>}

        <div className="company-form-grid">
          <div className="company-form-field">
            <label htmlFor="companyName">Company Name</label>
            <input
              id="companyName"
              name="companyName"
              value={form.companyName}
              onChange={handleChange}
              placeholder="Enter company name"
            />
          </div>

          <div className="company-form-field">
            <label htmlFor="companyCode">Company Code</label>
            <input
              id="companyCode"
              name="companyCode"
              value={form.companyCode}
              onChange={handleChange}
              placeholder="Enter company code"
            />
          </div>

          <div className="company-form-field">
            <label htmlFor="industry">Industry</label>
            <input
              id="industry"
              name="industry"
              value={form.industry}
              onChange={handleChange}
              placeholder="e.g. Information Technology"
            />
          </div>

          <div className="company-form-field">
            <label htmlFor="companyType">Company Type</label>
            <input
              id="companyType"
              name="companyType"
              value={form.companyType}
              onChange={handleChange}
              placeholder="e.g. Private Limited"
            />
          </div>

          <div className="company-form-field">
            <label htmlFor="companyEmail">Company Email</label>
            <input
              id="companyEmail"
              name="companyEmail"
              type="email"
              value={form.companyEmail}
              onChange={handleChange}
              placeholder="company@example.com"
            />
          </div>

          <div className="company-form-field">
            <label htmlFor="phone">Phone</label>
            <input
              id="phone"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="Enter phone number"
            />
          </div>

          <div className="company-form-field">
            <label htmlFor="website">Website</label>
            <input
              id="website"
              name="website"
              value={form.website}
              onChange={handleChange}
              placeholder="https://example.com"
            />
          </div>

          <div className="company-form-field">
            <label htmlFor="registrationNumber">Registration Number</label>
            <input
              id="registrationNumber"
              name="registrationNumber"
              value={form.registrationNumber}
              onChange={handleChange}
              placeholder="Enter registration number"
            />
          </div>
        </div>

        <div className="company-logo-section">
          <div>
            <label>Company Logo</label>
            <p>Upload a logo for your organization.</p>
          </div>

          <input
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            onChange={handleLogoChange}
          />

          {form.companyLogoDataUrl && (
            <img
              src={form.companyLogoDataUrl}
              alt="Company logo preview"
              className="company-logo-preview"
            />
          )}
        </div>
      </CompanyEditLayout>
    );
  }

  return (
    <CompanySetupLayout
      title="Company Details"
      description="Tell us about your company."
      currentStep={1}
      onNext={handleSubmit}
      nextLabel="Continue"
    >
      {error && <div className="company-form-error">{error}</div>}

      <div className="company-form-grid">
        <div className="company-form-field">
          <label htmlFor="companyName">Company Name</label>
          <input
            id="companyName"
            name="companyName"
            value={form.companyName}
            onChange={handleChange}
            placeholder="Enter company name"
          />
        </div>

        <div className="company-form-field">
          <label htmlFor="companyCode">Company Code</label>
          <input
            id="companyCode"
            name="companyCode"
            value={form.companyCode}
            onChange={handleChange}
            placeholder="Enter company code"
          />
        </div>

        <div className="company-form-field">
          <label htmlFor="industry">Industry</label>
          <input
            id="industry"
            name="industry"
            value={form.industry}
            onChange={handleChange}
            placeholder="Enter industry"
          />
        </div>

        <div className="company-form-field">
          <label htmlFor="companyType">Company Type</label>
          <input
            id="companyType"
            name="companyType"
            value={form.companyType}
            onChange={handleChange}
            placeholder="Enter company type"
          />
        </div>

        <div className="company-form-field">
          <label htmlFor="companyEmail">Company Email</label>
          <input
            id="companyEmail"
            name="companyEmail"
            type="email"
            value={form.companyEmail}
            onChange={handleChange}
            placeholder="company@example.com"
          />
        </div>

        <div className="company-form-field">
          <label htmlFor="phone">Phone</label>
          <input
            id="phone"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="Enter phone number"
          />
        </div>

        <div className="company-form-field">
          <label htmlFor="website">Website</label>
          <input
            id="website"
            name="website"
            value={form.website}
            onChange={handleChange}
            placeholder="https://example.com"
          />
        </div>

        <div className="company-form-field">
          <label htmlFor="registrationNumber">Registration Number</label>
          <input
            id="registrationNumber"
            name="registrationNumber"
            value={form.registrationNumber}
            onChange={handleChange}
            placeholder="Enter registration number"
          />
        </div>
      </div>

      <div className="company-logo-section">
        <div>
          <label>Company Logo</label>
          <p>Upload a logo for your organization.</p>
        </div>

        <input
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp"
          onChange={handleLogoChange}
        />

        {form.companyLogoDataUrl && (
          <img
            src={form.companyLogoDataUrl}
            alt="Company logo preview"
            className="company-logo-preview"
          />
        )}
      </div>
    </CompanySetupLayout>
  );
}
