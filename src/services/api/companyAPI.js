import api from "./axios";

const isFormDataRequired = (data) => {
  if (data instanceof FormData) return true;
  if (!data || typeof data !== "object") return false;
  return Object.values(data).some(
    (value) => value instanceof File || value instanceof Blob
  );
};

const buildFormData = (data) => {
  if (data instanceof FormData) return data;
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (value instanceof File || value instanceof Blob) {
        formData.append(key, value);
      } else if (typeof value === "object") {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, value);
      }
    }
  });
  return formData;
};

export const getCompany = async () => {
  const response = await api.get("/company/");
  return response.data;
};

export const getCompanyOptions = async () => {
  const response = await api.get("/company/options/");
  return response.data;
};

export const setupCompany = async (companyData) => {
  const hasFiles = isFormDataRequired(companyData);
  const payload = hasFiles ? buildFormData(companyData) : companyData;
  const headers = hasFiles ? { "Content-Type": "multipart/form-data" } : undefined;
  const response = await api.post("/company/setup/", payload, { headers });
  return response.data;
};

export const updateCompany = async (companyData) => {
  const hasFiles = isFormDataRequired(companyData);
  const payload = hasFiles ? buildFormData(companyData) : companyData;
  const headers = hasFiles ? { "Content-Type": "multipart/form-data" } : undefined;
  const response = await api.patch("/company/", payload, { headers });
  return response.data;
};