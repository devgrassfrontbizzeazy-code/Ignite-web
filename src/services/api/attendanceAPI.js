import api from "./axios";

export const attendanceAPI = {
  /**
   * Fetch current day's attendance status, timers, and timeline
   */
  getTodayAttendance: async () => {
    const response = await api.get("/attendance/today/");
    return response.data;
  },

  /**
   * Punch In for the current 4:00 AM business day
   */
  punchIn: async () => {
    const response = await api.post("/attendance/punch-in/");
    return response.data;
  },

  /**
   * Start Break session
   */
  startBreak: async () => {
    const response = await api.post("/attendance/break/start/");
    return response.data;
  },

  /**
   * End Break session and resume work
   */
  endBreak: async () => {
    const response = await api.post("/attendance/break/end/");
    return response.data;
  },

  /**
   * Punch Out for today and lock session for approval
   */
  punchOut: async () => {
    const response = await api.post("/attendance/punch-out/");
    return response.data;
  },

  /**
   * Fetch attendance history logs and statistics
   * @param {string} range - '15d' | '1m' | '3m' | '6m' | '1y'
   */
  getAttendanceHistory: async (range = "15d") => {
    const response = await api.get("/attendance/history/", {
      params: { range },
    });
    return response.data;
  },

  /**
   * Fetch specific attendance details with full break breakdown
   * @param {number|string} attendanceId
   */
  getAttendanceDetails: async (attendanceId) => {
    const response = await api.get(`/attendance/${attendanceId}/`);
    return response.data;
  },

  /**
   * Fetch company-wide employee attendance records with summary stats and filters
   * @param {Object} params - { date, department, status, search }
   */
  getCompanyAttendance: async (params = {}) => {
    const response = await api.get("/attendance/company/", { params });
    return response.data;
  },

  /**
   * Approve an attendance session
   */
  approveAttendance: async (attendanceId) => {
    const response = await api.post(`/attendance/${attendanceId}/approve/`, {
      action: "APPROVE",
    });
    return response.data;
  },

  /**
   * Reject an attendance session
   */
  rejectAttendance: async (attendanceId, reason = "") => {
    const response = await api.post(`/attendance/${attendanceId}/reject/`, {
      action: "REJECT",
      rejection_reason: reason,
    });
    return response.data;
  },
};

export default attendanceAPI;
