import DesignationRowActions from "../DesignationRowActions/DesignationRowActions";
import { formatDate } from "../../../utils/dateUtils";
import roleService from "../../../services/roleService";
import "./DesignationTable.css";

const DesignationTable = ({
  designations = [],
  onView,
  onEdit,
  onDelete,
  onToggleStatus,
}) => {
  if (!designations.length) {
    return null;
  }

  return (
    <div className="designation-table-wrapper">
      <table className="designation-table">
        <thead>
          <tr>
            <th>Designation Code</th>
            <th>Designation Name</th>
            <th>Department</th>
            <th>Default Role</th>
            <th>Description</th>
            <th>Status</th>
            <th>Created At</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {designations.map((designation) => {
            const isActive = designation.status === "active";

            // Resolve role name
            const role =
              designation.defaultRoleObj ||
              (designation.id ? roleService.getDesignationRole(designation.id) : null) ||
              (designation.defaultRole ? roleService.getRoleById(designation.defaultRole) : null);

            const roleName =
              role?.roleName ||
              designation.defaultRoleName ||
              "—";

            return (
              <tr
                key={
                  designation.id ?? `designation-${designation.designationName}`
                }
              >
                <td>{designation.designationCode || "—"}</td>

                <td>
                  <div className="designation-table__name">
                    <span className="designation-table__name-text">
                      {designation.designationName || "—"}
                    </span>
                  </div>
                </td>

                <td>{designation.departmentName || "—"}</td>

                {/* Default Role */}
                <td>
                  <div className="designation-table__access-profile">
                    <span
                      className="designation-table__access-profile-name"
                      style={{
                        fontWeight: role ? 600 : 400,
                        color: role ? "var(--color-primary)" : "var(--color-text-secondary)",
                      }}
                    >
                      {roleName}
                    </span>
                    {role && (
                      <span className="designation-table__access-profile-extra">
                        {role.permissionCount ?? role.permissions?.length ?? 0} perms
                      </span>
                    )}
                  </div>
                </td>

                <td
                  className="designation-table__description"
                  title={designation.description || ""}
                >
                  {designation.description || "—"}
                </td>

                <td>
                  <span
                    className={`designation-table__status designation-table__status--${
                      isActive ? "active" : "inactive"
                    }`}
                  >
                    <span className="designation-table__status-dot" />
                    {isActive ? "Active" : "Inactive"}
                  </span>
                </td>

                <td>{formatDate(designation.createdAt)}</td>

                <td>
                  <DesignationRowActions
                    designation={designation}
                    onView={onView}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onToggleStatus={onToggleStatus}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default DesignationTable;
