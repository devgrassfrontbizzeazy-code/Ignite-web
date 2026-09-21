import api from "./axios";

const holidayAPI = {
  // Get company holidays with optional filters
  getHolidays: async (params = {}) => {
    const response = await api.get("/holidays/", {
      params,
    });

    return response.data;
  },

  // Get a single holiday
  getHoliday: async (id) => {
    const response = await api.get(`/holidays/${id}/`);

    return response.data;
  },

  // Create a holiday
  createHoliday: async (holidayData) => {
    const response = await api.post("/holidays/", holidayData);

    return response.data;
  },

  // Update a holiday
  updateHoliday: async (id, holidayData) => {
    const response = await api.patch(`/holidays/${id}/`, holidayData);

    return response.data;
  },

  // Delete a holiday
  deleteHoliday: async (id) => {
    const response = await api.delete(`/holidays/${id}/`);

    return response.data;
  },

  // Get upcoming holidays
  getUpcomingHolidays: async (params = {}) => {
    const response = await api.get("/holidays/upcoming/", {
      params,
    });

    return response.data;
  },
};

export default holidayAPI;