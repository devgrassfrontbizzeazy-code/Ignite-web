import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Clock3,
} from "lucide-react";

import "./SchedulePreview.css";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

function SchedulePreview({ weeklySchedule, shifts }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();

  const calendarDays = useMemo(
    () => generateCalendar(year, month),
    [year, month]
  );

  const getScheduleForDay = (dayName) =>
    weeklySchedule.find((item) => item.day === dayName);

  const getShift = (shiftId) =>
    shifts.find((shift) => shift.id === shiftId);

  const previousMonth = () => {
    setCurrentDate(
      new Date(year, month - 1, 1)
    );
  };

  const nextMonth = () => {
    setCurrentDate(
      new Date(year, month + 1, 1)
    );
  };

  return (
    <div className="schedule-preview-card">
      <div className="preview-header">
        <div>
          <h3>
            {currentDate.toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </h3>

          <p>Recurring monthly schedule</p>
        </div>

        <div className="calendar-navigation">
          <button onClick={previousMonth}>
            <ChevronLeft size={16} />
          </button>

          <button onClick={nextMonth}>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="calendar-grid">
        {DAYS.map((day) => (
          <div className="calendar-weekday" key={day}>
            {day.slice(0, 3)}
          </div>
        ))}

        {calendarDays.map((day, index) => {
          if (!day) {
            return (
              <div
                className="calendar-cell empty"
                key={`empty-${index}`}
              />
            );
          }

          const dayName = day.date.toLocaleDateString("en-US", {
            weekday: "long",
          });

          const schedule = getScheduleForDay(dayName);

          const isWorking = isWorkingDate(
            day.date,
            schedule
          );

          const shift = schedule
            ? getShift(schedule.shift_id)
            : null;

          return (
            <div
              className={`calendar-cell ${
                isWorking ? "working" : "off"
              }`}
              key={day.date.toISOString()}
            >
              <span className="calendar-date">
                {day.date.getDate()}
              </span>

              {isWorking ? (
                <div className="calendar-working">
                  <span className="calendar-status">Working</span>

                  {shift && (
                    <span className="calendar-shift">
                      <Clock3 size={10} />
                      {shift.start_time}
                    </span>
                  )}
                </div>
              ) : (
                <span className="calendar-off">Off</span>
              )}
            </div>
          );
        })}
      </div>

      <div className="preview-legend">
        <span>
          <i className="legend-working" />
          Working
        </span>

        <span>
          <i className="legend-off" />
          Non-working
        </span>
      </div>
    </div>
  );
}

function generateCalendar(year, month) {
  const firstDay = new Date(year, month, 1);

  // Convert Sunday-first JS index to Monday-first.
  const firstDayIndex =
    (firstDay.getDay() + 6) % 7;

  const daysInMonth = new Date(
    year,
    month + 1,
    0
  ).getDate();

  const result = [];

  for (let i = 0; i < firstDayIndex; i++) {
    result.push(null);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    result.push({
      date: new Date(year, month, day),
    });
  }

  return result;
}

function isWorkingDate(date, schedule) {
  if (!schedule || schedule.pattern === "non_working") {
    return false;
  }

  if (schedule.pattern === "every_week") {
    return true;
  }

  if (schedule.pattern === "custom") {
    const firstDayOfMonth = new Date(
      date.getFullYear(),
      date.getMonth(),
      1
    );

    const weekdayOffset =
      (date.getDay() - firstDayOfMonth.getDay() + 7) % 7;

    const occurrence =
      Math.floor(
        (date.getDate() - 1 - weekdayOffset) / 7
      ) + 1;

    return schedule.custom_occurrences?.includes(
      occurrence
    );
  }

  return false;
}



export default SchedulePreview;