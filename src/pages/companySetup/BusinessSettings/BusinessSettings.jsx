import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import CompanySetupLayout from "../CompanySetupLayout/CompanySetupLayout";
import CompanyEditLayout from "../CompanyEditLayout/CompanyEditLayout";

import { useCompanySetup } from "../CompanySetupContext";
import {
  getCompany,
  getCompanyOptions,
  updateCompany,
} from "../../../services/api/companyAPI";

import "./BusinessSettings.css";

const initialForm = {
  financialYear: "",
  currency: "",
  timezone: "",
  dateFormat: "",
  weekStartsOn: "",
};

export default function BusinessSettings({ mode = "setup" }) {
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

  const [options, setOptions] = useState({
    financialYears: [],
    currencies: [],
    timezones: [],
    dateFormats: [],
    weekStartsOn: [],
  });

  const [loading, setLoading] = useState(mode === "edit");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const response = await getCompanyOptions();

        console.log("COMPANY OPTIONS RESPONSE:", response);

        const data = response?.data || response || {};

        setOptions({
          financialYears: Array.isArray(data?.financial_years)
            ? data.financial_years
            : [],

          currencies: Array.isArray(data?.currencies) ? data.currencies : [],

          timezones: Array.isArray(data?.timezones)
            ? data.timezones
            : Array.isArray(data?.time_zones)
              ? data.time_zones
              : [],

          dateFormats: Array.isArray(data?.date_formats)
            ? data.date_formats
            : Array.isArray(data?.dateFormats)
              ? data.dateFormats
              : [],

          weekStartsOn: Array.isArray(data?.week_starts_on)
            ? data.week_starts_on
            : Array.isArray(data?.weekStartsOn)
              ? data.weekStartsOn
              : [],
        });
      } catch (err) {
        console.error("Failed to load company options:", err);
      }
    };

    loadOptions();
  }, []);

  useEffect(() => {
    if (mode !== "edit") return;

    const loadCompany = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getCompany();
        const data = response?.data || {};

        console.log("COMPANY BUSINESS SETTINGS:", data);

        setForm({
          financialYear: data?.financial_year ?? data?.financialYear ?? "",

          currency: data?.currency ?? "",

          timezone: data?.time_zone ?? data?.timezone ?? "",

          dateFormat: data?.date_format ?? data?.dateFormat ?? "",

          weekStartsOn: data?.week_starts_on ?? data?.weekStartsOn ?? "",
        });
      } catch (err) {
        console.error("Failed to load business settings:", err);

        setError(
          err?.response?.data?.detail || "Unable to load business settings.",
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

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (!form.financialYear) {
      setError("Financial year is required.");
      return;
    }

    if (!form.currency) {
      setError("Currency is required.");
      return;
    }

    if (!form.timezone) {
      setError("Timezone is required.");
      return;
    }

    if (!form.dateFormat) {
      setError("Date format is required.");
      return;
    }

    if (!form.weekStartsOn) {
      setError("Week start day is required.");
      return;
    }

    if (mode === "setup") {
      updateCompanySetupData(form);
      navigate("/company-setup/review");
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        financial_year: form.financialYear,
        currency: form.currency,
        time_zone: form.timezone,
        date_format: form.dateFormat,
        week_starts_on: form.weekStartsOn,
      };

      const response = await updateCompany(payload);
      const updatedCompany = response?.data || {};

      updateCompanySetupData({
        ...form,
        ...(updatedCompany || {}),
      });

      navigate("/organization-overview");
    } catch (err) {
      console.error("Failed to update business settings:", err);

      const backendError = err?.response?.data;

      if (typeof backendError === "string") {
        setError(backendError);
      } else if (backendError?.detail) {
        setError(backendError.detail);
      } else {
        setError("Unable to save business settings.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const renderOptions = (list) => {
    if (!Array.isArray(list)) {
      return null;
    }

    return list.map((item, index) => {
      if (typeof item === "string" || typeof item === "number") {
        return (
          <option key={`${item}-${index}`} value={item}>
            {item}
          </option>
        );
      }

      if (!item || typeof item !== "object") {
        return null;
      }

      const value = item.value ?? item.code ?? item.id ?? item.key ?? "";

      const label =
        item.label ?? item.name ?? item.title ?? item.value ?? item.code ?? "";

      return (
        <option key={`${value}-${index}`} value={value}>
          {label}
        </option>
      );
    });
  };

  if (loading) {
    return (
      <div className="company-edit-loading">Loading business settings...</div>
    );
  }

  const formContent = (
    <>
      {error && <div className="company-form-error">{error}</div>}

      <div className="company-form-grid">
        <div className="company-form-field">
          <label htmlFor="financialYear">Financial Year</label>

          <select
            id="financialYear"
            name="financialYear"
            value={form.financialYear}
            onChange={handleChange}
          >
            <option value="">Select financial year</option>

            {renderOptions(options.financialYears)}
          </select>
        </div>

        <div className="company-form-field">
          <label htmlFor="currency">Currency</label>

          <select
            id="currency"
            name="currency"
            value={form.currency}
            onChange={handleChange}
          >
            <option value="">Select currency</option>

            {renderOptions(options.currencies)}
          </select>
        </div>

        <div className="company-form-field company-form-field--full">
          <label htmlFor="timezone">Timezone</label>

          <select
            id="timezone"
            name="timezone"
            value={form.timezone}
            onChange={handleChange}
          >
            <option value="">Select timezone</option>

            {renderOptions(options.timezones)}
          </select>
        </div>

        <div className="company-form-field">
          <label htmlFor="dateFormat">Date Format</label>

          <select
            id="dateFormat"
            name="dateFormat"
            value={form.dateFormat}
            onChange={handleChange}
          >
            <option value="">Select date format</option>

            {renderOptions(options.dateFormats)}
          </select>
        </div>

        <div className="company-form-field">
          <label htmlFor="weekStartsOn">Week Starts On</label>

          <select
            id="weekStartsOn"
            name="weekStartsOn"
            value={form.weekStartsOn}
            onChange={handleChange}
          >
            <option value="">Select day</option>

            {renderOptions(options.weekStartsOn)}
          </select>
        </div>
      </div>
    </>
  );

  if (mode === "edit") {
    return (
      <CompanyEditLayout
        eyebrow="Organization"
        title="Business Settings"
        description="Manage the financial year, currency, timezone, date format, and working calendar preferences for your organization."
        onSubmit={handleSubmit}
        submitting={submitting}
      >
        {formContent}
      </CompanyEditLayout>
    );
  }

  return (
    <CompanySetupLayout
      title="Business Settings"
      description="Configure your organization's basic business preferences."
      currentStep={3}
      onBack={() => navigate("/company-setup/address")}
      onNext={handleSubmit}
      nextLabel="Continue"
    >
      {formContent}
    </CompanySetupLayout>
  );
}
