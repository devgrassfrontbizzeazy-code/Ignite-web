import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  GoogleMap,
  Marker,
  useJsApiLoader,
} from "@react-google-maps/api";

import CompanySetupLayout from "../CompanySetupLayout/CompanySetupLayout";
import {
  useCompanySetup,
  isEmpty,
  isValidPostalCode,
} from "../CompanySetupContext";

import "./Address.css";

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

const DEFAULT_MAP_CENTER = {
  lat: 20.5937,
  lng: 78.9629,
};

const MAP_CONTAINER_STYLE = {
  width: "100%",
  height: "320px",
};

function Address() {
  const navigate = useNavigate();
  const { companySetupData, updateCompanySetupData } = useCompanySetup();

  const [form, setForm] = useState({
    fullAddress: companySetupData.fullAddress,
    addressCountry: companySetupData.addressCountry,
    addressState: companySetupData.addressState,
    addressCity: companySetupData.addressCity,
    addressPostalCode: companySetupData.addressPostalCode,
    mapLocation: companySetupData.mapLocation,
    latitude: companySetupData.latitude,
    longitude: companySetupData.longitude,
  });

  const [errors, setErrors] = useState({});
  const [showMap, setShowMap] = useState(false);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  });

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

  const handleMapClick = (event) => {
    if (!event.latLng) return;

    const latitude = event.latLng.lat();
    const longitude = event.latLng.lng();

    setForm((prev) => ({
      ...prev,
      latitude: latitude.toFixed(6),
      longitude: longitude.toFixed(6),
      mapLocation: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
    }));
  };

  const getMapCenter = () => {
    if (form.latitude && form.longitude) {
      const lat = Number(form.latitude);
      const lng = Number(form.longitude);

      if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
        return {
          lat,
          lng,
        };
      }
    }

    return DEFAULT_MAP_CENTER;
  };

  const validate = () => {
    const nextErrors = {};

    if (isEmpty(form.fullAddress)) {
      nextErrors.fullAddress = "Full address is required.";
    }

    if (isEmpty(form.addressCountry)) {
      nextErrors.addressCountry = "Please select a country.";
    }

    if (isEmpty(form.addressState)) {
      nextErrors.addressState = "Please select a state / province.";
    }

    if (isEmpty(form.addressCity)) {
      nextErrors.addressCity = "City is required.";
    }

    if (isEmpty(form.addressPostalCode)) {
      nextErrors.addressPostalCode = "Pincode is required.";
    } else if (!isValidPostalCode(form.addressPostalCode)) {
      nextErrors.addressPostalCode = "Enter a valid pincode.";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const handleBack = () => {
    updateCompanySetupData(form);
    navigate("/company-setup/company-details");
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!validate()) return;

    updateCompanySetupData(form);
    navigate("/company-setup/business-settings");
  };

  const mapCenter = getMapCenter();

  return (
    <CompanySetupLayout
      currentStep="address"
      title="Business Address"
      subtitle="Tell us where your company is located."
    >
      <form className="setup-form-grid" onSubmit={handleSubmit} noValidate>

        {/* Full Address */}
        <div className="setup-field setup-field--full">
          <label className="setup-label" htmlFor="fullAddress">
            Full Address
            <span className="setup-required" aria-hidden="true">
              *
            </span>
          </label>

          <textarea
            id="fullAddress"
            className={`setup-input setup-textarea ${
              errors.fullAddress ? "setup-input--error" : ""
            }`}
            placeholder="Enter complete company address"
            value={form.fullAddress}
            onChange={handleChange("fullAddress")}
            aria-required="true"
            aria-invalid={Boolean(errors.fullAddress)}
            aria-describedby={
              errors.fullAddress ? "fullAddress-error" : undefined
            }
            rows={3}
          />

          {errors.fullAddress && (
            <p id="fullAddress-error" className="setup-error-text">
              {errors.fullAddress}
            </p>
          )}
        </div>

        {/* Country */}
        <SelectField
          id="addressCountry"
          label="Country"
          required
          placeholder="Select country"
          value={form.addressCountry}
          onChange={handleChange("addressCountry")}
          options={COUNTRY_OPTIONS}
          error={errors.addressCountry}
        />

        {/* State */}
        <SelectField
          id="addressState"
          label="State / Province"
          required
          placeholder="Select state"
          value={form.addressState}
          onChange={handleChange("addressState")}
          options={STATE_OPTIONS}
          error={errors.addressState}
        />

        {/* City */}
        <Field
          id="addressCity"
          label="City"
          required
          placeholder="Enter city"
          value={form.addressCity}
          onChange={handleChange("addressCity")}
          error={errors.addressCity}
        />

        {/* Pincode */}
        <Field
          id="addressPostalCode"
          label="Pincode"
          required
          type="text"
          inputMode="numeric"
          maxLength={10}
          placeholder="Enter pincode"
          value={form.addressPostalCode}
          onChange={handleChange("addressPostalCode")}
          error={errors.addressPostalCode}
        />

        {/* Map Location */}
        <div className="setup-field setup-field--full">
          <label className="setup-label">
            Map Location
          </label>

          <div className="map-location-row">
            <div className="map-location-display">
              {form.mapLocation ? (
                <span>
                  {form.mapLocation}
                </span>
              ) : (
                <span className="map-location-placeholder">
                  No location selected
                </span>
              )}
            </div>

            <button
              type="button"
              className="map-select-button"
              onClick={() => setShowMap((prev) => !prev)}
            >
              <MapPinIcon />
              {showMap ? "Hide Map" : "Select on Map"}
            </button>
          </div>

          {/* Map */}
          {showMap && (
            <div className="map-picker-wrapper">

              {!import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? (
                <div className="map-error">
                  Google Maps API key is not configured.
                </div>
              ) : loadError ? (
                <div className="map-error">
                  Unable to load Google Maps.
                </div>
              ) : !isLoaded ? (
                <div className="map-loading">
                  Loading map...
                </div>
              ) : (
                <GoogleMap
                  mapContainerStyle={MAP_CONTAINER_STYLE}
                  center={mapCenter}
                  zoom={form.latitude ? 16 : 5}
                  onClick={handleMapClick}
                  options={{
                    streetViewControl: false,
                    mapTypeControl: false,
                    fullscreenControl: true,
                    zoomControl: true,
                    styles: [
                      {
                        elementType: "geometry",
                        stylers: [{ color: "#f4fbf9" }],
                      },
                      {
                        elementType: "labels.text.fill",
                        stylers: [{ color: "#0f3d3e" }],
                      },
                      {
                        elementType: "labels.text.stroke",
                        stylers: [{ color: "#ffffff" }],
                      },
                      {
                        featureType: "administrative",
                        elementType: "geometry.stroke",
                        stylers: [{ color: "#b8ddd4" }],
                      },
                      {
                        featureType: "landscape",
                        elementType: "geometry",
                        stylers: [{ color: "#eef9f6" }],
                      },
                      {
                        featureType: "poi",
                        elementType: "geometry",
                        stylers: [{ color: "#e3f4ef" }],
                      },
                      {
                        featureType: "poi",
                        elementType: "labels.text.fill",
                        stylers: [{ color: "#0f3d3e" }],
                      },
                      {
                        featureType: "road",
                        elementType: "geometry",
                        stylers: [{ color: "#ffffff" }],
                      },
                      {
                        featureType: "road",
                        elementType: "geometry.stroke",
                        stylers: [{ color: "#d5ebe6" }],
                      },
                      {
                        featureType: "road",
                        elementType: "labels.text.fill",
                        stylers: [{ color: "#39716c" }],
                      },
                      {
                        featureType: "transit",
                        elementType: "geometry",
                        stylers: [{ color: "#d8eee9" }],
                      },
                      {
                        featureType: "water",
                        elementType: "geometry",
                        stylers: [{ color: "#cceee7" }],
                      },
                      {
                        featureType: "water",
                        elementType: "labels.text.fill",
                        stylers: [{ color: "#39716c" }],
                      },
                    ],
                  }}
                >
                  {form.latitude && form.longitude && (
                    <Marker
                      position={{
                        lat: Number(form.latitude),
                        lng: Number(form.longitude),
                      }}
                    />
                  )}
                </GoogleMap>
              )}

              {isLoaded && (
                <p className="map-helper-text">
                  Click anywhere on the map to select your company location.
                </p>
              )}
            </div>
          )}

          {/* Coordinates */}
          {(form.latitude || form.longitude) && (
            <div className="coordinates-display">
              <span>
                <strong>Latitude:</strong> {form.latitude || "—"}
              </span>

              <span>
                <strong>Longitude:</strong> {form.longitude || "—"}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="setup-field setup-field--full setup-actions">
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
          >
            Continue
            <ArrowIcon />
          </button>
        </div>

      </form>
    </CompanySetupLayout>
  );
}

function Field({
  id,
  label,
  required,
  error,
  ...inputProps
}) {
  return (
    <div
      className={`setup-field ${
        error ? "setup-field--error" : ""
      }`.trim()}
    >
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
        aria-describedby={
          error ? `${id}-error` : undefined
        }
        {...inputProps}
      />

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
    <div
      className={`setup-field ${
        error ? "setup-field--error" : ""
      }`.trim()}
    >
      <label className="setup-label" htmlFor={id}>
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
        data-placeholder={
          value === "" ? "true" : "false"
        }
        aria-required={required || undefined}
        aria-invalid={Boolean(error)}
        aria-describedby={
          error ? `${id}-error` : undefined
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

function MapPinIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M20 10C20 15 12 22 12 22C12 22 4 15 4 10C4 5.58 7.58 2 12 2C16.42 2 20 5.58 20 10Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle
        cx="12"
        cy="10"
        r="3"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
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

export default Address;

