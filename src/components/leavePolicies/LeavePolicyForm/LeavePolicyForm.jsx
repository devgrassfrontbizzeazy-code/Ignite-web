
import { useEffect, useState } from "react";
import { X } from "lucide-react";

import Toggle from "../../common/Toggle/Toggle";

import "./LeavePolicyForm.css";

const defaultForm = {
  name: "",
  description: "",
  daysPerYear: "",
  carryForward: false,
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
        daysPerYear:
          policy.daysPerYear === null ? "" : policy.daysPerYear,
        carryForward: Boolean(policy.carryForward),
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

    const isUnlimited = formData.daysPerYear === "";

    onSave({
      name: formData.name.trim(),
      description: formData.description.trim(),
      daysPerYear: isUnlimited
        ? null
        : Number(formData.daysPerYear),
      carryForward: formData.carryForward,
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
        <div className="leave-policy-form-header">
          <div>
            <h2 className="leave-policy-form-title">
              {policy ? "Edit Leave Policy" : "Add Leave Policy"}
            </h2>

            <p className="leave-policy-form-subtitle">
              Configure the basic rules for this leave type.
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
            <div className="leave-policy-form-grid">
              <div className="leave-policy-form-group full">
                <label
                  className="leave-policy-form-label"
                  htmlFor="leave-policy-name"
                >
                  Leave Type <span>*</span>
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
                  placeholder="Briefly describe this leave type..."
                  value={formData.description}
                  onChange={(event) =>
                    updateField("description", event.target.value)
                  }
                />
              </div>

              <div className="leave-policy-form-group">
                <label
                  className="leave-policy-form-label"
                  htmlFor="leave-policy-days"
                >
                  Days Per Year
                </label>

                <input
                  id="leave-policy-days"
                  className="leave-policy-form-input"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="Leave blank for unlimited"
                  value={formData.daysPerYear}
                  onChange={(event) =>
                    updateField(
                      "daysPerYear",
                      event.target.value
                    )
                  }
                />

                <span className="leave-policy-form-help">
                  Leave blank if there is no fixed annual limit.
                </span>
              </div>
            </div>

            <div className="leave-policy-toggle-list">
              <div className="leave-policy-toggle-row">
                <div className="leave-policy-toggle-content">
                  <span className="leave-policy-toggle-title">
                    Carry Forward
                  </span>

                  <span className="leave-policy-toggle-description">
                    Allow unused leave to move to the next year.
                  </span>
                </div>

                <Toggle
                  checked={formData.carryForward}
                  onChange={(value) =>
                    updateField("carryForward", value)
                  }
                />
              </div>

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
                    updateField("halfDayAllowed", value)
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
                    updateField("requiresApproval", value)
                  }
                />
              </div>
            </div>
          </div>

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

