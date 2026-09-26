/**
 * Permission utility functions for RBAC and scoping.
 */

export const getCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
};

export const getUserPermissions = (user = null) => {
  const targetUser = user || getCurrentUser();
  if (Array.isArray(targetUser.permissions)) {
    return targetUser.permissions;
  }
  return [];
};

export const isSuperOrAdmin = (user = null) => {
  const targetUser = user || getCurrentUser();
  const rawRole = String(targetUser.role || "").toUpperCase();
  const perms = getUserPermissions(targetUser);

  return (
    targetUser.is_superuser === true ||
    rawRole === "OWNER" ||
    rawRole === "ADMIN" ||
    rawRole === "ADMINISTRATOR" ||
    perms.includes("*")
  );
};

/**
 * Checks if user has a permission matching any of the allowed keys.
 */
export const hasAnyPermission = (allowedKeys = [], user = null) => {
  const targetUser = user || getCurrentUser();
  if (isSuperOrAdmin(targetUser)) return true;

  const perms = getUserPermissions(targetUser);
  return allowedKeys.some((k) => perms.includes(k));
};

// ==========================================
// 1. EMPLOYEES
// ==========================================
export const canViewEmployees = (user = null) => {
  return hasAnyPermission([
    "view_user",
    "view_employee",
    "employees.view",
    "employees.view_all",
    "employees.view_department",
    "employees.view_team",
  ], user);
};

export const canCreateEmployees = (user = null) => {
  return hasAnyPermission([
    "add_user",
    "add_employee",
    "employees.create",
    "employees.create_all",
    "employees.create_department",
    "employees.create_team",
  ], user);
};
export const canViewOwnProfile = (user = null) => {
  return hasAnyPermission(
    [
      "employees.view_own",
      "profile.view_own",
      "profile.view",
    ],
    user,
  );
};

export const canUpdateOwnProfile = (user = null) => {
  return hasAnyPermission(
    [
      "employees.update_own",
      "profile.update_own",
      "profile.update",
    ],
    user,
  );
};

export const canUpdateEmployees = (user = null, targetEmployee = null) => {
  const targetUser = user || getCurrentUser();
  if (isSuperOrAdmin(targetUser)) return true;

  const perms = getUserPermissions(targetUser);

  if (targetEmployee && perms.includes("employees.update_own")) {
    if (targetEmployee.id === targetUser.employee_id || targetEmployee.email === targetUser.email) {
      return true;
    }
  }

  return hasAnyPermission([
    "change_user",
    "change_employee",
    "employees.update",
    "employees.update_all",
    "employees.update_department",
    "employees.update_team",
  ], targetUser);
};

export const canDeleteEmployees = (user = null) => {
  return hasAnyPermission([
    "delete_user",
    "delete_employee",
    "employees.delete",
    "employees.delete_all",
    "employees.delete_department",
    "employees.delete_team",
  ], user);
};

export const canExportEmployees = (user = null) => {
  return hasAnyPermission([
    "export_user",
    "export_employee",
    "employees.export",
    "employees.export_all",
  ], user);
};

// ==========================================
// 2. DEPARTMENTS
// ==========================================
export const canViewDepartments = (user = null) => {
  return hasAnyPermission([
    "view_department",
    "departments.view",
    "departments.view_all",
    "department.view",
  ], user);
};

export const canCreateDepartments = (user = null) => {
  return hasAnyPermission([
    "add_department",
    "departments.create",
    "departments.create_all",
    "department.create",
  ], user);
};

export const canUpdateDepartments = (user = null) => {
  return hasAnyPermission([
    "change_department",
    "departments.update",
    "departments.update_all",
    "department.update",
  ], user);
};

export const canDeleteDepartments = (user = null) => {
  return hasAnyPermission([
    "delete_department",
    "departments.delete",
    "departments.delete_all",
    "department.delete",
  ], user);
};

// ==========================================
// 3. DESIGNATIONS
// ==========================================
export const canViewDesignations = (user = null) => {
  return hasAnyPermission([
    "view_designation",
    "designations.view",
    "designations.view_all",
    "designation.view",
  ], user);
};

export const canCreateDesignations = (user = null) => {
  return hasAnyPermission([
    "add_designation",
    "designations.create",
    "designations.create_all",
    "designation.create",
  ], user);
};

export const canUpdateDesignations = (user = null) => {
  return hasAnyPermission([
    "change_designation",
    "designations.update",
    "designations.update_all",
    "designation.update",
  ], user);
};

export const canDeleteDesignations = (user = null) => {
  return hasAnyPermission([
    "delete_designation",
    "designations.delete",
    "designations.delete_all",
    "designation.delete",
  ], user);
};

// ==========================================
// 4. TEAMS
// ==========================================
export const canViewTeams = (user = null) => {
  return hasAnyPermission([
    "view_team",
    "teams.view",
    "teams.view_all",
    "teams.view_department",
    "teams.view_team",
    "teams.view_own",
    "team.view",
  ], user);
};

export const canCreateTeams = (user = null) => {
  return hasAnyPermission([
    "add_team",
    "teams.create",
    "teams.create_all",
    "team.create",
  ], user);
};

export const canUpdateTeams = (user = null) => {
  return hasAnyPermission([
    "change_team",
    "teams.update",
    "teams.update_all",
    "team.update",
  ], user);
};

export const canDeleteTeams = (user = null) => {
  return hasAnyPermission([
    "delete_team",
    "teams.delete",
    "teams.delete_all",
    "team.delete",
  ], user);
};

// ==========================================
// 5. ATTENDANCE
// ==========================================
export const canViewAttendance = (user = null) => {
  return hasAnyPermission([
    "view_attendance",
    "attendance.view",
    "attendance.view_all",
    "attendance.view_department",
    "attendance.view_team",
    "attendance.view_own",
  ], user);
};

export const canApproveAttendance = (user = null) => {
  return hasAnyPermission([
    "approve_attendance",
    "attendance.approve",
    "attendance.approve_all",
    "attendance.approve_department",
    "attendance.approve_team",
  ], user);
};

export const canExportAttendance = (user = null) => {
  return hasAnyPermission([
    "export_attendance",
    "attendance.export",
    "attendance.export_all",
  ], user);
};

// ==========================================
// 6. LEAVES
// ==========================================
export const canViewLeaves = (user = null) => {
  return hasAnyPermission([
    "view_leave",
    "leaves.view",
    "leaves.view_all",
    "leaves.view_department",
    "leaves.view_team",
    "leaves.view_own",
    "leave.view",
  ], user);
};

export const canCreateLeaves = (user = null) => {
  return hasAnyPermission([
    "add_leave",
    "leaves.create",
    "leaves.create_all",
    "leave.create",
  ], user);
};

export const canApproveLeaves = (user = null) => {
  return hasAnyPermission([
    "approve_leave",
    "leaves.approve",
    "leaves.approve_all",
    "leaves.approve_department",
    "leaves.approve_team",
    "leave.approve",
  ], user);
};

export const canDeleteLeaves = (user = null) => {
  return hasAnyPermission([
    "delete_leave",
    "leaves.delete",
    "leaves.delete_all",
    "leave.delete",
  ], user);
};

// ==========================================
// 7. HOLIDAYS
// ==========================================
export const canViewHolidays = (user = null) => {
  return hasAnyPermission([
    "view_holiday",
    "holidays.view",
    "holidays.view_all",
    "holiday.view",
  ], user);
};

export const canCreateHolidays = (user = null) => {
  return hasAnyPermission([
    "add_holiday",
    "holidays.create",
    "holidays.create_all",
    "holiday.create",
  ], user);
};

export const canUpdateHolidays = (user = null) => {
  return hasAnyPermission([
    "change_holiday",
    "holidays.update",
    "holidays.update_all",
    "holiday.update",
  ], user);
};

export const canDeleteHolidays = (user = null) => {
  return hasAnyPermission([
    "delete_holiday",
    "holidays.delete",
    "holidays.delete_all",
    "holiday.delete",
  ], user);
};

// ==========================================
// 8. ORGANIZATION SETUP
// ==========================================
export const canViewOrganization = (user = null) => {
  return hasAnyPermission([
    "view_companydetails",
    "organization.view",
    "organization_setup.view",
  ], user);
};

export const canUpdateOrganization = (user = null) => {
  return hasAnyPermission([
    "change_companydetails",
    "organization.update",
    "organization_setup.update",
  ], user);
};
