import { useState } from "react";
import { X, CalendarDays } from "lucide-react";

import "./ApplyLeaveModal.css";

const ApplyLeaveModal = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    leaveType: "",
    fromDate: "",
    toDate: "",
    reason: "",
  });

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const calculateDays = () => {
    if (!formData.fromDate || !formData.toDate) {
      return 0;
    }

    const start = new Date(formData.fromDate);
    const end = new Date(formData.toDate);

    if (end < start) {
      return 0;
    }

    const difference =
      end.getTime() - start.getTime();

    return Math.floor(
      difference / (1000 * 60 * 60 * 24)
    ) + 1;
  };

  const days = calculateDays();

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!formData.leaveType) {
      return;
    }

    if (!formData.fromDate || !formData.toDate) {
      return;
    }

    if (days <= 0) {
      return;
    }

    onSubmit({
      ...formData,
      days,
    });
  };

  return (
    <div
      className="apply-leave-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="apply-leave-modal">
        <div className="apply-leave-modal__header">
          <div className="apply-leave-modal__title">
            <div className="apply-leave-modal__icon">
              <CalendarDays size={19} />
            </div>

            <div>
              <h2>Apply for Leave</h2>
              <p>Submit a new leave request</p>
            </div>
          </div>

          <button
            type="button"
            className="apply-leave-modal__close"
            onClick={onClose}
          >
            <X size={19} />
          </button>
        </div>

        <form
          className="apply-leave-modal__form"
          onSubmit={handleSubmit}
        >
          <div className="apply-leave-field">
            <label htmlFor="leaveType">
              Leave Type
            </label>

            <select
              id="leaveType"
              name="leaveType"
              value={formData.leaveType}
              onChange={handleChange}
              required
            >
              <option value="">
                Select leave type
              </option>
              <option value="Casual Leave">
                Casual Leave
              </option>
              <option value="Sick Leave">
                Sick Leave
              </option>
              <option value="Earned Leave">
                Earned Leave
              </option>
              <option value="Other Leave">
                Other Leave
              </option>
            </select>
          </div>

          <div className="apply-leave-date-grid">
            <div className="apply-leave-field">
              <label htmlFor="fromDate">
                From Date
              </label>

              <input
                id="fromDate"
                type="date"
                name="fromDate"
                value={formData.fromDate}
                onChange={handleChange}
                required
              />
            </div>

            <div className="apply-leave-field">
              <label htmlFor="toDate">
                To Date
              </label>

              <input
                id="toDate"
                type="date"
                name="toDate"
                value={formData.toDate}
                min={formData.fromDate || undefined}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="apply-leave-duration">
            <span>Duration</span>
            <strong>
              {days > 0 ? `${days} ${days === 1 ? "Day" : "Days"}` : "—"}
            </strong>
          </div>

          <div className="apply-leave-field">
            <label htmlFor="reason">
              Reason
            </label>

            <textarea
              id="reason"
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              placeholder="Enter the reason for your leave..."
              rows={4}
              required
            />
          </div>

          <div className="apply-leave-modal__actions">
            <button
              type="button"
              className="apply-leave-cancel"
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="apply-leave-submit"
            >
              Submit Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApplyLeaveModal;