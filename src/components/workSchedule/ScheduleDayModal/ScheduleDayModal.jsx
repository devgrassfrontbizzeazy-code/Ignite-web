import { useEffect, useState } from "react";
import { CalendarDays, X } from "lucide-react";

import "./ScheduleDayModal.css";

const PATTERNS = [
  {
    value: "every_week",
    label: "Every week",
    description: "This day is working every week.",
  },
  {
    value: "custom",
    label: "Custom",
    description: "Choose specific weeks of each month.",
  },
  {
    value: "non_working",
    label: "Non-working",
    description: "This day is always off.",
  },
];

const OCCURRENCES = [1, 2, 3, 4, 5];

function ScheduleDayModal({
  daySchedule,
  shifts,
  onApply,
  onClose,
}) {
  const [form, setForm] = useState(daySchedule);

  useEffect(() => {
    setForm(daySchedule);
  }, [daySchedule]);

  const updateField = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePatternChange = (pattern) => {
    setForm((prev) => ({
      ...prev,
      pattern,
      custom_occurrences:
        pattern === "custom"
          ? prev.custom_occurrences || [1, 3]
          : [],
      shift_id:
        pattern === "non_working" ? null : prev.shift_id,
    }));
  };

  const toggleOccurrence = (occurrence) => {
    const current = form.custom_occurrences || [];

    const updated = current.includes(occurrence)
      ? current.filter((item) => item !== occurrence)
      : [...current, occurrence].sort();

    updateField("custom_occurrences", updated);
  };

  const handleApply = () => {
    if (
      form.pattern === "custom" &&
      (!form.custom_occurrences ||
        form.custom_occurrences.length === 0)
    ) {
      return;
    }

    onApply(form);
  };

  const selectedShift = shifts.find(
    (shift) => shift.id === form.shift_id
  );

  return (
    <div className="schedule-modal-overlay" onMouseDown={onClose}>
      <div
        className="schedule-day-modal"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="schedule-modal-header">
          <div className="schedule-modal-title">
            <div className="schedule-modal-icon">
              <CalendarDays size={18} />
            </div>

            <div>
              <h2>Configure {form.day}</h2>
              <p>Set the recurring working pattern for this day.</p>
            </div>
          </div>

          <button
            className="schedule-modal-close"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        <div className="schedule-modal-body">
          <div className="modal-field">
            <label>Working Pattern</label>

            <div className="pattern-options">
              {PATTERNS.map((pattern) => (
                <button
                  type="button"
                  key={pattern.value}
                  className={`pattern-option ${
                    form.pattern === pattern.value ? "selected" : ""
                  }`}
                  onClick={() =>
                    handlePatternChange(pattern.value)
                  }
                >
                  <span className="pattern-radio">
                    {form.pattern === pattern.value && <span />}
                  </span>

                  <span>
                    <strong>{pattern.label}</strong>
                    <small>{pattern.description}</small>
                  </span>
                </button>
              ))}
            </div>
          </div>

          {form.pattern === "custom" && (
            <div className="custom-pattern-box">
              <label>Select weeks of the month</label>

              <div className="week-selector">
                {OCCURRENCES.map((occurrence) => {
                  const selected =
                    form.custom_occurrences?.includes(occurrence);

                  return (
                    <button
                      type="button"
                      key={occurrence}
                      className={`week-option ${
                        selected ? "selected" : ""
                      }`}
                      onClick={() =>
                        toggleOccurrence(occurrence)
                      }
                    >
                      <span className="week-checkbox">
                        {selected ? "✓" : ""}
                      </span>

                      {getWeekLabel(occurrence)}
                    </button>
                  );
                })}
              </div>

              {(!form.custom_occurrences ||
                form.custom_occurrences.length === 0) && (
                <p className="validation-text">
                  Select at least one week.
                </p>
              )}
            </div>
          )}

          {form.pattern !== "non_working" && (
            <div className="modal-field">
              <label>Shift</label>

              {shifts.length === 0 ? (
                <div className="no-shifts-message">
                  No shifts are available. Create a shift first.
                </div>
              ) : (
                <>
                  <select
                    value={form.shift_id || ""}
                    onChange={(event) =>
                      updateField(
                        "shift_id",
                        event.target.value || null
                      )
                    }
                  >
                    <option value="">Select a shift</option>

                    {shifts.map((shift) => (
                      <option value={shift.id} key={shift.id}>
                        {shift.name} — {shift.start_time} to{" "}
                        {shift.end_time}
                      </option>
                    ))}
                  </select>

                  {selectedShift && (
                    <div className="shift-preview">
                      <span>
                        {selectedShift.start_time} –{" "}
                        {selectedShift.end_time}
                      </span>

                      {selectedShift.break_minutes > 0 && (
                        <small>
                          {selectedShift.break_minutes} min break
                        </small>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {form.pattern !== "non_working" && (
            <div className="schedule-preview-text">
              <strong>Schedule preview</strong>

              <span>
                {getSchedulePreview(form, selectedShift)}
              </span>
            </div>
          )}
        </div>

        <div className="schedule-modal-footer">
          <button
            className="modal-cancel-button"
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            className="modal-apply-button"
            onClick={handleApply}
            disabled={
              form.pattern === "custom" &&
              (!form.custom_occurrences ||
                form.custom_occurrences.length === 0)
            }
          >
            Apply Changes
          </button>
        </div>
      </div>
    </div>
  );
}

function getWeekLabel(number) {
  const labels = {
    1: "1st week",
    2: "2nd week",
    3: "3rd week",
    4: "4th week",
    5: "5th week",
  };

  return labels[number];
}

function getSchedulePreview(form, shift) {
  if (form.pattern === "every_week") {
    return shift
      ? `Every ${form.day}, ${shift.start_time} – ${shift.end_time}`
      : `Every ${form.day}, shift not assigned`;
  }

  if (form.pattern === "custom") {
    const weeks = (form.custom_occurrences || [])
      .sort()
      .map(getWeekLabel)
      .join(", ");

    return shift
      ? `${weeks} ${form.day}, ${shift.start_time} – ${shift.end_time}`
      : `${weeks} ${form.day}, shift not assigned`;
  }

  return `${form.day} is non-working`;
}

export default ScheduleDayModal;