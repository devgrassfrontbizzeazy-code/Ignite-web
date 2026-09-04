
import Button from "../../common/Button/Button";

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

  return (
    <div className="designation-details">
      <div className="designation-details__top">
        <div className="designation-details__identity">
          <div className="designation-details__icon">
            💼
          </div>

          <div>
            <h3 className="designation-details__name">
              {designation.designationName || "—"}
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
              Created At
            </span>

            <span className="designation-details__value">
              {designation.createdAt || "—"}
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
        </div>
      </div>

      <div className="designation-details__section">
        <h4>Description</h4>

        <p className="designation-details__description">
          {designation.description ||
            "No description has been added for this designation."}
        </p>
      </div>

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

