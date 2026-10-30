import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FiEdit2,
  FiSend,
  FiNavigation,
  FiExternalLink,
  FiMapPin,
  FiClock,
  FiActivity,
} from "react-icons/fi";

import BackButton from "../../../components/common/BackButton/BackButton";
import Button from "../../../components/common/Button/Button";
import IgniteLoader from "../../../components/common/IgniteLoader/IgniteLoader";
import employeeService from "../../../services/employeeService";
import roleService from "../../../services/roleService";
import { canUpdateEmployees } from "../../../utils/permissionUtils";
import { getTeamLiveLocations } from "../../../services/api/fieldSalesAPI";
import attendanceAPI from "../../../services/api/attendanceAPI";

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

  const [fieldTracking, setFieldTracking] = useState(null);
  const [attendanceRecord, setAttendanceRecord] = useState(null);
  const [trackingLoading, setTrackingLoading] = useState(false);

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

  // Load Workday Attendance & Field GPS Telemetry
  useEffect(() => {
    if (!employee) return;
    let isMounted = true;

    const loadTrackingTelemetry = async () => {
      try {
        setTrackingLoading(true);
        const todayStr = new Date().toISOString().split("T")[0];
        const [liveRes, attRes] = await Promise.allSettled([
          getTeamLiveLocations(),
          attendanceAPI.getCompanyAttendance({ date: todayStr }),
        ]);

        if (!isMounted) return;

        if (liveRes.status === "fulfilled") {
          const list = Array.isArray(liveRes.value?.data)
            ? liveRes.value.data
            : Array.isArray(liveRes.value)
            ? liveRes.value
            : [];
          const found = list.find((item) => {
            const itemEmpId = String(item.employee_id || item.employeeId || item.id || "");
            const itemCode = String(item.employee_code || "").toLowerCase();
            const itemEmail = String(item.email || "").toLowerCase();
            const empId = String(employee.id || "");
            const empCode = String(employee.employee_code || "").toLowerCase();
            const empEmail = String(employee.email || "").toLowerCase();
            return (
              itemEmpId === empId ||
              (itemCode && itemCode === empCode) ||
              (itemEmail && itemEmail === empEmail)
            );
          });
          if (found) setFieldTracking(found);
        }

        if (attRes.status === "fulfilled") {
          const attList = Array.isArray(attRes.value?.data)
            ? attRes.value.data
            : Array.isArray(attRes.value?.results)
            ? attRes.value.results
            : Array.isArray(attRes.value)
            ? attRes.value
            : [];
          const foundAtt = attList.find((att) => {
            const attEmpId = String(att.employeeId || att.employee_id || att.employee?.id || "");
            const attCode = String(att.employee?.employee_code || "").toLowerCase();
            const attEmail = String(att.employee?.email || "").toLowerCase();
            const empId = String(employee.id || "");
            const empCode = String(employee.employee_code || "").toLowerCase();
            const empEmail = String(employee.email || "").toLowerCase();
            return (
              attEmpId === empId ||
              (attCode && attCode === empCode) ||
              (attEmail && attEmail === empEmail)
            );
          });
          if (foundAtt) setAttendanceRecord(foundAtt);
        }
      } catch (err) {
        console.warn("Failed to load tracking/attendance info for employee profile:", err);
      } finally {
        if (isMounted) setTrackingLoading(false);
      }
    };

    loadTrackingTelemetry();
    return () => {
      isMounted = false;
    };
  }, [employee]);

  // RBAC Role Resolution
  const desigRole = useMemo(() => {
    if (!employee) return null;
    const desigId =
      employee.designation_id ??
      (typeof employee.designation === "object"
        ? employee.designation?.id
        : employee.designation);
    return desigId ? roleService.getDesignationRole(desigId) : null;
  }, [employee]);

  const overrideRole = useMemo(() => {
    if (!employee) return null;
    return (
      (employee.id ? roleService.getEmployeeOverrideRole(employee.id) : null) ||
      (employee.override_role ? roleService.getRoleById(employee.override_role) : null)
    );
  }, [employee]);

  const effectiveRole = useMemo(() => {
    if (!employee) return null;
    return roleService.getEffectiveRole(employee);
  }, [employee]);

  const attendanceStatus = useMemo(() => {
    if (fieldTracking?.attendance_status) return fieldTracking.attendance_status;
    const attStatus = attendanceRecord?.status;
    if (attStatus === "WORKING" || attStatus === "ON_BREAK") return "CHECKED_IN";
    if (attStatus === "COMPLETED" || attendanceRecord?.checkOut || attendanceRecord?.check_out_time) return "CHECKED_OUT";
    return "NOT_CHECKED_IN";
  }, [fieldTracking, attendanceRecord]);

  const gpsStatusInfo = useMemo(() => {
    if (fieldTracking?.is_live) {
      return { type: "live", label: "🟢 Live GPS" };
    }
    if (fieldTracking?.is_stale) {
      return { type: "stale", label: "⚠️ Stale GPS (> 2m ago)" };
    }
    if (fieldTracking?.latitude && fieldTracking?.longitude) {
      return { type: "cached", label: "Last Known GPS" };
    }
    return { type: "none", label: "Location Unavailable" };
  }, [fieldTracking]);

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

        {canUpdateEmployees(null, employee) && (
          <Button
            variant="outline"
            onClick={() =>
              navigate(`/employees/${employee.id}/edit`)
            }
          >
            <FiEdit2 />
            Edit Employee
          </Button>
        )}
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
            {employee.employee_code || employee.employeeCode || "—"}
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
          WORKDAY ATTENDANCE & FIELD TRACKING
      ========================= */}
      <section className="employee-profile__section employee-profile__tracking-section">
        <div className="employee-profile__tracking-header">
          <h2>Workday Attendance & Field Tracking</h2>
          <Button
            variant="outline"
            className="employee-profile__map-btn"
            onClick={() => navigate(`/field-sales/visits?tab=map&repId=${employee.id}`)}
          >
            <FiNavigation style={{ marginRight: 6 }} />
            View Route on Command Map
          </Button>
        </div>

        <div className="employee-profile__tracking-banner">
          <div className="employee-profile__tracking-stat">
            <span className="employee-profile__stat-label">Authoritative Attendance</span>
            <div className="employee-profile__stat-value-row">
              <span className={`employee-profile__attendance-badge employee-profile__attendance-badge--${attendanceStatus.toLowerCase()}`}>
                {attendanceStatus === "CHECKED_IN"
                  ? "Checked In"
                  : attendanceStatus === "CHECKED_OUT"
                  ? "Checked Out"
                  : "Not Checked In"}
              </span>
            </div>
          </div>

          <div className="employee-profile__tracking-stat">
            <span className="employee-profile__stat-label">Live Telemetry</span>
            <div className="employee-profile__stat-value-row">
              <span className={`employee-profile__gps-badge employee-profile__gps-badge--${gpsStatusInfo.type}`}>
                {gpsStatusInfo.label}
              </span>
            </div>
          </div>

          <div className="employee-profile__tracking-stat">
            <span className="employee-profile__stat-label">Today's Distance Travelled</span>
            <strong className="employee-profile__stat-km">
              {fieldTracking?.today_distance_km ?? 0} km
            </strong>
          </div>
        </div>

        <div className="employee-profile__grid">
          <div className="employee-profile__item">
            <span className="employee-profile__label">Check-in Time</span>
            <span className="employee-profile__value">
              {fieldTracking?.check_in_time_formatted || attendanceRecord?.checkIn || "Not recorded"}
            </span>
          </div>

          <div className="employee-profile__item">
            <span className="employee-profile__label">Check-in Location</span>
            <span className="employee-profile__value">
              {fieldTracking?.check_in_address || attendanceRecord?.checkInAddress || "—"}
              {fieldTracking?.check_in_latitude && fieldTracking?.check_in_longitude && (
                <a
                  href={`https://www.google.com/maps?q=${fieldTracking.check_in_latitude},${fieldTracking.check_in_longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="employee-profile__map-link"
                >
                  <FiExternalLink /> ({Number(fieldTracking.check_in_latitude).toFixed(5)}, {Number(fieldTracking.check_in_longitude).toFixed(5)})
                </a>
              )}
            </span>
          </div>

          <div className="employee-profile__item">
            <span className="employee-profile__label">Check-out Time</span>
            <span className="employee-profile__value">
              {fieldTracking?.check_out_time_formatted || attendanceRecord?.checkOut || (attendanceStatus === "CHECKED_IN" ? "In progress" : "Not recorded")}
            </span>
          </div>

          <div className="employee-profile__item">
            <span className="employee-profile__label">Check-out Location</span>
            <span className="employee-profile__value">
              {fieldTracking?.check_out_address || attendanceRecord?.checkOutAddress || "—"}
              {fieldTracking?.check_out_latitude && fieldTracking?.check_out_longitude && (
                <a
                  href={`https://www.google.com/maps?q=${fieldTracking.check_out_latitude},${fieldTracking.check_out_longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="employee-profile__map-link"
                >
                  <FiExternalLink /> ({Number(fieldTracking.check_out_latitude).toFixed(5)}, {Number(fieldTracking.check_out_longitude).toFixed(5)})
                </a>
              )}
            </span>
          </div>

          <div className="employee-profile__item">
            <span className="employee-profile__label">Last Known GPS Position</span>
            <span className="employee-profile__value">
              {fieldTracking?.latitude && fieldTracking?.longitude ? (
                <a
                  href={`https://www.google.com/maps?q=${fieldTracking.latitude},${fieldTracking.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="employee-profile__map-link"
                >
                  <FiExternalLink /> {Number(fieldTracking.latitude).toFixed(5)}, {Number(fieldTracking.longitude).toFixed(5)}
                </a>
              ) : (
                "Location unavailable"
              )}
            </span>
          </div>

          <div className="employee-profile__item">
            <span className="employee-profile__label">Last GPS Ping Received</span>
            <span className="employee-profile__value">
              {fieldTracking?.last_ping_formatted || (fieldTracking?.minutes_ago != null ? `${fieldTracking.minutes_ago}m ago` : "No recent ping")}
            </span>
          </div>
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
            value={formatDate(employee.date_of_birth || employee.dateOfBirth)}
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
            label="Employee ID"
            value={employee.employee_code || employee.employeeCode}
          />

          <InfoItem
            label="Date of Joining"
            value={formatDate(employee.date_of_joining || employee.dateOfJoining)}
          />

          <InfoItem
            label="Shift"
            value={
              employee.shift?.timingDisplay
                ? `${employee.shift?.name || "Shift"} (${employee.shift.timingDisplay})`
                : employee.shift?.name || employee.shift_timing || employee.shift_name || "—"
            }
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
            label="Designation Role"
            value={
              desigRole?.roleName || employee.default_role_name || "None"
            }
          />
        </div>
      </section>

      {/* =========================
          RBAC ACCESS SUMMARY
      ========================= */}
      <section className="employee-profile__access">
        <div className="employee-profile__access-header">
          <div>
            <h2>RBAC Access Summary</h2>
            <p>
              Permissions are derived from the employee's effective role.
            </p>
          </div>
        </div>

        <div className="employee-profile__access-flow">
          <div>
            <span>Designation Role</span>
            <strong>
              {desigRole?.roleName || "No Role"}
            </strong>
          </div>

          <span className="employee-profile__arrow">
            {overrideRole ? "⚡ (Overridden by)" : "→"}
          </span>

          <div>
            <span>Employee Override</span>
            <strong>
              {overrideRole ? overrideRole.roleName : "None"}
            </strong>
          </div>

          <span className="employee-profile__arrow">
            ═►
          </span>

          <div>
            <span>Effective Role</span>
            <strong style={{ color: "var(--color-primary)" }}>
              {effectiveRole ? effectiveRole.label : "No Role Assigned"}
            </strong>
          </div>
        </div>

        <div className="employee-profile__access-note">
          {effectiveRole
            ? `Active access granted via "${effectiveRole.label}" (${
                effectiveRole.source === "override"
                  ? "Employee Override"
                  : "Designation Inheritance"
              }).`
            : "No elevated permissions assigned. Built-in employee self-service only."}
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
              This employee has not accepted their invitation yet.
            </p>
          </div>

          <Button
            variant="outline"
            onClick={() => {
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
