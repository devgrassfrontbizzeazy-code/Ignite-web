import api from "./axios";

/**
 * FIELD SALES API SERVICE
 * Connects frontend Field Sales UI with backend DRF endpoints
 */

// -------------------------------------------------------------
// Employees
// -------------------------------------------------------------

export const getFieldSalesEmployees = async (params = {}) => {
  const response = await api.get("/field-sales/employees/", { params });
  return response.data;
};

export const getFieldSalesEmployee = async (id) => {
  const response = await api.get(`/field-sales/employees/${id}/`);
  return response.data;
};

export const createFieldSalesEmployee = async (data) => {
  const response = await api.post("/field-sales/employees/", data);
  return response.data;
};

export const updateFieldSalesEmployee = async (id, data) => {
  const response = await api.put(`/field-sales/employees/${id}/`, data);
  return response.data;
};

export const deleteFieldSalesEmployee = async (id) => {
  const response = await api.delete(`/field-sales/employees/${id}/`);
  return response.data;
};

export const resendFieldSalesInvite = async (id) => {
  const response = await api.post(`/field-sales/employees/${id}/resend-invite/`);
  return response.data;
};

export const getFieldSalesManagers = async () => {
  const response = await api.get("/field-sales/employees/managers/");
  return response.data;
};

// -------------------------------------------------------------
// Customers
// -------------------------------------------------------------

export const getFieldSalesCustomers = async (params = {}) => {
  const response = await api.get("/field-sales/customers/", { params });
  return response.data;
};

export const createFieldSalesCustomer = async (data) => {
  const response = await api.post("/field-sales/customers/", data);
  return response.data;
};

// -------------------------------------------------------------
// Leads
// -------------------------------------------------------------

export const getFieldSalesLeads = async (params = {}) => {
  const response = await api.get("/field-sales/leads/", { params });
  return response.data;
};

export const createFieldSalesLead = async (data) => {
  const response = await api.post("/field-sales/leads/", data);
  return response.data;
};

// -------------------------------------------------------------
// Visits
// -------------------------------------------------------------

export const getFieldSalesVisits = async (params = {}) => {
  const response = await api.get("/field-sales/visits/", { params });
  return response.data;
};

export const getTodayFieldSalesVisits = async () => {
  const response = await api.get("/field-sales/visits/today/");
  return response.data;
};

export const createFieldSalesVisit = async (data) => {
  const response = await api.post("/field-sales/visits/", data);
  return response.data;
};

// -------------------------------------------------------------
// Live GPS Tracking & Daily Timeline Trail
// -------------------------------------------------------------

export const pingFieldSalesLocation = async (data) => {
  const response = await api.post("/field-sales/location/ping/", data);
  return response.data;
};

export const toggleFieldSalesLocation = async (isActive) => {
  const response = await api.post("/field-sales/location/toggle-status/", {
    is_active_tracking: isActive,
  });
  return response.data;
};

export const getTeamLiveLocations = async () => {
  const response = await api.get("/field-sales/location/team-live/");
  return response.data;
};

export const getEmployeeTimelineHistory = async (employeeId, date = "") => {
  const params = date ? { date } : {};
  const response = await api.get(`/field-sales/location/history/${employeeId}/`, { params });
  return response.data;
};

