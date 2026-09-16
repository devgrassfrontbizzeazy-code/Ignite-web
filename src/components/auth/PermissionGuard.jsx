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
      userPermissions.includes(`leave.${requiredPermission}`) ||
      (requiredPermission === "view_user" && (
        userPermissions.includes("employees.view") ||
        userPermissions.includes("employees.view_all") ||
        userPermissions.includes("employees.view_department") ||
        userPermissions.includes("employees.view_team") ||
        userPermissions.includes("employees.view_own")
      )) ||
      (requiredPermission === "view_department" && (
        userPermissions.includes("departments.view") ||
        userPermissions.includes("departments.view_all")
      )) ||
      (requiredPermission === "view_designation" && (
        userPermissions.includes("designations.view") ||
        userPermissions.includes("designations.view_all")
      )) ||
      (requiredPermission === "view_attendance" && (
        userPermissions.includes("attendance.view") ||
        userPermissions.includes("attendance.view_all") ||
        userPermissions.includes("attendance.view_department") ||
        userPermissions.includes("attendance.view_team") ||
        userPermissions.includes("attendance.view_own")
      )) ||
      (requiredPermission === "view_leave" && (
        userPermissions.includes("leaves.view") ||
        userPermissions.includes("leaves.view_all") ||
        userPermissions.includes("leaves.view_department") ||
        userPermissions.includes("leaves.view_team") ||
        userPermissions.includes("leaves.view_own")
      ));

    if (!hasPerm) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <Outlet />;
}
