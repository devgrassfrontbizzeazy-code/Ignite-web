import "./EmployeeRowActions.css";

const EmployeeRowActions = ({
  employee,
  onView,
  onEdit,
  onToggleStatus,
  onTerminate,
  onResign,
  onDelete,
}) => {
  const isActive = employee.employment_status === "ACTIVE";

  return (
    <div className="employee-row-actions">
      <button
        type="button"
        className="employee-row-actions__button"
        onClick={() => onView(employee)}
        title="View employee"
      >
        View
      </button>

      <button
        type="button"
        className="employee-row-actions__button"
        onClick={() => onEdit(employee)}
        title="Edit employee"
      >
        Edit
      </button>

      <button
        type="button"
        className="employee-row-actions__button"
        onClick={() => onToggleStatus(employee)}
        title={isActive ? "Deactivate employee" : "Activate employee"}
      >
        {isActive ? "Deactivate" : "Activate"}
      </button>

      {isActive && (
        <>
          <button
            type="button"
            className="employee-row-actions__button employee-row-actions__button--danger"
            onClick={() => onTerminate(employee)}
          >
            Terminate
          </button>

          <button
            type="button"
            className="employee-row-actions__button"
            onClick={() => onResign(employee)}
          >
            Resign
          </button>
        </>
      )}

      <button
        type="button"
        className="employee-row-actions__button employee-row-actions__button--danger"
        onClick={() => onDelete(employee)}
      >
        Delete
      </button>
    </div>
  );
};

export default EmployeeRowActions;