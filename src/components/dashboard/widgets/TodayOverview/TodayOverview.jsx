import { LogIn, LogOut, Timer, CalendarClock, CircleCheck } from "lucide-react";

import DashboardWidget from "../../DashboardWidget/DashboardWidget";
import "./TodayOverview.css";

const formatWorkingTime = (seconds = 0) => {
  const totalMinutes = Math.floor(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes}m`;
  }

  return `${hours}h ${minutes}m`;
};

const TodayOverview = ({ data, loading }) => {
  const attendance = data?.attendance;

  const {
    punchIn,
    punchOut,
    attendanceActionLoading,
  } = data || {};
  const getAttendanceStatusLabel = (status) => {
  const labels = {
    WORKING: "Working",
    COMPLETED: "Completed",
    PENDING_APPROVAL: "Pending Approval",
    APPROVED: "Approved",
    REJECTED: "Rejected",
  };

  return labels[status] || "Not Started";
};

  const isWorking = attendance?.status === "WORKING";
  const isCompleted = attendance?.status === "COMPLETED";

  const statusLabel = getAttendanceStatusLabel(attendance?.status);
  const canCheckIn =
  !attendance?.checkInAt && !attendanceActionLoading;

const canCheckOut =
  !!attendance?.checkInAt &&
  !attendance?.checkOutAt &&
  !attendanceActionLoading;

  const handleCheckIn = () => {
    window.location.href = "/attendance";
  };

  const handleCheckOut = () => {
    window.location.href = "/attendance";
  };

  return (
    <DashboardWidget
      title="Today's Attendance"
      action="View Attendance"
      onAction={() => {
        window.location.href = "/attendance";
      }}
      loading={loading}
      className="today-overview-widget"
    >
      <div className="today-overview">
        {/* Status */}
        <div className="today-overview__status">
          <div className="today-overview__status-left">
            <div className="today-overview__status-icon">
              <CircleCheck size={21} />
            </div>

            <div>
              <span className="today-overview__status-label">
                Today's Status
              </span>

              <h3>{statusLabel}</h3>
            </div>
          </div>

          <div className="today-overview__status-badge">
            <span className="today-overview__status-badge-dot" />
            {attendance?.approvalStatus === "PENDING"
              ? "Awaiting Approval"
              : "Up to date"}
          </div>
        </div>

        {/* Attendance Actions */}
        <div className="today-overview__actions">
          <button
            type="button"
            className="today-overview__action today-overview__action--check-in"
            disabled={!canCheckIn}
            onClick={punchIn}
          >
            <span className="today-overview__action-icon">
              <LogIn size={17} />
            </span>

            <span>
              <small>Attendance</small>
              <strong>
                {attendanceActionLoading ? "Processing..." : "Check In"}
              </strong>
            </span>
          </button>

          <button
            type="button"
            className="today-overview__action today-overview__action--check-out"
            disabled={!canCheckOut}
            onClick={punchOut}
          >
            <span className="today-overview__action-icon">
              <LogOut size={17} />
            </span>

            <span>
              <small>Attendance</small>
              <strong>
                {attendanceActionLoading ? "Processing..." : "Check Out"}
              </strong>
            </span>
          </button>
        </div>

        {/* Stats */}
        <div className="today-overview__stats">
          <div className="today-overview__stat">
            <div className="today-overview__stat-icon">
              <LogIn size={17} />
            </div>

            <div>
              <span>Check In</span>
              <strong>{attendance?.checkInTimeFormatted || "--:--"}</strong>
            </div>
          </div>

          <div className="today-overview__stat">
            <div className="today-overview__stat-icon">
              <Timer size={17} />
            </div>

            <div>
              <span>Working</span>
              <strong>{formatWorkingTime(attendance?.workingDuration)}</strong>
            </div>
          </div>

          <div className="today-overview__stat">
            <div className="today-overview__stat-icon">
              <CalendarClock size={17} />
            </div>

            <div>
              <span>Shift</span>
              <strong>
                {attendance?.shift?.shiftStart || "--"} -{" "}
                {attendance?.shift?.shiftEnd || "--"}
              </strong>
            </div>
          </div>
        </div>
      </div>
    </DashboardWidget>
  );
};

export default TodayOverview;
