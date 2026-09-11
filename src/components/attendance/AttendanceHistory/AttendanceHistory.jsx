import { useState } from "react";
import {
  FiCalendar,
  FiDownload,
  FiList,
} from "react-icons/fi";

import "./AttendanceHistory.css";

const PERIODS = [
  "15 Days",
  "1 Month",
  "3 Months",
  "6 Months",
  "1 Year",
];

const ATTENDANCE_DATA = [
  {
    date: "Today, Sep 11",
    checkIn: "09:32 AM",
    breakPeriod: "01:15 - 02:00 PM",
    checkOut: "Active",
    hours: "6h 42m",
    status: "Present",
    active: true,
  },
  {
    date: "Sep 10, 2026",
    checkIn: "09:32 AM",
    breakPeriod: "01:15 - 02:00 PM",
    checkOut: "06:48 PM",
    hours: "8h 01m",
    status: "Present",
  },
  {
    date: "Sep 09, 2026",
    checkIn: "09:41 AM",
    breakPeriod: "01:20 - 02:00 PM",
    checkOut: "06:55 PM",
    hours: "7h 54m",
    status: "Late",
  },
  {
    date: "Sep 08, 2026",
    checkIn: "09:28 AM",
    breakPeriod: "01:10 - 01:55 PM",
    checkOut: "06:40 PM",
    hours: "7h 57m",
    status: "Present",
  },
  {
    date: "Sep 07, 2026",
    checkIn: "09:30 AM",
    breakPeriod: "01:15 - 02:00 PM",
    checkOut: "06:42 PM",
    hours: "7h 57m",
    status: "Present",
  },
];

const AttendanceHistory = () => {
  const [period, setPeriod] =
    useState("15 Days");

  const [view, setView] =
    useState("table");

  return (
    <section className="attendance-history">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="attendance-history__header">
        <div>
          <h2>Attendance History</h2>

          <p>
            Showing past {period.toLowerCase()} of
            attendance.
          </p>
        </div>

        <div className="attendance-history__actions">
          <button
            type="button"
            className={
              view === "table"
                ? "active"
                : ""
            }
            onClick={() =>
              setView("table")
            }
          >
            <FiList />
            Table
          </button>

          <button
            type="button"
            className={
              view === "calendar"
                ? "active"
                : ""
            }
            onClick={() =>
              setView("calendar")
            }
          >
            <FiCalendar />
            Calendar
          </button>

          <button
            type="button"
            className="attendance-history__export"
          >
            <FiDownload />
            Export
          </button>
        </div>
      </div>

      {/* =====================================================
          PERIOD FILTER
      ===================================================== */}

      <div className="attendance-history__filters">
        {PERIODS.map((item) => (
          <button
            type="button"
            key={item}
            className={
              period === item
                ? "active"
                : ""
            }
            onClick={() =>
              setPeriod(item)
            }
          >
            {item}
          </button>
        ))}
      </div>

      {/* =====================================================
          TABLE VIEW
      ===================================================== */}

      {view === "table" && (
        <div className="attendance-history__table-wrapper">
          <table className="attendance-history__table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Check In</th>
                <th>Break Period</th>
                <th>Check Out</th>
                <th>Working Hours</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {ATTENDANCE_DATA.map(
                (record) => (
                  <tr key={record.date}>
                    <td>
                      <strong>
                        {record.date}
                      </strong>
                    </td>

                    <td>
                      {record.checkIn}
                    </td>

                    <td>
                      {record.breakPeriod}
                    </td>

                    <td>
                      <span
                        className={
                          record.active
                            ? "attendance-history__active-time"
                            : ""
                        }
                      >
                        {record.checkOut}
                      </span>
                    </td>

                    <td>
                      <strong>
                        {record.hours}
                      </strong>
                    </td>

                    <td>
                      <span
                        className={`attendance-history__status attendance-history__status--${record.status.toLowerCase()}`}
                      >
                        {record.status}
                      </span>
                    </td>

                    <td>
                      <button
                        type="button"
                        className="attendance-history__details"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* =====================================================
          CALENDAR VIEW
      ===================================================== */}

      {view === "calendar" && (
        <div className="attendance-history__calendar">
          <FiCalendar />

          <h3>
            Calendar View
          </h3>

          <p>
            Attendance calendar will display
            daily attendance status here.
          </p>
        </div>
      )}
    </section>
  );
};

export default AttendanceHistory;