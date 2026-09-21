import api from "./axios";

export const holidayAPI = {
  /**
   * Fetch list of holidays for the company, optionally filtered by year
   * @param {number|string} year
   */
  getHolidays: async (year) => {
    const params = year ? { year } : {};
    const response = await api.get("/holidays/", { params });
    return response.data;
  },

  /**
   * Add a new holiday
   * @param {Object} data - { name, date, description, is_optional }
   */
  createHoliday: async (data) => {
    const response = await api.post("/holidays/", data);
    return response.data;
  },

  /**
   * Update an existing holiday
   * @param {number|string} id
   * @param {Object} data
   */
  updateHoliday: async (id, data) => {
    const response = await api.put(`/holidays/${id}/`, data);
    return response.data;
  },

  /**
   * Delete a holiday
   * @param {number|string} id
   */
  deleteHoliday: async (id) => {
    const response = await api.delete(`/holidays/${id}/`);
    return response.data;
  },
};

export default holidayAPI;
