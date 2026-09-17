
import { useEffect, useState } from "react";
import { X } from "lucide-react";

import Toggle from "../../common/Toggle/Toggle";

import "./LeavePolicyForm.css";

const defaultForm = {
  name: "",
  description: "",
  allocationType: "Annual",
  days: "",
  carryForward: false,
  carryForwardType: "All",
  carryForwardLimit: "",
  halfDayAllowed: true,
  requiresApproval: true,
};

const LeavePolicyForm = ({ policy, onSave, onClose }) => {
  const [formData, setFormData] = useState(defaultForm);

  useEffect(() => {
    if (policy) {
      setFormData({
        name: policy.name || "",
        description: policy.description || "",
        allocationType: policy.allocationType || "Annual",
        days:
          policy.days !== undefined && policy.days !== null
            ? policy.days
            : "",
        carryForward: Boolean(policy.carryForward),
        carryForwardType: policy.carryForwardType || "All",
        carryForwardLimit:
          policy.carryForwardLimit !== undefined &&
          policy.carryForwardLimit !== null
            ? policy.carryForwardLimit
            : "",
        halfDayAllowed: Boolean(policy.halfDayAllowed),
        requiresApproval: Boolean(policy.requiresApproval),
      });
    } else {
      setFormData(defaultForm);
    }
  }, [policy]);

  const updateField = (field, value) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!formData.name.trim()) {
      return;
    }

    onSave({
      name: formData.name.trim(),
      description: formData.description.trim(),

      allocationType: formData.allocationType,

      days:
        formData.days === ""
          ? null
          : Number(formData.days),

      carryForward: formData.carryForward,

      carryForwardType: formData.carryForward
        ? formData.carryForwardType
        : null,

      carryForwardLimit:
        formData.carryForward &&
        formData.carryForwardType === "Maximum"
          ? Number(formData.carryForwardLimit)
          : null,

      halfDayAllowed: formData.halfDayAllowed,
      requiresApproval: formData.requiresApproval,
    });
  };

  return (
    <div
      className="leave-policy-form-overlay"
      onMouseDown={onClose}
    >
      <div
        className="leave-policy-form-modal"
        onMouseDown={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="leave-policy-form-header">
          <div>
            <h2 className="leave-policy-form-title">
              {policy ? "Edit Leave Policy" : "Add Leave Policy"}
            </h2>

            <p className="leave-policy-form-subtitle">
              Configure leave allocation and usage rules.
            </p>
          </div>

          <button
            type="button"
            className="leave-policy-form-close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="leave-policy-form-body">

            {/* BASIC INFORMATION */}
            <div className="leave-policy-form-section">
              <div className="leave-policy-form-section-title">
                Basic Information
              </div>

              <div className="leave-policy-form-grid">
                <div className="leave-policy-form-group full">
                  <label
                    className="leave-policy-form-label"
                    htmlFor="leave-policy-name"
                  >
                    Leave Name <span>*</span>
                  </label>

                  <input
                    id="leave-policy-name"
                    className="leave-policy-form-input"
                    type="text"
                    placeholder="e.g. Casual Leave"
                    value={formData.name}
                    onChange={(event) =>
                      updateField("name", event.target.value)
                    }
                  />
                </div>

                <div className="leave-policy-form-group full">
                  <label
                    className="leave-policy-form-label"
                    htmlFor="leave-policy-description"
                  >
                    Description
                  </label>

                  <textarea
                    id="leave-policy-description"
                    className="leave-policy-form-textarea"
                    rows="3"
                    placeholder="Briefly describe this leave policy..."
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
            </div>

            {/* ALLOCATION */}
            <div className="leave-policy-form-section">
              <div className="leave-policy-form-section-title">
                Leave Allocation
              </div>

              <div className="leave-policy-form-grid">
                <div className="leave-policy-form-group">
                  <label
                    className="leave-policy-form-label"
                    htmlFor="leave-policy-allocation"
                  >
                    Allocation
                  </label>

                  <select
                    id="leave-policy-allocation"
                    className="leave-policy-form-input"
                    value={formData.allocationType}
                    onChange={(event) =>
                      updateField(
                        "allocationType",
                        event.target.value
                      )
                    }
                  >
                    <option value="Annual">
                      Annual
                    </option>

                    <option value="Monthly">
                      Monthly
                    </option>
                  </select>

                  <span className="leave-policy-form-help">
                    Choose how leave is allocated to employees.
                  </span>
                </div>

                <div className="leave-policy-form-group">
                  <label
                    className="leave-policy-form-label"
                    htmlFor="leave-policy-days"
                  >
                    Number of Days
                  </label>

                  <input
                    id="leave-policy-days"
                    className="leave-policy-form-input"
                    type="number"
                    min="0"
                    step="0.5"
                    placeholder={
                      formData.allocationType === "Annual"
                        ? "e.g. 12"
                        : "e.g. 1"
                    }
                    value={formData.days}
                    onChange={(event) =>
                      updateField(
                        "days",
                        event.target.value
                      )
                    }
                  />

                  <span className="leave-policy-form-help">
                    {formData.allocationType === "Annual"
                      ? "Days granted per year."
                      : "Days granted every month."}
                  </span>
                </div>
              </div>
            </div>

            {/* CARRY FORWARD */}
            <div className="leave-policy-form-section">
              <div className="leave-policy-form-section-title">
                Carry Forward
              </div>

              <div className="leave-policy-toggle-row">
                <div className="leave-policy-toggle-content">
                  <span className="leave-policy-toggle-title">
                    Allow Carry Forward
                  </span>

                  <span className="leave-policy-toggle-description">
                    Allow unused leave to move to the next period.
                  </span>
                </div>

                <Toggle
                  checked={formData.carryForward}
                  onChange={(value) =>
                    updateField("carryForward", value)
                  }
                />
              </div>

              {formData.carryForward && (
                <div className="leave-policy-form-grid leave-policy-carry-forward-fields">
                  <div className="leave-policy-form-group">
                    <label
                      className="leave-policy-form-label"
                      htmlFor="leave-policy-carry-type"
                    >
                      Carry Forward Limit
                    </label>

                    <select
                      id="leave-policy-carry-type"
                      className="leave-policy-form-input"
                      value={formData.carryForwardType}
                      onChange={(event) =>
                        updateField(
                          "carryForwardType",
                          event.target.value
                        )
                      }
                    >
                      <option value="All">
                        All unused days
                      </option>

                      <option value="Maximum">
                        Maximum number of days
                      </option>
                    </select>
                  </div>

                  {formData.carryForwardType === "Maximum" && (
                    <div className="leave-policy-form-group">
                      <label
                        className="leave-policy-form-label"
                        htmlFor="leave-policy-carry-limit"
                      >
                        Maximum Days
                      </label>

                      <input
                        id="leave-policy-carry-limit"
                        className="leave-policy-form-input"
                        type="number"
                        min="0"
                        step="0.5"
                        placeholder="e.g. 5"
                        value={formData.carryForwardLimit}
                        onChange={(event) =>
                          updateField(
                            "carryForwardLimit",
                            event.target.value
                          )
                        }
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* RULES */}
            <div className="leave-policy-form-section">
              <div className="leave-policy-form-section-title">
                Leave Rules
              </div>

              <div className="leave-policy-toggle-list">

                <div className="leave-policy-toggle-row">
                  <div className="leave-policy-toggle-content">
                    <span className="leave-policy-toggle-title">
                      Half Day Leave
                    </span>

                    <span className="leave-policy-toggle-description">
                      Allow employees to apply for half-day leave.
                    </span>
                  </div>

                  <Toggle
                    checked={formData.halfDayAllowed}
                    onChange={(value) =>
                      updateField(
                        "halfDayAllowed",
                        value
                      )
                    }
                  />
                </div>

                <div className="leave-policy-toggle-row">
                  <div className="leave-policy-toggle-content">
                    <span className="leave-policy-toggle-title">
                      Requires Approval
                    </span>

                    <span className="leave-policy-toggle-description">
                      Leave requests must be approved before confirmation.
                    </span>
                  </div>

                  <Toggle
                    checked={formData.requiresApproval}
                    onChange={(value) =>
                      updateField(
                        "requiresApproval",
                        value
                      )
                    }
                  />
                </div>

              </div>
            </div>
          </div>

          {/* FOOTER */}
          <div className="leave-policy-form-footer">
            <button
              type="button"
              className="leave-policy-cancel-button"
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="leave-policy-save-button"
            >
              {policy ? "Save Changes" : "Create Policy"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LeavePolicyForm;

