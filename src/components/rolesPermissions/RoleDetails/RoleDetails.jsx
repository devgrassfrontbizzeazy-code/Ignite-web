import { useMemo } from "react";
import RoleUserManager from "../RoleUserManager/RoleUserManager";
import { formatDate } from "../../../utils/dateUtils";
import { RBAC_MODULES } from "../../../data/rbacCatalogue";
import "./RoleDetails.css";

const RoleDetails = ({
  role,
  onClose,
  onEdit,
  onAssignUser,
  onRemoveUser,
  onClone,
}) => {
  if (!role) {
    return null;
  }

  const isActive = role.status === "active";

  // Group permissions by Module -> Functionality
  const groupedPermissions = useMemo(() => {
    if (!role.permissions || !Array.isArray(role.permissions)) return {};

    const groups = {};

    role.permissions.forEach((p) => {
      let modKey = "hrms";
      let funcKey = "employees";
      let actKey = "view";
      let scope = p.scope;

      if (typeof p === "string") {
        const parts = p.split(".");
        if (parts.length === 3) {
          [modKey, funcKey, actKey] = parts;
        } else if (parts.length === 2) {
          funcKey = parts[0];
          actKey = parts[1];
        }
      } else if (p && typeof p === "object") {
        modKey = p.module || "hrms";
        funcKey = p.functionality || p.resource || "employees";
        actKey = p.action || "view";
      }

      const modMeta = RBAC_MODULES.find((m) => m.key === modKey);
      const modName = modMeta?.name || modKey.toUpperCase();

      const funcMeta = modMeta?.functionalities.find((f) => f.key === funcKey);
      const funcName = funcMeta?.name || funcKey.charAt(0).toUpperCase() + funcKey.slice(1);

      const actionLabel = actKey.charAt(0).toUpperCase() + actKey.slice(1);

      if (!groups[modName]) {
        groups[modName] = {};
      }
      if (!groups[modName][funcName]) {
        groups[modName][funcName] = [];
      }

      groups[modName][funcName].push({
        action: actionLabel,
        scope: scope || null,
      });
    });

    return groups;
  }, [role.permissions]);

  const hasPermissions = Object.keys(groupedPermissions).length > 0;

  return (
    <div className="role-details">
      {/* Header */}
      <div className="role-details__header">
        <div className="role-details__identity">
          <div className="role-details__icon">
            {role.roleName?.charAt(0)?.toUpperCase() || "R"}
          </div>

          <div>
            <h2>{role.roleName}</h2>
            <span
              className={`role-details__status role-details__status--${
                isActive ? "active" : "inactive"
              }`}
            >
              <span className="role-details__status-dot" />
              {isActive ? "Active Role" : "Inactive Role"}
            </span>
          </div>
        </div>
      </div>

      <div className="role-details__body">
        {/* Role Information */}
        <div className="role-details__section">
          <h3>Role Overview</h3>

          <div className="role-details__grid">
            <div className="role-details__field">
              <span>Role Name</span>
              <strong>{role.roleName || "—"}</strong>
            </div>

            <div className="role-details__field">
              <span>Role Code</span>
              <strong className="role-details__code">{role.roleCode || "—"}</strong>
            </div>

            <div className="role-details__field">
              <span>Total Permissions</span>
              <strong>{role.permissionCount ?? role.permissions?.length ?? 0}</strong>
            </div>

            <div className="role-details__field">
              <span>Assigned Employees</span>
              <strong>{role.employeeCount ?? role.assignedUsers?.length ?? 0}</strong>
            </div>

            <div className="role-details__field">
              <span>Created Date</span>
              <strong>{formatDate(role.createdAt)}</strong>
            </div>

            <div className="role-details__field">
              <span>Status</span>
              <strong>{isActive ? "Active" : "Inactive"}</strong>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="role-details__section">
          <h3>Description</h3>
          <p className="role-details__description">
            {role.description || "No description provided for this role."}
          </p>
        </div>

        {/* Permissions Grouped by Module and Functionality */}
        <div className="role-details__section">
          <div className="role-details__section-header">
            <h3>Assigned Module Permissions</h3>
            <span className="role-details__perm-badge">
              {role.permissionCount ?? role.permissions?.length ?? 0} total actions
            </span>
          </div>

          {!hasPermissions ? (
            <p className="role-details__empty-perms">No permissions assigned to this role.</p>
          ) : (
            <div className="role-details__module-groups">
              {Object.entries(groupedPermissions).map(([moduleName, functionalities]) => (
                <div key={moduleName} className="role-details__module-card">
                  <div className="role-details__module-header">
                    <h4>{moduleName} Module</h4>
                  </div>

                  <div className="role-details__func-list">
                    {Object.entries(functionalities).map(([funcName, actions]) => (
                      <div key={funcName} className="role-details__func-row">
                        <span className="role-details__func-name">{funcName}</span>
                        <div className="role-details__action-chips">
                          {actions.map((act, idx) => (
                            <span
                              key={idx}
                              className={`role-details__action-chip ${
                                act.scope ? "has-scope" : ""
                              }`}
                            >
                              <span className="role-details__chip-act">{act.action}</span>
                              {act.scope && (
                                <span className="role-details__chip-scope">
                                  {act.scope}
                                </span>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Assigned Employees */}
        <div className="role-details__section">
          <RoleUserManager
            role={role}
            onAssignUser={(user) => onAssignUser?.(role, user)}
            onRemoveUser={(userId) => onRemoveUser?.(role, userId)}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="role-details__footer">
        <button
          type="button"
          className="role-details__button role-details__button--secondary"
          onClick={onClose}
        >
          Close
        </button>

        <button
          type="button"
          className="role-details__button role-details__button--secondary"
          onClick={() => onClone?.(role)}
        >
          Clone Role
        </button>

        <button
          type="button"
          className="role-details__button role-details__button--primary"
          onClick={() => onEdit?.(role)}
        >
          Edit Role
        </button>
      </div>
    </div>
  );
};

export default RoleDetails;
