import Modal from "../../common/Modal/Modal";
import Button from "../../common/Button/Button";
import { FiSend } from "react-icons/fi";
import "./EmployeeDetails.css";

const formatName = (employee) =>
  [employee?.first_name, employee?.middle_name, employee?.last_name]
    .filter(Boolean)
    .join(" ") || employee?.full_name || "—";

const formatDate = (date) => {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatStatus = (status) => {
  const map = {
    ACTIVE: "Active",
    INACTIVE: "Inactive",
    TERMINATED: "Terminated",
    RESIGNED: "Resigned",
  };

  return map[status] || status || "—";
};

const formatType = (type) => {
  const map = {
    FULL_TIME: "Full Time",
    PART_TIME: "Part Time",
    CONTRACT: "Contract",
    INTERN: "Intern",
  };

  return map[type] || type || "—";
};

const InfoItem = ({ label, value }) => (
  <div className="employee-details__item">
    <span className="employee-details__label">{label}</span>
    <span className="employee-details__value">{value || "—"}</span>
  </div>
);

const EmployeeDetails = ({ open, employee, onClose, onResendInvite }) => {
  if (!employee) return null;

  const fullName = formatName(employee);
  const initials =
    `${employee.first_name?.[0] || ""}${employee.last_name?.[0] || ""}`.toUpperCase() ||
    "EM";
  const isAccepted = employee.invitation_status === "ACCEPTED";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Employee Details"
      description="View employee personal info, organization details and access hierarchy."
      size="large"
      footer={
        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", width: "100%" }}>
          {!isAccepted && onResendInvite && (
            <Button
              variant="outline"
              onClick={() => {
                onResendInvite(employee);
              }}
            >
              <FiSend /> Resend Invite Email
            </Button>
          )}
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      }
    >
      <div className="employee-details">
        <div className="employee-details__header">
          <div
            className="employee-details__avatar"
            style={{
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {employee.profile_photo_url ? (
              <img
                src={employee.profile_photo_url}
                alt={fullName}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              initials
            )}
          </div>

          <div className="employee-details__header-info">
            <h2>{fullName}</h2>

            <p>
              {employee.employee_code} · {employee.designation_name || "Team Member"}
            </p>

            <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
              <span
                className={`employee-details__status employee-details__status--${String(
                  employee.employment_status || ""
                ).toLowerCase()}`}
              >
                {formatStatus(employee.employment_status)}
              </span>

              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "2px 10px",
                  borderRadius: "12px",
                  fontSize: "12px",
                  fontWeight: "600",
                  backgroundColor: isAccepted ? "#ecfdf5" : "#fef3c7",
                  color: isAccepted ? "#065f46" : "#92400e",
                }}
              >
                {isAccepted ? "Account Active" : "Invitation Pending"}
              </span>
            </div>
          </div>
        </div>

        <section className="employee-details__section">
          <h3>Personal Information</h3>

          <div className="employee-details__grid">
            <InfoItem label="First Name" value={employee.first_name} />
            <InfoItem label="Middle Name" value={employee.middle_name} />
            <InfoItem label="Last Name" value={employee.last_name} />
            <InfoItem label="Gender" value={employee.gender} />
            <InfoItem
              label="Date of Birth"
              value={formatDate(employee.date_of_birth)}
            />
          </div>
        </section>

        <section className="employee-details__section">
          <h3>Contact Information</h3>

          <div className="employee-details__grid">
            <InfoItem label="Official Email" value={employee.email} />
            <InfoItem label="Phone" value={employee.phone} />
            <InfoItem label="Address" value={employee.address} />
          </div>
        </section>

        <section className="employee-details__section">
          <h3>Employment Information</h3>

          <div className="employee-details__grid">
            <InfoItem
              label="Date of Joining"
              value={formatDate(employee.date_of_joining)}
            />

            <InfoItem
              label="Employment Type"
              value={formatType(employee.employment_type)}
            />

            <InfoItem
              label="Employment Status"
              value={formatStatus(employee.employment_status)}
            />

            <InfoItem
              label="Date of Exit"
              value={formatDate(employee.date_of_exit)}
            />

            <InfoItem
              label="Work Location"
              value={employee.work_location}
            />
          </div>
        </section>

        <section className="employee-details__section">
          <h3>Organization Hierarchy</h3>

          <div className="employee-details__grid">
            <InfoItem
              label="Department"
              value={employee.department_name}
            />

            <InfoItem
              label="Designation"
              value={employee.designation_name}
            />

            <InfoItem
              label="Reporting Manager"
              value={employee.reporting_manager_name}
            />

            <InfoItem
              label="Default Role"
              value={employee.default_role_name || "Member"}
            />
          </div>
        </section>

        <section className="employee-details__access">
          <div className="employee-details__access-header">
            <div>
              <h3>Access Summary</h3>
              <p>
                Employee access is inherited through the assigned designation
                and its default role.
              </p>
            </div>
          </div>

          <div className="employee-details__access-flow">
            <div>
              <span>Department</span>
              <strong>{employee.department_name || "—"}</strong>
            </div>

            <span className="employee-details__arrow">→</span>

            <div>
              <span>Designation</span>
              <strong>{employee.designation_name || "—"}</strong>
            </div>

            <span className="employee-details__arrow">→</span>

            <div>
              <span>Default Role</span>
              <strong>{employee.default_role_name || "Member"}</strong>
            </div>
          </div>

          <div className="employee-details__access-note">
            Permissions and scopes are managed by the role. The employee does
            not require separate manual role configuration.
          </div>
        </section>

        <section className="employee-details__section">
          <h3>Emergency Contact</h3>

          <div className="employee-details__grid">
            <InfoItem
              label="Contact Name"
              value={employee.emergency_contact_name}
            />

            <InfoItem
              label="Contact Phone"
              value={employee.emergency_contact_phone}
            />
          </div>
        </section>
      </div>
    </Modal>
  );
};

export default EmployeeDetails;