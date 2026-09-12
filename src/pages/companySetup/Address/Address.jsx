import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import CompanySetupLayout from "../CompanySetupLayout/CompanySetupLayout";
import CompanyEditLayout from "../CompanyEditLayout/CompanyEditLayout";

import { useCompanySetup } from "../CompanySetupContext";
import { getCompany, updateCompany } from "../../../services/api/companyAPI";

import "./Address.css";

const initialForm = {
  fullAddress: "",
  addressCountry: "",
  addressState: "",
  addressCity: "",
  addressPostalCode: "",
  mapLocation: "",
  latitude: "",
  longitude: "",
};

export default function Address({ mode = "setup" }) {
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
          fullAddress:
            data?.full_address || data?.fullAddress || data?.address || "",
          addressCountry: data?.country || data?.addressCountry || "",
          addressState: data?.state || data?.addressState || "",
          addressCity: data?.city || data?.addressCity || "",
          addressPostalCode:
            data?.pincode || data?.postal_code || data?.addressPostalCode || "",
          mapLocation: data?.map_location || data?.mapLocation || "",
          latitude: data?.latitude ?? "",
          longitude: data?.longitude ?? "",
        });
      } catch (err) {
        console.error("Failed to load address:", err);
        setError(
          err?.response?.data?.detail || "Unable to load company address.",
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

    if (!form.fullAddress.trim()) {
      setError("Full address is required.");
      return;
    }

    if (!form.addressCountry.trim()) {
      setError("Country is required.");
      return;
    }

    if (!form.addressState.trim()) {
      setError("State is required.");
      return;
    }

    if (!form.addressCity.trim()) {
      setError("City is required.");
      return;
    }

    if (!form.addressPostalCode.trim()) {
      setError("Postal code is required.");
      return;
    }

    if (mode === "setup") {
      updateCompanySetupData(form);
      navigate("/company-setup/business-settings");
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        full_address: form.fullAddress,
        country: form.addressCountry,
        state: form.addressState,
        city: form.addressCity,
        pincode: form.addressPostalCode,
        map_location: form.mapLocation,
        latitude: form.latitude || null,
        longitude: form.longitude || null,
      };

      const response = await updateCompany(payload);
const updatedCompany = response?.data || {};

      updateCompanySetupData({
        ...form,
        ...(updatedCompany || {}),
      });

      navigate("/organization-overview");
    } catch (err) {
      console.error("Failed to update company address:", err);

      const backendError = err?.response?.data;

      if (typeof backendError === "string") {
        setError(backendError);
      } else if (backendError?.detail) {
        setError(backendError.detail);
      } else {
        setError("Unable to save company address.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="company-edit-loading">Loading company address...</div>
    );
  }

  if (mode === "edit") {
    return (
      <CompanyEditLayout
        eyebrow="Organization"
        title="Company Address"
        description="Update the registered address and location information for your organization."
        onSubmit={handleSubmit}
        submitting={submitting}
      >
        {error && <div className="company-form-error">{error}</div>}

        <div className="company-form-grid">
          <div className="company-form-field company-form-field--full">
            <label htmlFor="fullAddress">Full Address</label>

            <textarea
              id="fullAddress"
              name="fullAddress"
              value={form.fullAddress}
              onChange={handleChange}
              placeholder="Enter complete address"
              rows={4}
            />
          </div>

          <div className="company-form-field">
            <label htmlFor="addressCountry">Country</label>

            <input
              id="addressCountry"
              name="addressCountry"
              value={form.addressCountry}
              onChange={handleChange}
              placeholder="Enter country"
            />
          </div>

          <div className="company-form-field">
            <label htmlFor="addressState">State</label>

            <input
              id="addressState"
              name="addressState"
              value={form.addressState}
              onChange={handleChange}
              placeholder="Enter state"
            />
          </div>

          <div className="company-form-field">
            <label htmlFor="addressCity">City</label>

            <input
              id="addressCity"
              name="addressCity"
              value={form.addressCity}
              onChange={handleChange}
              placeholder="Enter city"
            />
          </div>

          <div className="company-form-field">
            <label htmlFor="addressPostalCode">Postal Code</label>

            <input
              id="addressPostalCode"
              name="addressPostalCode"
              value={form.addressPostalCode}
              onChange={handleChange}
              placeholder="Enter postal code"
            />
          </div>

          <div className="company-form-field company-form-field--full">
            <label htmlFor="mapLocation">Map Location</label>

            <input
              id="mapLocation"
              name="mapLocation"
              value={form.mapLocation}
              onChange={handleChange}
              placeholder="Enter map location"
            />
          </div>

          <div className="company-form-field">
            <label htmlFor="latitude">Latitude</label>

            <input
              id="latitude"
              name="latitude"
              value={form.latitude}
              onChange={handleChange}
              placeholder="Latitude"
            />
          </div>

          <div className="company-form-field">
            <label htmlFor="longitude">Longitude</label>

            <input
              id="longitude"
              name="longitude"
              value={form.longitude}
              onChange={handleChange}
              placeholder="Longitude"
            />
          </div>
        </div>
      </CompanyEditLayout>
    );
  }

  return (
    <CompanySetupLayout
      title="Company Address"
      description="Add your company's registered address."
      currentStep={2}
      onBack={() => navigate("/company-setup/company-details")}
      onNext={handleSubmit}
      nextLabel="Continue"
    >
      {error && <div className="company-form-error">{error}</div>}

      <div className="company-form-grid">
        <div className="company-form-field company-form-field--full">
          <label htmlFor="fullAddress">Full Address</label>

          <textarea
            id="fullAddress"
            name="fullAddress"
            value={form.fullAddress}
            onChange={handleChange}
            placeholder="Enter complete address"
            rows={4}
          />
        </div>

        <div className="company-form-field">
          <label htmlFor="addressCountry">Country</label>

          <input
            id="addressCountry"
            name="addressCountry"
            value={form.addressCountry}
            onChange={handleChange}
            placeholder="Enter country"
          />
        </div>

        <div className="company-form-field">
          <label htmlFor="addressState">State</label>

          <input
            id="addressState"
            name="addressState"
            value={form.addressState}
            onChange={handleChange}
            placeholder="Enter state"
          />
        </div>

        <div className="company-form-field">
          <label htmlFor="addressCity">City</label>

          <input
            id="addressCity"
            name="addressCity"
            value={form.addressCity}
            onChange={handleChange}
            placeholder="Enter city"
          />
        </div>

        <div className="company-form-field">
          <label htmlFor="addressPostalCode">Postal Code</label>

          <input
            id="addressPostalCode"
            name="addressPostalCode"
            value={form.addressPostalCode}
            onChange={handleChange}
            placeholder="Enter postal code"
          />
        </div>

        <div className="company-form-field company-form-field--full">
          <label htmlFor="mapLocation">Map Location</label>

          <input
            id="mapLocation"
            name="mapLocation"
            value={form.mapLocation}
            onChange={handleChange}
            placeholder="Enter map location"
          />
        </div>

        <div className="company-form-field">
          <label htmlFor="latitude">Latitude</label>

          <input
            id="latitude"
            name="latitude"
            value={form.latitude}
            onChange={handleChange}
            placeholder="Latitude"
          />
        </div>

        <div className="company-form-field">
          <label htmlFor="longitude">Longitude</label>

          <input
            id="longitude"
            name="longitude"
            value={form.longitude}
            onChange={handleChange}
            placeholder="Longitude"
          />
        </div>
      </div>
    </CompanySetupLayout>
  );
}
