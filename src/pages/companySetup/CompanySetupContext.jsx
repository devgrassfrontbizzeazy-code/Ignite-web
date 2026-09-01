import React, { createContext, useContext, useState } from 'react';

/**
 * CompanySetupContext
 * ---------------------------------------------------------------------------
 * Holds the in-progress "company setup" form data so it survives navigation
 * between the onboarding steps (Company Details -> Address -> Business
 * Settings -> Review -> Account Created).
 *
 * This is temporary frontend-only state. When the backend is ready, replace
 * `submitCompanySetup` with a real API call and keep the rest of the shape.
 */

const CompanySetupContext = createContext(null);

export const initialCompanySetupData = {
  // Company Details
  companyName: '',
  companyCode: '',
  companyLogoName: '',
  companyLogoDataUrl: '',
  industry: '',
  companyEmail: '',
  phone: '',
  website: '',
  companyType: '',
  registrationNumber: '',

  // Address
  fullAddress: '',
  addressCountry: '',
  addressState: '',
  addressCity: '',
  addressPostalCode: '',
  mapLocation: '',
  latitude: '',
  longitude: '',

  // Business Settings
  financialYear: '',
  currency: '',
  timezone: '',
  dateFormat: '',
  weekStartsOn: '',
};

export function CompanySetupProvider({ children }) {
  const [companySetupData, setCompanySetupData] = useState(initialCompanySetupData);

  const updateCompanySetupData = (updates) => {
    setCompanySetupData((prev) => ({ ...prev, ...updates }));
  };

  const resetCompanySetupData = () => setCompanySetupData(initialCompanySetupData);

  const value = {
    companySetupData,
    updateCompanySetupData,
    resetCompanySetupData,
  };

  return (
    <CompanySetupContext.Provider value={value}>
      {children}
    </CompanySetupContext.Provider>
  );
}

export function useCompanySetup() {
  const context = useContext(CompanySetupContext);
  if (!context) {
    throw new Error('useCompanySetup must be used within a CompanySetupProvider');
  }
  return context;
}

/* ---------------------------------------------------------------------- */
/* Lightweight, shared validation helpers                                  */
/* ---------------------------------------------------------------------- */

export const isEmpty = (value) => !value || !String(value).trim();

export const isValidEmail = (value) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());

export const isValidPhone = (value) =>
  /^\d{10}$/.test(String(value).trim());

export const isValidPostalCode = (value) =>
  /^[A-Za-z0-9][A-Za-z0-9\s-]{2,9}$/.test(String(value).trim());

export const isValidLogoFile = (file, maxSizeMB = 2) => {
  if (!file) return { valid: true };

  const allowedTypes = ['image/png', 'image/jpeg', 'image/svg+xml'];
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, message: 'Logo must be a PNG, JPG or SVG file.' };
  }

  if (file.size > maxSizeMB * 1024 * 1024) {
    return { valid: false, message: `Logo must be ${maxSizeMB}MB or smaller.` };
  }

  return { valid: true };
};
