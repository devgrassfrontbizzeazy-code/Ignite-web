
import api from "./axios";

const leaveApplicationAPI = {
  // Leave policies available to the current employee
  getApplyOptions: async () => {
    const response = await api.get("/leaves/apply/options/");
    return response.data;
  },

  // Apply for leave
  applyLeave: async (data) => {
    const response = await api.post("/leaves/apply/", data);
    return response.data;
  },

  // Current employee's leave applications
  getMyLeaves: async (params = {}) => {
    const response = await api.get("/leaves/my/", {
      params,
    });

    return response.data;
  },

  // Pending leaves for approval
  getPendingApprovals: async () => {
    const response = await api.get("/leaves/pending-approvals/");
    return response.data;
  },

  // Approve leave
  approveLeave: async (id) => {
    const response = await api.post(`/leaves/${id}/approve/`);
    return response.data;
  },

  // Reject leave
  rejectLeave: async (id, data = {}) => {
    const response = await api.post(
      `/leaves/${id}/reject/`,
      data
    );

    return response.data;
  },

  // Cancel leave
  cancelLeave: async (id) => {
    const response = await api.post(`/leaves/${id}/cancel/`);
    return response.data;
  },
};

export default leaveApplicationAPI;

