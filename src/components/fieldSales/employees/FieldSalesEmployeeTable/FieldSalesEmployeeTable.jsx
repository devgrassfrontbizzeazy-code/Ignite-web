import RowActions from "../../../common/RowActions/RowActions";
import EmptyState from "../../../common/EmptyState/EmptyState";
import IgniteLoader from "../../../common/IgniteLoader/IgniteLoader";
import "./FieldSalesEmployeeTable.css";

const formatEmployeeName = (emp) => {
  if (!emp) return "Employee";
  const parts = [emp.first_name, emp.middle_name, emp.last_name].filter(Boolean);
  if (parts.length > 0) return parts.join(" ");
  return emp.full_name || emp.name || "Employee";
};

const getInitials = (name) => {
  if (!name) return "E";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
};

export default function FieldSalesEmployeeTable({
  employees = [],
  loading = false,
  onView,
  onEdit,
  onToggleStatus,
  onDelete,
  onResendInvite,
}) {
  if (loading) {
    return (
      <div className="fs-employee-table__loading">
        <IgniteLoader message="Loading Field Sales employees..." />
      </div>
    );
  }

  if (!employees || employees.length === 0) {
    return (
      <EmptyState
        title="No Field Sales Employees Found"
        description="No employees match your filter criteria or none have been added yet."
      />
    );
  }

  return (
    <div className="fs-employee-table-wrapper">
      <table className="fs-employee-table">
        <thead>
          <tr>
            <th>Employee</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Role</th>
            <th>Joining Date</th>
            <th>Reporting Manager</th>
            <th>Status</th>
            <th className="fs-employee-table__actions-header">Actions</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((emp) => {
            const name = formatEmployeeName(emp);
            const roleName = emp.field_sales_role || emp.role || emp.designation_name || "Sales Person";
            const managerName = emp.reporting_manager_name || (typeof emp.reporting_manager === "object" ? emp.reporting_manager?.full_name || emp.reporting_manager?.name : null) || emp.reporting_manager || "—";
            const isPendingInvite = emp.invitation_status === "PENDING";
            const isActive = emp.employment_status === "Active" || emp.is_active === true;
            const statusLabel = isPendingInvite ? "Pending" : isActive ? "Active" : "Inactive";
            const statusClass = isPendingInvite
              ? "fs-employee-table__status-badge--pending"
              : isActive
              ? "fs-employee-table__status-badge--active"
              : "fs-employee-table__status-badge--inactive";
            const joiningDate = emp.date_of_joining || emp.dateOfJoining || "—";

            const rowActions = [
              ...(onView ? [{ key: "view", label: "View Details", onClick: () => onView(emp) }] : []),
              ...(onEdit ? [{ key: "edit", label: "Edit Employee", onClick: () => onEdit(emp) }] : []),
              ...(isPendingInvite && onResendInvite
                ? [
                    {
                      key: "resend",
                      label: "Resend Invitation",
                      onClick: () => onResendInvite(emp),
                    },
                  ]
                : []),
              ...(onToggleStatus
                ? [
                    {
                      key: "toggle",
                      label: isActive ? "Deactivate" : "Activate",
                      onClick: () => onToggleStatus(emp),
                    },
                  ]
                : []),
              ...(onDelete
                ? [
                    { isDivider: true },
                    {
                      key: "delete",
                      label: "Delete Employee",
                      variant: "danger",
                      onClick: () => onDelete(emp),
                    },
                  ]
                : []),
            ];

            return (
              <tr key={emp.id || emp.email}>
                <td className="fs-employee-table__user-cell">
                  <div className="fs-employee-table__avatar">
                    {emp.profile_photo_url ? (
                      <img src={emp.profile_photo_url} alt={name} />
                    ) : (
                      <span>{getInitials(name)}</span>
                    )}
                  </div>
                  <div className="fs-employee-table__user-info">
                    <strong className="fs-employee-table__user-name">{name}</strong>
                    {emp.employee_code && (
                      <span className="fs-employee-table__user-code">{emp.employee_code}</span>
                    )}
                  </div>
                </td>
                <td>{emp.email || "—"}</td>
                <td>{emp.phone || "—"}</td>
                <td>
                  <span
                    className={`fs-employee-table__role-badge ${
                      roleName === "Manager"
                        ? "fs-employee-table__role-badge--manager"
                        : "fs-employee-table__role-badge--sales"
                    }`}
                  >
                    {roleName}
                  </span>
                </td>
                <td>{joiningDate}</td>
                <td>{managerName}</td>
                <td>
                  <span className={`fs-employee-table__status-badge ${statusClass}`}>
                    {statusLabel}
                  </span>
                </td>
                <td className="fs-employee-table__actions-cell">
                  <RowActions actions={rowActions} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
