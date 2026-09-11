import api from "./axios";

// Helper to determine if data has File object
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

// ==========================================
// CORE EMPLOYEE CRUD & OPTIONS
// ==========================================

export const getEmployees = async (params = {}) => {
  const response = await api.get("/employees/", { params });
  return response.data;
};

export const getEmployee = async (id) => {
  const response = await api.get(`/employees/${id}/`);
  return response.data;
};

export const createEmployee = async (employeeData) => {
  const hasFiles = isFormDataRequired(employeeData);
  const payload = hasFiles ? buildFormData(employeeData) : employeeData;
  const headers = hasFiles
    ? { "Content-Type": "multipart/form-data" }
    : undefined;

  const response = await api.post("/employees/", payload, { headers });
  return response.data;
};

export const updateEmployee = async (id, employeeData) => {
  const hasFiles = isFormDataRequired(employeeData);
  const payload = hasFiles ? buildFormData(employeeData) : employeeData;
  const headers = hasFiles
    ? { "Content-Type": "multipart/form-data" }
    : undefined;

  const response = await api.put(`/employees/${id}/`, payload, { headers });
  return response.data;
};

export const patchEmployee = async (id, employeeData) => {
  const hasFiles = isFormDataRequired(employeeData);
  const payload = hasFiles ? buildFormData(employeeData) : employeeData;
  const headers = hasFiles
    ? { "Content-Type": "multipart/form-data" }
    : undefined;

  const response = await api.patch(`/employees/${id}/`, payload, { headers });
  return response.data;
};

export const deleteEmployee = async (id) => {
  const response = await api.delete(`/employees/${id}/`);
  return response.data;
};

export const resendEmployeeInvite = async (id) => {
  const response = await api.post(`/employees/${id}/resend-invite/`);
  return response.data;
};

export const getEmployeeOptions = async () => {
  const response = await api.get("/employees/options/");
  return response.data;
};

export const getEmployeeManagers = async () => {
  const response = await api.get("/employees/managers/");
  return response.data;
};

// ==========================================
// INVITATION & ONBOARDING WORKFLOW (PUBLIC)
// ==========================================

export const getInvitationDetails = async (token) => {
  const response = await api.get("/employees/invitation-details/", {
    params: { token },
  });
  return response.data;
};

export const sendInvitationOTP = async (token, email) => {
  const response = await api.post("/employees/invitation/send-otp/", {
    token,
    email,
  });
  return response.data;
};

export const verifyInvitationOTP = async (token, email, otp) => {
  const response = await api.post("/employees/invitation/verify-otp/", {
    token,
    email,
    otp,
  });
  return response.data;
};

export const acceptInvitation = async ({
  token,
  email,
  password,
  confirm_password,
}) => {
  const response = await api.post("/employees/invitation/accept/", {
    token,
    email,
    password,
    confirm_password,
  });
  return response.data;
};
