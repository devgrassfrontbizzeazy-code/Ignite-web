import { useState } from "react";
import {
  FiCalendar,
  FiDownload,
  FiList,
} from "react-icons/fi";

import "./AttendanceHistory.css";

const PERIODS = [
  { label: "15 Days", value: "15d" },
  { label: "1 Month", value: "1m" },
  { label: "3 Months", value: "3m" },
  { label: "6 Months", value: "6m" },
  { label: "1 Year", value: "1y" },
];

const AttendanceHistory = ({
  records = [],
  activePeriod = "15d",
  onSelectPeriod,
  onViewDetails,
  loading = false,
}) => {
  const [view, setView] = useState("table");

  const currentPeriodObj = PERIODS.find((p) => p.value === activePeriod) || PERIODS[0];

  const handleExport = () => {
    if (!records.length) return;
    const headers = ["Date", "Check In", "Break Period", "Check Out", "Working Hours", "Status"];
    const csvRows = [
      headers.join(","),
      ...records.map((r) =>
        [
          `"${r.date}"`,
          `"${r.checkIn}"`,
          `"${r.breakPeriod}"`,
          `"${r.checkOut}"`,
          `"${r.hours}"`,
          `"${r.status}"`,
        ].join(",")
      ),
    ];
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `attendance_history_${activePeriod}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <section className="attendance-history">
      {/* HEADER */}
      <div className="attendance-history__header">
        <div>
          <h2>Attendance History</h2>
          <p>Showing past {currentPeriodObj.label.toLowerCase()} of attendance.</p>
        </div>

        <div className="attendance-history__actions">
          <button
            type="button"
            className={view === "table" ? "active" : ""}
            onClick={() => setView("table")}
          >
            <FiList />
            Table
          </button>

          <button
            type="button"
            className={view === "calendar" ? "active" : ""}
            onClick={() => setView("calendar")}
          >
            <FiCalendar />
            Calendar
          </button>

          <button
            type="button"
            className="attendance-history__export"
            onClick={handleExport}
            disabled={!records.length}
          >
            <FiDownload />
            Export
          </button>
        </div>
      </div>

      {/* PERIOD FILTER */}
      <div className="attendance-history__filters">
        {PERIODS.map((item) => (
          <button
            type="button"
            key={item.value}
            className={activePeriod === item.value ? "active" : ""}
            onClick={() => onSelectPeriod?.(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* TABLE VIEW */}
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
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center", padding: "30px", color: "var(--color-text-muted)" }}>
                    Loading attendance records...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center", padding: "30px", color: "var(--color-text-muted)" }}>
                    No attendance records found for this period.
                  </td>
                </tr>
              ) : (
                records.map((record) => {
                  const statusKey = (record.status || "present").toLowerCase();

                  return (
                    <tr key={record.id || record.attendanceDate || record.date}>
                      <td>
                        <strong>{record.date}</strong>
                      </td>

                      <td>{record.checkIn}</td>

                      <td>{record.breakPeriod}</td>

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
                        <strong>{record.hours}</strong>
                      </td>

                      <td>
                        <span
                          className={`attendance-history__status attendance-history__status--${statusKey}`}
                        >
                          {record.status}
                        </span>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="attendance-history__details"
                          onClick={() => onViewDetails?.(record)}
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* CALENDAR VIEW */}
      {view === "calendar" && (
        <div className="attendance-history__calendar">
          <FiCalendar />
          <h3>Calendar View</h3>
          <p>Attendance calendar will display daily attendance status here.</p>
        </div>
      )}
    </section>
  );
};

export default AttendanceHistory;