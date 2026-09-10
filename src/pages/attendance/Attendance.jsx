
import { useState } from "react";

import PageHeader from "../../components/common/PageHeader/PageHeader";
import AttendanceActionCard from "../../components/attendance/AttendanceActionCard/AttendanceActionCard";

import "./Attendance.css";

const Attendance = () => {
  const [status, setStatus] = useState("checked_in");

  const [checkInTime] = useState(
    "2026-09-10T10:02:00",
  );

  const [workedSeconds] = useState(16560);

  const [breakSeconds, setBreakSeconds] = useState(1920);

  const handleCheckIn = () => {
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

  return (
    <div className="attendance-page">
      <div className="attendance-page__header">
        <PageHeader
          title="Attendance"
          description="Manage your daily attendance, work hours, and breaks."
        />
      </div>

      <div className="attendance-page__content">
        <div className="attendance-page__action">
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
        </div>

        <div className="attendance-page__future">
          <div className="attendance-page__future-content">
            <span className="attendance-page__future-label">
              Attendance
            </span>

            <h2>More attendance insights coming here</h2>

            <p>
              Daily records, attendance history, break history,
              summaries, and other attendance features will be
              added here.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Attendance;

