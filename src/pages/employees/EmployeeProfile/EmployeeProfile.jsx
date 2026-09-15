import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FiEdit2,
  FiSend,
} from "react-icons/fi";

import BackButton from "../../../components/common/BackButton/BackButton";
import Button from "../../../components/common/Button/Button";
import IgniteLoader from "../../../components/common/IgniteLoader/IgniteLoader";
import employeeService from "../../../services/employeeService";

import "./EmployeeProfile.css";

const formatName = (employee) =>
  [
    employee?.first_name,
    employee?.middle_name,
    employee?.last_name,
  ]
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
  <div className="employee-profile__item">
    <span className="employee-profile__label">{label}</span>
    <span className="employee-profile__value">{value || "—"}</span>
  </div>
);

const EmployeeProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadEmployee = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await employeeService.getById(id);

        setEmployee(response);
      } catch (err) {
        console.error("Failed to load employee profile:", err);

        setError(
          err?.response?.data?.message ||
            "Unable to load employee profile."
        );
      } finally {
        setLoading(false);
      }
    };

    loadEmployee();
  }, [id]);

  if (loading) {
    return <IgniteLoader text="Loading employee profile..." />;
  }

  if (error || !employee) {
    return (
      <div className="employee-profile-page">
        <div className="employee-profile__error">
          <h2>Employee Profile</h2>
          <p>{error || "Employee not found."}</p>

          <BackButton
            label="Back to Employees"
            onClick={() => navigate("/employees")}
          />
        </div>
      </div>
    );
  }

  const fullName = formatName(employee);

  const initials =
    `${employee.first_name?.[0] || ""}${
      employee.last_name?.[0] || ""
    }`.toUpperCase() || "EM";

  const isAccepted =
    employee.invitation_status === "ACCEPTED";

  return (
    <div className="employee-profile-page">
      {/* =========================
          PAGE TOP
      ========================= */}

      <div className="employee-profile__topbar">
        <BackButton
          label="Back to Employees"
          onClick={() => navigate("/employees")}
        />

        <Button
          variant="outline"
          onClick={() =>
            navigate(`/employees/${employee.id}/edit`)
          }
        >
          <FiEdit2 />
          Edit Employee
        </Button>
      </div>

      {/* =========================
          PROFILE HEADER
      ========================= */}

      <section className="employee-profile__header">
        <div className="employee-profile__avatar">
          {employee.profile_photo_url ? (
            <img
              src={employee.profile_photo_url}
              alt={fullName}
            />
          ) : (
            initials
          )}
        </div>

        <div className="employee-profile__header-info">
          <div className="employee-profile__name-row">
            <h1>{fullName}</h1>

            <span
              className={`employee-profile__status employee-profile__status--${String(
                employee.employment_status || ""
              ).toLowerCase()}`}
            >
              {formatStatus(employee.employment_status)}
            </span>
          </div>

          <p className="employee-profile__subtitle">
            {employee.employee_code || "—"}
            {" · "}
            {employee.designation_name || "Team Member"}
          </p>

          <p className="employee-profile__organization">
            {employee.department_name || "—"}
            {" · "}
            {employee.designation_name || "—"}
          </p>

          <span
            className={`employee-profile__invitation ${
              isAccepted
                ? "employee-profile__invitation--accepted"
                : "employee-profile__invitation--pending"
            }`}
          >
            {isAccepted
              ? "Account Active"
              : "Invitation Pending"}
          </span>
        </div>
      </section>

      {/* =========================
          PERSONAL INFORMATION
      ========================= */}

      <section className="employee-profile__section">
        <h2>Personal Information</h2>

        <div className="employee-profile__grid">
          <InfoItem
            label="First Name"
            value={employee.first_name}
          />

          <InfoItem
            label="Middle Name"
            value={employee.middle_name}
          />

          <InfoItem
            label="Last Name"
            value={employee.last_name}
          />

          <InfoItem
            label="Gender"
            value={employee.gender}
          />

          <InfoItem
            label="Date of Birth"
            value={formatDate(employee.date_of_birth)}
          />
        </div>
      </section>

      {/* =========================
          CONTACT INFORMATION
      ========================= */}

      <section className="employee-profile__section">
        <h2>Contact Information</h2>

        <div className="employee-profile__grid">
          <InfoItem
            label="Official Email"
            value={employee.email}
          />

          <InfoItem
            label="Phone"
            value={employee.phone}
          />

          <InfoItem
            label="Address"
            value={employee.address}
          />
        </div>
      </section>

      {/* =========================
          EMPLOYMENT INFORMATION
      ========================= */}

      <section className="employee-profile__section">
        <h2>Employment Information</h2>

        <div className="employee-profile__grid">
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

      {/* =========================
          ORGANIZATION
      ========================= */}

      <section className="employee-profile__section">
        <h2>Organization Hierarchy</h2>

        <div className="employee-profile__grid">
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
            value={
              employee.default_role_name || "Member"
            }
          />
        </div>
      </section>

      {/* =========================
          ACCESS SUMMARY
      ========================= */}

      <section className="employee-profile__access">
        <div className="employee-profile__access-header">
          <div>
            <h2>Access Summary</h2>

            <p>
              Employee access is determined by the assigned
              department and designation.
            </p>
          </div>
        </div>

        <div className="employee-profile__access-flow">
          <div>
            <span>Department</span>
            <strong>
              {employee.department_name || "—"}
            </strong>
          </div>

          <span className="employee-profile__arrow">
            →
          </span>

          <div>
            <span>Designation</span>
            <strong>
              {employee.designation_name || "—"}
            </strong>
          </div>

          <span className="employee-profile__arrow">
            →
          </span>

          <div>
            <span>Default Role</span>
            <strong>
              {employee.default_role_name || "Member"}
            </strong>
          </div>
        </div>

        <div className="employee-profile__access-note">
          Permissions and scopes are inherited from the
          employee's assigned designation and organizational
          access configuration.
        </div>
      </section>

      {/* =========================
          EMERGENCY CONTACT
      ========================= */}

      <section className="employee-profile__section">
        <h2>Emergency Contact</h2>

        <div className="employee-profile__grid">
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

      {/* =========================
          INVITATION ACTION
      ========================= */}

      {!isAccepted && (
        <section className="employee-profile__invite">
          <div>
            <h3>Invitation Pending</h3>
            <p>
              This employee has not accepted their invitation
              yet.
            </p>
          </div>

          <Button
            variant="outline"
            onClick={() => {
              // We'll connect the existing resend handler
              // after the page structure is verified.
              console.log("Resend invite:", employee.id);
            }}
          >
            <FiSend />
            Resend Invite
          </Button>
        </section>
      )}
    </div>
  );
};

export default EmployeeProfile;