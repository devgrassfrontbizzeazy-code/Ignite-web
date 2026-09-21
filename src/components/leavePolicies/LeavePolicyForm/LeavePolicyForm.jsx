import { useEffect, useState } from "react";
import { X } from "lucide-react";

import Toggle from "../../common/Toggle/Toggle";

import "./LeavePolicyForm.css";

const defaultForm = {
  name: "",
  description: "",
  allocationType: "YEARLY",
  days: "",
  carryForward: false,
  carryForwardType: "NONE",
  carryForwardLimit: "",
  halfDayAllowed: true,
  requiresApproval: true,
  isPaid: true,
};

const LeavePolicyForm = ({
  policy,
  onSave,
  onClose,
  saving = false,
}) => {
  const [formData, setFormData] = useState(defaultForm);

  useEffect(() => {
    if (policy) {
      setFormData({
        name: policy.name || "",
        description: policy.description || "",

        allocationType:
          policy.allocationType ||
          policy.allocation_type ||
          "YEARLY",

        days:
          policy.days !== undefined &&
          policy.days !== null
            ? policy.days
            : policy.allocation_days !== undefined &&
                policy.allocation_days !== null
              ? policy.allocation_days
              : "",

        carryForward: Boolean(
          policy.carryForward ??
            policy.is_carry_forward
        ),

        carryForwardType:
          policy.carryForwardType ||
          policy.carry_forward_type ||
          "NONE",

        carryForwardLimit:
          policy.carryForwardLimit !== undefined &&
          policy.carryForwardLimit !== null
            ? policy.carryForwardLimit
            : policy.max_carry_forward_days !==
                  undefined &&
                policy.max_carry_forward_days !== null
              ? policy.max_carry_forward_days
              : "",

        halfDayAllowed: Boolean(
          policy.halfDayAllowed ??
            policy.allow_half_day
        ),

        requiresApproval: Boolean(
          policy.requiresApproval ??
            policy.requires_approval
        ),

        isPaid: Boolean(
          policy.isPaid ??
            policy.is_paid
        ),
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

    if (!formData.name.trim() || saving) {
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
        : "NONE",

      carryForwardLimit:
        formData.carryForward &&
        formData.carryForwardType === "MAXIMUM"
          ? Number(formData.carryForwardLimit)
          : null,

      halfDayAllowed:
        formData.halfDayAllowed,

      requiresApproval:
        formData.requiresApproval,

      isPaid: formData.isPaid,
    });
  };

  return (
    <div
      className="leave-policy-form-overlay"
      onMouseDown={onClose}
    >
      <div
        className="leave-policy-form-modal"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <div className="leave-policy-form-header">
          <div>
            <h2 className="leave-policy-form-title">
              {policy
                ? "Edit Leave Policy"
                : "Add Leave Policy"}
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
            disabled={saving}
          >
            <X
              size={18}
              strokeWidth={2}
            />
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
                      updateField(
                        "name",
                        event.target.value
                      )
                    }
                    disabled={saving}
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
                    disabled={saving}
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
                    disabled={saving}
                  >
                    <option value="YEARLY">
                      Yearly
                    </option>

                    <option value="MONTHLY">
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
                      formData.allocationType ===
                      "YEARLY"
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
                    disabled={saving}
                  />

                  <span className="leave-policy-form-help">
                    {formData.allocationType ===
                    "YEARLY"
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
                    updateField(
                      "carryForward",
                      value
                    )
                  }
                  disabled={saving}
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
                      value={
                        formData.carryForwardType
                      }
                      onChange={(event) =>
                        updateField(
                          "carryForwardType",
                          event.target.value
                        )
                      }
                      disabled={saving}
                    >
                      <option value="NONE">
                        No carry forward
                      </option>

                      <option value="ALL">
                        All unused days
                      </option>

                      <option value="MAXIMUM">
                        Maximum number of days
                      </option>
                    </select>
                  </div>

                  {formData.carryForwardType ===
                    "MAXIMUM" && (
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
                        value={
                          formData.carryForwardLimit
                        }
                        onChange={(event) =>
                          updateField(
                            "carryForwardLimit",
                            event.target.value
                          )
                        }
                        disabled={saving}
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
                    checked={
                      formData.halfDayAllowed
                    }
                    onChange={(value) =>
                      updateField(
                        "halfDayAllowed",
                        value
                      )
                    }
                    disabled={saving}
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
                    checked={
                      formData.requiresApproval
                    }
                    onChange={(value) =>
                      updateField(
                        "requiresApproval",
                        value
                      )
                    }
                    disabled={saving}
                  />
                </div>

                <div className="leave-policy-toggle-row">
                  <div className="leave-policy-toggle-content">
                    <span className="leave-policy-toggle-title">
                      Paid Leave
                    </span>

                    <span className="leave-policy-toggle-description">
                      Employees receive their regular salary during this leave.
                    </span>
                  </div>

                  <Toggle
                    checked={formData.isPaid}
                    onChange={(value) =>
                      updateField(
                        "isPaid",
                        value
                      )
                    }
                    disabled={saving}
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
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="leave-policy-save-button"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : policy
                  ? "Save Changes"
                  : "Create Policy"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LeavePolicyForm;