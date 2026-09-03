import React, { createContext, useContext, useState } from "react";

const CompanySetupContext = createContext(null);

export const initialCompanySetupData = {
  // Company Details
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

  // Address
  fullAddress: "",
  addressCountry: "",
  addressState: "",
  addressCity: "",
  addressPostalCode: "",
  mapLocation: "",
  latitude: "",
  longitude: "",

  // Business Settings
  financialYear: "",
  currency: "",
  timezone: "",
  dateFormat: "",
  weekStartsOn: "",
};

export function CompanySetupProvider({ children }) {
  const [companySetupData, setCompanySetupData] = useState(
    initialCompanySetupData
  );

  const updateCompanySetupData = (updates) => {
    setCompanySetupData((prev) => ({
      ...prev,
      ...updates,
    }));
  };

  const resetCompanySetupData = () => {
    setCompanySetupData(initialCompanySetupData);
  };

  return (
    <CompanySetupContext.Provider
      value={{
        companySetupData,
        updateCompanySetupData,
        resetCompanySetupData,
      }}
    >
      {children}
    </CompanySetupContext.Provider>
  );
}

export function useCompanySetup() {
  const context = useContext(CompanySetupContext);

  if (!context) {
    throw new Error(
      "useCompanySetup must be used within a CompanySetupProvider"
    );
  }

  return context;
}

/* ---------------------------------------------------------------------- */
/* Validation helpers                                                     */
/* ---------------------------------------------------------------------- */

export const isEmpty = (value) => {
  return !value || !String(value).trim();
};

export const isValidEmail = (value) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());
};

export const isValidPhone = (value) => {
  return /^\d{10}$/.test(String(value).trim());
};

export const isValidPostalCode = (value) => {
  return /^[A-Za-z0-9][A-Za-z0-9\s-]{2,9}$/.test(
    String(value).trim()
  );
};

export const isValidLogoFile = (file, maxSizeMB = 2) => {
  if (!file) {
    return { valid: true };
  }

  const allowedTypes = [
    "image/png",
    "image/jpeg",
    "image/svg+xml",
  ];

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      message: "Logo must be a PNG, JPG or SVG file.",
    };
  }

  if (file.size > maxSizeMB * 1024 * 1024) {
    return {
      valid: false,
      message: `Logo must be ${maxSizeMB}MB or smaller.`,
    };
  }

  return { valid: true };
};