import api, { clearSuperAdminAuthSession } from "../../../services/api/axios";

/**
 * Platform Super Admin API Service
 * Handles platform-wide queries across multi-tenant organizations.
 * Requests explicitly disable client caching (skipCache: true) to ensure real-time accuracy.
 */

const cleanParams = (params = {}) => {
  const cleaned = {};
  Object.keys(params).forEach((key) => {
    const val = params[key];
    if (val !== undefined && val !== null && val !== "") {
      cleaned[key] = val;
    }
  });
  return cleaned;
};

const superAdminAPI = {
  /**
   * Dedicated platform super admin authentication.
   * POST /api/super-admin/login/
   * Body: { email, password }
   * Returns: { status: "success", success: true, message: "...", data: { user: {...}, tokens: { access, refresh } } }
   */
  login: async ({ email, password }) => {
    const response = await api.post(
      "/super-admin/login/",
      { email, password },
      { skipCache: true }
    );
    return response.data;
  },

  /**
   * Clear platform super admin session credentials.
   */
  logout: () => {
    clearSuperAdminAuthSession();
  },
  /**
   * Verified identity of current platform super admin.
   * Returns: { status, success, message, data: { id, username, email, first_name, last_name, is_active, is_staff, is_superuser, date_joined, last_login } }
   */
  getMe: async () => {
    const response = await api.get("/super-admin/me/", { skipCache: true });
    return response.data;
  },

  /**
   * Platform-wide dashboard summary metrics.
   * Returns: { status, success, message, data: { companies, employees, users, recent_companies, company_growth_trend, attendance_overview, field_sales_overview, platform_activity } }
   */
  getDashboard: async () => {
    const response = await api.get("/super-admin/dashboard/", { skipCache: true });
    return response.data;
  },

  /**
   * Global company directory with server-side pagination, search, and filtering.
   * Params: { search, industry, company_type, country, field_sales_enabled, ordering, page, page_size }
   * Returns: { status, success, count, total_pages, current_page, page_size, next, previous, data: [...] }
   */
  getCompanies: async (params = {}) => {
    const response = await api.get("/super-admin/companies/", {
      params: cleanParams(params),
      skipCache: true,
    });
    return response.data;
  },

  /**
   * Full profile and aggregated platform metrics for a single company.
   * Returns: { status, success, message, data: { id, name, code, industry, ..., employee_count, active_employee_count, department_count, ... } }
   */
  getCompanyDetail: async (id) => {
    const response = await api.get(`/super-admin/companies/${id}/`, { skipCache: true });
    return response.data;
  },

  /**
   * Global employee directory across all tenants with server-side pagination and filters.
   * Params: { search, company_id, department_id, designation_id, employment_status, employment_type, is_active, ordering, page, page_size }
   * Returns: { status, success, count, total_pages, current_page, page_size, next, previous, data: [...] }
   */
  getEmployees: async (params = {}) => {
    const response = await api.get("/super-admin/employees/", {
      params: cleanParams(params),
      skipCache: true,
    });
    return response.data;
  },

  /**
   * Platform user accounts directory.
   * Params: { search, is_active, is_superuser, page, page_size }
   * Returns: { status, success, count, total_pages, current_page, page_size, next, previous, data: [...] }
   */
  getUsers: async (params = {}) => {
    const response = await api.get("/super-admin/users/", {
      params: cleanParams(params),
      skipCache: true,
    });
    return response.data;
  },

  /**
   * Platform-wide attendance statistics and 14-day daily trends.
   * Returns: { status, success, message, data: { total_records, today_date, today_total, today_status_breakdown, daily_trends: [...] } }
   */
  getAttendanceStats: async () => {
    const response = await api.get("/super-admin/stats/attendance/", { skipCache: true });
    return response.data;
  },

  /**
   * Platform-wide Field Sales usage overview.
   * Returns: { status, success, message, data: { field_sales_enabled_companies, total_field_sales_employees, total_leads, total_visits, total_customers, lead_status_breakdown, visit_status_breakdown } }
   */
  getFieldSalesStats: async () => {
    const response = await api.get("/super-admin/stats/field-sales/", { skipCache: true });
    return response.data;
  },

  /**
   * 12-month platform growth statistics for company registrations and employee onboardings.
   * Returns: { status, success, message, data: { company_growth: [...], employee_growth: [...] } }
   */
  getGrowthStats: async () => {
    const response = await api.get("/super-admin/stats/growth/", { skipCache: true });
    return response.data;
  },
};

export default superAdminAPI;
