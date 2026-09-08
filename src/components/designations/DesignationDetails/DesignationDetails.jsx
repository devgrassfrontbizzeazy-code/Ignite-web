import Button from "../../common/Button/Button";
import { formatDate } from "../../../utils/dateUtils";

import "./DesignationDetails.css";

const DesignationDetails = ({
  designation,
  onClose,
  onEdit,
}) => {
  if (!designation) {
    return null;
  }

  const isActive =
    designation.status === "active";

  const permissions =
    Array.isArray(designation.permissionsDetail)
      ? designation.permissionsDetail
      : Array.isArray(designation.permissions_detail)
        ? designation.permissions_detail
        : [];

  const defaultRoleName =
    designation.defaultRoleName ||
    designation.default_role_name ||
    designation.defaultRole?.name ||
    "No role assigned";

  // Group permissions by module
  const permissionsByModule = permissions.reduce(
    (groups, permission) => {
      const moduleName =
        permission.module || "Other";

      if (!groups[moduleName]) {
        groups[moduleName] = [];
      }

      groups[moduleName].push(permission);

      return groups;
    },
    {},
  );

  return (
    <div className="designation-details">
      <div className="designation-details__top">
        <div className="designation-details__identity">
          <div className="designation-details__icon">
            💼
          </div>

          <div>
            <h3 className="designation-details__name">
              {designation.designationName ||
                "—"}
            </h3>

            <p className="designation-details__department">
              {designation.departmentName ||
                "No department"}
            </p>
          </div>
        </div>

        <span
          className={`designation-details__status designation-details__status--${
            isActive
              ? "active"
              : "inactive"
          }`}
        >
          <span className="designation-details__status-dot" />

          {isActive
            ? "Active"
            : "Inactive"}
        </span>
      </div>

      {/* Designation Information */}
      <div className="designation-details__section">
        <h4>Designation Information</h4>

        <div className="designation-details__grid">
          <div className="designation-details__item">
            <span className="designation-details__label">
              Designation Code
            </span>

            <span className="designation-details__value">
              {designation.designationCode ||
                "—"}
            </span>
          </div>

          <div className="designation-details__item">
            <span className="designation-details__label">
              Designation Name
            </span>

            <span className="designation-details__value">
              {designation.designationName ||
                "—"}
            </span>
          </div>

          <div className="designation-details__item">
            <span className="designation-details__label">
              Department
            </span>

            <span className="designation-details__value">
              {designation.departmentName ||
                "—"}
            </span>
          </div>

          <div className="designation-details__item">
            <span className="designation-details__label">
              Default Role
            </span>

            <span className="designation-details__value">
              {defaultRoleName}
            </span>
          </div>

          <div className="designation-details__item">
            <span className="designation-details__label">
              Status
            </span>

            <span className="designation-details__value">
              {isActive
                ? "Active"
                : "Inactive"}
            </span>
          </div>

          <div className="designation-details__item">
            <span className="designation-details__label">
              Created At
            </span>

            <span className="designation-details__value">
              {formatDate(
                designation.createdAt
              )}
            </span>
          </div>

          <div className="designation-details__item">
            <span className="designation-details__label">
              Last Updated
            </span>

            <span className="designation-details__value">
              {formatDate(
                designation.updatedAt
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="designation-details__section">
        <h4>Description</h4>

        <p className="designation-details__description">
          {designation.description ||
            "No description has been added for this designation."}
        </p>
      </div>

      {/* Permissions */}
      <div className="designation-details__section">
        <div className="designation-details__section-header">
          <h4>Permissions</h4>

          <span className="designation-details__permission-count">
            {permissions.length} permission
            {permissions.length === 1
              ? ""
              : "s"}
          </span>
        </div>

        {permissions.length === 0 ? (
          <div className="designation-details__permissions-empty">
            No permissions have been assigned
            to this designation.
          </div>
        ) : (
          <div className="designation-details__permission-groups">
            {Object.entries(
              permissionsByModule,
            ).map(
              ([moduleName, modulePermissions]) => (
                <div
                  className="designation-details__permission-group"
                  key={moduleName}
                >
                  <div className="designation-details__permission-group-header">
                    {moduleName}
                  </div>

                  <div className="designation-details__permission-list">
                    {modulePermissions.map(
                      (permission) => (
                        <div
                          className="designation-details__permission"
                          key={permission.id}
                        >
                          <span className="designation-details__permission-check">
                            ✓
                          </span>

                          <div className="designation-details__permission-content">
                            <span className="designation-details__permission-name">
                              {permission.name ||
                                permission.codename ||
                                "Unnamed Permission"}
                            </span>

                            {permission.action && (
                              <span className="designation-details__permission-action">
                                {permission.action}
                              </span>
                            )}
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              ),
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="designation-details__footer">
        <Button
          type="button"
          variant="secondary"
          onClick={onClose}
        >
          Close
        </Button>

        <Button
          type="button"
          variant="primary"
          onClick={() =>
            onEdit?.(designation)
          }
        >
          Edit Designation
        </Button>
      </div>
    </div>
  );
};

export default DesignationDetails;