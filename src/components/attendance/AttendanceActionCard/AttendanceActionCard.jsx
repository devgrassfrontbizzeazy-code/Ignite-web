import { useEffect, useState } from "react";
import {
  FiActivity,
  FiCalendar,
  FiCheck,
  FiCoffee,
  FiLogIn,
  FiLogOut,
  FiPlay,
} from "react-icons/fi";

import "./AttendanceActionCard.css";

const STATUS_CONFIG = {
  checked_out: {
    label: "Not Checked In",
    className: "checked-out",
  },

  checked_in: {
    label: "Checked In",
    className: "checked-in",
  },

  on_break: {
    label: "On Break",
    className: "on-break",
  },
};

const formatTime = (date) => {
  if (!date) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
};

const formatDate = (date) => {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const formatDuration = (seconds = 0) => {
  if (!seconds || seconds < 0) {
    return "0h 00m";
  }

  const totalMinutes = Math.floor(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${hours}h ${String(minutes).padStart(2, "0")}m`;
};

const AttendanceActionCard = ({
  status = "checked_out",
  checkInTime = null,
  workedSeconds = 0,
  breakSeconds = 0,

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

  const statusConfig =
    STATUS_CONFIG[status] || STATUS_CONFIG.checked_out;

  const calculatedWorkedSeconds =
    status === "checked_in" && checkInTime
      ? Math.max(
          workedSeconds +
            Math.floor(
              (currentTime.getTime() -
                new Date(checkInTime).getTime()) /
                1000,
            ),
          0,
        )
      : workedSeconds;

  return (
    <section
      className={`attendance-card attendance-card--${statusConfig.className}`}
    >
      {/* Header */}
      <div className="attendance-card__top">
        <div className="attendance-card__status">
          <span className="attendance-card__status-dot" />
          <span>{statusConfig.label}</span>
        </div>

        <div className="attendance-card__datetime">
          <strong>{formatTime(currentTime)}</strong>

          <span>
            <FiCalendar />
            {formatDate(currentTime)}
          </span>
        </div>
      </div>

      {/* Total Hours */}
      <div className="attendance-card__hours">
        <div className="attendance-card__ring">
          <div className="attendance-card__ring-inner">
            <span>Total Hours</span>

            <strong>
              {formatDuration(calculatedWorkedSeconds)}
            </strong>
          </div>
        </div>
      </div>

      {/* Attendance Information */}
      <div className="attendance-card__info">
        <div className="attendance-card__info-item">
          <span className="attendance-card__info-icon">
            <FiActivity />
          </span>

          <div>
            <span>Production</span>
            <strong>3.45 hrs</strong>
          </div>
        </div>

        {status === "checked_in" && (
          <div className="attendance-card__info-item">
            <span className="attendance-card__info-icon">
              <FiLogIn />
            </span>

            <div>
              <span>Punch In</span>

              <strong>
                {checkInTime
                  ? formatTime(new Date(checkInTime))
                  : "—"}
              </strong>
            </div>
          </div>
        )}

        {status === "on_break" && (
          <div className="attendance-card__info-item">
            <span className="attendance-card__info-icon">
              <FiCoffee />
            </span>

            <div>
              <span>Break Time</span>

              <strong>
                {formatDuration(breakSeconds)}
              </strong>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="attendance-card__actions">
        {status === "checked_out" && (
          <button
            type="button"
            className="attendance-card__button attendance-card__button--check-in"
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
              className="attendance-card__button attendance-card__button--break"
              onClick={onStartBreak}
              disabled={disabled}
            >
              <FiCoffee />
              Break
            </button>

            <button
              type="button"
              className="attendance-card__button attendance-card__button--check-out"
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
              className="attendance-card__button attendance-card__button--end-break"
              onClick={onEndBreak}
              disabled={disabled}
            >
              <FiPlay />
              End Break
            </button>

            <button
              type="button"
              className="attendance-card__button attendance-card__button--check-out"
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