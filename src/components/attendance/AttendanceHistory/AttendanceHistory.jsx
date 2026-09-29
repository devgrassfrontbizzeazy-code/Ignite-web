import { useState } from "react";
import {
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiDownload,
  FiList,
} from "react-icons/fi";

import DatePicker from "../../common/DatePicker/DatePicker";

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
  const todayStr = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [calendarDate, setCalendarDate] = useState(new Date());

  const calendarYear = calendarDate.getFullYear();
  const calendarMonth = calendarDate.getMonth();

  const monthName = calendarDate.toLocaleString("en-US", {
    month: "long",
  });

  const firstDayOfMonth = new Date(calendarYear, calendarMonth, 1).getDay();

  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();

  const calendarCells = [
    ...Array(firstDayOfMonth).fill(null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];

  const getRecordForDate = (day) => {
    if (!day) return null;

    const dateString = `${calendarYear}-${String(calendarMonth + 1).padStart(
      2,
      "0",
    )}-${String(day).padStart(2, "0")}`;

    return records.find((record) => {
      const recordDate = record.attendanceDate || record.date;

      if (!recordDate) return false;

      return String(recordDate).slice(0, 10) === dateString;
    });
  };

  const getStatusClass = (record) => {
    if (!record) return "";

    const status = String(record.status || "").toLowerCase();

    if (status.includes("holiday")) return "holiday";
    if (status.includes("absent")) return "absent";
    if (status.includes("reject")) return "rejected";
    if (status.includes("pending")) return "pending";
    if (status.includes("late")) return "late";
    if (status.includes("approv")) return "approved";
    if (status.includes("present")) return "present";

    return "present";
  };

  const goToPreviousMonth = () => {
    setCalendarDate(new Date(calendarYear, calendarMonth - 1, 1));
  };

  const goToNextMonth = () => {
    setCalendarDate(new Date(calendarYear, calendarMonth + 1, 1));
  };

  const currentPeriodObj =
    PERIODS.find((p) => p.value === activePeriod) || PERIODS[0];

  const handleExport = () => {
    if (!records.length) return;
    const headers = [
      "Date",
      "Check In",
      "Break Period",
      "Check Out",
      "Working Hours",
      "Status",
    ];
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
        ].join(","),
      ),
    ];
    const blob = new Blob([csvRows.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
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
          <p>
            Showing past {currentPeriodObj.label.toLowerCase()} of attendance.
          </p>
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
        <div className="attendance-history__date">
          <DatePicker
            value={selectedDate}
            onChange={(value) => setSelectedDate(value)}
          />
        </div>

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
                  <td
                    colSpan="7"
                    style={{
                      textAlign: "center",
                      padding: "30px",
                      color: "var(--color-text-muted)",
                    }}
                  >
                    Loading attendance records...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    style={{
                      textAlign: "center",
                      padding: "30px",
                      color: "var(--color-text-muted)",
                    }}
                  >
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
                        {record.holidayName && (
                          <div className="attendance-history__holiday-name">
                            {record.holidayName}
                          </div>
                        )}
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
                        {record.id ? (
                          <button
                            type="button"
                            className="attendance-history__details"
                            onClick={() => onViewDetails?.(record)}
                          >
                            View Details
                          </button>
                        ) : (
                          <span className="attendance-history__no-action">
                            —
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {view === "calendar" && (
        <div className="attendance-history__calendar">
          <div className="attendance-calendar__header">
            <div>
              <h3>
                {monthName} {calendarYear}
              </h3>
              <p>Daily attendance overview</p>
            </div>

            <div className="attendance-calendar__navigation">
              <button
                type="button"
                onClick={goToPreviousMonth}
                aria-label="Previous month"
              >
                <FiChevronLeft />
              </button>

              <button type="button" onClick={() => setCalendarDate(new Date())}>
                Today
              </button>

              <button
                type="button"
                onClick={goToNextMonth}
                aria-label="Next month"
              >
                <FiChevronRight />
              </button>
            </div>
          </div>

          <div className="attendance-calendar__weekdays">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day}>{day}</div>
            ))}
          </div>

          <div className="attendance-calendar__grid">
            {calendarCells.map((day, index) => {
              if (!day) {
                return (
                  <div
                    key={`empty-${index}`}
                    className="attendance-calendar__day attendance-calendar__day--empty"
                  />
                );
              }

              const record = getRecordForDate(day);
              const statusClass = getStatusClass(record);

              const dateString = `${calendarYear}-${String(
                calendarMonth + 1,
              ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

              const isToday = dateString === todayStr;

              return (
                <button
                  type="button"
                  key={dateString}
                  className={`attendance-calendar__day ${
                    isToday ? "attendance-calendar__day--today" : ""
                  } ${
                    record ? `attendance-calendar__day--${statusClass}` : ""
                  }`}
                  onClick={() => {
                    setSelectedDate(dateString);

                    if (record?.id) {
                      onViewDetails?.(record);
                    }
                  }}
                >
                  <span className="attendance-calendar__date">{day}</span>

                  {record ? (
                    <>
                      <span
                        className={`attendance-calendar__status attendance-calendar__status--${statusClass}`}
                      >
                        {record.status || "Present"}
                      </span>

                      {record.hours && (
                        <span className="attendance-calendar__hours">
                          {record.hours}
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="attendance-calendar__empty-label">—</span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="attendance-calendar__legend">
            <span>
              <i className="attendance-calendar__legend-dot attendance-calendar__legend-dot--present" />
              Present
            </span>

            <span>
              <i className="attendance-calendar__legend-dot attendance-calendar__legend-dot--approved" />
              Approved
            </span>

            <span>
              <i className="attendance-calendar__legend-dot attendance-calendar__legend-dot--pending" />
              Pending
            </span>

            <span>
              <i className="attendance-calendar__legend-dot attendance-calendar__legend-dot--absent" />
              Absent
            </span>

            <span>
              <i className="attendance-calendar__legend-dot attendance-calendar__legend-dot--holiday" />
              Holiday
            </span>
          </div>
        </div>
      )}
    </section>
  );
};

export default AttendanceHistory;
