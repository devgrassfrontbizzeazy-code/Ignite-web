import "./DepartmentDetails.css";
const DepartmentDetails = ({ department, onClose, onEdit }) => {
  if (!department) {
    return null;
  }
  return (
    <div className="department-details">
      {" "}
      <div className="department-details__header">
        {" "}
        <div className="department-details__identity">
          {" "}
          <div className="department-details__icon">
            {" "}
            {department.name?.charAt(0)?.toUpperCase() || "D"}{" "}
          </div>{" "}
          <div>
            {" "}
            <h2>{department.name}</h2>{" "}
            <span
              className={`department-details__status department-details__status--${department.status === "active" ? "active" : "inactive"}`}
            >
              {" "}
              <span className="department-details__status-dot" />{" "}
              {department.status === "active" ? "Active" : "Inactive"}{" "}
            </span>{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
      <div className="department-details__body">
        {" "}
        <div className="department-details__stats">
          {" "}
          <div className="department-details__stat">
            {" "}
            <span className="department-details__stat-label">
              {" "}
              Employees{" "}
            </span>{" "}
            <strong className="department-details__stat-value">
              {" "}
              {department.employeeCount ?? 0}{" "}
            </strong>{" "}
          </div>{" "}
          <div className="department-details__stat">
            {" "}
            <span className="department-details__stat-label">
              {" "}
              Created At{" "}
            </span>{" "}
            <strong className="department-details__stat-value">
              {" "}
              {department.createdAt || "—"}{" "}
            </strong>{" "}
          </div>{" "}
        </div>{" "}
        <div className="department-details__section">
          {" "}
          <h3>Department Information</h3>{" "}
          <div className="department-details__grid">
            {" "}
            <div className="department-details__field">
              {" "}
              <span>Department Name</span>{" "}
              <strong>{department.name || "—"}</strong>{" "}
            </div>{" "}
            <div className="department-details__field">
              {" "}
              <span>Department Head</span>{" "}
              <strong>{department.head || "Not assigned"}</strong>{" "}
            </div>{" "}
            <div className="department-details__field">
              {" "}
              <span>Status</span>{" "}
              <strong>
                {" "}
                {department.status === "active" ? "Active" : "Inactive"}{" "}
              </strong>{" "}
            </div>{" "}
            <div className="department-details__field">
              {" "}
              <span>Employees</span>{" "}
              <strong>{department.employeeCount ?? 0}</strong>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
        <div className="department-details__section">
          {" "}
          <h3>Description</h3>{" "}
          <p className="department-details__description">
            {" "}
            {department.description || "No description added."}{" "}
          </p>{" "}
        </div>{" "}
      </div>{" "}
      <div className="department-details__footer">
        {" "}
        <button
          type="button"
          className="department-details__button department-details__button--secondary"
          onClick={onClose}
        >
          {" "}
          Close{" "}
        </button>{" "}
        <button
          type="button"
          className="department-details__button department-details__button--primary"
          onClick={() => onEdit?.(department)}
        >
          {" "}
          Edit Department{" "}
        </button>{" "}
      </div>{" "}
    </div>
  );
};
export default DepartmentDetails;
