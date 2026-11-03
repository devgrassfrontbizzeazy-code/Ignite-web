import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import {
  canViewEmployeeAttendance,
  canViewOwnAttendance,
} from "../../utils/permissionUtils";

/**
 * Route-level guard enforcing RBAC permissions.
 * Admins/Owners and superusers have unrestricted access.
 * Regular employees/members only have access if they have the required permission
 * or if it's an in-built feature.
 */
export default function PermissionGuard({
  requiredPermission,
  adminOnly = false,
  showAccessDenied = false,
}) {
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
    rawRole === "FULL ACCESS" ||
    rawRole === "FULL_ACCESS" ||
    rawRole === "SUPERADMIN" ||
    user.is_superuser === true;

  const userPermissions = Array.isArray(user.permissions)
    ? user.permissions
    : [];

  // Superusers and Owners/Admins have access to everything
  if (isAdminOrOwner || userPermissions.includes("*")) {
    return <Outlet />;
  }

  const renderAccessDenied = () => (
    <div
      className="access-denied-container"
      style={{
        minHeight: "60vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
      }}
    >
      <div
        className="access-denied-card"
        style={{
          maxWidth: "480px",
          width: "100%",
          textAlign: "center",
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: "12px",
          padding: "2.5rem 2rem",
          boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
        }}
      >
        <div
          style={{
            width: "56px",
            height: "56px",
            margin: "0 auto 1.25rem",
            borderRadius: "50%",
            background: "#fee2e2",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#ef4444",
          }}
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h2
          style={{
            fontSize: "1.25rem",
            fontWeight: 700,
            color: "#1e293b",
            marginBottom: "0.5rem",
          }}
        >
          Access Denied
        </h2>
        <p
          style={{
            color: "#64748b",
            fontSize: "0.875rem",
            lineHeight: 1.5,
            marginBottom: "1.5rem",
          }}
        >
          You do not have permission to access this page. Please contact
          your administrator if you require access.
        </p>
        <button
          onClick={() => {
            window.location.href = "/dashboard";
          }}
          style={{
            padding: "0.625rem 1.25rem",
            background: "#4f46e5",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            fontWeight: 500,
            cursor: "pointer",
            fontSize: "0.875rem",
          }}
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );

  // Admin-only routes are blocked for regular employees
  if (adminOnly) {
    if (showAccessDenied) {
      return renderAccessDenied();
    }
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
        userPermissions.includes("employees.view_team")
      )) ||
      (requiredPermission === "view_department" && (
        userPermissions.includes("departments.view") ||
        userPermissions.includes("departments.view_all")
      )) ||
      (requiredPermission === "view_designation" && (
        userPermissions.includes("designations.view") ||
        userPermissions.includes("designations.view_all")
      )) ||
      (requiredPermission === "view_employee_attendance" && canViewEmployeeAttendance(user)) ||
      (requiredPermission === "view_attendance" && (
        canViewOwnAttendance(user) ||
        canViewEmployeeAttendance(user)
      )) ||
      (requiredPermission === "view_leave" && (
        userPermissions.includes("leaves.view") ||
        userPermissions.includes("leaves.view_all") ||
        userPermissions.includes("leaves.view_department") ||
        userPermissions.includes("leaves.view_team") ||
        userPermissions.includes("leaves.view_own")
      )) ||
      (requiredPermission === "view_role" && (
        userPermissions.includes("view_role") ||
        userPermissions.includes("roles.view") ||
        userPermissions.includes("roles.view_all") ||
        userPermissions.includes("roles_permissions.view") ||
        userPermissions.includes("roles_permissions.view_all")
      )) ||
      (requiredPermission === "view_companydetails" && (
        userPermissions.includes("view_companydetails") ||
        userPermissions.includes("organization.view") ||
        userPermissions.includes("organization_setup.view")
      ));

    if (!hasPerm) {
      if (showAccessDenied) {
        return renderAccessDenied();
      }
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <Outlet />;
}
