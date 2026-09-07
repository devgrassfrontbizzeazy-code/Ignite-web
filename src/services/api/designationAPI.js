import api from "./axios";

export const getDesignations = async (params = {}) => {
  const response = await api.get("/designation/", {
    params,
  });

  return response.data;
};

export const getDesignation = async (id) => {
  const response = await api.get(
    `/designation/${id}/`
  );

  return response.data;
};

export const createDesignation = async (
  designationData
) => {
  const response = await api.post(
    "/designation/",
    designationData
  );

  return response.data;
};

export const updateDesignation = async (
  id,
  designationData
) => {
  const response = await api.put(
    `/designation/${id}/`,
    designationData
  );

  return response.data;
};

export const patchDesignation = async (
  id,
  designationData
) => {
  const response = await api.patch(
    `/designation/${id}/`,
    designationData
  );

  return response.data;
};

export const deleteDesignation = async (id) => {
  const response = await api.delete(
    `/designation/${id}/`
  );

  return response.data;
};