
import api from "./axios";

const mapPolicyPayload = (data) => ({
  name: data.name,
  description: data.description || "",

  allocation_type:
    data.allocationType ??
    data.allocation_type ??
    "YEARLY",

  allocation_days:
    data.days !== undefined && data.days !== null && data.days !== ""
      ? Number(data.days)
      : null,

  is_carry_forward:
    data.carryForward ??
    data.is_carry_forward ??
    false,

  carry_forward_type:
    data.carryForwardType ??
    data.carry_forward_type ??
    "NONE",

  max_carry_forward_days:
    data.carryForwardLimit !== undefined &&
    data.carryForwardLimit !== null &&
    data.carryForwardLimit !== ""
      ? Number(data.carryForwardLimit)
      : null,

  allow_half_day:
    data.halfDayAllowed ??
    data.allow_half_day ??
    false,

  requires_approval:
    data.requiresApproval ??
    data.requires_approval ??
    false,

  is_paid:
    data.isPaid ??
    data.is_paid ??
    false,
});

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
    const response = await api.post(
      "/leaves/policies/",
      mapPolicyPayload(data)
    );

    return response.data;
  },

  updatePolicy: async (id, data) => {
    const response = await api.put(
      `/leaves/policies/${id}/`,
      mapPolicyPayload(data)
    );

    return response.data;
  },

  partialUpdatePolicy: async (id, data) => {
    const response = await api.patch(
      `/leaves/policies/${id}/`,
      mapPolicyPayload(data)
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

