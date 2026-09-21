import api from "./axios";

const leavePolicyApi = {
  getPolicies: async (params = {}) => {
    const response = await api.get("/leaves/policies/", {
      params,
    });

    return response.data;
  },

  getPolicy: async (id) => {
    const response = await api.get(`/leaves/policies/${id}/`);

    return response.data;
  },

  createPolicy: async (data) => {
    const response = await api.post("/leaves/policies/", data);

    return response.data;
  },

  updatePolicy: async (id, data) => {
    const response = await api.put(`/leaves/policies/${id}/`, data);

    return response.data;
  },

  partialUpdatePolicy: async (id, data) => {
    const response = await api.patch(
      `/leaves/policies/${id}/`,
      data
    );

    return response.data;
  },

  deletePolicy: async (id) => {
    const response = await api.delete(
      `/leaves/policies/${id}/`
    );

    return response.data;
  },

  togglePolicyStatus: async (id) => {
    const response = await api.patch(
      `/leaves/policies/${id}/toggle-status/`
    );

    return response.data;
  },
};

export default leavePolicyApi;

