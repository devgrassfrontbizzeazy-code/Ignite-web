import { useState } from "react";
import { X, CalendarDays, AlertCircle } from "lucide-react";
import DatePicker from "../../common/DatePicker/DatePicker";

import "./ApplyLeaveModal.css";

const ApplyLeaveModal = ({
  onClose,
  onSubmit,
  options = [],
  submitting = false,
}) => {
  const [formData, setFormData] = useState({
    leavePolicyId: "",
    fromDate: "",
    toDate: "",
    reason: "",
  });
  const [formError, setFormError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormError("");

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleFromDateChange = (value) => {
    setFormError("");
    setFormData((previous) => {
      // When fromDate is chosen, if toDate is empty or earlier than fromDate, sync it
      const nextToDate =
        !previous.toDate || previous.toDate < value ? value : previous.toDate;
      return {
        ...previous,
        fromDate: value,
        toDate: nextToDate,
      };
    });
  };

  const handleToDateChange = (value) => {
    setFormError("");
    setFormData((previous) => ({
      ...previous,
      toDate: value,
      // If fromDate is not yet set, default it to the chosen date
      fromDate: previous.fromDate || value,
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

    const difference = end.getTime() - start.getTime();

    return Math.round(difference / (1000 * 60 * 60 * 24)) + 1;
  };

  const days = calculateDays();

  const selectedPolicy = options.find(
    (option) => String(option.id) === String(formData.leavePolicyId),
  );

  const handleSubmit = (event) => {
    event.preventDefault();
    setFormError("");

    if (!formData.leavePolicyId) {
      setFormError("Please select a leave type.");
      return;
    }

    if (!formData.fromDate) {
      setFormError("Please select a From Date.");
      return;
    }

    if (!formData.toDate) {
      setFormError("Please select a To Date.");
      return;
    }

    if (days <= 0) {
      setFormError("To Date cannot be earlier than From Date.");
      return;
    }

    if (!formData.reason.trim()) {
      setFormError("Please enter a reason for your leave request.");
      return;
    }

    onSubmit({
      leave_policy_id: Number(formData.leavePolicyId),
      from_date: formData.fromDate,
      to_date: formData.toDate,
      reason: formData.reason.trim(),
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
            disabled={submitting}
          >
            <X size={19} />
          </button>
        </div>

        <form className="apply-leave-modal__form" onSubmit={handleSubmit}>
          <div className="apply-leave-field">
            <label htmlFor="leavePolicyId">Leave Type</label>

            <select
              id="leavePolicyId"
              name="leavePolicyId"
              value={formData.leavePolicyId}
              onChange={handleChange}
              required
              disabled={submitting}
            >
              <option value="">Select leave type</option>

              {options.map((option) => (
                <option
                  key={option.id}
                  value={option.id}
                  disabled={option.remaining_balance <= 0}
                >
                  {option.name} ({option.remaining_balance}{" "}
                  {option.remaining_balance === 1 ? "day" : "days"} available)
                </option>
              ))}
            </select>

            {selectedPolicy && (
              <small>
                {selectedPolicy.remaining_balance}{" "}
                {selectedPolicy.remaining_balance === 1 ? "day" : "days"}{" "}
                remaining
              </small>
            )}
          </div>

          <div className="apply-leave-date-grid">
            <div className="apply-leave-field">
              <label>From Date</label>

              <DatePicker
                value={formData.fromDate}
                onChange={handleFromDateChange}
                placeholder="Select start date"
                disabled={submitting}
              />
            </div>

            <div className="apply-leave-field">
              <label>To Date</label>

              <DatePicker
                value={formData.toDate}
                onChange={handleToDateChange}
                minDate={formData.fromDate || undefined}
                placeholder="Select end date"
                disabled={submitting}
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
            <label htmlFor="reason">Reason</label>

            <textarea
              id="reason"
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              placeholder="Enter the reason for your leave..."
              rows={4}
              required
              disabled={submitting}
            />
          </div>

          {formError && (
            <div className="apply-leave-error-banner">
              <AlertCircle size={15} />
              <span>{formError}</span>
            </div>
          )}

          <div className="apply-leave-modal__actions">
            <button
              type="button"
              className="apply-leave-cancel"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="apply-leave-submit"
              disabled={submitting}
            >
              {submitting ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApplyLeaveModal;
