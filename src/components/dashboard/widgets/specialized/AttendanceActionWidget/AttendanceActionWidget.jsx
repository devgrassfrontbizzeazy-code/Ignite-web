import { useEffect, useState } from "react";

import { Clock3, CircleCheck, LogIn, LogOut } from "lucide-react";

import DashboardWidget from "../../../DashboardWidget/DashboardWidget";
import "./AttendanceActionWidget.css";

const formatWorkingTime = (seconds = 0) => {
  const totalSeconds = Math.max(0, Math.floor(seconds));

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainingSeconds = totalSeconds % 60;

  if (hours === 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }

  return `${hours}h ${minutes}m ${remainingSeconds}s`;
};

const parseTimeToMinutes = (time) => {
  if (!time) {
    return null;
  }

  const match = time.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);

  if (!match) {
    return null;
  }

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3]?.toUpperCase();

  if (meridiem) {
    if (meridiem === "AM" && hours === 12) {
      hours = 0;
    }

    if (meridiem === "PM" && hours !== 12) {
      hours += 12;
    }
  }

  return hours * 60 + minutes;
};

const getShiftDurationSeconds = (shift) => {
  const start = parseTimeToMinutes(shift?.shiftStart);
  const end = parseTimeToMinutes(shift?.shiftEnd);

  if (start === null || end === null) {
    return 0;
  }

  let durationMinutes = end - start;

  if (durationMinutes <= 0) {
    durationMinutes += 24 * 60;
  }

  return durationMinutes * 60;
};

const getProgressPercentage = (workingDuration, shiftDuration) => {
  if (!shiftDuration || !workingDuration) {
    return 0;
  }

  return Math.min(Math.max((workingDuration / shiftDuration) * 100, 0), 100);
};

const getAttendanceState = (attendance) => {
  if (!attendance?.checkInAt) {
    return "not-started";
  }

  if (attendance?.checkInAt && !attendance?.checkOutAt) {
    return "working";
  }

  if (attendance?.checkOutAt) {
    return "completed";
  }

  return "not-started";
};

const AttendanceActionWidget = ({ data, loading }) => {
  const attendance = data?.attendance;
  const [liveWorkingDuration, setLiveWorkingDuration] = useState(0);

  useEffect(() => {
    const backendDuration = Number(attendance?.workingDuration || 0);

    setLiveWorkingDuration(backendDuration);

    if (!attendance?.checkInAt || attendance?.checkOutAt) {
      return;
    }

    const interval = setInterval(() => {
      setLiveWorkingDuration((current) => current + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [
    attendance?.workingDuration,
    attendance?.checkInAt,
    attendance?.checkOutAt,
  ]);

  const { punchIn, punchOut, attendanceActionLoading } = data || {};

 const workingDuration = liveWorkingDuration;

  const shiftDuration = getShiftDurationSeconds(attendance?.shift);

  const progressPercentage = getProgressPercentage(
    workingDuration,
    shiftDuration,
  );

  const attendanceState = getAttendanceState(attendance);

  const isNotStarted = attendanceState === "not-started";

  const isWorking = attendanceState === "working";

  const isCompleted = attendanceState === "completed";

  const buttonLoading = attendanceActionLoading;

  const buttonLabel = buttonLoading
    ? "Processing..."
    : isWorking
      ? "Punch Out"
      : isCompleted
        ? "Attendance Completed"
        : "Punch In";

  const ButtonIcon = isWorking ? LogOut : isCompleted ? CircleCheck : LogIn;

  const handleAttendanceAction = async () => {
    if (buttonLoading || isCompleted) {
      return;
    }

    if (isWorking) {
      await punchOut?.();
      return;
    }

    await punchIn?.();
  };

  return (
    <DashboardWidget
      title="Today's Attendance"
      action="View All"
      onAction={() => {
        window.location.href = "/attendance";
      }}
      loading={loading}
      className="attendance-action-widget"
    >
      <div className="attendance-action">
        {/* Check-in Time */}
        <div className="attendance-action__time-block">
          <div className="attendance-action__time-label">Checked In</div>
          <div className="attendance-action__time-value">
            {attendance?.checkInTimeFormatted || "--:--"}
          </div>
        </div>

        {/* Working Time Donut */}
        <div className="attendance-action__progress-area">
          <div
            className="attendance-action__donut"
            style={{
              "--attendance-progress": `${progressPercentage}%`,
            }}
          >
            <div className="attendance-action__donut-inner">
              <Clock3 size={20} />
              <strong>{formatWorkingTime(workingDuration)}</strong>
              <span>Worked</span>
            </div>
          </div>
        </div>

        {/* Main Action Button */}
        <button
          type="button"
          className={`attendance-action__button ${
            isWorking ? "attendance-action__button--out" : ""
          } ${isCompleted ? "attendance-action__button--completed" : ""}`}
          disabled={buttonLoading || isCompleted}
          onClick={handleAttendanceAction}
        >
          <ButtonIcon size={18} />
          <span>{buttonLabel}</span>
        </button>

        {/* Check-out Time (Only when checked out) */}
        {isCompleted && attendance?.checkOutTimeFormatted && (
          <div className="attendance-action__time-block">
            <div className="attendance-action__time-label">Checked Out</div>
            <div className="attendance-action__time-value">
              {attendance.checkOutTimeFormatted}
            </div>
          </div>
        )}
      </div>
    </DashboardWidget>
  );
};

export default AttendanceActionWidget;
