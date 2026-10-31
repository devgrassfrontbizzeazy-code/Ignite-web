import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
  FiMinusSquare,
  FiInbox,
  FiFilter,
  FiUser,
  FiUsers,
  FiCalendar,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";
import { attendanceAPI } from "../../../services/api/attendanceAPI";
import { getDepartments } from "../../../services/api/departmentAPI";
import { getEmployees } from "../../../services/api/employeeAPI";
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
  const [companyEmployees, setCompanyEmployees] = useState([]);

  // Search & filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");

  // Searchable Employee Dropdown states
  const [employeeDropdownOpen, setEmployeeDropdownOpen] = useState(false);
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState("");
  const employeeDropdownRef = useRef(null);

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
    let isMounted = true;
    const loadDepts = async () => {
      try {
        const res = await getDepartments();
        const list = Array.isArray(res) ? res : res?.data || [];
        if (isMounted) setDepartments(list);
      } catch (err) {
        console.error("Failed to load departments:", err);
      }
    };
    loadDepts();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch company employees for search dropdown options (graceful fallback to records)
  useEffect(() => {
    let isMounted = true;
    const loadCompanyEmployees = async () => {
      try {
        const res = await getEmployees({ is_active: true });
        const list = Array.isArray(res)
          ? res
          : Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res?.results)
          ? res.results
          : [];
        if (isMounted) setCompanyEmployees(list);
      } catch (err) {
        // Fallback gracefully; employees will be computed directly from pending records
        console.warn("Company employee listing restricted or unavailable:", err);
      }
    };
    loadCompanyEmployees();
    return () => {
      isMounted = false;
    };
  }, []);

  // Close employee dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        employeeDropdownRef.current &&
        !employeeDropdownRef.current.contains(event.target)
      ) {
        setEmployeeDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch pending attendance requests from backend
  const fetchPendingApprovals = useCallback(
    async (isSilent = false) => {
      if (!hasApprovePerm) {
        setLoading(false);
        return;
      }

      try {
        if (!isSilent) setLoading(true);
        const res = await attendanceAPI.getPendingAttendanceApprovals({
          search: searchQuery.trim() || undefined,
          department: selectedDepartment || undefined,
          employee_id: selectedEmployeeId || undefined,
          date: selectedDate || undefined,
        });

        if (res?.success) {
          const list = Array.isArray(res.data) ? res.data : [];
          setRecords(list);
          if (onPendingCountChange) {
            onPendingCountChange(list.length);
          }
          // Prune selected IDs that are no longer in the list
          setSelectedIds((prev) =>
            prev.filter((id) => list.some((r) => r.id === id))
          );
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
    },
    [
      hasApprovePerm,
      searchQuery,
      selectedDepartment,
      selectedEmployeeId,
      selectedDate,
      onPendingCountChange,
      onShowToast,
    ]
  );

  useEffect(() => {
    fetchPendingApprovals();
  }, [fetchPendingApprovals]);

  // Compute distinct employees who have pending requests (and combine with company list)
  const employeeOptions = useMemo(() => {
    const pendingMap = new Map();

    // 1. Gather all employees with pending requests from records
    records.forEach((r) => {
      if (!r.employeeId) return;
      if (!pendingMap.has(r.employeeId)) {
        pendingMap.set(r.employeeId, {
          id: r.employeeId,
          name: r.employeeName || `Employee #${r.employeeId}`,
          code: r.employeeCode || "",
          email: r.employeeEmail || "",
          avatar: r.employeeAvatar || null,
          department: r.department || "",
          designation: r.designation || "",
          pendingCount: 0,
        });
      }
      pendingMap.get(r.employeeId).pendingCount += 1;
    });

    // 2. Also incorporate company employees if available
    const combinedMap = new Map(pendingMap);
    companyEmployees.forEach((emp) => {
      if (!emp?.id) return;
      const empName = `${emp.first_name || ""} ${emp.last_name || ""}`.trim() ||
        emp.name ||
        emp.email ||
        `Employee #${emp.id}`;
      const deptName =
        typeof emp.department === "object"
          ? emp.department?.name || emp.department?.department_name || ""
          : emp.department || "";
      const desigName =
        typeof emp.designation === "object"
          ? emp.designation?.name || emp.designation?.designation_name || ""
          : emp.designation || "";

      if (!combinedMap.has(emp.id)) {
        combinedMap.set(emp.id, {
          id: emp.id,
          name: empName,
          code: emp.employee_code || emp.code || "",
          email: emp.email || "",
          avatar: emp.profile_photo_url || emp.avatar || null,
          department: deptName,
          designation: desigName,
          pendingCount: 0,
        });
      }
    });

    const list = Array.from(combinedMap.values());

    // Sort: employees with pending requests first (descending pending count), then alphabetically by name
    return list.sort((a, b) => {
      if (b.pendingCount !== a.pendingCount) {
        return b.pendingCount - a.pendingCount;
      }
      return a.name.localeCompare(b.name);
    });
  }, [records, companyEmployees]);

  // Filtered employee options inside dropdown search
  const filteredEmployeeOptions = useMemo(() => {
    if (!employeeSearchTerm.trim()) return employeeOptions;
    const term = employeeSearchTerm.toLowerCase().trim();
    return employeeOptions.filter((emp) => {
      return (
        emp.name.toLowerCase().includes(term) ||
        emp.code.toLowerCase().includes(term) ||
        emp.email.toLowerCase().includes(term) ||
        emp.department.toLowerCase().includes(term)
      );
    });
  }, [employeeOptions, employeeSearchTerm]);

  // Active selected employee object (for badge & details)
  const currentSelectedEmployee = useMemo(() => {
    if (!selectedEmployeeId) return null;
    return employeeOptions.find((e) => String(e.id) === String(selectedEmployeeId)) || null;
  }, [employeeOptions, selectedEmployeeId]);

  // Client-side filtered list based on all active criteria
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      // 1. Text Search
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (r.employeeName || "").toLowerCase().includes(q) ||
        (r.employeeCode || "").toLowerCase().includes(q) ||
        (r.employeeEmail || "").toLowerCase().includes(q) ||
        (r.department || "").toLowerCase().includes(q);

      // 2. Specific Employee Filter
      const matchesEmployee =
        !selectedEmployeeId ||
        String(r.employeeId) === String(selectedEmployeeId);

      // 3. Department Filter
      const matchesDept =
        !selectedDepartment ||
        String(r.departmentId || r.department || "").toLowerCase() ===
          String(selectedDepartment).toLowerCase();

      // 4. Date Filter
      const matchesDate =
        !selectedDate ||
        String(r.attendanceDate || "").startsWith(selectedDate);

      return matchesSearch && matchesEmployee && matchesDept && matchesDate;
    });
  }, [records, searchQuery, selectedEmployeeId, selectedDepartment, selectedDate]);

  // CRITICAL REQUIREMENT: Whenever filters change, prune selectedIds so approvals
  // are never accidentally applied to hidden or unselected employees/requests!
  useEffect(() => {
    setSelectedIds((prev) => {
      if (prev.length === 0) return prev;
      const validIds = new Set(filteredRecords.map((r) => r.id));
      const pruned = prev.filter((id) => validIds.has(id));
      return pruned.length === prev.length ? prev : pruned;
    });
  }, [filteredRecords]);

  // Selection state helpers
  const allFilteredSelected =
    filteredRecords.length > 0 &&
    filteredRecords.every((r) => selectedIds.includes(r.id));

  const someFilteredSelected =
    selectedIds.length > 0 && !allFilteredSelected;

  const handleToggleSelectAll = () => {
    if (allFilteredSelected) {
      const filteredIdSet = new Set(filteredRecords.map((r) => r.id));
      setSelectedIds((prev) => prev.filter((id) => !filteredIdSet.has(id)));
    } else {
      const combined = new Set([
        ...selectedIds,
        ...filteredRecords.map((r) => r.id),
      ]);
      setSelectedIds(Array.from(combined));
    }
  };

  const handleToggleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
  };

  // Reset all active filters
  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedEmployeeId("");
    setSelectedDepartment("");
    setSelectedDate("");
  };

  const hasActiveFilters =
    Boolean(searchQuery) ||
    Boolean(selectedEmployeeId) ||
    Boolean(selectedDepartment) ||
    Boolean(selectedDate);

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
            res?.message ||
              `Successfully approved ${approvedCount} attendance request(s).`,
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
      const msg =
        err.response?.data?.message || "Failed to process bulk approvals.";
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
      const msg =
        err.response?.data?.message || "Failed to approve attendance.";
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
      setSelectedIds((prev) =>
        prev.filter((id) => id !== rejectModal.attendanceId)
      );
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
          <p>
            You do not have permission to review or approve employee attendance
            requests.
          </p>
        </div>
      </section>
    );
  }

  return (
    <div className="pending-approvals">
      {/* 1. HEADER & ACTION CONTROLS */}
      <section className="pending-approvals__header-card">
        <div className="pending-approvals__header-title">
          <div className="pending-approvals__eyebrow-row">
            <span className="pending-approvals__eyebrow">ATTENDANCE APPROVALS</span>
            <span className="pending-approvals__queue-badge">
              <span className="badge-pulse-dot" />
              {records.length} Pending
            </span>
            {selectedEmployeeId && currentSelectedEmployee && (
              <span className="pending-approvals__filter-pill">
                Filtered: <strong>{currentSelectedEmployee.name}</strong>
                <button
                  type="button"
                  onClick={() => setSelectedEmployeeId("")}
                  title="Clear employee filter"
                  className="pending-approvals__pill-clear"
                >
                  <FiX size={12} />
                </button>
              </span>
            )}
          </div>
          <h2>Pending Approvals Queue</h2>
          <p>
            Review and authorize employee attendance records, shift corrections,
            and checkout submissions. Select multiple items to approve in bulk.
          </p>
        </div>

        {/* Action Controls & Bulk Approve Button */}
        <div className="pending-approvals__header-actions">
          <div className="pending-approvals__selection-summary">
            <span className="pending-approvals__selection-count">
              <strong>{selectedIds.length}</strong> of {filteredRecords.length} selected
            </span>
            {selectedIds.length > 0 && (
              <button
                type="button"
                className="pending-approvals__btn-clear-selection"
                onClick={handleClearSelection}
                title="Clear all selected items"
              >
                Clear
              </button>
            )}
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

      {/* 2. DEDICATED SELECTION ACTION BAR (Visible when items selected) */}
      {selectedIds.length > 0 && (
        <section className="pending-approvals__selection-bar">
          <div className="pending-approvals__selection-bar-left">
            <FiCheckSquare className="selection-bar-icon" />
            <div className="selection-bar-text">
              <strong>{selectedIds.length}</strong> request{selectedIds.length !== 1 ? "s" : ""} selected
              {currentSelectedEmployee && (
                <span className="selection-bar-target">
                  for {currentSelectedEmployee.name}
                </span>
              )}
            </div>
            <button
              type="button"
              className="pending-approvals__selection-bar-link"
              onClick={handleToggleSelectAll}
            >
              {allFilteredSelected
                ? "Deselect Visible"
                : `Select All Visible (${filteredRecords.length})`}
            </button>
          </div>

          <div className="pending-approvals__selection-bar-right">
            <button
              type="button"
              className="pending-approvals__btn-bar-clear"
              onClick={handleClearSelection}
            >
              <FiX size={14} /> Clear Selection
            </button>
            <Button
              variant="primary"
              icon={<FiCheckCircle size={16} />}
              onClick={() => setBulkConfirmOpen(true)}
              loading={bulkSubmitting}
              className="pending-approvals__btn-bar-approve"
            >
              Approve Selected ({selectedIds.length})
            </Button>
          </div>
        </section>
      )}

      {/* 3. FAILURE ALERTS (If any items failed during bulk approval) */}
      {failedAlerts.length > 0 && (
        <section className="pending-approvals__alert-card">
          <div className="pending-approvals__alert-header">
            <FiAlertCircle className="pending-approvals__alert-icon" />
            <div>
              <h4>Some requests could not be approved</h4>
              <p>
                The following {failedAlerts.length} item(s) were skipped or
                failed validation:
              </p>
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
                <strong>{f.employee_name || `Record #${f.id}`}:</strong>{" "}
                {f.reason}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 4. FILTER & SEARCH TOOLBAR */}
      <section className="pending-approvals__filters-bar">
        {/* Search by text */}
        <div className="pending-approvals__search">
          <FiSearch className="pending-approvals__search-icon" />
          <input
            type="text"
            placeholder="Search by name, ID, or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="pending-approvals__search-clear"
              onClick={() => setSearchQuery("")}
              title="Clear search"
            >
              <FiX />
            </button>
          )}
        </div>

        {/* Searchable Employee Dropdown */}
        <div
          className="pending-approvals__emp-dropdown-wrapper"
          ref={employeeDropdownRef}
        >
          <button
            type="button"
            className={`pending-approvals__emp-trigger ${
              selectedEmployeeId ? "has-value" : ""
            } ${employeeDropdownOpen ? "open" : ""}`}
            onClick={() => setEmployeeDropdownOpen((prev) => !prev)}
            title="Filter by Employee"
          >
            <div className="pending-approvals__emp-trigger-content">
              {currentSelectedEmployee ? (
                <>
                  <div className="emp-mini-avatar">
                    {currentSelectedEmployee.avatar ? (
                      <img
                        src={currentSelectedEmployee.avatar}
                        alt={currentSelectedEmployee.name}
                      />
                    ) : (
                      <span>
                        {currentSelectedEmployee.name
                          .split(" ")
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join("")
                          .toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="emp-mini-meta">
                    <span className="emp-mini-name">
                      {currentSelectedEmployee.name}
                    </span>
                    <span className="emp-mini-code">
                      {currentSelectedEmployee.code || "EMP"}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <FiUsers className="pending-approvals__filter-icon" />
                  <span className="emp-placeholder">All Employees</span>
                </>
              )}
            </div>

            <div className="pending-approvals__emp-trigger-actions">
              {selectedEmployeeId ? (
                <span
                  role="button"
                  tabIndex={0}
                  className="emp-clear-icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedEmployeeId("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.stopPropagation();
                      setSelectedEmployeeId("");
                    }
                  }}
                  title="Clear Employee filter"
                >
                  <FiX size={14} />
                </span>
              ) : employeeDropdownOpen ? (
                <FiChevronUp size={16} />
              ) : (
                <FiChevronDown size={16} />
              )}
            </div>
          </button>

          {/* Dropdown Menu Popover */}
          {employeeDropdownOpen && (
            <div className="pending-approvals__emp-menu">
              <div className="pending-approvals__emp-menu-search">
                <FiSearch size={14} />
                <input
                  type="text"
                  placeholder="Search employee by name, code..."
                  value={employeeSearchTerm}
                  onChange={(e) => setEmployeeSearchTerm(e.target.value)}
                  autoFocus
                />
                {employeeSearchTerm && (
                  <button
                    type="button"
                    onClick={() => setEmployeeSearchTerm("")}
                    className="emp-menu-search-clear"
                  >
                    <FiX size={12} />
                  </button>
                )}
              </div>

              <div className="pending-approvals__emp-list">
                {/* Option to select All Employees */}
                <button
                  type="button"
                  className={`pending-approvals__emp-item ${
                    !selectedEmployeeId ? "selected" : ""
                  }`}
                  onClick={() => {
                    setSelectedEmployeeId("");
                    setEmployeeDropdownOpen(false);
                    setEmployeeSearchTerm("");
                  }}
                >
                  <input
                    type="checkbox"
                    className="pending-approvals__dropdown-checkbox"
                    checked={!selectedEmployeeId}
                    readOnly
                  />
                  <div className="emp-item-avatar emp-item-avatar--all">
                    <FiUsers size={14} />
                  </div>
                  <div className="emp-item-info">
                    <span className="emp-item-name">All Employees</span>
                    <span className="emp-item-sub">Show all pending requests</span>
                  </div>
                  <span className="emp-item-count-badge">
                    {records.length}
                  </span>
                </button>

                {/* List of matching employees */}
                {filteredEmployeeOptions.length === 0 ? (
                  <div className="pending-approvals__emp-empty">
                    <span>No employees match "{employeeSearchTerm}"</span>
                  </div>
                ) : (
                  filteredEmployeeOptions.map((emp) => {
                    const isSelected =
                      String(emp.id) === String(selectedEmployeeId);
                    return (
                      <button
                        key={emp.id}
                        type="button"
                        className={`pending-approvals__emp-item ${
                          isSelected ? "selected" : ""
                        }`}
                        onClick={() => {
                          setSelectedEmployeeId(isSelected ? "" : emp.id);
                          setEmployeeDropdownOpen(false);
                          setEmployeeSearchTerm("");
                        }}
                      >
                        <input
                          type="checkbox"
                          className="pending-approvals__dropdown-checkbox"
                          checked={isSelected}
                          readOnly
                        />
                        <div className="emp-item-avatar">
                          {emp.avatar ? (
                            <img src={emp.avatar} alt={emp.name} />
                          ) : (
                            <span>
                              {emp.name
                                .split(" ")
                                .map((n) => n[0])
                                .slice(0, 2)
                                .join("")
                                .toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="emp-item-info">
                          <span className="emp-item-name">{emp.name}</span>
                          <span className="emp-item-sub">
                            {emp.code} {emp.department ? `• ${emp.department}` : ""}
                          </span>
                        </div>
                        {emp.pendingCount > 0 && (
                          <span className="emp-item-pending-badge">
                            {emp.pendingCount}
                          </span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Department Filter */}
        <div className="pending-approvals__dept-select">
          <FiFilter className="pending-approvals__filter-icon" />
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.name || d.id}>
                {d.name || d.department_name}
              </option>
            ))}
          </select>
        </div>

        {/* Date Filter */}
        <div className="pending-approvals__date-select">
          <FiCalendar className="pending-approvals__filter-icon" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="pending-approvals__date-input"
            title="Filter by Attendance Date"
          />
          {selectedDate && (
            <button
              type="button"
              className="pending-approvals__date-clear"
              onClick={() => setSelectedDate("")}
              title="Clear date filter"
            >
              <FiX size={14} />
            </button>
          )}
        </div>

        {/* Clear All Filters Button */}
        {hasActiveFilters && (
          <button
            type="button"
            className="pending-approvals__btn-reset-filters"
            onClick={handleResetFilters}
            title="Reset all search & filter criteria"
          >
            <FiX size={14} /> Clear Filters
          </button>
        )}
      </section>

      {/* 5. TABLE VIEW */}
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
                : "No pending requests matched your active filter criteria."}
            </p>
            {hasActiveFilters && (
              <Button
                variant="secondary"
                onClick={handleResetFilters}
                className="pending-approvals__btn-empty-reset"
              >
                Clear All Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="pending-approvals__table-responsive">
            <table className="pending-approvals__table">
              <thead>
                <tr>
                  <th className="th-checkbox">
                    <label
                      className="pending-approvals__checkbox-label"
                      title={
                        allFilteredSelected
                          ? "Deselect All Visible"
                          : someFilteredSelected
                          ? "Select All Visible"
                          : "Select All Visible"
                      }
                    >
                      <input
                        type="checkbox"
                        className="pending-approvals__table-checkbox"
                        checked={allFilteredSelected}
                        ref={(el) => {
                          if (el) el.indeterminate = someFilteredSelected;
                        }}
                        onChange={handleToggleSelectAll}
                        aria-label="Select all visible pending requests"
                      />
                    </label>
                  </th>
                  <th>Employee</th>
                  <th>Date & Shift</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Worked & Breaks</th>
                  <th>Request / Change</th>
                  <th>Submitted</th>
                  <th>Status</th>
                  <th className="th-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((r) => {
                  const isSelected = selectedIds.includes(r.id);

                  return (
                    <tr
                      key={r.id}
                      className={isSelected ? "row-selected" : ""}
                      onClick={(e) => {
                        // Allow clicking row to toggle selection, except on buttons, actions, or direct inputs
                        if (
                          e.target.closest("button") ||
                          e.target.closest(".pending-att-actions") ||
                          e.target.closest("input") ||
                          e.target.closest("a")
                        ) {
                          return;
                        }
                        handleToggleSelectOne(r.id);
                      }}
                      style={{ cursor: "pointer" }}
                    >
                      {/* Checkbox */}
                      <td
                        className="td-checkbox"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        <label
                          className="pending-approvals__checkbox-label"
                          title={isSelected ? `Deselect ${r.employeeName}` : `Select ${r.employeeName}`}
                        >
                          <input
                            type="checkbox"
                            className="pending-approvals__table-checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectOne(r.id)}
                            aria-label={`Select pending attendance for ${r.employeeName}`}
                          />
                        </label>
                      </td>

                      {/* Employee Info */}
                      <td>
                        <div className="pending-att-user">
                          <div className="pending-att-avatar">
                            {r.employeeAvatar ? (
                              <img
                                src={r.employeeAvatar}
                                alt={r.employeeName}
                              />
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
                            <span className="pending-att-name">
                              {r.employeeName}
                            </span>
                            <span className="pending-att-code">
                              {r.employeeCode}
                            </span>
                            <span className="pending-att-dept">
                              {r.department} • {r.designation}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Date & Shift */}
                      <td>
                        <div className="pending-att-cell-stack">
                          <span className="pending-att-date">
                            {formatDate(r.attendanceDate)}
                          </span>
                          <span className="pending-att-shift-badge">
                            {r.shiftTiming || r.shift || "10:00 AM – 07:00 PM"}
                          </span>
                          {r.shiftHours && (
                            <span className="pending-att-shift-hours">
                              {r.shiftHours}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Check In */}
                      <td>
                        <div className="pending-att-cell-stack">
                          <span className="pending-att-time checkin-time">
                            {r.checkIn || "--:--"}
                          </span>
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
                          <span className="pending-att-time checkout-time">
                            {r.checkOut || "--:--"}
                          </span>
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
                          <span className="pending-att-hours">
                            {r.workedHours || "00:00"}
                          </span>
                          <span className="pending-att-break-badge">
                            Breaks: {r.breakDuration || "00:00"}
                          </span>
                        </div>
                      </td>

                      {/* Request Type / Requested Change */}
                      <td>
                        <span className="pending-att-change-tag">
                          {r.requestedCorrection ||
                            r.requestType ||
                            "Standard Checkout"}
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
                      <td className="td-actions">
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

      {/* 6. CONFIRMATION MODAL FOR BULK APPROVAL */}
      <ConfirmModal
        open={bulkConfirmOpen}
        onClose={() => setBulkConfirmOpen(false)}
        onConfirm={handleConfirmBulkApprove}
        title="Approve Selected Attendance Requests"
        description={
          currentSelectedEmployee
            ? `Are you sure you want to approve ${selectedIds.length} selected attendance request(s) for ${currentSelectedEmployee.name}? This will mark them as Approved and notify the employee.`
            : `Are you sure you want to approve ${selectedIds.length} selected employee attendance request(s)? This will mark them as Approved and notify the employees.`
        }
        confirmText={`Approve (${selectedIds.length})`}
        variant="primary"
        loading={bulkSubmitting}
      />

      {/* 7. REJECT MODAL FOR SINGLE ITEM */}
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
          <div
            style={{
              display: "flex",
              gap: "10px",
              justifyContent: "flex-end",
              width: "100%",
            }}
          >
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
            style={{
              fontSize: "13px",
              fontWeight: "600",
              color: "var(--ignite-charcoal, #1A1F24)",
            }}
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
              border: "1px solid var(--ignite-soft-gray, #E6EAEE)",
              fontSize: "13px",
              fontFamily: "var(--font-family-base, 'Montserrat', sans-serif)",
              color: "var(--ignite-charcoal, #1A1F24)",
              resize: "vertical",
              outline: "none",
            }}
          />
        </div>
      </Modal>

      {/* 8. ATTENDANCE DETAIL MODAL */}
      <AttendanceDetailModal
        open={detailModal.open}
        attendanceId={detailModal.attendanceId}
        initialData={detailModal.data}
        onClose={() =>
          setDetailModal({ open: false, attendanceId: null, data: null })
        }
      />
    </div>
  );
};

export default PendingAttendanceApprovals;
