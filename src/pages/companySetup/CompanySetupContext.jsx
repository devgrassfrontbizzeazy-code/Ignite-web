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
    "image/jpg",
    "image/svg+xml",
    "image/webp",
  ];

  const ext = file.name ? file.name.substring(file.name.lastIndexOf(".")).toLowerCase() : "";
  const allowedExtensions = [".png", ".jpg", ".jpeg", ".svg", ".webp"];

  if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(ext)) {
    return {
      valid: false,
      message: "Logo must be a PNG, JPG, WebP, or SVG file.",
    };
  }

  if (file.size > maxSizeMB * 1024 * 1024) {
    return {
      valid: false,
      message: `Logo file size must be ${maxSizeMB}MB or smaller.`,
    };
  }

  return { valid: true };
};

export const validateLogoFileAsync = (file, maxSizeMB = 2) => {
  return new Promise((resolve) => {
    const basic = isValidLogoFile(file, maxSizeMB);
    if (!basic.valid) {
      resolve(basic);
      return;
    }

    if (!file) {
      resolve({ valid: true });
      return;
    }

    const isSvg = file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg");
    if (isSvg) {
      resolve({
        valid: true,
        width: null,
        height: null,
        aspectRatio: null,
        isSvg: true,
        sizeFormatted: (file.size / 1024).toFixed(1) + " KB",
      });
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      const width = img.naturalWidth || img.width;
      const height = img.naturalHeight || img.height;
      URL.revokeObjectURL(objectUrl);

      if (width < 60 || height < 30) {
        resolve({
          valid: false,
          message: `Logo resolution is too low (${width}×${height}px). Minimum dimensions are 60×30 pixels.`,
        });
        return;
      }

      if (width > 2500 || height > 2500) {
        resolve({
          valid: false,
          message: `Logo resolution is too large (${width}×${height}px). Maximum dimensions are 2500×2500 pixels.`,
        });
        return;
      }

      const ratio = width / Math.max(1, height);
      if (ratio < 0.5 || ratio > 5.0) {
        resolve({
          valid: false,
          message: `Logo aspect ratio (${ratio.toFixed(1)}:1) is unsuitable for payslip headers. Aspect ratio must be between 1:2 and 5:1.`,
        });
        return;
      }

      resolve({
        valid: true,
        width,
        height,
        aspectRatio: ratio.toFixed(2),
        sizeFormatted: file.size > 1024 * 1024
          ? (file.size / (1024 * 1024)).toFixed(2) + " MB"
          : (file.size / 1024).toFixed(1) + " KB",
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({
        valid: false,
        message: "Unable to read the image file. It may be corrupted or unsupported.",
      });
    };

    img.src = objectUrl;
  });
};