import {
  getEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  patchEmployee,
  deleteEmployee,
  resendEmployeeInvite,
  getEmployeeOptions,
  getEmployeeManagers,
  getInvitationDetails,
  sendInvitationOTP,
  verifyInvitationOTP,
  acceptInvitation,
} from "./api/employeeAPI";

const extractData = (response) => {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if (Array.isArray(response.data)) return response.data;
  if (Array.isArray(response.results)) return response.results;
  if (response.data && typeof response.data === "object") return response.data;
  return response;
};

const normalizeEmployee = (emp) => {
  if (!emp) return null;
  return {
    ...emp,
    id: emp.id,
    first_name: emp.first_name || emp.firstName || "",
    middle_name: emp.middle_name || emp.middleName || "",
    last_name: emp.last_name || emp.lastName || "",
    employee_code: emp.employee_code || emp.employeeCode || "",
    email: emp.email || "",
    phone: emp.phone || "",
    date_of_birth: emp.date_of_birth || emp.dateOfBirth || "",
    date_of_joining: emp.date_of_joining || emp.dateOfJoining || "",
    gender: emp.gender || "",
    address: emp.address || "",
    work_location: emp.work_location || emp.workLocation || "",
    employment_type: emp.employment_type || emp.employmentType || "Full Time",
    employment_status: emp.employment_status || emp.employmentStatus || "Active",
    department_id:
      emp.department_id ||
      (typeof emp.department === "object" ? emp.department?.id : emp.department) ||
      "",
    department_name:
      emp.department_name ||
      (typeof emp.department === "object" ? emp.department?.name : "") ||
      "",
    designation_id:
      emp.designation_id ||
      (typeof emp.designation === "object" ? emp.designation?.id : emp.designation) ||
      "",
    designation_name:
      emp.designation_name ||
      (typeof emp.designation === "object" ? emp.designation?.name : "") ||
      "",
    reporting_manager_id:
      emp.reporting_manager_id ||
      (typeof emp.reporting_manager === "object"
        ? emp.reporting_manager?.id
        : typeof emp.reportingManager === "object"
        ? emp.reportingManager?.id
        : emp.reporting_manager) ||
      "",
    reporting_manager_name:
      emp.reporting_manager_name ||
      (typeof emp.reporting_manager === "object"
        ? emp.reporting_manager?.full_name || emp.reporting_manager?.name
        : typeof emp.reportingManager === "object"
        ? emp.reportingManager?.full_name || emp.reportingManager?.name
        : "") ||
      "",
    emergency_contact_name:
      emp.emergency_contact_name ||
      emp.emergencyContactName ||
      emp.emergencyContact?.name ||
      emp.emergency_contact?.name ||
      "",
    emergency_contact_phone:
      emp.emergency_contact_phone ||
      emp.emergencyContactPhone ||
      emp.emergencyContact?.phone ||
      emp.emergency_contact?.phone ||
      "",
    profile_photo_url:
      emp.profile_photo_url ||
      emp.photoUrl ||
      (typeof emp.profilePhoto === "object" ? emp.profilePhoto?.url : null) ||
      "",
    invitation_status: emp.invitation_status || emp.invitationStatus || "PENDING",
    is_active: emp.is_active !== undefined ? emp.is_active : true,
  };
};

const employeeService = {
  /*
   * GET ALL EMPLOYEES
   */
  async getAll(params = {}) {
    const res = await getEmployees(params);
    const list = extractData(res);
    return Array.isArray(list) ? list.map(normalizeEmployee) : [];
  },

  /*
   * GET EMPLOYEE BY ID
   */
  async getById(id) {
    const res = await getEmployee(id);
    const data = res?.data || res;
    return normalizeEmployee(data);
  },

  /*
   * CREATE EMPLOYEE
   */
  async create(data) {
    const res = await createEmployee(data);
    const newEmp = res?.data || res;
    return normalizeEmployee(newEmp);
  },

  /*
   * UPDATE EMPLOYEE
   */
  async update(id, data) {
    const res = await updateEmployee(id, data);
    const updated = res?.data || res;
    return normalizeEmployee(updated);
  },

  /*
   * PARTIAL UPDATE EMPLOYEE
   */
  async patch(id, data) {
    const res = await patchEmployee(id, data);
    const updated = res?.data || res;
    return normalizeEmployee(updated);
  },

  /*
   * DELETE EMPLOYEE (Soft delete)
   */
  async delete(id) {
    const res = await deleteEmployee(id);
    return res;
  },

  /*
   * RESEND INVITATION EMAIL
   */
  async resendInvite(id) {
    const res = await resendEmployeeInvite(id);
    return res;
  },

  /*
   * CHANGE STATUS (Active / Inactive)
   */
  async changeStatus(id, status) {
    const isAct = String(status).toUpperCase() === "ACTIVE";
    return this.patch(id, {
      employment_status: isAct ? "Active" : "Inactive",
      is_active: isAct,
    });
  },

  /*
   * TERMINATE EMPLOYEE
   */
  async terminate(id, dateOfExit = null) {
    return this.patch(id, {
      employment_status: "Terminated",
      is_active: false,
      date_of_exit: dateOfExit || new Date().toISOString().split("T")[0],
    });
  },

  /*
   * RESIGN EMPLOYEE
   */
  async resign(id, dateOfExit = null) {
    return this.patch(id, {
      employment_status: "Inactive",
      is_active: false,
      date_of_exit: dateOfExit || new Date().toISOString().split("T")[0],
    });
  },

  /*
   * FORM OPTIONS (Departments, Designations, Managers, Genders, etc.)
   */
  async getOptions() {
    const res = await getEmployeeOptions();
    return res?.data || res;
  },

  /*
   * MANAGERS LIST
   */
  async getManagers() {
    const res = await getEmployeeManagers();
    const list = extractData(res);
    return Array.isArray(list) ? list : [];
  },

  /*
   * INVITATION WORKFLOW
   */
  async getInviteDetails(token) {
    return getInvitationDetails(token);
  },

  async sendOTP(token, email) {
    return sendInvitationOTP(token, email);
  },

  async verifyOTP(token, email, otp) {
    return verifyInvitationOTP(token, email, otp);
  },

  async acceptInvite(payload) {
    return acceptInvitation(payload);
  },
};

export default employeeService;