
import api from "./axios";

export const getDepartments = async (params = {}) => {
  const response = await api.get("/department/", {
    params,
  });

  return response.data;
};

export const getDepartment = async (id) => {
  const response = await api.get(`/department/${id}/`);

  return response.data;
};

export const createDepartment = async (departmentData) => {
  const response = await api.post(
    "/department/",
    departmentData
  );

  return response.data;
};

export const updateDepartment = async (
  id,
  departmentData
) => {
  const response = await api.put(
    `/department/${id}/`,
    departmentData
  );

  return response.data;
};

export const patchDepartment = async (
  id,
  departmentData
) => {
  const response = await api.patch(
    `/department/${id}/`,
    departmentData
  );

  return response.data;
};

export const deleteDepartment = async (id) => {
  const response = await api.delete(
    `/department/${id}/`
  );

  return response.data;
};
