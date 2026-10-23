import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import CompanySetupLayout from "../CompanySetupLayout/CompanySetupLayout";
import CompanyEditLayout from "../CompanyEditLayout/CompanyEditLayout";
import IgniteLoader from "../../../components/common/IgniteLoader/IgniteLoader";

import { useCompanySetup, validateLogoFileAsync } from "../CompanySetupContext";
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
  const [logoError, setLogoError] = useState("");
  const [logoMeta, setLogoMeta] = useState(null);

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

  const handleLogoChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLogoError("");
    const validation = await validateLogoFileAsync(file);

    if (!validation.valid) {
      setLogoError(validation.message);
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setForm((prev) => ({
        ...prev,
        companyLogoName: file.name,
        companyLogoDataUrl: reader.result,
        companyLogoFile: file,
      }));
      setLogoMeta({
        width: validation.width,
        height: validation.height,
        aspectRatio: validation.aspectRatio,
        sizeFormatted: validation.sizeFormatted,
        isSvg: validation.isSvg,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setForm((prev) => ({
      ...prev,
      companyLogoName: "",
      companyLogoDataUrl: "",
      companyLogoFile: null,
    }));
    setLogoError("");
    setLogoMeta(null);
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

      if (form.companyLogoFile) {
        payload.logo = form.companyLogoFile;
      } else if (form.companyLogoDataUrl === "") {
        payload.logo = null;
      }

      const updatedCompanyRes = await updateCompany(payload);
      const updatedCompany = updatedCompanyRes?.data || updatedCompanyRes;

      updateCompanySetupData({
        ...form,
        ...(updatedCompany || {}),
      });

      // Notify other parts of the app (like Sidebar) about company logo update
      try {
        const logoUrl = updatedCompany?.logo_url || updatedCompany?.logo;
        if (logoUrl) {
          const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
          const merged = { ...storedUser, company_logo: logoUrl, company_logo_url: logoUrl };
          localStorage.setItem("user", JSON.stringify(merged));
          window.dispatchEvent(new CustomEvent("ignite:user-updated", { detail: { user: merged } }));
        }
      } catch (syncErr) {
        console.warn("Could not sync company logo:", syncErr);
      }

      navigate("/organization-overview");
    } catch (err) {
      console.error("Failed to update company details:", err);

      const backendError = err?.response?.data;

      if (typeof backendError === "string") {
        setError(backendError);
      } else if (backendError?.logo) {
        const logoMsg = Array.isArray(backendError.logo)
          ? backendError.logo.join(" ")
          : backendError.logo;
        setLogoError(logoMsg);
        setError(logoMsg);
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
    return <IgniteLoader text="Loading company details..." />;
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
          <div className="company-logo-header">
            <label>Company Logo</label>
            <p className="company-logo-hint">
              Upload a logo for your organization. Displayed on payslip headers, PDF exports, and official documents.
            </p>
            <span className="company-logo-guidelines">
              Recommended: Transparent PNG or SVG (crisp JPG/WebP also supported) • Max 2MB • Min 60×30px, Max 2500×2500px • Horizontal or balanced aspect ratio (1:2 to 5:1).
            </span>
          </div>

          <div className="company-logo-input-wrapper">
            <input
              id="company-logo-edit-input"
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
              onChange={handleLogoChange}
            />
          </div>

          {logoError && (
            <div className="company-logo-error" role="alert">
              {logoError}
            </div>
          )}

          {form.companyLogoDataUrl && (
            <div className="company-logo-preview-card">
              <div className="company-logo-preview-frame">
                <img
                  src={form.companyLogoDataUrl}
                  alt="Company logo preview"
                  className="company-logo-preview"
                />
              </div>
              <div className="company-logo-details">
                <span className="company-logo-name">{form.companyLogoName || "Company Logo"}</span>
                {logoMeta && (
                  <span className="company-logo-meta">
                    {logoMeta.isSvg ? "SVG Vector" : `${logoMeta.width} × ${logoMeta.height} px (Ratio ${logoMeta.aspectRatio?.toFixed?.(2) || logoMeta.aspectRatio}:1)`} • {logoMeta.sizeFormatted}
                  </span>
                )}
                <button
                  type="button"
                  className="company-logo-remove-btn"
                  onClick={handleRemoveLogo}
                >
                  Remove logo
                </button>
              </div>
            </div>
          )}
        </div>
      </CompanyEditLayout>
    );
  }

  return (
    <CompanySetupLayout
      title="Company Details"
      subtitle="Tell us about your company."
      currentStep="company-details"
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
        <div className="company-logo-header">
          <label>Company Logo</label>
          <p className="company-logo-hint">
            Upload a logo for your organization. Displayed on payslip headers, PDF exports, and official documents.
          </p>
          <span className="company-logo-guidelines">
            Recommended: Transparent PNG or SVG (crisp JPG/WebP also supported) • Max 2MB • Min 60×30px, Max 2500×2500px • Horizontal or balanced aspect ratio (1:2 to 5:1).
          </span>
        </div>

        <div className="company-logo-input-wrapper">
          <input
            id="company-logo-setup-input"
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
            onChange={handleLogoChange}
          />
        </div>

        {logoError && (
          <div className="company-logo-error" role="alert">
            {logoError}
          </div>
        )}

        {form.companyLogoDataUrl && (
          <div className="company-logo-preview-card">
            <div className="company-logo-preview-frame">
              <img
                src={form.companyLogoDataUrl}
                alt="Company logo preview"
                className="company-logo-preview"
              />
            </div>
            <div className="company-logo-details">
              <span className="company-logo-name">{form.companyLogoName || "Company Logo"}</span>
              {logoMeta && (
                <span className="company-logo-meta">
                  {logoMeta.isSvg ? "SVG Vector" : `${logoMeta.width} × ${logoMeta.height} px (Ratio ${logoMeta.aspectRatio?.toFixed?.(2) || logoMeta.aspectRatio}:1)`} • {logoMeta.sizeFormatted}
                </span>
              )}
              <button
                type="button"
                className="company-logo-remove-btn"
                onClick={handleRemoveLogo}
              >
                Remove logo
              </button>
            </div>
          </div>
        )}
      </div>
    </CompanySetupLayout>
  );
}
