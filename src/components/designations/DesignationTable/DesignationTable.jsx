import DesignationRowActions from "../DesignationRowActions/DesignationRowActions";
import { formatDate } from "../../../utils/dateUtils";

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

return ( <div className="designation-table-wrapper"> <table className="designation-table"> <thead> <tr> <th>Designation Code</th> <th>Designation Name</th> <th>Department</th> <th>Access Profile</th> <th>Description</th> <th>Status</th> <th>Created At</th> <th>Actions</th> </tr> </thead>


    <tbody>
      {designations.map((designation) => {
        const isActive =
          designation.status === "active";

        const accessProfileName =
          designation.accessProfileName ||
          designation.accessProfile?.name ||
          "Employee";

        const additionalPermissions =
          designation.additionalPermissions ??
          designation.additional_permissions ??
          [];

        const additionalPermissionCount =
          Array.isArray(additionalPermissions)
            ? additionalPermissions.length
            : 0;

        return (
          <tr
            key={
              designation.id ??
              `designation-${designation.designationName}`
            }
          >
            <td>
              {designation.designationCode || "—"}
            </td>

            <td>
              <div className="designation-table__name">
                <span className="designation-table__name-text">
                  {designation.designationName || "—"}
                </span>
              </div>
            </td>

            <td>
              {designation.departmentName || "—"}
            </td>

            {/* Access Profile */}
            <td>
              <div className="designation-table__access-profile">
                <span className="designation-table__access-profile-name">
                  {accessProfileName}
                </span>

                {additionalPermissionCount > 0 && (
                  <span className="designation-table__access-profile-extra">
                    +{additionalPermissionCount}
                  </span>
                )}
              </div>
            </td>

            <td>
              {designation.description || "—"}
            </td>

            <td>
              <span
                className={`designation-table__status designation-table__status--${
                  isActive
                    ? "active"
                    : "inactive"
                }`}
              >
                <span className="designation-table__status-dot" />

                {isActive
                  ? "Active"
                  : "Inactive"}
              </span>
            </td>

            <td>
              {formatDate(
                designation.createdAt
              )}
            </td>

            <td>
              <DesignationRowActions
                designation={designation}
                onView={onView}
                onEdit={onEdit}
                onDelete={onDelete}
                onToggleStatus={
                  onToggleStatus
                }
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
