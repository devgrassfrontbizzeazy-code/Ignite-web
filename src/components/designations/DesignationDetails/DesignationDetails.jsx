import { useMemo } from "react";
import Button from "../../common/Button/Button";
import { formatDate } from "../../../utils/dateUtils";
import roleService from "../../../services/roleService";
import { RBAC_MODULES } from "../../../data/rbacCatalogue";
import "./DesignationDetails.css";

const DesignationDetails = ({ designation, onClose, onEdit }) => {
  if (!designation) {
    return null;
  }

  const isActive = designation.status === "active";

  // Resolve default role for this designation
  const defaultRole = useMemo(() => {
    const directRole =
      designation.defaultRoleObj ||
      (designation.defaultRole ? roleService.getRoleById(designation.defaultRole) : null) ||
      (designation.defaultRoleId ? roleService.getRoleById(designation.defaultRoleId) : null) ||
      (designation.id ? roleService.getDesignationRole(designation.id) : null);

    if (directRole) return directRole;

    if (designation.defaultRoleName) {
      return roleService.getRoleById(designation.defaultRoleName);
    }

    return null;
  }, [designation]);

  // Group role permissions by module -> functionality
  const groupedRolePermissions = useMemo(() => {
    if (!defaultRole?.permissions || !Array.isArray(defaultRole.permissions)) {
      return {};
    }

    const groups = {};
    defaultRole.permissions.forEach((p) => {
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

      if (!groups[modName]) groups[modName] = {};
      if (!groups[modName][funcName]) groups[modName][funcName] = [];

      groups[modName][funcName].push({
        action: actionLabel,
        scope: scope || null,
      });
    });

    return groups;
  }, [defaultRole]);

  return (
    <div className="designation-details">
      {/* Top Identity */}
      <div className="designation-details__top">
        <div className="designation-details__identity">
          <div className="designation-details__icon">💼</div>
          <div>
            <h3 className="designation-details__name">
              {designation.designationName || "—"}
            </h3>
            <p className="designation-details__department">
              {designation.departmentName || "No department"}
            </p>
          </div>
        </div>

        <span
          className={`designation-details__status designation-details__status--${
            isActive ? "active" : "inactive"
          }`}
        >
          <span className="designation-details__status-dot" />
          {isActive ? "Active" : "Inactive"}
        </span>
      </div>

      {/* Designation Information */}
      <div className="designation-details__section">
        <h4>Designation Overview</h4>
        <div className="designation-details__grid">
          <div className="designation-details__item">
            <span className="designation-details__label">Designation Code</span>
            <span className="designation-details__value">
              {designation.designationCode || "—"}
            </span>
          </div>

          <div className="designation-details__item">
            <span className="designation-details__label">Designation Name</span>
            <span className="designation-details__value">
              {designation.designationName || "—"}
            </span>
          </div>

          <div className="designation-details__item">
            <span className="designation-details__label">Department</span>
            <span className="designation-details__value">
              {designation.departmentName || "—"}
            </span>
          </div>

          <div className="designation-details__item">
            <span className="designation-details__label">Default Role</span>
            <span className="designation-details__value" style={{ fontWeight: 600, color: "var(--color-primary)" }}>
              {defaultRole?.roleName || designation.defaultRoleName || "No Default Role"}
            </span>
          </div>

          <div className="designation-details__item">
            <span className="designation-details__label">Status</span>
            <span className="designation-details__value">
              {isActive ? "Active" : "Inactive"}
            </span>
          </div>

          <div className="designation-details__item">
            <span className="designation-details__label">Created At</span>
            <span className="designation-details__value">
              {formatDate(designation.createdAt)}
            </span>
          </div>
        </div>
      </div>

      {/* Default Role Card */}
      <div className="designation-details__section">
        <div className="designation-details__section-header">
          <div>
            <h4>Inherited Default Role</h4>
            <p className="designation-details__section-description">
              Employees assigned to this designation will automatically inherit this role unless explicitly overridden.
            </p>
          </div>
        </div>

        {defaultRole ? (
          <div className="designation-details__profile-card">
            <div className="designation-details__profile-icon">🛡️</div>
            <div className="designation-details__profile-content">
              <span className="designation-details__profile-name">
                {defaultRole.roleName}
              </span>
              <span className="designation-details__profile-description">
                {defaultRole.description || "Reusable RBAC role."}
              </span>
            </div>
          </div>
        ) : (
          <div className="designation-details__permissions-empty">
            <div className="designation-details__empty-icon">ℹ️</div>
            <div>
              <strong>No Default Role Assigned</strong>
              <p>Employees with this designation will have no default elevated permissions.</p>
            </div>
          </div>
        )}
      </div>

      {/* Role Permissions Breakdown */}
      {defaultRole && Object.keys(groupedRolePermissions).length > 0 && (
        <div className="designation-details__section">
          <div className="designation-details__section-header">
            <div>
              <h4>Role Permissions Breakdown</h4>
              <p className="designation-details__section-description">
                Permissions granted to employees through the <strong>{defaultRole.roleName}</strong> role.
              </p>
            </div>
            <span className="designation-details__permission-count">
              {defaultRole.permissionCount ?? defaultRole.permissions?.length ?? 0} actions
            </span>
          </div>

          <div className="designation-details__permission-groups">
            {Object.entries(groupedRolePermissions).map(([modName, funcs]) => (
              <div className="designation-details__permission-group" key={modName}>
                <div className="designation-details__permission-group-header">
                  <span>{modName} Module</span>
                </div>
                <div className="designation-details__permission-list">
                  {Object.entries(funcs).map(([funcName, actions]) => (
                    <div className="designation-details__permission" key={funcName}>
                      <span className="designation-details__permission-check">✓</span>
                      <span className="designation-details__permission-name">{funcName}:</span>
                      {actions.map((act, idx) => (
                        <span key={idx} className="designation-details__permission-scope">
                          {act.action} {act.scope ? `(${act.scope})` : ""}
                        </span>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Description */}
      <div className="designation-details__section">
        <h4>Description</h4>
        <p className="designation-details__description">
          {designation.description || "No description has been added for this designation."}
        </p>
      </div>

      {/* Footer */}
      <div className="designation-details__footer">
        <Button type="button" variant="secondary" onClick={onClose}>
          Close
        </Button>
        <Button
          type="button"
          variant="primary"
          onClick={() => onEdit?.(designation)}
        >
          Edit Designation
        </Button>
      </div>
    </div>
  );
};

export default DesignationDetails;
