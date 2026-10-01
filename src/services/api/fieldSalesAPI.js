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

const isFormDataRequired = (data) => {
  if (data instanceof FormData) return true;
  if (!data || typeof data !== "object") return false;
  return Object.values(data).some(
    (value) => value instanceof File || value instanceof Blob
  );
};

const buildFormData = (data) => {
  if (data instanceof FormData) return data;
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (value instanceof File || value instanceof Blob) {
        formData.append(key, value);
      } else if (typeof value === "object") {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, value);
      }
    }
  });
  return formData;
};

export const createFieldSalesEmployee = async (data) => {
  const hasFiles = isFormDataRequired(data);
  const payload = hasFiles ? buildFormData(data) : data;
  const headers = hasFiles ? { "Content-Type": "multipart/form-data" } : undefined;
  const response = await api.post("/field-sales/employees/", payload, { headers });
  return response.data;
};

export const updateFieldSalesEmployee = async (id, data) => {
  const hasFiles = isFormDataRequired(data);
  const payload = hasFiles ? buildFormData(data) : data;
  const headers = hasFiles ? { "Content-Type": "multipart/form-data" } : undefined;
  const response = await api.put(`/field-sales/employees/${id}/`, payload, { headers });
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

export const getFieldSalesLead = async (id) => {
  const response = await api.get(`/field-sales/leads/${id}/`);
  return response.data;
};

export const updateFieldSalesLead = async (id, data) => {
  const response = await api.patch(`/field-sales/leads/${id}/`, data);
  return response.data;
};

export const deleteFieldSalesLead = async (id) => {
  const response = await api.delete(`/field-sales/leads/${id}/`);
  return response.data;
};

export const getLeadTimelineHistory = async (leadId) => {
  const response = await api.get(`/field-sales/leads/${leadId}/timeline/`);
  return response.data;
};

// -------------------------------------------------------------
// Visits & Check-In / Report Submission
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

export const checkInFieldSalesVisit = async (visitId, data) => {
  const response = await api.post(`/field-sales/visits/${visitId}/check-in/`, data);
  return response.data;
};

export const submitFieldSalesVisitReport = async (visitId, data) => {
  const response = await api.post(`/field-sales/visits/${visitId}/submit-report/`, data);
  return response.data;
};

export const completeFieldSalesVisit = async (visitId, data) => {
  const response = await api.post(`/field-sales/visits/${visitId}/complete/`, data);
  return response.data;
};

// -------------------------------------------------------------
// Follow-ups Lifecycle Pipeline
// -------------------------------------------------------------

export const getFieldSalesFollowUps = async (params = {}) => {
  const response = await api.get("/field-sales/follow-ups/", { params });
  return response.data;
};

export const createFieldSalesFollowUp = async (data) => {
  const response = await api.post("/field-sales/follow-ups/", data);
  return response.data;
};

export const logFollowUpOutcome = async (followUpId, data) => {
  const response = await api.post(`/field-sales/follow-ups/${followUpId}/log-outcome/`, data);
  return response.data;
};

// -------------------------------------------------------------
// Sales Person & Manager Dashboard Summary
// -------------------------------------------------------------

export const getSalesDashboardSummary = async () => {
  const response = await api.get("/field-sales/dashboard/sales-summary/");
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


