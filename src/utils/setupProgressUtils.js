/**
 * Organization Setup Progress Single Source of Truth Utility
 * Determines setup completion strictly from actual backend API responses.
 */

const extractList = (response) => {
  if (Array.isArray(response)) {
    return response;
  }
  if (Array.isArray(response?.results)) {
    return response.results;
  }
  if (Array.isArray(response?.data)) {
    return response.data;
  }
  if (Array.isArray(response?.data?.results)) {
    return response.data.results;
  }
  return [];
};

const isWorkScheduleConfigured = (workScheduleData) => {
  if (!workScheduleData) return false;
  const data = workScheduleData?.data || workScheduleData;

  const shifts = extractList(data?.shifts);
  const defaultShiftId =
    data?.default_shift_id ??
    data?.defaultShiftId ??
    data?.default_shift?.id ??
    data?.defaultShift?.id;

  const weekly = Array.isArray(data?.weekly_schedule)
    ? data.weekly_schedule
    : Array.isArray(data?.weeklySchedule)
    ? data.weeklySchedule
    : [];

  const hasActiveDay = weekly.some((day) => {
    const pattern = day?.pattern;
    const isWorking = day?.is_working_day ?? day?.isWorkingDay;
    const shiftId = day?.shift_id ?? day?.shiftId;
    return (
      (pattern && pattern !== "non_working") ||
      isWorking === true ||
      shiftId != null
    );
  });

  return Boolean(shifts.length > 0 || defaultShiftId || hasActiveDay);
};

export const getOrganizationSetupItems = ({
  company = null,
  departments = [],
  designations = [],
  roles = [],
  workSchedule = null,
  leavePolicies = [],
  holidays = [],
} = {}) => {
  const comp = company?.data || company || {};

  const name = comp.name || comp.company_name || comp.companyName || "";
  const address =
    comp.full_address ||
    comp.fullAddress ||
    comp.address ||
    comp.city ||
    comp.country ||
    "";
  const currency =
    comp.currency || comp.financial_year || comp.financialYear || "";

  const departmentList = extractList(departments);
  const designationList = extractList(designations);
  const roleList = extractList(roles);
  const leavePolicyList = extractList(leavePolicies);
  const holidayList = extractList(holidays);

  return [
    {
      key: "company_details",
      label: "Company details",
      description: "Basic organization information",
      complete: Boolean(name && name !== "—"),
      action: "Edit",
      path: "/company/edit",
    },
    {
      key: "company_address",
      label: "Company address",
      description: "Registered and business address",
      complete: Boolean(address && address !== "—"),
      action: "Edit",
      path: "/company/address/edit",
    },
    {
      key: "business_settings",
      label: "Business settings",
      description: "Financial year, currency and regional settings",
      complete: Boolean(currency && currency !== "—"),
      action: "Edit",
      path: "/company/business-settings/edit",
    },
    {
      key: "departments",
      label: "Departments",
      description: "Create and manage organization departments",
      complete: departmentList.length > 0,
      action: "Manage",
      path: "/departments",
    },
    {
      key: "designations",
      label: "Designations",
      description: "Define employee designations and permissions",
      complete: designationList.length > 0,
      action: "Manage",
      path: "/designations",
    },
    {
      key: "roles_permissions",
      label: "Roles & Permissions",
      description: "Configure user roles and system access permissions",
      complete: roleList.length > 0,
      action: "Manage",
      path: "/roles-permissions",
    },
    {
      key: "work_schedule",
      label: "Work Schedule",
      description: "Define working hours, shifts and weekly schedules",
      complete: isWorkScheduleConfigured(workSchedule),
      action: "Manage",
      path: "/work-schedule",
    },
    {
      key: "leave_policies",
      label: "Leave Policies",
      description: "Configure leave types, balances and approval rules",
      complete: leavePolicyList.length > 0,
      action: "Manage",
      path: "/leave-policies",
    },
    {
      key: "holidays",
      label: "Holidays",
      description: "Manage company holidays and holiday calendar",
      complete: holidayList.length > 0,
      action: "Manage",
      path: "/holidays",
    },
  ];
};

export const calculateOrganizationSetupProgress = (params = {}) => {
  const items = getOrganizationSetupItems(params);
  const total = items.length;
  const completed = items.filter((item) => item.complete).length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return {
    items,
    total,
    completed,
    percentage,
  };
};
