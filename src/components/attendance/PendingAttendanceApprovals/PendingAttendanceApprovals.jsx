import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  FiCheckCircle,
  FiClock,
  FiSearch,
  FiRefreshCw,
  FiEye,
  FiCheck,
  FiX,
  FiAlertCircle,
  FiCheckSquare,
  FiSquare,
  FiInbox,
  FiFilter,
} from "react-icons/fi";
import { attendanceAPI } from "../../../services/api/attendanceAPI";
import { getDepartments } from "../../../services/api/departmentAPI";
import AttendanceDetailModal from "../AttendanceDetailModal/AttendanceDetailModal";
import Modal from "../../common/Modal/Modal";
import ConfirmModal from "../../common/ConfirmModal/ConfirmModal";
import Button from "../../common/Button/Button";
import { canApproveAttendance, getCurrentUser } from "../../../utils/permissionUtils";
import "./PendingAttendanceApprovals.css";

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return dateStr;
  }
};

const PendingAttendanceApprovals = ({
  onShowToast,
  onPendingCountChange,
  onRefreshParent,
}) => {
  const currentUser = getCurrentUser();
  const hasApprovePerm = canApproveAttendance(currentUser);

  // Data states
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [departments, setDepartments] = useState([]);

  // Search & filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");

  // Modals & alerts
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [failedAlerts, setFailedAlerts] = useState([]);
  const [rejectModal, setRejectModal] = useState({
    open: false,
    attendanceId: null,
    employeeName: "",
    reason: "",
    submitting: false,
  });
  const [detailModal, setDetailModal] = useState({
    open: false,
    attendanceId: null,
    data: null,
  });

  // Fetch departments for filtering
  useEffect(() => {
    const loadDepts = async () => {
      try {
        const res = await getDepartments();
        const list = Array.isArray(res) ? res : res?.data || [];
        setDepartments(list);
      } catch (err) {
        console.error("Failed to load departments:", err);
      }
    };
    loadDepts();
  }, []);

  // Fetch pending attendance requests
  const fetchPendingApprovals = useCallback(async (isSilent = false) => {
    if (!hasApprovePerm) {
      setLoading(false);
      return;
    }

    try {
      if (!isSilent) setLoading(true);
      const res = await attendanceAPI.getPendingAttendanceApprovals({
        search: searchQuery.trim() || undefined,
        department: selectedDepartment || undefined,
      });

      if (res?.success) {
        const list = Array.isArray(res.data) ? res.data : [];
        setRecords(list);
        if (onPendingCountChange) {
          onPendingCountChange(list.length);
        }
        // Prune selected IDs that are no longer in the list
        setSelectedIds((prev) => prev.filter((id) => list.some((r) => r.id === id)));
      }
    } catch (err) {
      console.error("Failed to fetch pending attendance approvals:", err);
      if (onShowToast) {
        const msg =
          err.response?.data?.message ||
          "Failed to load pending attendance requests.";
        onShowToast(msg, "error");
      }
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [hasApprovePerm, searchQuery, selectedDepartment, onPendingCountChange, onShowToast]);

  useEffect(() => {
    fetchPendingApprovals();
  }, [fetchPendingApprovals]);

  // Client-side filtered list based on search/department
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (r.employeeName || "").toLowerCase().includes(q) ||
        (r.employeeCode || "").toLowerCase().includes(q) ||
        (r.employeeEmail || "").toLowerCase().includes(q) ||
        (r.department || "").toLowerCase().includes(q);

      const matchesDept =
        !selectedDepartment ||
        String(r.departmentId || r.department || "").toLowerCase() ===
        String(selectedDepartment).toLowerCase();

      return matchesSearch && matchesDept;
    });
  }, [records, searchQuery, selectedDepartment]);

  // Selection handlers
  const allFilteredSelected =
    filteredRecords.length > 0 &&
    filteredRecords.every((r) => selectedIds.includes(r.id));

  const handleToggleSelectAll = () => {
    if (allFilteredSelected) {
      const filteredIdSet = new Set(filteredRecords.map((r) => r.id));
      setSelectedIds((prev) => prev.filter((id) => !filteredIdSet.has(id)));
    } else {
      const combined = new Set([...selectedIds, ...filteredRecords.map((r) => r.id)]);
      setSelectedIds(Array.from(combined));
    }
  };

  const handleToggleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Bulk Approval Execution
  const handleConfirmBulkApprove = async () => {
    if (selectedIds.length === 0) return;

    setBulkSubmitting(true);
    setFailedAlerts([]);
    try {
      const res = await attendanceAPI.bulkApproveAttendance(selectedIds);
      const approvedCount = res?.approved_count ?? 0;
      const failedCount = res?.failed_count ?? 0;
      const failed = res?.failed || [];

      if (approvedCount > 0) {
        if (onShowToast) {
          onShowToast(
            res?.message || `Successfully approved ${approvedCount} attendance request(s).`,
            "success"
          );
        }
      }

      if (failedCount > 0) {
        setFailedAlerts(failed);
        if (onShowToast && approvedCount === 0) {
          onShowToast(
            res?.message || "Failed to approve selected attendance requests.",
            "error"
          );
        }
      }

      setBulkConfirmOpen(false);
      setSelectedIds([]);
      await fetchPendingApprovals(true);
      if (onRefreshParent) {
        onRefreshParent();
      }
    } catch (err) {
      console.error("Bulk approval error:", err);
      const msg = err.response?.data?.message || "Failed to process bulk approvals.";
      if (onShowToast) onShowToast(msg, "error");
    } finally {
      setBulkSubmitting(false);
    }
  };

  // Single-request Approve
  const handleSingleApprove = async (record) => {
    if (!record?.id) return;
    try {
      setActionLoading(true);
      const res = await attendanceAPI.approveAttendance(record.id);
      if (onShowToast) {
        onShowToast(
          res?.message || `Approved attendance for ${record.employeeName}`,
          "success"
        );
      }
      setSelectedIds((prev) => prev.filter((id) => id !== record.id));
      await fetchPendingApprovals(true);
      if (onRefreshParent) {
        onRefreshParent();
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to approve attendance.";
      if (onShowToast) onShowToast(msg, "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Single-request Reject
  const handleOpenReject = (record) => {
    setRejectModal({
      open: true,
      attendanceId: record.id,
      employeeName: record.employeeName,
      reason: "",
      submitting: false,
    });
  };

  const handleConfirmReject = async () => {
    if (!rejectModal.attendanceId) return;
    setRejectModal((prev) => ({ ...prev, submitting: true }));
    try {
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
      setSelectedIds((prev) => prev.filter((id) => id !== rejectModal.attendanceId));
      setRejectModal({
        open: false,
        attendanceId: null,
        employeeName: "",
        reason: "",
        submitting: false,
      });
      await fetchPendingApprovals(true);
      if (onRefreshParent) {
        onRefreshParent();
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to reject attendance.";
      if (onShowToast) onShowToast(msg, "error");
      setRejectModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  // If user lacks permission, do not render or show unauthorized message
  if (!hasApprovePerm) {
    return (
      <section className="pending-approvals__unauthorized">
        <div className="pending-approvals__unauthorized-box">
          <FiAlertCircle size={36} />
          <h3>Access Restricted</h3>
          <p>You do not have permission to review or approve employee attendance requests.</p>
        </div>
      </section>
    );
  }

  return (
    <div className="pending-approvals">
      {/* 1. HEADER & CONTROLS */}
      <section className="pending-approvals__header-card">
        <div className="pending-approvals__header-title">
          <div className="pending-approvals__eyebrow-row">
            <span className="pending-approvals__eyebrow">ATTENDANCE APPROVALS</span>
            <span className="pending-approvals__queue-badge">
              {records.length} Pending
            </span>
          </div>
          <h2>Pending Approvals Queue</h2>
          <p>
            Review attendance records awaiting your authorization. You can approve multiple
            requests simultaneously or review individual items.
          </p>
        </div>

        {/* Action Controls & Bulk Approve Button */}
        <div className="pending-approvals__header-actions">
          <div className="pending-approvals__selection-summary">
            <span className="pending-approvals__selection-count">
              <strong>{selectedIds.length}</strong> of {filteredRecords.length} selected
            </span>
          </div>

          <Button
            variant="primary"
            icon={<FiCheckCircle size={16} />}
            disabled={selectedIds.length === 0 || loading || bulkSubmitting}
            onClick={() => setBulkConfirmOpen(true)}
            className="pending-approvals__btn-bulk-approve"
          >
            Approve Selected ({selectedIds.length})
          </Button>

          <button
            type="button"
            className="pending-approvals__btn-refresh"
            onClick={() => fetchPendingApprovals()}
            title="Refresh Pending Queue"
            disabled={loading}
          >
            <FiRefreshCw className={loading ? "spin" : ""} />
          </button>
        </div>
      </section>

      {/* 2. FAILURE ALERTS (If any items failed during bulk approval) */}
      {failedAlerts.length > 0 && (
        <section className="pending-approvals__alert-card">
          <div className="pending-approvals__alert-header">
            <FiAlertCircle className="pending-approvals__alert-icon" />
            <div>
              <h4>Some requests could not be approved</h4>
              <p>The following {failedAlerts.length} item(s) were skipped or failed:</p>
            </div>
            <button
              type="button"
              className="pending-approvals__alert-close"
              onClick={() => setFailedAlerts([])}
            >
              <FiX />
            </button>
          </div>
          <ul className="pending-approvals__alert-list">
            {failedAlerts.map((f, idx) => (
              <li key={idx}>
                <strong>{f.employee_name || `Record #${f.id}`}:</strong> {f.reason}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 3. FILTER & SEARCH BAR */}
      <section className="pending-approvals__filters-bar">
        <div className="pending-approvals__search">
          <FiSearch className="pending-approvals__search-icon" />
          <input
            type="text"
            placeholder="Search by employee name, code, email, or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="pending-approvals__search-clear"
              onClick={() => setSearchQuery("")}
            >
              <FiX />
            </button>
          )}
        </div>

        <div className="pending-approvals__dept-select">
          <FiFilter className="pending-approvals__filter-icon" />
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.name || d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* 4. TABLE VIEW */}
      <section className="pending-approvals__table-card">
        {loading ? (
          <div className="pending-approvals__loading-state">
            <div className="pending-approvals__spinner" />
            <p>Loading pending attendance requests...</p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="pending-approvals__empty-state">
            <div className="pending-approvals__empty-icon">
              <FiInbox />
            </div>
            <h3>No Pending Attendance Approvals</h3>
            <p>
              {records.length === 0
                ? "All attendance requests have been processed. Great job!"
                : "No pending requests matched your search criteria."}
            </p>
          </div>
        ) : (
          <div className="pending-approvals__table-responsive">
            <table className="pending-approvals__table">
              <thead>
                <tr>
                  <th className="th-checkbox">
                    <button
                      type="button"
                      className="pending-approvals__checkbox-btn"
                      onClick={handleToggleSelectAll}
                      title={allFilteredSelected ? "Deselect All" : "Select All"}
                    >
                      {allFilteredSelected ? (
                        <FiCheckSquare className="checkbox-icon checked" />
                      ) : (
                        <FiSquare className="checkbox-icon" />
                      )}
                    </button>
                  </th>
                  <th>Employee</th>
                  <th>Date & Shift</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Worked & Breaks</th>
                  <th>Request / Change</th>
                  <th>Submitted</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((r) => {
                  const isSelected = selectedIds.includes(r.id);

                  return (
                    <tr
                      key={r.id}
                      className={isSelected ? "row-selected" : ""}
                    >
                      {/* Checkbox */}
                      <td className="td-checkbox">
                        <button
                          type="button"
                          className="pending-approvals__checkbox-btn"
                          onClick={() => handleToggleSelectOne(r.id)}
                          title={isSelected ? "Deselect" : "Select"}
                        >
                          {isSelected ? (
                            <FiCheckSquare className="checkbox-icon checked" />
                          ) : (
                            <FiSquare className="checkbox-icon" />
                          )}
                        </button>
                      </td>

                      {/* Employee Info */}
                      <td>
                        <div className="pending-att-user">
                          <div className="pending-att-avatar">
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
                          <div className="pending-att-user-meta">
                            <span className="pending-att-name">{r.employeeName}</span>
                            <span className="pending-att-code">{r.employeeCode}</span>
                            <span className="pending-att-dept">{r.department} • {r.designation}</span>
                          </div>
                        </div>
                      </td>

                      {/* Date & Shift */}
                      <td>
                        <div className="pending-att-cell-stack">
                          <span className="pending-att-date">
                            {formatDate(r.attendanceDate)}
                          </span>
                          <span className="pending-att-subtext">
                            {r.attendanceType || r.shift || "General Shift"}
                          </span>
                        </div>
                      </td>

                      {/* Check In */}
                      <td>
                        <div className="pending-att-cell-stack">
                          <span className="pending-att-time">{r.checkIn || "--:--"}</span>
                          {r.checkInAddress && (
                            <span
                              className="pending-att-subtext pending-att-addr"
                              title={r.checkInAddress}
                            >
                              {r.checkInAddress}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Check Out */}
                      <td>
                        <div className="pending-att-cell-stack">
                          <span className="pending-att-time">{r.checkOut || "--:--"}</span>
                          {r.checkOutAddress && (
                            <span
                              className="pending-att-subtext pending-att-addr"
                              title={r.checkOutAddress}
                            >
                              {r.checkOutAddress}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Total Worked & Breaks */}
                      <td>
                        <div className="pending-att-cell-stack">
                          <span className="pending-att-hours">{r.workedHours || "00:00"}</span>
                          <span className="pending-att-subtext">
                            Breaks: {r.breakDuration || "00:00"}
                          </span>
                        </div>
                      </td>

                      {/* Request Type / Requested Change */}
                      <td>
                        <span className="pending-att-change-tag">
                          {r.requestedCorrection || r.requestType || "Standard Checkout"}
                        </span>
                      </td>

                      {/* Submission Date */}
                      <td>
                        <span className="pending-att-subtext">
                          {formatDateTime(r.submissionDate)}
                        </span>
                      </td>

                      {/* Current Status */}
                      <td>
                        <span className="pending-att-status-badge">
                          <span className="badge-dot" />
                          Pending Approval
                        </span>
                      </td>

                      {/* Actions */}
                      <td>
                        <div className="pending-att-actions">
                          <button
                            type="button"
                            className="pending-att-action-btn pending-att-action-btn--view"
                            onClick={() =>
                              setDetailModal({
                                open: true,
                                attendanceId: r.id,
                                data: r,
                              })
                            }
                            title="View Full Details"
                          >
                            <FiEye />
                          </button>

                          <button
                            type="button"
                            className="pending-att-action-btn pending-att-action-btn--approve"
                            onClick={() => handleSingleApprove(r)}
                            disabled={actionLoading || bulkSubmitting}
                            title="Approve this request"
                          >
                            <FiCheck />
                          </button>

                          <button
                            type="button"
                            className="pending-att-action-btn pending-att-action-btn--reject"
                            onClick={() => handleOpenReject(r)}
                            disabled={actionLoading || bulkSubmitting}
                            title="Reject this request"
                          >
                            <FiX />
                          </button>
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

      {/* 5. CONFIRMATION MODAL FOR BULK APPROVAL */}
      <ConfirmModal
        open={bulkConfirmOpen}
        onClose={() => setBulkConfirmOpen(false)}
        onConfirm={handleConfirmBulkApprove}
        title="Approve Selected Attendance Requests"
        description={`Are you sure you want to approve ${selectedIds.length} selected employee attendance request(s)? This will mark them as Approved and notify the employees.`}
        confirmText={`Approve (${selectedIds.length})`}
        variant="primary"
        loading={bulkSubmitting}
      />

      {/* 6. REJECT MODAL FOR SINGLE ITEM */}
      <Modal
        open={rejectModal.open}
        onClose={() =>
          setRejectModal({
            open: false,
            attendanceId: null,
            employeeName: "",
            reason: "",
            submitting: false,
          })
        }
        title="Reject Attendance Request"
        description={`Provide a reason for rejecting the attendance record for ${rejectModal.employeeName}.`}
        size="small"
        footer={
          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", width: "100%" }}>
            <Button
              variant="secondary"
              onClick={() =>
                setRejectModal({
                  open: false,
                  attendanceId: null,
                  employeeName: "",
                  reason: "",
                  submitting: false,
                })
              }
              disabled={rejectModal.submitting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmReject}
              loading={rejectModal.submitting}
            >
              Confirm Rejection
            </Button>
          </div>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <label
            htmlFor="reject-reason"
            style={{ fontSize: "13px", fontWeight: "600", color: "#374151" }}
          >
            Rejection Reason (Optional)
          </label>
          <textarea
            id="reject-reason"
            rows={3}
            placeholder="e.g. Unverified hours or missing checkout details..."
            value={rejectModal.reason}
            onChange={(e) =>
              setRejectModal((prev) => ({ ...prev, reason: e.target.value }))
            }
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: "8px",
              border: "1px solid #D1D5DB",
              fontSize: "13px",
              fontFamily: "inherit",
              resize: "vertical",
              outline: "none",
            }}
          />
        </div>
      </Modal>

      {/* 7. ATTENDANCE DETAIL MODAL */}
      <AttendanceDetailModal
        open={detailModal.open}
        attendanceId={detailModal.attendanceId}
        initialData={detailModal.data}
        onClose={() => setDetailModal({ open: false, attendanceId: null, data: null })}
      />
    </div>
  );
};

export default PendingAttendanceApprovals;

