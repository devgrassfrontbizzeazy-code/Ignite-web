
import { useMemo } from "react";
import { Check, Plus, Settings2 } from "lucide-react";

import "./WeeklySchedule.css";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

function WeeklySchedule({
  schedule,
  shifts,
  defaultShiftId,
  onDefaultShiftChange,
  onChange,
}) {
  const workingDays = useMemo(
    () =>
      schedule
        .filter(
          (day) => day.pattern === "every_week"
        )
        .map((day) => day.day),
    [schedule]
  );

  const customDays = useMemo(
    () =>
      schedule.filter(
        (day) => day.pattern === "custom"
      ),
    [schedule]
  );

  /*
   * Keep select values consistent.
   * HTML select values are strings, while backend IDs
   * may be numbers.
   */
  const selectedDefaultShiftId =
    defaultShiftId != null
      ? String(defaultShiftId)
      : "";

  const toggleWorkingDay = (dayName) => {
    const isWorking =
      workingDays.includes(dayName);

    const updatedSchedule =
      schedule.map((day) => {
        if (day.day !== dayName) {
          return day;
        }

        /*
         * Turn an existing working day into
         * a non-working day.
         */
        if (isWorking) {
          return {
            ...day,
            pattern: "non_working",
            custom_occurrences: [],
            shift_id: null,
          };
        }

        /*
         * Turn a non-working day into a
         * normal weekly working day.
         */
        return {
          ...day,
          pattern: "every_week",
          custom_occurrences: [],
          shift_id:
            defaultShiftId || null,
        };
      });

    onChange(updatedSchedule);
  };

  const updateDefaultShift = (shiftId) => {
    const normalizedShiftId =
      shiftId || null;

    /*
     * Update the organization's default shift
     * in the parent state.
     */
    onDefaultShiftChange(
      normalizedShiftId
    );

    /*
     * Apply the selected default shift to
     * every normal weekly working day.
     *
     * Custom days are intentionally left alone
     * because they can have their own shift.
     */
    const updatedSchedule =
      schedule.map((day) =>
        day.pattern === "every_week"
          ? {
              ...day,
              shift_id:
                normalizedShiftId,
            }
          : day
      );

    onChange(updatedSchedule);
  };

  const addCustomDay = () => {
    /*
     * Find the first day that is not already
     * a normal working day or custom day.
     */
    const availableDay = DAYS.find(
      (dayName) =>
        !schedule.some(
          (day) =>
            day.day === dayName &&
            (day.pattern === "custom" ||
              day.pattern === "every_week")
        )
    );

    if (!availableDay) {
      return;
    }

    const updatedSchedule =
      schedule.map((day) => {
        if (day.day !== availableDay) {
          return day;
        }

        return {
          ...day,
          pattern: "custom",
          custom_occurrences: [1],
          shift_id:
            defaultShiftId || null,
        };
      });

    onChange(updatedSchedule);
  };

  const removeCustomDay = (dayName) => {
    const updatedSchedule =
      schedule.map((day) => {
        if (day.day !== dayName) {
          return day;
        }

        return {
          ...day,
          pattern: "non_working",
          custom_occurrences: [],
          shift_id: null,
        };
      });

    onChange(updatedSchedule);
  };

  const updateCustomDay = (
    dayName,
    field,
    value
  ) => {
    const updatedSchedule =
      schedule.map((day) => {
        if (day.day !== dayName) {
          return day;
        }

        return {
          ...day,
          [field]: value,
        };
      });

    onChange(updatedSchedule);
  };

  return (
    <div className="weekly-schedule-card">
      {/* DEFAULT WEEKLY SETUP */}
      <div className="weekly-default-section">
        <div className="weekly-subsection-heading">
          <div className="weekly-subsection-icon">
            <Check size={17} />
          </div>

          <div>
            <h3>Working Days</h3>

            <p>
              Select the days your organization
              normally operates.
            </p>
          </div>
        </div>

        <div className="working-days-grid">
          {DAYS.map((day) => {
            const isSelected =
              workingDays.includes(day);

            return (
              <button
                key={day}
                type="button"
                className={`working-day-option ${
                  isSelected
                    ? "selected"
                    : ""
                }`}
                onClick={() =>
                  toggleWorkingDay(day)
                }
              >
                <span className="working-day-check">
                  {isSelected && (
                    <Check
                      size={13}
                      strokeWidth={2.5}
                    />
                  )}
                </span>

                <span>
                  {day.slice(0, 3)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* DEFAULT SHIFT */}
      <div className="weekly-default-shift">
        <div>
          <h3>Default Shift</h3>

          <p>
            This shift will be applied to all
            selected working days.
          </p>
        </div>

        <select
          value={selectedDefaultShiftId}
          onChange={(event) =>
            updateDefaultShift(
              event.target.value
            )
          }
          disabled={
            !workingDays.length ||
            !shifts.length
          }
        >
          <option value="">
            {shifts.length
              ? "Select default shift"
              : "Create a shift first"}
          </option>

          {shifts.map((shift) => (
            <option
              key={shift.id}
              value={String(shift.id)}
            >
              {shift.name} —{" "}
              {shift.start_time} to{" "}
              {shift.end_time}
            </option>
          ))}
        </select>
      </div>

      {/* CUSTOM DAYS */}
      <div className="weekly-custom-section">
        <div className="weekly-custom-header">
          <div className="weekly-subsection-heading">
            <div className="weekly-subsection-icon custom">
              <Settings2 size={17} />
            </div>

            <div>
              <h3>Custom Schedule</h3>

              <p>
                Add exceptions when a specific day
                follows a different recurring pattern.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="add-custom-day-button"
            onClick={addCustomDay}
            disabled={
              customDays.length >= 7 ||
              customDays.length +
                workingDays.length >=
                7
            }
          >
            <Plus size={16} />
            Add Custom Day
          </button>
        </div>

        {customDays.length > 0 ? (
          <div className="custom-days-list">
            {customDays.map((day) => (
              <div
                className="custom-day-row"
                key={day.day}
              >
                <div className="custom-day-name">
                  {day.day}
                </div>

                <div className="custom-day-field">
                  <label>
                    Occurrences
                  </label>

                  <div className="occurrence-options">
                    {[1, 2, 3, 4, 5].map(
                      (occurrence) => {
                        const selected =
                          day.custom_occurrences?.includes(
                            occurrence
                          );

                        return (
                          <button
                            key={occurrence}
                            type="button"
                            className={
                              selected
                                ? "selected"
                                : ""
                            }
                            onClick={() => {
                              const current =
                                day.custom_occurrences ||
                                [];

                              const next =
                                selected
                                  ? current.filter(
                                      (item) =>
                                        item !==
                                        occurrence
                                    )
                                  : [
                                      ...current,
                                      occurrence,
                                    ].sort(
                                      (a, b) =>
                                        a - b
                                    );

                              updateCustomDay(
                                day.day,
                                "custom_occurrences",
                                next
                              );
                            }}
                          >
                            {occurrence}

                            {occurrence === 1
                              ? "st"
                              : occurrence === 2
                              ? "nd"
                              : occurrence === 3
                              ? "rd"
                              : "th"}
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>

                <div className="custom-day-field">
                  <label>
                    Shift
                  </label>

                  <select
                    value={
                      day.shift_id != null
                        ? String(day.shift_id)
                        : ""
                    }
                    onChange={(event) =>
                      updateCustomDay(
                        day.day,
                        "shift_id",
                        event.target.value ||
                          null
                      )
                    }
                  >
                    <option value="">
                      Select shift
                    </option>

                    {shifts.map((shift) => (
                      <option
                        key={shift.id}
                        value={String(
                          shift.id
                        )}
                      >
                        {shift.name}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  className="remove-custom-day"
                  onClick={() =>
                    removeCustomDay(day.day)
                  }
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="custom-empty-state">
            <span>
              No custom schedules added.
            </span>

            <span>
              Use this only when a day needs a
              different recurring pattern.
            </span>
          </div>
        )}
      </div>

      <div className="weekly-schedule-note">
        <span className="note-dot" />

        <span>
          Non-working days are off automatically.
          Use Custom Schedule only for recurring
          exceptions such as 1st and 3rd Saturdays.
        </span>
      </div>
    </div>
  );
}

export default WeeklySchedule;

