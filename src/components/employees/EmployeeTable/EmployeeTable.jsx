import EmployeeRowActions from "../EmployeeRowActions/EmployeeRowActions";

import "./EmployeeTable.css";

const formatName = (employee) =>
  [employee.first_name, employee.middle_name, employee.last_name]
    .filter(Boolean)
    .join(" ");

const formatStatus = (status) => {
  const statusMap = {
    ACTIVE: "Active",
    INACTIVE: "Inactive",
    TERMINATED: "Terminated",
    RESIGNED: "Resigned",
  };

  return statusMap[status] || status;
};

const formatEmploymentType = (type) => {
  const typeMap = {
    FULL_TIME: "Full Time",
    PART_TIME: "Part Time",
    CONTRACT: "Contract",
    INTERN: "Intern",
  };

  return typeMap[type] || type;
};

const formatDate = (date) => {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const EmployeeTable = ({
  employees,
  onView,
  onEdit,
  onToggleStatus,
  onTerminate,
  onResign,
  onDelete,
}) => {
  return (
    <div className="employee-table-card">
      <div className="employee-table-card__header">
        <div>
          <h3>Employee Directory</h3>
          <p>{employees.length} employees found</p>
        </div>
      </div>

      {employees.length === 0 ? (
        <div className="employee-table-empty">
          <div className="employee-table-empty__icon">👥</div>
          <h4>No employees found</h4>
          <p>
            Try changing your search or filters, or add a new employee.
          </p>
        </div>
      ) : (
        <div className="employee-table-wrapper">
          <table className="employee-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Employee Code</th>
                <th>Department</th>
                <th>Designation</th>
                <th>Role</th>
                <th>Manager</th>
                <th>Type</th>
                <th>Status</th>
                <th>Joining Date</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {employees.map((employee) => (
                <tr key={employee.id}>
                  <td>
                    <div className="employee-table__employee">
                      <div className="employee-table__avatar">
                        {employee.first_name?.charAt(0)}
                        {employee.last_name?.charAt(0)}
                      </div>

                      <div>
                        <div className="employee-table__name">
                          {formatName(employee)}
                        </div>

                        <div className="employee-table__email">
                          {employee.email}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td>
                    <span className="employee-code">
                      {employee.employee_code}
                    </span>
                  </td>

                  <td>{employee.department_name || "—"}</td>

                  <td>{employee.designation_name || "—"}</td>

                  <td>
                    <div className="employee-role">
                      {employee.default_role_name || "—"}
                    </div>
                  </td>

                  <td>{employee.reporting_manager_name || "—"}</td>

                  <td>{formatEmploymentType(employee.employment_type)}</td>

                  <td>
                    <span
                      className={`employee-status employee-status--${employee.employment_status.toLowerCase()}`}
                    >
                      {formatStatus(employee.employment_status)}
                    </span>
                  </td>

                  <td>{formatDate(employee.date_of_joining)}</td>

                  <td>
                    <EmployeeRowActions
                      employee={employee}
                      onView={onView}
                      onEdit={onEdit}
                      onToggleStatus={onToggleStatus}
                      onTerminate={onTerminate}
                      onResign={onResign}
                      onDelete={onDelete}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default EmployeeTable;