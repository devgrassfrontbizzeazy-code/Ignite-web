import { useEffect, useState, useCallback, useMemo } from "react";
import { FiCalendar, FiCheckCircle, FiAlertCircle } from "react-icons/fi";

import AttendanceActionCard from "../../components/attendance/AttendanceActionCard/AttendanceActionCard";
import TodayPunchLog from "../../components/attendance/TodayPunchLog/TodayPunchLog";
import AttendanceStats from "../../components/attendance/AttendanceStats/AttendanceStats";
import AttendanceHistory from "../../components/attendance/AttendanceHistory/AttendanceHistory";
import AttendanceDetailModal from "../../components/attendance/AttendanceDetailModal/AttendanceDetailModal";
import EmployeeAttendance from "../../components/attendance/EmployeeAttendance/EmployeeAttendance";
import Modal from "../../components/common/Modal/Modal";
import Button from "../../components/common/Button/Button";

import { attendanceAPI } from "../../services/api/attendanceAPI";
import "./Attendance.css";

const STATUS_LABELS = {
  NOT_STARTED: "Not Checked In",
  WORKING: "Currently Working",
  ON_BREAK: "On Break",
  PENDING_APPROVAL: "Pending Approval",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

const Attendance = () => {
  // Permission resolution
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  }, []);

  const rawRole = String(user.role || "").toUpperCase();
  const isAdminOrOwner =
    rawRole === "OWNER" ||
    rawRole === "ADMIN" ||
    rawRole === "ADMINISTRATOR" ||
    user.is_superuser === true;

  const userPermissions = Array.isArray(user.permissions)
    ? user.permissions
    : [];

  const canViewEmployees =
    isAdminOrOwner ||
    userPermissions.includes("*") ||
    userPermissions.includes("attendance.view_all") ||
    userPermissions.includes("view_all_attendance") ||
    userPermissions.includes("attendance.manage") ||
    userPermissions.includes("manage_attendance") ||
    userPermissions.includes("view_employee_attendance") ||
    userPermissions.includes("attendance.view_employees");

  // Tab State: 'my' | 'employees'
  const [activeTab, setActiveTab] = useState("my");
  const effectiveTab = canViewEmployees ? activeTab : "my";

  // Today's attendance state
  const [todayData, setTodayData] = useState(null);
  const [loadingToday, setLoadingToday] = useState(true);

  // History & stats state
  const [historyRecords, setHistoryRecords] = useState([]);
  const [statsData, setStatsData] = useState([]);
  const [activePeriod, setActivePeriod] = useState("15d");
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Action loading state
  const [actionLoading, setActionLoading] = useState(false);

  // Modals state
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    type: null, // 'punch-in' | 'start-break' | 'end-break' | 'punch-out'
    title: "",
    description: "",
    confirmText: "Confirm",
    confirmVariant: "primary",
    onConfirm: null,
  });

  const [detailModal, setDetailModal] = useState({
    open: false,
    attendanceId: null,
    data: null,
  });

  // Toast state
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "success" });
    }, 4500);
  };

  // Fetch today's attendance state
  const fetchTodayAttendance = useCallback(async () => {
    try {
      setLoadingToday(true);
      const res = await attendanceAPI.getTodayAttendance();
      if (res?.data) {
        setTodayData(res.data);
        if (res.data.stats && Array.isArray(res.data.stats) && res.data.stats.length > 0) {
          setStatsData(res.data.stats);
        }
      }
    } catch (err) {
      console.error("Failed to fetch today's attendance", err);
      const msg = err.response?.data?.message || "Failed to load today's attendance.";
      showToast(msg, "error");
    } finally {
      setLoadingToday(false);
    }
  }, []);

  // Fetch attendance history & statistics
  const fetchHistory = useCallback(async (period = "15d") => {
    try {
      setLoadingHistory(true);
      const res = await attendanceAPI.getAttendanceHistory(period);
      if (res?.data) {
        setHistoryRecords(res.data);
      }
      if (res?.stats) {
        setStatsData(res.stats);
      }
    } catch (err) {
      console.error("Failed to fetch attendance history", err);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    fetchTodayAttendance();
    fetchHistory(activePeriod);
  }, [fetchTodayAttendance, fetchHistory, activePeriod]);

  // Handle period switch
  const handleSelectPeriod = (period) => {
    setActivePeriod(period);
    fetchHistory(period);
  };

  // ==========================================
  // CONFIRMATION & API ACTION HANDLERS
  // ==========================================

  // Step 1: Punch In Flow
  const handleRequestPunchIn = () => {
    setConfirmModal({
      open: true,
      type: "punch-in",
      title: "Start Work Session?",
      description: "Are you sure you want to punch in and start your work session?",
      confirmText: "Confirm Punch In",
      confirmVariant: "primary",
      onConfirm: executePunchIn,
    });
  };

  const executePunchIn = async () => {
    try {
      setActionLoading(true);
      const res = await attendanceAPI.punchIn();
      if (res?.data) {
        setTodayData(res.data);
      }
      showToast(res?.message || "Work session started successfully!", "success");
      setConfirmModal((prev) => ({ ...prev, open: false }));
      fetchHistory(activePeriod);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to punch in. Please try again.";
      showToast(msg, "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Step 2: Start Break Flow
  const handleRequestStartBreak = () => {
    setConfirmModal({
      open: true,
      type: "start-break",
      title: "Start Break?",
      description: "Are you sure you want to start your break?",
      confirmText: "Start Break",
      confirmVariant: "primary",
      onConfirm: executeStartBreak,
    });
  };

  const executeStartBreak = async () => {
    try {
      setActionLoading(true);
      const res = await attendanceAPI.startBreak();
      if (res?.data) {
        setTodayData(res.data);
      }
      showToast(res?.message || "Break started. Enjoy your break!", "success");
      setConfirmModal((prev) => ({ ...prev, open: false }));
      fetchHistory(activePeriod);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to start break.";
      showToast(msg, "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Step 3: End Break Flow
  const handleRequestEndBreak = () => {
    setConfirmModal({
      open: true,
      type: "end-break",
      title: "End Break?",
      description: "Are you sure you want to end your break and resume working?",
      confirmText: "End Break",
      confirmVariant: "primary",
      onConfirm: executeEndBreak,
    });
  };

  const executeEndBreak = async () => {
    try {
      setActionLoading(true);
      const res = await attendanceAPI.endBreak();
      if (res?.data) {
        setTodayData(res.data);
      }
      showToast(res?.message || "Break ended. Resumed working session.", "success");
      setConfirmModal((prev) => ({ ...prev, open: false }));
      fetchHistory(activePeriod);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to end break.";
      showToast(msg, "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Step 4: Punch Out Flow
  const handleRequestPunchOut = () => {
    if (todayData?.status === "ON_BREAK") {
      showToast("You are currently on break. Please end your break before punching out.", "error");
      return;
    }

    setConfirmModal({
      open: true,
      type: "punch-out",
      title: "Punch Out?",
      description:
        "Are you sure you want to punch out for today? After punching out, you cannot punch in again until the next attendance day starts at 4:00 AM.",
      confirmText: "Confirm Punch Out",
      confirmVariant: "danger",
      onConfirm: executePunchOut,
    });
  };

  const executePunchOut = async () => {
    try {
      setActionLoading(true);
      const res = await attendanceAPI.punchOut();
      if (res?.data) {
        setTodayData(res.data);
      }
      showToast(
        res?.message || "Successfully punched out! Your attendance has been submitted for approval.",
        "success"
      );
      setConfirmModal((prev) => ({ ...prev, open: false }));
      fetchHistory(activePeriod);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to punch out.";
      showToast(msg, "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle View Details Modal
  const handleOpenDetails = (record) => {
    setDetailModal({
      open: true,
      attendanceId: record.id,
      data: record,
    });
  };

  // Formatted current date
  const today = new Date();
  const formattedDate = new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(today);

  const currentStatus = todayData?.status || "NOT_STARTED";
  const statusLabel = STATUS_LABELS[currentStatus] || "Not Checked In";

  return (
    <main className="attendance-page">
      {/* HEADER */}
      <header className="attendance-page__header">
        <div>
          <span className="attendance-page__eyebrow">ATTENDANCE</span>
          <h1>{effectiveTab === "my" ? "My Attendance" : "Employee Attendance"}</h1>
          <p>
            {effectiveTab === "my"
              ? "Track your daily attendance, working hours and punch activity."
              : "Monitor company-wide employee attendance, live status, and approvals."}
          </p>
        </div>

        <div className="attendance-page__header-actions">
          <div className="attendance-page__date">
            <FiCalendar />
            <span>{formattedDate}</span>
          </div>

          {effectiveTab === "my" && (
            <div className="attendance-page__status">
              <span />
              {statusLabel}
            </div>
          )}
        </div>
      </header>

      {/* SUB-NAVIGATION TABS (Rendered only if user has permission to view employee attendance) */}
      {canViewEmployees && (
        <div className="attendance-page__nav-tabs">
          <button
            type="button"
            className={`attendance-page__nav-tab ${effectiveTab === "my" ? "active" : ""}`}
            onClick={() => setActiveTab("my")}
          >
            My Attendance
          </button>
          <button
            type="button"
            className={`attendance-page__nav-tab ${effectiveTab === "employees" ? "active" : ""}`}
            onClick={() => setActiveTab("employees")}
          >
            Employee Attendance
          </button>
        </div>
      )}

      {/* TAB 1: MY ATTENDANCE CONTENT */}
      {effectiveTab === "my" && (
        <>
          {/* HERO SECTION */}
          <section className="attendance-page__hero">
            <AttendanceActionCard
              status={currentStatus}
              checkInTime={todayData?.checkInAt}
              workedSeconds={todayData?.workingDuration || 0}
              breakSeconds={todayData?.totalBreakDuration || 0}
              currentBreak={todayData?.currentBreak}
              shiftStart={todayData?.shift?.shiftStart || "09:30 AM"}
              shiftEnd={todayData?.shift?.shiftEnd || "07:30 PM"}
              targetSeconds={todayData?.shift?.targetSeconds || 28800}
              onCheckIn={handleRequestPunchIn}
              onCheckOut={handleRequestPunchOut}
              onStartBreak={handleRequestStartBreak}
              onEndBreak={handleRequestEndBreak}
              loading={actionLoading}
            />

            <TodayPunchLog
              status={currentStatus}
              checkInTime={todayData?.checkInAt}
              checkOutTime={todayData?.checkOutAt}
              timeline={todayData?.timeline || []}
              shiftEnd={todayData?.shift?.shiftEnd || "07:30 PM"}
              location="Office HQ"
            />
          </section>

          {/* STATS SECTION */}
          <AttendanceStats stats={statsData} />

          {/* HISTORY TABLE & CALENDAR */}
          <AttendanceHistory
            records={historyRecords}
            activePeriod={activePeriod}
            onSelectPeriod={handleSelectPeriod}
            onViewDetails={handleOpenDetails}
            loading={loadingHistory}
          />
        </>
      )}

      {/* TAB 2: EMPLOYEE ATTENDANCE CONTENT */}
      {effectiveTab === "employees" && canViewEmployees && (
        <EmployeeAttendance onShowToast={showToast} />
      )}

      {/* CONFIRMATION MODAL */}
      <Modal
        open={confirmModal.open}
        onClose={() => setConfirmModal((prev) => ({ ...prev, open: false }))}
        title={confirmModal.title}
        description={confirmModal.description}
        size="small"
        footer={
          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", width: "100%" }}>
            <Button
              variant="secondary"
              onClick={() => setConfirmModal((prev) => ({ ...prev, open: false }))}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              variant={confirmModal.confirmVariant}
              onClick={confirmModal.onConfirm}
              loading={actionLoading}
            >
              {confirmModal.confirmText}
            </Button>
          </div>
        }
      />

      {/* ATTENDANCE DETAIL MODAL */}
      <AttendanceDetailModal
        open={detailModal.open}
        attendanceId={detailModal.attendanceId}
        initialData={detailModal.data}
        onClose={() => setDetailModal({ open: false, attendanceId: null, data: null })}
      />

      {/* TOAST FEEDBACK NOTIFICATION */}
      {toast.show && (
        <div className={`attendance-toast attendance-toast--${toast.type}`}>
          {toast.type === "success" ? <FiCheckCircle /> : <FiAlertCircle />}
          <span>{toast.message}</span>
        </div>
      )}
    </main>
  );
};

export default Attendance;