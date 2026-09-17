
import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Circle,
  X,
} from "lucide-react";

import "./HolidayCalendar.css";

const WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const getDateKey = (date) => {
  const value = new Date(date);

  return [
    value.getFullYear(),
    String(value.getMonth() + 1).padStart(2, "0"),
    String(value.getDate()).padStart(2, "0"),
  ].join("-");
};

const getCalendarStart = (year, month) => {
  const firstDay = new Date(year, month, 1);
  const day = firstDay.getDay();

  // Convert Sunday = 0 into Monday = 0.
  const mondayOffset = day === 0 ? 6 : day - 1;

  return new Date(year, month, 1 - mondayOffset);
};

const getCalendarEnd = (year, month) => {
  const lastDay = new Date(year, month + 1, 0);
  const day = lastDay.getDay();

  const sundayOffset = day === 0 ? 0 : 7 - day;

  return new Date(
    year,
    month,
    lastDay.getDate() + sundayOffset,
  );
};

const HolidayCalendar = ({
  holidays = [],
  selectedYear,
  onYearChange,
}) => {
  const [currentMonth, setCurrentMonth] = useState(0);
  const [selectedHoliday, setSelectedHoliday] = useState(null);

  const todayKey = getDateKey(new Date());

  const calendarDays = useMemo(() => {
    const start = getCalendarStart(selectedYear, currentMonth);
    const end = getCalendarEnd(selectedYear, currentMonth);

    const days = [];
    const cursor = new Date(start);

    while (cursor <= end) {
      days.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }

    return days;
  }, [selectedYear, currentMonth]);

  const holidaysByDate = useMemo(() => {
    const grouped = {};

    holidays.forEach((holiday) => {
      if (!holiday.date) {
        return;
      }

      const key = getDateKey(holiday.date);

      if (!grouped[key]) {
        grouped[key] = [];
      }

      grouped[key].push(holiday);
    });

    return grouped;
  }, [holidays]);

  const handlePreviousMonth = () => {
    if (currentMonth === 0) {
      onYearChange(selectedYear - 1);
      setCurrentMonth(11);
      return;
    }

    setCurrentMonth((month) => month - 1);
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      onYearChange(selectedYear + 1);
      setCurrentMonth(0);
      return;
    }

    setCurrentMonth((month) => month + 1);
  };

  const handleToday = () => {
    const today = new Date();

    onYearChange(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSelectedHoliday(null);
  };

  const handleHolidayClick = (event, holiday) => {
    event.stopPropagation();
    setSelectedHoliday(holiday);
  };

  const getHolidayClass = (holiday) => {
    if (holiday.status === "Inactive") {
      return "holiday-calendar-event--inactive";
    }

    if (holiday.type === "Company Holiday") {
      return "holiday-calendar-event--company";
    }

    if (holiday.type === "Optional Holiday") {
      return "holiday-calendar-event--optional";
    }

    return "holiday-calendar-event--public";
  };

  return (
    <div className="holiday-calendar">
      {/* Calendar toolbar */}
      <div className="holiday-calendar-toolbar">
        <div className="holiday-calendar-navigation">
          <button
            type="button"
            onClick={handlePreviousMonth}
            aria-label="Previous month"
            title="Previous month"
          >
            <ChevronLeft size={17} strokeWidth={2} />
          </button>

          <div className="holiday-calendar-month">
            <h3>
              {MONTHS[currentMonth]} {selectedYear}
            </h3>

            <span>
              {holidays.length} holiday
              {holidays.length === 1 ? "" : "s"} this year
            </span>
          </div>

          <button
            type="button"
            onClick={handleNextMonth}
            aria-label="Next month"
            title="Next month"
          >
            <ChevronRight size={17} strokeWidth={2} />
          </button>
        </div>

        <button
          type="button"
          className="holiday-calendar-today"
          onClick={handleToday}
        >
          Today
        </button>
      </div>

      {/* Weekday header */}
      <div className="holiday-calendar-weekdays">
        {WEEKDAYS.map((weekday) => (
          <div key={weekday}>{weekday.slice(0, 3)}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="holiday-calendar-grid">
        {calendarDays.map((date) => {
          const dateKey = getDateKey(date);
          const dayHolidays = holidaysByDate[dateKey] || [];

          const isCurrentMonth =
            date.getMonth() === currentMonth &&
            date.getFullYear() === selectedYear;

          const isToday = dateKey === todayKey;

          return (
            <div
              key={dateKey}
              className={[
                "holiday-calendar-day",
                !isCurrentMonth
                  ? "holiday-calendar-day--outside"
                  : "",
                isToday
                  ? "holiday-calendar-day--today"
                  : "",
                dayHolidays.length
                  ? "holiday-calendar-day--has-holiday"
                  : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <div className="holiday-calendar-day-number">
                <span>{date.getDate()}</span>

                {isToday && (
                  <small>Today</small>
                )}
              </div>

              <div className="holiday-calendar-events">
                {dayHolidays.map((holiday) => (
                  <button
                    type="button"
                    key={holiday.id}
                    className={`holiday-calendar-event ${getHolidayClass(
                      holiday,
                    )}`}
                    onClick={(event) =>
                      handleHolidayClick(event, holiday)
                    }
                    title={holiday.name}
                  >
                    <Circle
                      size={6}
                      fill="currentColor"
                      strokeWidth={0}
                    />

                    <span>{holiday.name}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="holiday-calendar-legend">
        <div>
          <span className="holiday-legend-dot holiday-legend-dot--public" />
          Public Holiday
        </div>

        <div>
          <span className="holiday-legend-dot holiday-legend-dot--company" />
          Company Holiday
        </div>

        <div>
          <span className="holiday-legend-dot holiday-legend-dot--optional" />
          Optional Holiday
        </div>

        <div>
          <span className="holiday-legend-dot holiday-legend-dot--inactive" />
          Inactive
        </div>
      </div>

      {/* Holiday details */}
      {selectedHoliday && (
        <div
          className="holiday-details-overlay"
          onClick={() => setSelectedHoliday(null)}
        >
          <div
            className="holiday-details-popover"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="holiday-details-header">
              <div>
                <span
                  className={`holiday-details-type ${getHolidayClass(
                    selectedHoliday,
                  )}`}
                >
                  <Circle
                    size={6}
                    fill="currentColor"
                    strokeWidth={0}
                  />

                  {selectedHoliday.type}
                </span>

                <h3>{selectedHoliday.name}</h3>
              </div>

              <button
                type="button"
                onClick={() => setSelectedHoliday(null)}
                aria-label="Close holiday details"
              >
                <X size={17} strokeWidth={2} />
              </button>
            </div>

            <div className="holiday-details-content">
              <div className="holiday-detail-row">
                <span>Date</span>
                <strong>
                  {new Date(
                    `${selectedHoliday.date}T00:00:00`,
                  ).toLocaleDateString("en-IN", {
                    weekday: "long",
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </strong>
              </div>

              <div className="holiday-detail-row">
                <span>Recurring</span>
                <strong>
                  {selectedHoliday.recurring ? "Yes" : "No"}
                </strong>
              </div>

              <div className="holiday-detail-row">
                <span>Status</span>
                <strong
                  className={
                    selectedHoliday.status === "Active"
                      ? "holiday-status-active"
                      : "holiday-status-inactive"
                  }
                >
                  {selectedHoliday.status}
                </strong>
              </div>

              {selectedHoliday.description && (
                <div className="holiday-detail-description">
                  <span>Description</span>
                  <p>{selectedHoliday.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HolidayCalendar;

