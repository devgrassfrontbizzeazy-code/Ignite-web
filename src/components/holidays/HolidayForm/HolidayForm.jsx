
import { useEffect, useState } from "react";
import { X } from "lucide-react";

import Toggle from "../../common/Toggle/Toggle";

import "./HolidayForm.css";

const defaultForm = {
  name: "",
  date: "",
  type: "Public Holiday",
  description: "",
  recurring: true,
};

const HolidayForm = ({ holiday, onSave, onClose }) => {
  const [formData, setFormData] = useState(defaultForm);

  useEffect(() => {
    if (holiday) {
      setFormData({
        name: holiday.name || "",
        date: holiday.date || "",
        type: holiday.type || "Public Holiday",
        description: holiday.description || "",
        recurring: Boolean(holiday.recurring),
      });
    } else {
      setFormData(defaultForm);
    }
  }, [holiday]);

  const updateField = (field, value) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!formData.name.trim() || !formData.date) {
      return;
    }

    const selectedDate = new Date(`${formData.date}T00:00:00`);

    const day = selectedDate.toLocaleDateString("en-US", {
      weekday: "long",
    });

    onSave({
      name: formData.name.trim(),
      date: formData.date,
      day,
      type: formData.type,
      description: formData.description.trim(),
      recurring: formData.recurring,
    });
  };

  return (
    <div
      className="holiday-form-overlay"
      onMouseDown={onClose}
    >
      <div
        className="holiday-form-modal"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="holiday-form-header">
          <div>
            <h2 className="holiday-form-title">
              {holiday ? "Edit Holiday" : "Add Holiday"}
            </h2>

            <p className="holiday-form-subtitle">
              Add and configure a holiday for your company calendar.
            </p>
          </div>

          <button
            type="button"
            className="holiday-form-close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="holiday-form-body">
            <div className="holiday-form-grid">
              <div className="holiday-form-group full">
                <label
                  className="holiday-form-label"
                  htmlFor="holiday-name"
                >
                  Holiday Name <span>*</span>
                </label>

                <input
                  id="holiday-name"
                  className="holiday-form-input"
                  type="text"
                  placeholder="e.g. Republic Day"
                  value={formData.name}
                  onChange={(event) =>
                    updateField("name", event.target.value)
                  }
                />
              </div>

              <div className="holiday-form-group">
                <label
                  className="holiday-form-label"
                  htmlFor="holiday-date"
                >
                  Date <span>*</span>
                </label>

                <input
                  id="holiday-date"
                  className="holiday-form-input"
                  type="date"
                  value={formData.date}
                  onChange={(event) =>
                    updateField("date", event.target.value)
                  }
                />
              </div>

              <div className="holiday-form-group">
                <label
                  className="holiday-form-label"
                  htmlFor="holiday-type"
                >
                  Holiday Type
                </label>

                <select
                  id="holiday-type"
                  className="holiday-form-input holiday-form-select"
                  value={formData.type}
                  onChange={(event) =>
                    updateField("type", event.target.value)
                  }
                >
                  <option value="Public Holiday">
                    Public Holiday
                  </option>

                  <option value="Company Holiday">
                    Company Holiday
                  </option>

                  <option value="Optional Holiday">
                    Optional Holiday
                  </option>
                </select>
              </div>

              <div className="holiday-form-group full">
                <label
                  className="holiday-form-label"
                  htmlFor="holiday-description"
                >
                  Description
                </label>

                <textarea
                  id="holiday-description"
                  className="holiday-form-textarea"
                  rows="3"
                  placeholder="Briefly describe this holiday..."
                  value={formData.description}
                  onChange={(event) =>
                    updateField(
                      "description",
                      event.target.value
                    )
                  }
                />
              </div>
            </div>

            <div className="holiday-form-toggle-list">
              <div className="holiday-form-toggle-row">
                <div className="holiday-form-toggle-content">
                  <span className="holiday-form-toggle-title">
                    Recurring Every Year
                  </span>

                  <span className="holiday-form-toggle-description">
                    Automatically include this holiday in future
                    yearly calendars.
                  </span>
                </div>

                <Toggle
                  checked={formData.recurring}
                  onChange={(value) =>
                    updateField("recurring", value)
                  }
                />
              </div>
            </div>
          </div>

          <div className="holiday-form-footer">
            <button
              type="button"
              className="holiday-form-cancel-button"
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="holiday-form-save-button"
            >
              {holiday ? "Save Changes" : "Create Holiday"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HolidayForm;

