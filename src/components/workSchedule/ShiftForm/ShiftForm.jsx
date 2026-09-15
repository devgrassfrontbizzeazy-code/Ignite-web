import { useEffect, useState } from "react";
import { Clock3, X } from "lucide-react";
import TimePicker from "../../common/TimePicker/TimePicker";
import "./ShiftForm.css";

const DEFAULT_SHIFT = {
  name: "",
  start_time: "10:00 AM",
  end_time: "07:00 PM",
  overnight: false,
  break_minutes: 0,
};

function ShiftForm({ shift, onSave, onClose }) {
  const [form, setForm] = useState(DEFAULT_SHIFT);

  useEffect(() => {
    if (shift) {
      setForm({
        ...DEFAULT_SHIFT,
        ...shift,
      });
    } else {
      setForm(DEFAULT_SHIFT);
    }
  }, [shift]);

  const updateField = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!form.name.trim()) {
      return;
    }

    onSave({
      ...form,
      name: form.name.trim(),
      break_minutes: Number(form.break_minutes) || 0,
    });
  };

  return (
    <div className="shift-form-overlay" onMouseDown={onClose}>
      <div
        className="shift-form-modal"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="shift-form-header">
          <div className="shift-form-title">
            <div className="shift-form-icon">
              <Clock3 size={18} />
            </div>

            <div>
              <h2>{shift ? "Edit Shift" : "Add Shift"}</h2>
              <p>Create a reusable working shift.</p>
            </div>
          </div>

          <button className="close-form-button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="shift-form-body">
            <div className="form-group">
              <label>Shift Name</label>

              <input
                type="text"
                placeholder="e.g. General Shift"
                value={form.name}
                onChange={(event) =>
                  updateField("name", event.target.value)
                }
                autoFocus
              />
            </div>

            <div className="time-fields">
              <div className="form-group">
                <label>Start Time</label>

                <TimePicker
                  value={form.start_time}
                  onChange={(value) =>
                    updateField("start_time", value)
                  }
                />
              </div>

              <div className="time-separator"></div>

              <div className="form-group">
                <label>End Time</label>

                <TimePicker
                  value={form.end_time}
                  onChange={(value) =>
                    updateField("end_time", value)
                  }
                />
              </div>
            </div>

            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={form.overnight}
                onChange={(event) =>
                  updateField("overnight", event.target.checked)
                }
              />

              <span>
                <strong>Overnight shift</strong>
                <small>
                  Shift ends on the following day.
                </small>
              </span>
            </label>

            <div className="form-group">
              <label>Break Duration</label>

              <div className="input-with-suffix">
                <input
                  type="number"
                  min="0"
                  max="480"
                  value={form.break_minutes}
                  onChange={(event) =>
                    updateField(
                      "break_minutes",
                      event.target.value
                    )
                  }
                />

                <span>minutes</span>
              </div>
            </div>
          </div>

          <div className="shift-form-footer">
            <button
              type="button"
              className="cancel-form-button"
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="save-form-button"
              disabled={!form.name.trim()}
            >
              {shift ? "Update Shift" : "Create Shift"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function to24Hour(value) {
  if (!value) return "10:00";

  const match = value.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i);

  if (!match) return value;

  let hour = Number(match[1]);
  const minute = match[2];
  const period = match[3].toUpperCase();

  if (period === "AM" && hour === 12) hour = 0;
  if (period === "PM" && hour !== 12) hour += 12;

  return `${String(hour).padStart(2, "0")}:${minute}`;
}

function formatTime(value) {
  if (!value) return "";

  const [hourString, minute] = value.split(":");
  let hour = Number(hourString);

  const period = hour >= 12 ? "PM" : "AM";

  if (hour === 0) hour = 12;
  if (hour > 12) hour -= 12;

  return `${String(hour).padStart(2, "0")}:${minute} ${period}`;
}

export default ShiftForm;