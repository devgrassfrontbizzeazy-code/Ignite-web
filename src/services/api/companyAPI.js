import api from "./axios";

export const getCompany = async () => {
  const response = await api.get("/company/");
  return response.data;
};

export const getCompanyOptions = async () => {
  const response = await api.get("/company/options/");
  return response.data;
};

export const setupCompany = async (companyData) => {
  const response = await api.post("/company/setup/", companyData);
  return response.data;
};

export const updateCompany = async (companyData) => {
  const response = await api.patch("/company/", companyData);
  return response.data;
};