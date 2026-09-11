import React from "react";
import { Navigate, Outlet } from "react-router-dom";

/**
 * Route-level guard enforcing RBAC permissions.
 * Admins/Owners and superusers have unrestricted access.
 * Regular employees/members only have access if they have the required permission
 * or if it's an in-built feature.
 */
export default function PermissionGuard({ requiredPermission, adminOnly = false }) {
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  })();

  const rawRole = String(user.role || "").toUpperCase();
  const isAdminOrOwner =
    rawRole === "OWNER" ||
    rawRole === "ADMIN" ||
    rawRole === "ADMINISTRATOR" ||
    user.is_superuser === true;

  const userPermissions = Array.isArray(user.permissions)
    ? user.permissions
    : [];

  // Superusers and Owners/Admins have access to everything
  if (isAdminOrOwner || userPermissions.includes("*")) {
    return <Outlet />;
  }

  // Admin-only routes are blocked for regular employees
  if (adminOnly) {
    return <Navigate to="/dashboard" replace />;
  }

  // Specific permission check
  if (requiredPermission) {
    const hasPerm =
      userPermissions.includes(requiredPermission) ||
      userPermissions.includes(`auth.${requiredPermission}`) ||
      userPermissions.includes(`department.${requiredPermission}`) ||
      userPermissions.includes(`designation.${requiredPermission}`) ||
      userPermissions.includes(`attendance.${requiredPermission}`) ||
      userPermissions.includes(`leave.${requiredPermission}`);

    if (!hasPerm) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <Outlet />;
}
