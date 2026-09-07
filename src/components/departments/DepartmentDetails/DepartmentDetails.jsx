import "./DepartmentDetails.css";
import { formatDate } from "../../../utils/dateUtils";

const DepartmentDetails = ({ department, onClose, onEdit }) => {
  if (!department) {
    return null;
  }

  const isActive = department.status === "active";

  return (
    <div className="department-details">
      <div className="department-details__header">
        <div className="department-details__identity">
          <div className="department-details__icon">
            {department.departmentName?.charAt(0)?.toUpperCase() || "D"}
          </div>

          <div>
            <h2>{department.departmentName || "Department"}</h2>

            <span
              className={`department-details__status department-details__status--${
                isActive ? "active" : "inactive"
              }`}
            >
              <span className="department-details__status-dot" />

              {isActive ? "Active" : "Inactive"}
            </span>
          </div>
        </div>
      </div>

      <div className="department-details__body">
        <div className="department-details__section">
          <h3>Department Information</h3>

          <div className="department-details__grid">
            <div className="department-details__item">
              <span className="department-details__label">Department Code</span>

              <span className="department-details__value">
                {department.departmentCode || "—"}
              </span>
            </div>
            <div className="department-details__field">
              <span>Department Name</span>

              <strong>{department.departmentName || "—"}</strong>
            </div>

            <div className="department-details__field">
              <span>Status</span>

              <strong>{isActive ? "Active" : "Inactive"}</strong>
            </div>

            <div className="department-details__field">
              <span>Created At</span>

              <strong>{formatDate(department.createdAt)}</strong>
            </div>

            <div className="department-details__field">
              <span>Last Updated</span>

              <strong>{formatDate(department.updatedAt)}</strong>
            </div>
          </div>
        </div>

        <div className="department-details__section">
          <h3>Description</h3>

          <p className="department-details__description">
            {department.description || "No description added."}
          </p>
        </div>
      </div>

      <div className="department-details__footer">
        <button
          type="button"
          className="department-details__button department-details__button--secondary"
          onClick={onClose}
        >
          Close
        </button>

        <button
          type="button"
          className="department-details__button department-details__button--primary"
          onClick={() => onEdit?.(department)}
        >
          Edit Department
        </button>
      </div>
    </div>
  );
};

export default DepartmentDetails;
