import RoleUserManager from "../RoleUserManager/RoleUserManager";

import { formatDate } from "../../../utils/dateUtils";

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

  return (
    <div className="role-details">
      {/* Header */}
      <div className="role-details__header">
        <div className="role-details__identity">
          <div>
            <h2>{role.roleName}</h2>

            <span
              className={`role-details__status role-details__status--${
                isActive ? "active" : "inactive"
              }`}
            >
              <span className="role-details__status-dot" />

              {isActive ? "Active" : "Inactive"}
            </span>
          </div>
        </div>
      </div>

      <div className="role-details__body">
        {/* Role Information */}
        <div className="role-details__section">
          <h3>Role Information</h3>

          <div className="role-details__grid">
            <div className="role-details__field">
              <span>Role Name</span>

              <strong>{role.roleName || "—"}</strong>
            </div>

            <div className="role-details__field">
              <span>Role Code</span>

              <strong>{role.roleCode || "—"}</strong>
            </div>

            <div className="role-details__field">
              <span>Status</span>

              <strong>{isActive ? "Active" : "Inactive"}</strong>
            </div>

            <div className="role-details__field">
              <span>Employees</span>

              <strong>{role.employeeCount ?? 0}</strong>
            </div>

            <div className="role-details__field">
              <span>Permissions</span>

              <strong>{role.permissionCount ?? 0}</strong>
            </div>

            <div className="role-details__field">
              <span>Created At</span>

              <strong>{formatDate(role.createdAt)}</strong>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="role-details__section">
          <h3>Description</h3>

          <p className="role-details__description">
            {role.description || "No description added."}
          </p>
        </div>

        {/* Permissions */}
        <div className="role-details__section">
          <h3>Permissions</h3>

          <div className="role-details__permissions">
            {role.permissions?.length ? (
              role.permissions.map((permission) => (
                <span
                  key={permission.code}
                  className="role-details__permission"
                >
                  {permission.name}
                </span>
              ))
            ) : (
              <p>No permissions assigned.</p>
            )}
          </div>
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
