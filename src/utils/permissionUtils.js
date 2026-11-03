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
    rawRole === "FULL ACCESS" ||
    rawRole === "FULL_ACCESS" ||
    rawRole === "SUPERADMIN" ||
    perms.includes("*")
  );
};

// ==========================================
// ROLES & PERMISSIONS
// ==========================================
export const canViewRoles = (user = null) => {
  return hasAnyPermission([
    "view_role",
    "roles.view",
    "roles.view_all",
    "roles_permissions.view",
    "roles_permissions.view_all",
  ], user);
};

export const canCreateRoles = (user = null) => {
  return hasAnyPermission([
    "add_role",
    "roles.create",
    "roles.create_all",
    "roles_permissions.create",
    "roles_permissions.create_all",
  ], user);
};

export const canUpdateRoles = (user = null) => {
  return hasAnyPermission([
    "change_role",
    "roles.update",
    "roles.edit",
    "roles_permissions.update",
  ], user);
};

export const canDeleteRoles = (user = null) => {
  return hasAnyPermission([
    "delete_role",
    "roles.delete",
    "roles_permissions.delete",
  ], user);
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

export const isFieldSalesManager = (user = null) => {
  const targetUser = user || getCurrentUser();
  if (isSuperOrAdmin(targetUser)) return true;
  const rawRole = String(targetUser.role || targetUser.designation || "").toUpperCase();
  const perms = getUserPermissions(targetUser);
  const isFs = targetUser.is_field_sales === true || targetUser.department === "Field Sales";
  return (
    rawRole === "FIELD SALES MANAGER" ||
    (isFs && (targetUser.is_manager === true || rawRole === "MANAGER")) ||
    perms.includes("field_sales.manage") ||
    perms.includes("field_sales.employees_manage")
  );
};

export const isSalesPerson = (user = null) => {
  const targetUser = user || getCurrentUser();
  if (isFieldSalesManager(targetUser)) return false;
  const rawRole = String(targetUser.role || targetUser.designation || "").toUpperCase();
  const perms = getUserPermissions(targetUser);
  return (
    rawRole === "SALES PERSON" ||
    rawRole === "FIELD SALES" ||
    targetUser.department === "Field Sales" ||
    targetUser.is_field_sales === true ||
    perms.includes("field_sales.view") ||
    perms.includes("field_sales.visits_view")
  );
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

export const canViewAllEmployees = (user = null) => {
  const targetUser = user || getCurrentUser();
  if (isSuperOrAdmin(targetUser)) return true;

  return getUserPermissions(targetUser).some((permission) => {
    if (typeof permission === "string") {
      return ["employees.view_all", "hrms.employees.view_all"].includes(
        permission.toLowerCase(),
      );
    }

    if (!permission || typeof permission !== "object") {
      return false;
    }

    const module = String(permission.module || "").toLowerCase();
    const functionality = String(
      permission.functionality || permission.resource || "",
    ).toLowerCase();
    const action = String(permission.action || "").toLowerCase();
    const scope = String(permission.scope || "").toLowerCase();

    return (
      (module === "hrms" || module === "employees") &&
      functionality === "employees" &&
      action === "view" &&
      (scope === "all" || scope === "company")
    );
  });
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
// 4B. TASKS & WORK MANAGEMENT
// ==========================================
export const canViewTasks = (user = null) => {
  return hasAnyPermission([
    "view_task",
    "tasks.view",
    "tasks.view_all",
    "tasks.view_department",
    "tasks.view_team",
    "tasks.view_own",
    "task.view",
  ], user);
};

export const canCreateTasks = (user = null) => {
  return hasAnyPermission([
    "add_task",
    "tasks.create",
    "tasks.create_all",
    "task.create",
  ], user);
};

export const canUpdateTasks = (user = null) => {
  return hasAnyPermission([
    "change_task",
    "tasks.update",
    "tasks.update_all",
    "task.update",
  ], user);
};

export const canDeleteTasks = (user = null) => {
  return hasAnyPermission([
    "delete_task",
    "tasks.delete",
    "tasks.delete_all",
    "task.delete",
  ], user);
};

export const canViewWorkManagement = (user = null) => {
  return canViewTeams(user) || canViewTasks(user);
};

// ==========================================
// 5. ATTENDANCE
// ==========================================

/**
 * Checks if user has permission to view their OWN personal attendance.
 * All active employees with self-service / ViewOwn attendance have access.
 */
// Helper to test if permission object is strictly for attendance
const isAttendancePermObject = (p) => {
  if (!p || typeof p !== "object") return false;
  const func = String(p.functionality || p.resource || p.feature || "").toLowerCase();
  const mod = String(p.module || "").toLowerCase();
  return func === "attendance" || (mod === "attendance" && (!func || func === "attendance"));
};

export const canViewOwnAttendance = (user = null) => {
  const targetUser = user || getCurrentUser();
  if (isSuperOrAdmin(targetUser)) return true;

  const perms = getUserPermissions(targetUser);

  const ownOrAnyViewKeys = [
    "attendance.view_own",
    "hrms.attendance.view_own",
    "attendance.view",
    "view_attendance",
    "attendance.view_all",
    "attendance.view_department",
    "attendance.view_team",
    "hrms.attendance.view",
    "hrms.attendance.view_all",
    "hrms.attendance.view_department",
    "hrms.attendance.view_team",
  ];

  if (ownOrAnyViewKeys.some((k) => perms.includes(k))) {
    return true;
  }

  return perms.some((p) => {
    if (!isAttendancePermObject(p)) return false;
    const act = String(p.action || "").toLowerCase();
    return act === "view" || act === "read" || act === "list";
  });
};

/**
 * Checks if user has permission to view OTHER EMPLOYEES' attendance.
 * ViewOwn, CreateDepartment, and EditOwn do NOT grant access to Employee Attendance.
 */
export const canViewEmployeeAttendance = (user = null) => {
  const targetUser = user || getCurrentUser();
  if (isSuperOrAdmin(targetUser)) return true;

  const perms = getUserPermissions(targetUser);

  // If the user explicitly has "own" scope for attendance view in their assigned permission objects:
  const hasOwnObject = perms.some((p) => {
    if (!isAttendancePermObject(p)) return false;
    const act = String(p.action || "").toLowerCase();
    const scope = String(p.scope || "").toLowerCase();
    return (act === "view" || act === "read" || act === "list") && scope === "own";
  });

  const hasOwnString =
    perms.includes("attendance.view_own") ||
    perms.includes("hrms.attendance.view_own");

  // Check object permissions: must have action view/approve and scope all/department/team (NEVER own)
  const hasObjectEmployeeView = perms.some((p) => {
    if (!isAttendancePermObject(p)) return false;
    const act = String(p.action || "").toLowerCase();
    const scope = String(p.scope || "").toLowerCase();

    const isViewAct = act === "view" || act === "read" || act === "list";
    const isApproveAct = act === "approve" || act === "manage";

    if (isApproveAct) return true;
    if (
      isViewAct &&
      (scope === "all" || scope === "company" || scope === "department" || scope === "team")
    ) {
      return true;
    }
    return false;
  });

  if (hasObjectEmployeeView) {
    return true;
  }

  // Explicit department/team viewing or approval keys that can grant access
  const explicitDepartmentOrApproveKeys = [
    "attendance.view_department",
    "hrms.attendance.view_department",
    "attendance.view_team",
    "hrms.attendance.view_team",
    "attendance.approve",
    "attendance.approve_all",
    "attendance.approve_department",
    "attendance.approve_team",
    "approve_attendance",
    "manage_attendance",
    "attendance.manage",
  ];

  // If user has explicit "own" scope (via object or string), only explicit department/team/approval can override
  if (hasOwnObject || hasOwnString) {
    return explicitDepartmentOrApproveKeys.some((k) => perms.includes(k));
  }

  // Explicit employee/department/team viewing or approval permissions
  const employeeAttendanceKeys = [
    "attendance.view_all",
    "hrms.attendance.view_all",
    "view_all_attendance",
    "view_employee_attendance",
    "attendance.view_employees",
    ...explicitDepartmentOrApproveKeys,
    "export_attendance",
  ];

  if (employeeAttendanceKeys.some((k) => perms.includes(k))) {
    return true;
  }

  // Fallback: generic view_attendance WITHOUT own scope
  const genericViewKeys = ["view_attendance", "attendance.view", "hrms.attendance.view"];
  return genericViewKeys.some((k) => perms.includes(k));
};

export const canViewAllEmployeeAttendance = (user = null) => {
  const targetUser = user || getCurrentUser();
  if (isSuperOrAdmin(targetUser)) return true;

  const perms = getUserPermissions(targetUser);

  // If user explicitly has "own" scope for attendance view, reject all-scope view
  const hasOwnObject = perms.some((p) => {
    if (!isAttendancePermObject(p)) return false;
    const act = String(p.action || "").toLowerCase();
    const scope = String(p.scope || "").toLowerCase();
    return (act === "view" || act === "read" || act === "list") && scope === "own";
  });

  if (hasOwnObject) {
    return false;
  }

  const allAttendanceKeys = [
    "attendance.view_all",
    "hrms.attendance.view_all",
    "view_all_attendance",
    "view_employee_attendance",
    "attendance.view_employees",
    "attendance.manage",
    "manage_attendance",
    "attendance.approve_all",
  ];

  if (allAttendanceKeys.some((k) => perms.includes(k))) {
    return true;
  }

  return perms.some((p) => {
    if (!isAttendancePermObject(p)) return false;
    const act = String(p.action || "").toLowerCase();
    const scope = String(p.scope || "").toLowerCase();
    return (
      (act === "view" || act === "read" || act === "list") &&
      (scope === "all" || scope === "company")
    );
  });
};

export const canViewDepartmentAttendance = (user = null) => {
  const targetUser = user || getCurrentUser();
  if (isSuperOrAdmin(targetUser)) return true;

  const perms = getUserPermissions(targetUser);
  return (
    perms.includes("attendance.view_department") ||
    perms.includes("hrms.attendance.view_department") ||
    perms.some((p) => {
      if (!isAttendancePermObject(p)) return false;
      const act = String(p.action || "").toLowerCase();
      const scope = String(p.scope || "").toLowerCase();
      return (
        (act === "view" || act === "read" || act === "list") &&
        scope === "department"
      );
    })
  );
};

export const canViewAttendance = (user = null) => {
  return canViewEmployeeAttendance(user);
};

export const canApproveAttendance = (user = null) => {
  const targetUser = user || getCurrentUser();
  if (isSuperOrAdmin(targetUser)) return true;

  const perms = getUserPermissions(targetUser);

  const approveKeys = [
    "approve_attendance",
    "attendance.approve",
    "attendance.approve_all",
    "attendance.approve_department",
    "attendance.approve_team",
    "attendance.manage",
    "manage_attendance",
  ];

  if (approveKeys.some((k) => perms.includes(k))) {
    return true;
  }

  return perms.some((p) => {
    if (!isAttendancePermObject(p)) return false;
    const act = String(p.action || "").toLowerCase();
    return act === "approve" || act === "manage";
  });
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

// ==========================================
// 9. FIELD TRACKING
// ==========================================

/** Can the user see their own location / visits on the map? */
export const canViewOwnTracking = (user = null) => {
  return hasAnyPermission([
    "tracking.view_own",
    "visits.view_own",
    "field_tracking.view_own",
  ], user);
};

/** Can the user see team member locations / visits? */
export const canViewTeamTracking = (user = null) => {
  return hasAnyPermission([
    "tracking.view_team",
    "visits.view_team",
    "field_tracking.view_team",
  ], user);
};

/** Can the user see all employee locations / visits? */
export const canViewAllTracking = (user = null) => {
  return hasAnyPermission([
    "tracking.view_all",
    "visits.view_all",
    "field_tracking.view_all",
  ], user);
};

/** Can the user see any team/all employee markers on the map? */
export const canViewTeamOnMap = (user = null) => {
  return canViewTeamTracking(user) || canViewAllTracking(user);
};

// ==========================================
// 10. ACCOUNT / PAYROLL
// ==========================================
export const canViewPayroll = (user = null) => {
  return hasAnyPermission([
    "view_payroll",
    "payroll.view",
    "payroll.manage",
    "account.payroll.view",
    "account.payroll.manage",
  ], user);
};

export const canCreatePayroll = (user = null) => {
  return hasAnyPermission([
    "add_payroll",
    "payroll.create",
    "payroll.manage",
    "account.payroll.create",
    "account.payroll.manage",
  ], user);
};

export const canUpdatePayroll = (user = null) => {
  return hasAnyPermission([
    "change_payroll",
    "payroll.update",
    "payroll.edit",
    "payroll.manage",
    "account.payroll.update",
    "account.payroll.edit",
    "account.payroll.manage",
  ], user);
};

export const canApprovePayroll = (user = null) => {
  return hasAnyPermission([
    "approve_payroll",
    "payroll.approve",
    "payroll.manage",
    "account.payroll.approve",
    "account.payroll.manage",
  ], user);
};

export const canDeletePayroll = (user = null) => {
  return hasAnyPermission([
    "delete_payroll",
    "payroll.delete",
    "payroll.manage",
    "account.payroll.delete",
    "account.payroll.manage",
  ], user);
};

export const canExportPayroll = (user = null) => {
  return hasAnyPermission([
    "export_payroll",
    "payroll.export",
    "payroll.manage",
    "account.payroll.export",
    "account.payroll.manage",
  ], user);
};

export const canManagePayroll = (user = null) => {
  return hasAnyPermission([
    "change_payroll",
    "payroll.manage",
    "account.payroll.manage",
  ], user);
};

// ==========================================
// 11. FIELD SALES
// ==========================================
export const canViewFieldSales = (user = null) => {
  return hasAnyPermission([
    "field_sales.view",
    "field_sales.manage",
    "field_sales.leads_view",
    "field_sales.visits_view",
    "field_sales.customers_view",
    "field_sales.today_visits",
  ], user);
};

export const canManageFieldSales = (user = null) => {
  return hasAnyPermission([
    "field_sales.manage",
  ], user);
};

export const canManageFieldSalesEmployees = (user = null) => {
  return hasAnyPermission([
    "field_sales.employees_manage",
    "field_sales.manage",
  ], user);
};

export const canViewLeads = (user = null) => {
  return hasAnyPermission([
    "field_sales.leads_view",
    "field_sales.leads_manage",
    "field_sales.view",
    "field_sales.manage",
  ], user);
};

export const canCreateLeads = (user = null) => {
  return hasAnyPermission([
    "field_sales.leads_create",
    "field_sales.leads_manage",
    "field_sales.manage",
  ], user);
};

export const canManageLeads = (user = null) => {
  return hasAnyPermission([
    "field_sales.leads_manage",
    "field_sales.manage",
  ], user);
};

export const canViewCustomers = (user = null) => {
  return hasAnyPermission([
    "field_sales.customers_view",
    "field_sales.customers_manage",
    "field_sales.view",
    "field_sales.manage",
  ], user);
};

export const canCreateCustomers = (user = null) => {
  return hasAnyPermission([
    "field_sales.customers_create",
    "field_sales.customers_manage",
    "field_sales.manage",
  ], user);
};

export const canManageCustomers = (user = null) => {
  return hasAnyPermission([
    "field_sales.customers_manage",
    "field_sales.manage",
  ], user);
};

export const canViewVisits = (user = null) => {
  return hasAnyPermission([
    "field_sales.visits_view",
    "field_sales.visits_manage",
    "field_sales.today_visits",
    "field_sales.view",
    "field_sales.manage",
  ], user);
};

export const canCreateVisits = (user = null) => {
  return hasAnyPermission([
    "field_sales.visits_create",
    "field_sales.visits_manage",
    "field_sales.manage",
  ], user);
};

export const canManageVisits = (user = null) => {
  return hasAnyPermission([
    "field_sales.visits_manage",
    "field_sales.manage",
  ], user);
};

export const canCheckInVisits = (user = null) => {
  return hasAnyPermission([
    "field_sales.today_visits",
    "field_sales.checkin",
    "field_sales.visits_manage",
    "field_sales.manage",
  ], user);
};
