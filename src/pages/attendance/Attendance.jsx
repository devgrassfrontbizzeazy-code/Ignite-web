import { useState } from "react";
import { FiCalendar } from "react-icons/fi";

import AttendanceActionCard from "../../components/attendance/AttendanceActionCard/AttendanceActionCard";
import TodayPunchLog from "../../components/attendance/TodayPunchLog/TodayPunchLog";
import AttendanceStats from "../../components/attendance/AttendanceStats/AttendanceStats";
import AttendanceHistory from "../../components/attendance/AttendanceHistory/AttendanceHistory";

import "./Attendance.css";

const Attendance = () => {
  const [status, setStatus] = useState("checked_in");
  const [checkInTime, setCheckInTime] = useState(new Date());
  const [workedSeconds, setWorkedSeconds] = useState(0);
  const [breakSeconds, setBreakSeconds] = useState(0);

  const handleCheckIn = () => {
    setCheckInTime(new Date());
    setWorkedSeconds(0);
    setStatus("checked_in");
  };

  const handleCheckOut = () => {
    setStatus("checked_out");
  };

  const handleStartBreak = () => {
    setStatus("on_break");
  };

  const handleEndBreak = () => {
    setStatus("checked_in");
  };

  const today = new Date();

  const formattedDate = new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(today);

  const statusLabel =
    status === "checked_in"
      ? "Currently Working"
      : status === "on_break"
        ? "On Break"
        : "Not Checked In";

  return (
    <main className="attendance-page">
      <header className="attendance-page__header">
        <div>
          <span className="attendance-page__eyebrow">
            ATTENDANCE
          </span>

          <h1>My Attendance</h1>

          <p>
            Track your daily attendance, working hours and punch activity.
          </p>
        </div>

        <div className="attendance-page__header-actions">
          <div className="attendance-page__date">
            <FiCalendar />
            <span>{formattedDate}</span>
          </div>

          <div className="attendance-page__status">
            <span />
            {statusLabel}
          </div>
        </div>
      </header>

      <section className="attendance-page__hero">
        <AttendanceActionCard
          status={status}
          checkInTime={checkInTime}
          workedSeconds={workedSeconds}
          breakSeconds={breakSeconds}
          onCheckIn={handleCheckIn}
          onCheckOut={handleCheckOut}
          onStartBreak={handleStartBreak}
          onEndBreak={handleEndBreak}
        />

        <TodayPunchLog
          status={status}
          checkInTime={checkInTime}
        />
      </section>

      <AttendanceStats />

      <AttendanceHistory />
    </main>
  );
};

export default Attendance;