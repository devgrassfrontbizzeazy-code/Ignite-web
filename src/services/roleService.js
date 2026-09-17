import { RBAC_MODULES, SCOPE_OPTIONS, ALL_ACTIONS } from "../data/rbacCatalogue";
import * as roleAPI from "./api/roleAPI";

const STORAGE_KEY = "ignite_roles_v2";
const DESIG_ROLE_KEY = "ignite_designation_roles_v2";
const EMP_OVERRIDE_KEY = "ignite_employee_overrides_v2";
const EVENT_NAME = "ignite:roles-updated";

/**
 * Retrieves roles from local cache (synced with backend).
 */
export const getRoles = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      return [];
    }
    return parsed;
  } catch (error) {
    console.error("Failed to read roles from localStorage:", error);
    return [];
  }
};

/**
 * Persists roles array and notifies subscribers.
 */
const saveRoles = (roles) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(roles));
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: roles }));
    window.dispatchEvent(new Event("storage"));
  } catch (error) {
    console.error("Failed to persist roles:", error);
  }
};

/**
 * Normalizes backend role object to frontend structure.
 */
const normalizeRole = (r) => {
  if (!r) return null;
  return {
    id: r.id,
    roleName: r.role_name || r.roleName || "",
    roleCode: r.role_code || r.roleCode || "",
    description: r.description || "",
    status: (r.status || (r.is_active ? "active" : "inactive")).toLowerCase(),
    isSystem: Boolean(r.is_system),
    permissionCount: r.permission_count ?? r.permissionCount ?? (Array.isArray(r.permissions) ? r.permissions.length : 0),
    employeeCount: r.employee_count ?? r.employeeCount ?? 0,
    permissions: Array.isArray(r.permissions) ? r.permissions : [],
    createdAt: r.created_at || r.createdAt,
    updatedAt: r.updated_at || r.updatedAt,
    deletedAt: r.deleted_at || r.deletedAt || null,
  };
};

/**
 * Asynchronously syncs roles from backend API into local cache and notifies subscribers.
 */
export const syncRolesFromBackend = async () => {
  try {
    const response = await roleAPI.getRoles();
    const rawList = Array.isArray(response)
      ? response
      : Array.isArray(response?.results)
      ? response.results
      : Array.isArray(response?.data)
      ? response.data
      : [];

    const normalized = rawList.map(normalizeRole).filter(Boolean);
    saveRoles(normalized);
    return normalized;
  } catch (err) {
    console.warn("Could not sync roles from backend API, using local cache:", err);
  }
  return getRoles();
};

// Initial background sync
syncRolesFromBackend();

/**
 * Retrieves a role by ID or Name.
 */
export const getRoleById = (id) => {
  if (!id) return null;
  const roles = getRoles();
  return (
    roles.find(
      (r) => (String(r.id) === String(id) || r.roleName === id || r.roleCode === id) && !r.deletedAt
    ) || null
  );
};

/**
 * Retrieves active roles suitable for dropdown selection.
 */
export const getActiveRoles = () => {
  const roles = getRoles();
  return roles.filter((r) => !r.deletedAt && r.status === "active");
};

/**
 * Creates a new role.
 */
export const createRole = async (roleData) => {
  const permissions = Array.isArray(roleData?.permissions) ? roleData.permissions : [];

  const payload = {
    role_name: (roleData?.roleName || "").trim(),
    role_code: (roleData?.roleCode || "").trim().toUpperCase(),
    description: (roleData?.description || "").trim(),
    status: roleData?.status || "active",
    permissions: permissions.map((p) => ({
      module: p.module,
      functionality: p.functionality,
      action: p.action,
      ...(p.scope ? { scope: p.scope } : {}),
    })),
  };

  // Optimistic local save
  const tempRole = {
    id: Date.now(),
    roleName: payload.role_name,
    roleCode: payload.role_code,
    description: payload.description,
    employeeCount: 0,
    permissionCount: permissions.length,
    status: payload.status,
    createdAt: new Date().toISOString(),
    assignedUsers: [],
    permissions: payload.permissions,
  };

  const currentRoles = getRoles();
  saveRoles([tempRole, ...currentRoles]);

  try {
    const backendRole = await roleAPI.createRole(payload);
    const normalized = normalizeRole(backendRole);
    if (normalized) {
      const updated = getRoles().map((r) => (r.id === tempRole.id ? normalized : r));
      saveRoles(updated);
      return normalized;
    }
  } catch (err) {
    console.error("Failed to create role in backend, keeping local optimistic role:", err);
  }

  return tempRole;
};

/**
 * Updates an existing role.
 */
export const updateRole = async (id, roleData) => {
  const roles = getRoles();
  const target = roles.find((r) => String(r.id) === String(id));
  if (!target) {
    throw new Error("Role not found");
  }

  const permissions = Array.isArray(roleData?.permissions)
    ? roleData.permissions
    : target.permissions || [];

  const payload = {
    role_name: (roleData?.roleName || target.roleName).trim(),
    role_code: (roleData?.roleCode || target.roleCode).trim().toUpperCase(),
    description: roleData?.description !== undefined ? roleData.description : target.description,
    status: roleData?.status || target.status,
    permissions: permissions.map((p) => ({
      module: p.module,
      functionality: p.functionality,
      action: p.action,
      ...(p.scope ? { scope: p.scope } : {}),
    })),
  };

  const updatedRole = {
    ...target,
    roleName: payload.role_name,
    roleCode: payload.role_code,
    description: payload.description,
    status: payload.status,
    permissionCount: permissions.length,
    permissions: payload.permissions,
    updatedAt: new Date().toISOString(),
  };

  saveRoles(roles.map((r) => (String(r.id) === String(id) ? updatedRole : r)));

  try {
    const backendRole = await roleAPI.updateRole(id, payload);
    const normalized = normalizeRole(backendRole);
    if (normalized) {
      saveRoles(getRoles().map((r) => (String(r.id) === String(id) ? normalized : r)));
      return normalized;
    }
  } catch (err) {
    console.error("Failed to update role on backend API:", err);
  }

  return updatedRole;
};

/**
 * Soft-deletes a role.
 */
export const deleteRole = async (id) => {
  const roles = getRoles();
  const deletedAt = new Date().toISOString();
  saveRoles(roles.map((r) => (String(r.id) === String(id) ? { ...r, deletedAt } : r)));

  try {
    await roleAPI.deleteRole(id);
  } catch (err) {
    console.error("Failed to delete role on backend API:", err);
  }
};

/**
 * Toggles active/inactive status.
 */
export const toggleRoleStatus = async (id) => {
  const roles = getRoles();
  const target = roles.find((r) => String(r.id) === String(id));
  if (!target) return null;

  const newStatus = target.status === "active" ? "inactive" : "active";
  const updatedRole = {
    ...target,
    status: newStatus,
    updatedAt: new Date().toISOString(),
  };

  saveRoles(roles.map((r) => (String(r.id) === String(id) ? updatedRole : r)));

  try {
    const backendRole = await roleAPI.toggleRoleStatus(id);
    const normalized = normalizeRole(backendRole);
    if (normalized) {
      saveRoles(getRoles().map((r) => (String(r.id) === String(id) ? normalized : r)));
      return normalized;
    }
  } catch (err) {
    console.error("Failed to toggle role status on backend API:", err);
  }

  return updatedRole;
};

/**
 * Clones an existing role with a unique name.
 */
export const cloneRole = async (id) => {
  const roles = getRoles();
  const source = roles.find((r) => String(r.id) === String(id));
  if (!source) throw new Error("Source role not found");

  try {
    const backendRole = await roleAPI.cloneRole(id);
    const normalized = normalizeRole(backendRole);
    if (normalized) {
      saveRoles([normalized, ...getRoles()]);
      return normalized;
    }
  } catch (err) {
    console.error("Backend clone failed, performing local fallback clone:", err);
  }

  const baseName = `${source.roleName} Copy`;
  let clonedName = baseName;
  let counter = 2;
  while (roles.some((r) => !r.deletedAt && r.roleName.toLowerCase() === clonedName.toLowerCase())) {
    clonedName = `${source.roleName} Copy ${counter}`;
    counter++;
  }

  const baseCode = source.roleCode || source.roleName.replace(/[^a-zA-Z0-9]/g, "_").toUpperCase();
  let clonedCode = `${baseCode}_COPY`;
  counter = 2;
  while (roles.some((r) => !r.deletedAt && r.roleCode?.toLowerCase() === clonedCode.toLowerCase())) {
    clonedCode = `${baseCode}_COPY_${counter}`;
    counter++;
  }

  const clonedRole = {
    ...source,
    id: Date.now(),
    roleName: clonedName,
    roleCode: clonedCode,
    employeeCount: 0,
    assignedUsers: [],
    permissions: source.permissions ? source.permissions.map((p) => ({ ...p })) : [],
    permissionCount: source.permissions?.length || 0,
    createdAt: new Date().toISOString(),
    deletedAt: null,
  };

  saveRoles([clonedRole, ...roles]);
  return clonedRole;
};

// ==========================================
// DESIGNATION DEFAULT ROLE BINDINGS
// ==========================================

export const getDesignationRolesMap = () => {
  try {
    const raw = localStorage.getItem(DESIG_ROLE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

export const setDesignationRole = (designationId, roleId) => {
  if (!designationId) return;
  const map = getDesignationRolesMap();
  if (roleId) {
    map[String(designationId)] = String(roleId);
  } else {
    delete map[String(designationId)];
  }
  localStorage.setItem(DESIG_ROLE_KEY, JSON.stringify(map));
  window.dispatchEvent(new CustomEvent("ignite:designation-roles-updated"));
};

export const getDesignationRole = (designationId) => {
  if (!designationId) return null;
  const map = getDesignationRolesMap();
  const roleId = map[String(designationId)];
  if (!roleId) return null;
  return getRoleById(roleId);
};

// ==========================================
// EMPLOYEE OVERRIDE ROLE BINDINGS
// ==========================================

export const getEmployeeOverridesMap = () => {
  try {
    const raw = localStorage.getItem(EMP_OVERRIDE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

export const setEmployeeOverrideRole = (employeeId, roleId) => {
  if (!employeeId) return;
  const map = getEmployeeOverridesMap();
  if (roleId) {
    map[String(employeeId)] = String(roleId);
  } else {
    delete map[String(employeeId)];
  }
  localStorage.setItem(EMP_OVERRIDE_KEY, JSON.stringify(map));
  window.dispatchEvent(new CustomEvent("ignite:employee-roles-updated"));
};

export const getEmployeeOverrideRole = (employeeId) => {
  if (!employeeId) return null;
  const map = getEmployeeOverridesMap();
  const roleId = map[String(employeeId)];
  if (!roleId) return null;
  return getRoleById(roleId);
};

/**
 * Determines an employee's effective role.
 *
 * Effective Role = Employee Override Role (if present) OR Designation Default Role.
 */
export const getEffectiveRole = (employee = {}, designation = null) => {
  if (!employee && !designation) return null;

  // 1. Check if employee has an explicit override role
  const empId = employee.id ?? employee.employee_id ?? employee.pk;
  if (empId) {
    const cachedOverride = getEmployeeOverrideRole(empId);
    if (cachedOverride) {
      return {
        role: cachedOverride,
        source: "override",
        label: cachedOverride.roleName,
      };
    }
  }

  const directOverride =
    employee.override_role_id ??
    employee.override_role ??
    employee.overrideRole ??
    employee.role_override;

  if (directOverride) {
    const overrideRole =
      (typeof directOverride === "object" ? directOverride : null) ||
      getRoleById(directOverride);
    if (overrideRole) {
      return {
        role: overrideRole,
        source: "override",
        label: overrideRole.roleName,
      };
    }
  }

  // 2. Fall back to designation default role
  const targetDesig =
    designation ||
    (typeof employee.designation === "object" ? employee.designation : null);

  const desigId =
    targetDesig?.id ??
    employee.designation_id ??
    (typeof employee.designation === "number" ? employee.designation : null);

  if (desigId) {
    const cachedDesigRole = getDesignationRole(desigId);
    if (cachedDesigRole) {
      return {
        role: cachedDesigRole,
        source: "designation",
        label: cachedDesigRole.roleName,
      };
    }
  }

  const defaultRoleId =
    targetDesig?.default_role_id ??
    targetDesig?.default_role ??
    targetDesig?.defaultRole ??
    employee.default_role_id ??
    employee.default_role;

  if (defaultRoleId) {
    const defaultRole =
      (typeof defaultRoleId === "object" ? defaultRoleId : null) ||
      getRoleById(defaultRoleId);
    if (defaultRole) {
      return {
        role: defaultRole,
        source: "designation",
        label: defaultRole.roleName,
      };
    }
  }

  // Check if designation name has a matching default role
  const desigName = targetDesig?.name || targetDesig?.designationName || employee.designation_name;
  if (desigName) {
    const fallbackMatch = getRoleById(desigName);
    if (fallbackMatch) {
      return {
        role: fallbackMatch,
        source: "designation",
        label: fallbackMatch.roleName,
      };
    }
  }

  return null;
};

export const roleService = {
  getRoles,
  getRoleById,
  getActiveRoles,
  syncRolesFromBackend,
  createRole,
  updateRole,
  deleteRole,
  toggleRoleStatus,
  cloneRole,
  getEffectiveRole,
  getDesignationRole,
  setDesignationRole,
  getEmployeeOverrideRole,
  setEmployeeOverrideRole,
  RBAC_MODULES,
  SCOPE_OPTIONS,
  ALL_ACTIONS,
};

export default roleService;
