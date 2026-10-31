import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  FiUsers,
  FiCheckCircle,
  FiUserCheck,
  FiCoffee,
  FiUserX,
  FiClock,
  FiSearch,
  FiRefreshCw,
  FiDownload,
  FiEye,
  FiCheck,
  FiX,
} from "react-icons/fi";
import { attendanceAPI } from "../../../services/api/attendanceAPI";
import { getDepartments } from "../../../services/api/departmentAPI";
import AttendanceDetailModal from "../AttendanceDetailModal/AttendanceDetailModal";
import Modal from "../../common/Modal/Modal";
import Button from "../../common/Button/Button";
import DatePicker from "../../common/DatePicker/DatePicker";
import { canApproveAttendance } from "../../../utils/permissionUtils";
import "./EmployeeAttendance.css";

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "WORKING", label: "Currently Working" },
  { value: "ON_BREAK", label: "On Break" },
  { value: "PENDING_APPROVAL", label: "Pending Approval" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "ABSENT", label: "Absent / Not Checked In" },
];

/**
 * Format shift duration for display in the table.
 * If backend already provided formatted duration (e.g. "8 hrs"), returns it.
 * If fallback timing string like "10:00 PM — 06:00 AM" was provided, parses and calculates duration.
 */
const formatShiftHours = (record) => {
  if (!record) return "—";
  if (record.shiftHours && record.shiftHours !== "—") return record.shiftHours;
  if (record.shift && record.shift !== "—") {
    if (record.shift.includes("hr") || record.shift.includes("min") || record.shift === "—") {
      return record.shift;
    }
    const parts = record.shift.split(/[—–-]/).map((s) => s.trim());
    if (parts.length === 2 && (parts[0].includes(":") || parts[1].includes(":"))) {
      const parseMinutes = (str) => {
        const m = str.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
        if (!m) return null;
        let h = parseInt(m[1], 10);
        const min = parseInt(m[2], 10);
        const p = m[3] ? m[3].toUpperCase() : null;
        if (p === "PM" && h !== 12) h += 12;
        if (p === "AM" && h === 12) h = 0;
        return h * 60 + min;
      };
      const startMin = parseMinutes(parts[0]);
      const endMin = parseMinutes(parts[1]);
      if (startMin !== null && endMin !== null) {
        let dur = endMin - startMin;
        if (dur <= 0) dur += 1440; // overnight
        const h = Math.floor(dur / 60);
        const m = dur % 60;
        if (m === 0) return `${h} hrs`;
        if (h === 0) return `${m} mins`;
        return `${h} hrs ${m} mins`;
      }
    }
    return record.shift;
  }
  return "—";
};

const EmployeeAttendance = ({ onShowToast, onOpenPendingApprovals, pendingCount }) => {
  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  })();
  const rawRole = String(currentUser.role || "").toUpperCase();
  const isAdminOrOwner =
    rawRole === "OWNER" ||
    rawRole === "ADMIN" ||
    rawRole === "ADMINISTRATOR" ||
    currentUser.is_superuser === true;

  // Filters
  const todayStr = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  // Data
  const [departments, setDepartments] = useState([]);
  const [summary, setSummary] = useState({
    totalEmployees: 0,
    presentCount: 0,
    workingCount: 0,
    onBreakCount: 0,
    absentCount: 0,
    pendingApprovalCount: 0,
    lateCount: 0,
  });
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Modals
  const [detailModal, setDetailModal] = useState({
    open: false,
    attendanceId: null,
    data: null,
  });

  const [rejectModal, setRejectModal] = useState({
    open: false,
    attendanceId: null,
    employeeName: "",
    reason: "",
  });

  // Fetch departments list for filter
  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const res = await getDepartments();
        const deptList = Array.isArray(res) ? res : res?.data || [];
        setDepartments(deptList);
      } catch (err) {
        console.error("Failed to load departments", err);
      }
    };
    fetchDepts();
  }, []);

  const onShowToastRef = useRef(onShowToast);
  useEffect(() => {
    onShowToastRef.current = onShowToast;
  }, [onShowToast]);

  // Fetch company employee attendance
  const fetchEmployeeAttendance = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedDate) params.date = selectedDate;
      if (selectedDepartment) params.department = selectedDepartment;
      if (selectedStatus) params.status = selectedStatus;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await attendanceAPI.getCompanyAttendance(params);
      if (res?.success) {
        setRecords(res.data || []);
        if (res.summary) {
          setSummary(res.summary);
        }
      }
    } catch (err) {
      console.error("Failed to fetch employee attendance", err);
      if (onShowToastRef.current) {
        const msg = err.response?.data?.message || "Failed to load employee attendance.";
        onShowToastRef.current(msg, "error");
      }
    } finally {
      setLoading(false);
    }
  }, [selectedDate, selectedDepartment, selectedStatus, searchQuery]);

  useEffect(() => {
    fetchEmployeeAttendance();
  }, [fetchEmployeeAttendance]);

  // Date shortcuts
  const handleSetToday = () => {
    setSelectedDate(todayStr);
  };

  const handleSetYesterday = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    setSelectedDate(yesterday.toISOString().split("T")[0]);
  };

  // Approval Handlers
  const handleApprove = async (record) => {
    if (!record.id) return;
    try {
      setActionLoading(true);
      const res = await attendanceAPI.approveAttendance(record.id);
      if (onShowToast) {
        onShowToast(res?.message || `Approved attendance for ${record.employeeName}`, "success");
      }
      fetchEmployeeAttendance();
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to approve attendance.";
      if (onShowToast) onShowToast(msg, "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenReject = (record) => {
    if (!record.id) return;
    setRejectModal({
      open: true,
      attendanceId: record.id,
      employeeName: record.employeeName,
      reason: "",
    });
  };

  const handleConfirmReject = async () => {
    if (!rejectModal.attendanceId) return;
    try {
      setActionLoading(true);
      const res = await attendanceAPI.rejectAttendance(
        rejectModal.attendanceId,
        rejectModal.reason
      );
      if (onShowToast) {
        onShowToast(
          res?.message || `Rejected attendance for ${rejectModal.employeeName}`,
          "success"
        );
      }
      setRejectModal({ open: false, attendanceId: null, employeeName: "", reason: "" });
      fetchEmployeeAttendance();
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to reject attendance.";
      if (onShowToast) onShowToast(msg, "error");
    } finally {
      setActionLoading(false);
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    if (!records.length) {
      if (onShowToast) onShowToast("No records available to export.", "error");
      return;
    }

    const headers = [
      "Employee Code",
      "Employee Name",
      "Email",
      "Department",
      "Designation",
      "Date",
      "Shift Hours",
      "Shift Timings",
      "Check In",
      "Check Out",
      "Breaks",
      "Working Hours",
      "Status",
      "Approval Status",
    ];

    const rows = records.map((r) => [
      `"${r.employeeCode || ""}"`,
      `"${r.employeeName || ""}"`,
      `"${r.employeeEmail || ""}"`,
      `"${r.department || ""}"`,
      `"${r.designation || ""}"`,
      `"${r.attendanceDate || selectedDate}"`,
      `"${formatShiftHours(r)}"`,
      `"${r.shiftTiming && r.shiftTiming !== "—" ? r.shiftTiming : ""}"`,
      `"${r.checkIn || ""}"`,
      `"${r.checkOut || ""}"`,
      `"${r.breakSummary || ""}"`,
      `"${r.workedHours || ""}"`,
      `"${r.statusLabel || r.status || ""}"`,
      `"${r.approvalStatus || "N/A"}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Employee_Attendance_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (onShowToast) onShowToast("Attendance report exported successfully!", "success");
  };

  // Helpers for Status Badges
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "WORKING":
        return "employee-att-badge--working";
      case "ON_BREAK":
        return "employee-att-badge--break";
      case "PENDING_APPROVAL":
        return "employee-att-badge--pending";
      case "APPROVED":
        return "employee-att-badge--approved";
      case "REJECTED":
        return "employee-att-badge--rejected";
      case "NOT_STARTED":
      case "ABSENT":
        return "employee-att-badge--absent";
      default:
        return "employee-att-badge--default";
    }
  };

  return (
    <div className="employee-attendance">
      {/* 1. TOP SUMMARY CARDS */}
      <section className="employee-attendance__summary-grid">
        <div className="employee-summary-card">
          <div className="employee-summary-card__icon employee-summary-card__icon--total">
            <FiUsers />
          </div>
          <div className="employee-summary-card__info">
            <span className="employee-summary-card__label">Total Staff</span>
            <span className="employee-summary-card__value">{summary.totalEmployees}</span>
          </div>
        </div>

        <div className="employee-summary-card">
          <div className="employee-summary-card__icon employee-summary-card__icon--present">
            <FiUserCheck />
          </div>
          <div className="employee-summary-card__info">
            <span className="employee-summary-card__label">Present Today</span>
            <span className="employee-summary-card__value">{summary.presentCount}</span>
          </div>
        </div>

        <div className="employee-summary-card">
          <div className="employee-summary-card__icon employee-summary-card__icon--working">
            <FiClock />
          </div>
          <div className="employee-summary-card__info">
            <span className="employee-summary-card__label">Currently Working</span>
            <span className="employee-summary-card__value">{summary.workingCount}</span>
          </div>
        </div>

        <div className="employee-summary-card">
          <div className="employee-summary-card__icon employee-summary-card__icon--break">
            <FiCoffee />
          </div>
          <div className="employee-summary-card__info">
            <span className="employee-summary-card__label">On Break</span>
            <span className="employee-summary-card__value">{summary.onBreakCount}</span>
          </div>
        </div>

        <div className="employee-summary-card">
          <div className="employee-summary-card__icon employee-summary-card__icon--absent">
            <FiUserX />
          </div>
          <div className="employee-summary-card__info">
            <span className="employee-summary-card__label">Absent / Not In</span>
            <span className="employee-summary-card__value">{summary.absentCount}</span>
          </div>
        </div>

        <div className="employee-summary-card">
          <div className="employee-summary-card__icon employee-summary-card__icon--pending">
            <FiCheck />
          </div>
          <div className="employee-summary-card__info">
            <span className="employee-summary-card__label">Pending Approval</span>
            <span className="employee-summary-card__value">{summary.pendingApprovalCount}</span>
          </div>
        </div>
      </section>

      {/* 2. FILTER & CONTROLS TOOLBAR */}
      <section className="employee-attendance__toolbar">
        <div className="employee-attendance__search-box">
          <FiSearch />
          <input
            type="text"
            placeholder="Search employee by name, ID, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="employee-attendance__filters">
          {/* Date Picker & Quick toggles */}
          <div className="employee-attendance__date-wrapper">
            <DatePicker
              value={selectedDate}
              onChange={(value) => setSelectedDate(value)}
            />

            <div className="employee-attendance__date-shortcuts">
              <button
                type="button"
                className={selectedDate === todayStr ? "active" : ""}
                onClick={handleSetToday}
              >
                Today
              </button>

              <button
                type="button"
                onClick={handleSetYesterday}
              >
                Yesterday
              </button>
            </div>
          </div>

          {/* Department Filter */}
          <select
            className="employee-attendance__select"
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
          >
            <option value="">All Departments</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.department_name || dept.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            className="employee-attendance__select"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Action Buttons */}
          <button
            type="button"
            className="employee-attendance__btn-icon"
            onClick={() => fetchEmployeeAttendance()}
            title="Refresh Attendance Data"
          >
            <FiRefreshCw className={loading ? "spin" : ""} />
          </button>

          <button
            type="button"
            className="employee-attendance__btn-export"
            onClick={handleExportCSV}
          >
            <FiDownload />
            <span>Export CSV</span>
          </button>

          {onOpenPendingApprovals && canApproveAttendance(currentUser) && (
            <button
              type="button"
              className="employee-attendance__btn-bulk-queue"
              onClick={onOpenPendingApprovals}
              title="View and approve pending attendance requests in bulk"
            >
              <FiCheckCircle />
              <span>Bulk Approvals</span>
              {(pendingCount || summary.pendingApprovalCount) > 0 && (
                <span className="employee-attendance__pending-badge">
                  {pendingCount || summary.pendingApprovalCount}
                </span>
              )}
            </button>
          )}
        </div>
      </section>

      {/* 3. EMPLOYEE ATTENDANCE TABLE */}
      <section className="employee-attendance__table-card">
        {loading ? (
          <div className="employee-attendance__loading-state">
            <div className="employee-attendance__spinner" />
            <p>Loading employee attendance data...</p>
          </div>
        ) : records.length === 0 ? (
          <div className="employee-attendance__empty-state">
            <div className="employee-attendance__empty-icon">
              <FiUsers />
            </div>
            <h3>No Attendance Records Found</h3>
            <p>
              No employees matched the selected date ({selectedDate}) or search criteria.
            </p>
          </div>
        ) : (
          <div className="employee-attendance__table-responsive">
            <table className="employee-attendance__table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department & Role</th>
                  <th>Shift Hours</th>
                  <th>Check In</th>
                  <th>Break</th>
                  <th>Check Out</th>
                  <th>Total Worked</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => {
                  const hasAttendance = r.hasAttendance;
                  const isPending = r.status === "PENDING_APPROVAL";
                  const isSelf =
                    (currentUser.employee_id &&
                      currentUser.employee_id === r.employeeId) ||
                    (currentUser.employeeId &&
                      currentUser.employeeId === r.employeeId) ||
                    (currentUser.email &&
                      currentUser.email.toLowerCase() ===
                        (r.employeeEmail || "").toLowerCase());
                  const canApproveThisRow =
                    canApproveAttendance() &&
                    (isAdminOrOwner || !isSelf);

                  return (
                    <tr key={`${r.employeeId}-${r.attendanceDate}`}>
                      {/* Employee Info */}
                      <td>
                        <div className="employee-att-user">
                          <div className="employee-att-avatar">
                            {r.employeeAvatar ? (
                              <img src={r.employeeAvatar} alt={r.employeeName} />
                            ) : (
                              <span>
                                {r.employeeName
                                  ? r.employeeName
                                    .split(" ")
                                    .map((n) => n[0])
                                    .slice(0, 2)
                                    .join("")
                                    .toUpperCase()
                                  : "EM"}
                              </span>
                            )}
                          </div>
                          <div className="employee-att-user-meta">
                            <span className="employee-att-name">
                              {r.employeeName}
                              {isSelf && (
                                <span style={{ marginLeft: "6px", fontSize: "11px", opacity: 0.75, fontWeight: "normal" }}>
                                  (You)
                                </span>
                              )}
                            </span>
                            <span className="employee-att-code">{r.employeeCode}</span>
                          </div>
                        </div>
                      </td>

                      {/* Department & Designation */}
                      <td>
                        <div className="employee-att-dept-meta">
                          <span className="employee-att-dept-badge">{r.department}</span>
                          <span className="employee-att-desig-label">{r.designation}</span>
                        </div>
                      </td>

                      {/* Shift Hours */}
                      <td>
                        <div className="employee-att-shift-cell">
                          <span className="employee-att-shift">{formatShiftHours(r)}</span>
                          {r.shiftTiming && r.shiftTiming !== "—" && (
                            <span className="employee-att-shift-sub">{r.shiftTiming}</span>
                          )}
                        </div>
                      </td>

                      {/* Check In */}
                      <td>
                        <div className="employee-att-time-cell">
                          <span className="employee-att-time">{r.checkIn}</span>
                        </div>
                      </td>

                      {/* Break */}
                      <td>
                        <span className="employee-att-break">{r.breakSummary}</span>
                      </td>

                      {/* Check Out */}
                      <td>
                        <span className={`employee-att-time ${r.checkOut === "Active" ? "active-text" : ""}`}>
                          {r.checkOut}
                        </span>
                      </td>

                      {/* Total Worked */}
                      <td>
                        <span className="employee-att-hours">{r.workedHours}</span>
                      </td>

                      {/* Status */}
                      <td>
                        <span className={`employee-att-badge ${getStatusBadgeClass(r.status)}`}>
                          <span className="badge-dot" />
                          {r.statusLabel}
                        </span>
                      </td>

                      {/* Actions */}
                      <td>
                        <div className="employee-att-actions">
                          {hasAttendance && (
                            <button
                              type="button"
                              className="employee-att-action-btn employee-att-action-btn--view"
                              onClick={() =>
                                setDetailModal({
                                  open: true,
                                  attendanceId: r.id,
                                  data: r,
                                })
                              }
                              title="View Full Breakdown & Timeline"
                            >
                              <FiEye />
                            </button>
                          )}

                          {isPending && canApproveThisRow && (
                            <>
                              <button
                                type="button"
                                className="employee-att-action-btn employee-att-action-btn--approve"
                                onClick={() => handleApprove(r)}
                                disabled={actionLoading}
                                title="Approve Attendance"
                              >
                                <FiCheck />
                              </button>
                              <button
                                type="button"
                                className="employee-att-action-btn employee-att-action-btn--reject"
                                onClick={() => handleOpenReject(r)}
                                disabled={actionLoading}
                                title="Reject Attendance"
                              >
                                <FiX />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* 4. DETAIL MODAL */}
      <AttendanceDetailModal
        open={detailModal.open}
        attendanceId={detailModal.attendanceId}
        initialData={detailModal.data}
        onClose={() => setDetailModal({ open: false, attendanceId: null, data: null })}
      />

      {/* 5. REJECT CONFIRMATION MODAL */}
      <Modal
        open={rejectModal.open}
        onClose={() => setRejectModal({ open: false, attendanceId: null, employeeName: "", reason: "" })}
        title={`Reject Attendance for ${rejectModal.employeeName}`}
        description="Please provide an optional reason or remark for rejecting this attendance session."
        size="small"
        footer={
          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", width: "100%" }}>
            <Button
              variant="secondary"
              onClick={() =>
                setRejectModal({ open: false, attendanceId: null, employeeName: "", reason: "" })
              }
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmReject}
              loading={actionLoading}
            >
              Confirm Rejection
            </Button>
          </div>
        }
      >
        <div style={{ marginTop: "12px" }}>
          <label
            style={{
              display: "block",
              fontSize: "12px",
              fontWeight: "600",
              color: "var(--color-text-secondary)",
              marginBottom: "6px",
            }}
          >
            Rejection Reason (Optional)
          </label>
          <textarea
            rows={3}
            placeholder="e.g. Incomplete shift hours or unverified punch record..."
            value={rejectModal.reason}
            onChange={(e) =>
              setRejectModal((prev) => ({ ...prev, reason: e.target.value }))
            }
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: "8px",
              border: "1px solid var(--color-border)",
              fontSize: "13px",
              fontFamily: "inherit",
              resize: "vertical",
              background: "var(--color-bg-surface)",
              color: "var(--color-text-primary)",
              outline: "none",
            }}
          />
        </div>
      </Modal>
    </div>
  );
};

export default EmployeeAttendance;
