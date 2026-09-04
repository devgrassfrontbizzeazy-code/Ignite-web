
import DepartmentRowActions from "../DepartmentRowActions/DepartmentRowActions";

import "./DepartmentTable.css";

const DepartmentTable = ({
  departments = [],
  onView,
  onEdit,
  onDelete,
  onToggleStatus,
}) => {
  if (!departments.length) {
    return null;
  }

  return (
    <div className="department-table-wrapper">
      <table className="department-table">
        <thead>
          <tr>
            <th>Department Code</th>
            <th>Department Name</th>
            <th>Status</th>
            <th>Created At</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {departments.map((department) => {
            const isActive =
              department.status === "active";

            return (
              <tr key={department.id}>
                <td>
                  {department.departmentCode || "—"}
                </td>

                <td>
                  <div className="department-table__name">
                    <span className="department-table__name-text">
                      {department.departmentName || "—"}
                    </span>
                  </div>
                </td>

                <td>
                  <span
                    className={`department-table__status department-table__status--${
                      isActive
                        ? "active"
                        : "inactive"
                    }`}
                  >
                    <span className="department-table__status-dot" />

                    {isActive
                      ? "Active"
                      : "Inactive"}
                  </span>
                </td>

                <td>
                  {department.createdAt || "—"}
                </td>

                <td>
                  <DepartmentRowActions
                    department={department}
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

export default DepartmentTable;

