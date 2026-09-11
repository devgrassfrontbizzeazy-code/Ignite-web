import { useEffect, useMemo, useState } from "react";
import {
  FiClock,
  FiLogIn,
  FiLogOut,
  FiCoffee,
  FiPlay,
  FiPause,
} from "react-icons/fi";

import "./AttendanceActionCard.css";

const STATUS_CONFIG = {
  checked_out: {
    label: "Not Checked In",
    className: "is-checked-out",
  },
  checked_in: {
    label: "Currently Working",
    className: "is-checked-in",
  },
  on_break: {
    label: "On Break",
    className: "is-on-break",
  },
};

const formatTime = (date) => {
  if (!date) return "--:--";

  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(date));
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
  status,
  checkInTime,
  workedSeconds = 0,
  breakSeconds = 0,
  shiftStart = "09:30 AM",
  shiftEnd = "07:30 PM",
  targetSeconds = 8 * 60 * 60,
  onCheckIn,
  onCheckOut,
  onStartBreak,
  onEndBreak,
  disabled = false,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const liveWorkedSeconds = useMemo(() => {
    if (status === "checked_in" && checkInTime) {
      const elapsed = Math.floor(
        (currentTime.getTime() -
          new Date(checkInTime).getTime()) /
          1000
      );

      return Math.max(workedSeconds + elapsed, 0);
    }

    return Math.max(workedSeconds, 0);
  }, [currentTime, status, checkInTime, workedSeconds]);

  const progress = Math.min(
    (liveWorkedSeconds / targetSeconds) * 100,
    100
  );

  const config = STATUS_CONFIG[status] || STATUS_CONFIG.checked_out;

  return (
    <section
      className={`attendance-action-card ${config.className}`}
    >
      <div className="attendance-action-card__top">
        <div>
          <span className="attendance-action-card__eyebrow">
            TODAY'S ATTENDANCE
          </span>

          <h2>Work Session</h2>

          <p>
            Your attendance and working time for today
          </p>
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

              <strong>
                {formatDuration(liveWorkedSeconds)}
              </strong>

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
              <strong>{formatDuration(breakSeconds)}</strong>
            </div>

            <div>
              <span>Target</span>
              <strong>08:00:00</strong>
            </div>
          </div>

          <div className="attendance-action-card__remaining">
            <div>
              <span>Working hours</span>
              <strong>
                {formatDuration(liveWorkedSeconds)}
              </strong>
            </div>

            <span className="attendance-action-card__progress-text">
              {Math.round(progress)}% completed
            </span>
          </div>
        </div>
      </div>

      <div className="attendance-action-card__actions">
        {status === "checked_out" && (
          <button
            type="button"
            className="attendance-action-card__button attendance-action-card__button--primary"
            onClick={onCheckIn}
            disabled={disabled}
          >
            <FiLogIn />
            Punch In
          </button>
        )}

        {status === "checked_in" && (
          <>
            <button
              type="button"
              className="attendance-action-card__button attendance-action-card__button--secondary"
              onClick={onStartBreak}
              disabled={disabled}
            >
              <FiCoffee />
              Start Break
            </button>

            <button
              type="button"
              className="attendance-action-card__button attendance-action-card__button--danger"
              onClick={onCheckOut}
              disabled={disabled}
            >
              <FiLogOut />
              Punch Out
            </button>
          </>
        )}

        {status === "on_break" && (
          <>
            <button
              type="button"
              className="attendance-action-card__button attendance-action-card__button--primary"
              onClick={onEndBreak}
              disabled={disabled}
            >
              <FiPlay />
              End Break
            </button>

            <button
              type="button"
              className="attendance-action-card__button attendance-action-card__button--danger"
              onClick={onCheckOut}
              disabled={disabled}
            >
              <FiLogOut />
              Punch Out
            </button>
          </>
        )}
      </div>
    </section>
  );
};

export default AttendanceActionCard;