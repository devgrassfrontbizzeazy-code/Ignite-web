import { useEffect, useMemo, useState } from "react";
import {
  FiClock,
  FiLogIn,
  FiLogOut,
  FiCoffee,
  FiPlay,
} from "react-icons/fi";

import "./AttendanceActionCard.css";

const STATUS_CONFIG = {
  NOT_STARTED: {
    label: "Not Checked In",
    className: "is-checked-out",
  },
  WORKING: {
    label: "Currently Working",
    className: "is-checked-in",
  },
  ON_BREAK: {
    label: "On Break",
    className: "is-on-break",
  },
  PENDING_APPROVAL: {
    label: "Pending Approval",
    className: "is-pending",
  },
  APPROVED: {
    label: "Approved",
    className: "is-approved",
  },
  REJECTED: {
    label: "Rejected",
    className: "is-rejected",
  },
};

const formatTime = (date) => {
  if (!date) return "--:--";

  try {
    return new Intl.DateTimeFormat("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(date));
  } catch (e) {
    return "--:--";
  }
};

const formatDuration = (seconds = 0) => {
  const safeSeconds = Math.max(seconds, 0);

  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const secs = safeSeconds % 60;

  return `${String(hours).padStart(2, "0")}:${String(
    minutes
  ).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

const AttendanceActionCard = ({
  status = "NOT_STARTED",
  checkInTime = null,
  workedSeconds = 0,
  breakSeconds = 0,
  currentBreak = null,
  shiftStart = "09:30 AM",
  shiftEnd = "07:30 PM",
  targetSeconds = 8 * 60 * 60,
  onCheckIn,
  onCheckOut,
  onStartBreak,
  onEndBreak,
  disabled = false,
  loading = false,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Compute live worked seconds from authoritative timestamps
  const liveWorkedSeconds = useMemo(() => {
    if (status === "WORKING" && checkInTime) {
      const elapsed = Math.floor(
        (currentTime.getTime() - new Date(checkInTime).getTime()) / 1000
      );
      return Math.max(elapsed - breakSeconds, 0);
    }
    return Math.max(workedSeconds, 0);
  }, [currentTime, status, checkInTime, breakSeconds, workedSeconds]);

  // Compute live break seconds when on break
  const liveBreakSeconds = useMemo(() => {
    if (status === "ON_BREAK" && currentBreak?.breakStartAt) {
      const elapsed = Math.floor(
        (currentTime.getTime() - new Date(currentBreak.breakStartAt).getTime()) / 1000
      );
      return Math.max(breakSeconds + elapsed, 0);
    }
    return Math.max(breakSeconds, 0);
  }, [currentTime, status, currentBreak, breakSeconds]);

  const progress = Math.min(
    (liveWorkedSeconds / targetSeconds) * 100,
    100
  );

  const config = STATUS_CONFIG[status] || STATUS_CONFIG.NOT_STARTED;

  return (
    <section className={`attendance-action-card ${config.className}`}>
      <div className="attendance-action-card__top">
        <div>
          <span className="attendance-action-card__eyebrow">
            TODAY'S ATTENDANCE
          </span>

          <h2>Work Session</h2>

          <p>Your attendance and working time for today</p>
        </div>

        <div className="attendance-action-card__status">
          <span />
          {config.label}
        </div>
      </div>

      <div className="attendance-action-card__content">
        <div className="attendance-action-card__ring-wrapper">
          <div
            className="attendance-action-card__ring"
            style={{
              "--attendance-progress": `${progress}%`,
            }}
          >
            <div className="attendance-action-card__ring-inner">
              <FiClock />

              <strong>{formatDuration(liveWorkedSeconds)}</strong>

              <span>Worked</span>
            </div>
          </div>
        </div>

        <div className="attendance-action-card__details">
          <div className="attendance-action-card__shift">
            <span>Today's Shift</span>

            <strong>
              {shiftStart} — {shiftEnd}
            </strong>
          </div>

          <div className="attendance-action-card__metrics">
            <div>
              <span>Check In</span>
              <strong>{formatTime(checkInTime)}</strong>
            </div>

            <div>
              <span>Break Time</span>
              <strong>{formatDuration(liveBreakSeconds)}</strong>
            </div>

            <div>
              <span>Target</span>
              <strong>08:00:00</strong>
            </div>
          </div>

          <div className="attendance-action-card__remaining">
            <div>
              <span>Working hours</span>
              <strong>{formatDuration(liveWorkedSeconds)}</strong>
            </div>

            <span className="attendance-action-card__progress-text">
              {Math.round(progress)}% completed
            </span>
          </div>
        </div>
      </div>

      <div className="attendance-action-card__actions">
        {status === "NOT_STARTED" && (
          <button
            type="button"
            className="attendance-action-card__button attendance-action-card__button--primary"
            onClick={onCheckIn}
            disabled={disabled || loading}
          >
            <FiLogIn />
            Punch In
          </button>
        )}

        {status === "WORKING" && (
          <>
            <button
              type="button"
              className="attendance-action-card__button attendance-action-card__button--secondary"
              onClick={onStartBreak}
              disabled={disabled || loading}
            >
              <FiCoffee />
              Start Break
            </button>

            <button
              type="button"
              className="attendance-action-card__button attendance-action-card__button--danger"
              onClick={onCheckOut}
              disabled={disabled || loading}
            >
              <FiLogOut />
              Punch Out
            </button>
          </>
        )}

        {status === "ON_BREAK" && (
          <>
            <button
              type="button"
              className="attendance-action-card__button attendance-action-card__button--primary"
              onClick={onEndBreak}
              disabled={disabled || loading}
            >
              <FiPlay />
              End Break
            </button>

            <button
              type="button"
              className="attendance-action-card__button attendance-action-card__button--danger"
              onClick={onCheckOut}
              disabled={true}
              title="Please end your break before punching out"
            >
              <FiLogOut />
              Punch Out
            </button>
          </>
        )}

        {(status === "PENDING_APPROVAL" || status === "APPROVED" || status === "REJECTED") && (
          <button
            type="button"
            className="attendance-action-card__button attendance-action-card__button--secondary"
            disabled={true}
          >
            {status === "PENDING_APPROVAL" && "Attendance Submitted (Pending Approval)"}
            {status === "APPROVED" && "Attendance Approved for Today"}
            {status === "REJECTED" && "Attendance Rejected"}
          </button>
        )}
      </div>
    </section>
  );
};

export default AttendanceActionCard;