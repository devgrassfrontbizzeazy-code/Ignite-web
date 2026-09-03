
import DepartmentRowActions from "../DepartmentRowActions/DepartmentRowActions";

import "./DepartmentTable.css";

const DepartmentTable = ({
  departments = [],
  onView,
  onEdit,
  onDelete,
}) => {
  if (!departments.length) {
    return null;
  }

  return (
    <div className="department-table-wrapper">
      <table className="department-table">
        <thead>
          <tr>
            <th>Department Name</th>
            <th>Head</th>
            <th>Employees</th>
            <th>Status</th>
            <th>Created At</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {departments.map((department) => (
            <tr key={department.id}>
              <td>
                <div className="department-table__name">
                  <span className="department-table__name-text">
                    {department.name}
                  </span>
                </div>
              </td>

              <td>{department.head || "—"}</td>

              <td>{department.employeeCount ?? 0}</td>

              <td>
                <span
                  className={`department-table__status department-table__status--${
                    department.status === "active"
                      ? "active"
                      : "inactive"
                  }`}
                >
                  <span className="department-table__status-dot" />

                  {department.status === "active"
                    ? "Active"
                    : "Inactive"}
                </span>
              </td>

              <td>{department.createdAt || "—"}</td>

              <td>
                <DepartmentRowActions
                  department={department}
                  onView={onView}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DepartmentTable;

