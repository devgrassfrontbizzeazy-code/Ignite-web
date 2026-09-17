
import { Pencil, Power, Trash2 } from "lucide-react";

import "./LeavePolicyTable.css";

const LeavePolicyTable = ({
  policies,
  onEdit,
  onDelete,
  onToggleStatus,
}) => {
  if (!policies.length) {
    return (
      <div className="leave-policy-empty">
        <div className="leave-policy-empty-icon">
          <Power size={22} />
        </div>

        <h3>No leave policies yet</h3>

        <p>
          Create your first leave policy to define the leave options
          available to employees.
        </p>
      </div>
    );
  }

  return (
    <div className="leave-policy-table-wrapper">
      <table className="leave-policy-table">
        <thead>
          <tr>
            <th>Leave Policy</th>
            <th>Allocation</th>
            <th>Carry Forward</th>
            <th>Half Day</th>
            <th>Approval</th>
            <th>Status</th>
            <th className="leave-policy-actions-header">
              Actions
            </th>
          </tr>
        </thead>

        <tbody>
          {policies.map((policy) => (
            <tr key={policy.id}>

              {/* Leave Policy */}
              <td>
                <div className="leave-policy-name-cell">
                  <div>
                    <div className="leave-policy-name">
                      {policy.name}
                    </div>

                    {policy.description && (
                      <div className="leave-policy-description">
                        {policy.description}
                      </div>
                    )}
                  </div>
                </div>
              </td>

              {/* Allocation */}
              <td>
                <div className="leave-policy-allocation">
                  <span className="leave-policy-allocation-value">
                    {policy.days === null ||
                    policy.days === undefined
                      ? "Unlimited"
                      : `${policy.days} ${
                          policy.allocationType === "Monthly"
                            ? "day/month"
                            : "days/year"
                        }`}
                  </span>

                  <span className="leave-policy-allocation-type">
                    {policy.allocationType || "Annual"}
                  </span>
                </div>
              </td>

              {/* Carry Forward */}
              <td>
                {policy.carryForward ? (
                  <span className="leave-policy-carry-value">
                    {policy.carryForwardType === "Maximum"
                      ? `Up to ${policy.carryForwardLimit} days`
                      : "All unused days"}
                  </span>
                ) : (
                  <PolicyBoolean value={false} />
                )}
              </td>

              {/* Half Day */}
              <td>
                <PolicyBoolean value={policy.halfDayAllowed} />
              </td>

              {/* Approval */}
              <td>
                <PolicyBoolean value={policy.requiresApproval} />
              </td>

              {/* Status */}
              <td>
                <button
                  type="button"
                  className={`leave-policy-status ${
                    policy.status === "Active"
                      ? "leave-policy-status-active"
                      : "leave-policy-status-inactive"
                  }`}
                  onClick={() => onToggleStatus(policy.id)}
                  title="Toggle status"
                >
                  <span className="leave-policy-status-dot" />
                  {policy.status}
                </button>
              </td>

              {/* Actions */}
              <td>
                <div className="leave-policy-actions">
                  <button
                    type="button"
                    className="leave-policy-action-button"
                    onClick={() => onEdit(policy)}
                    title="Edit policy"
                    aria-label={`Edit ${policy.name}`}
                  >
                    <Pencil size={15} strokeWidth={2} />
                  </button>

                  <button
                    type="button"
                    className="leave-policy-action-button leave-policy-action-danger"
                    onClick={() => onDelete(policy.id)}
                    title="Delete policy"
                    aria-label={`Delete ${policy.name}`}
                  >
                    <Trash2 size={15} strokeWidth={2} />
                  </button>
                </div>
              </td>

            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const PolicyBoolean = ({ value }) => {
  return (
    <span
      className={`leave-policy-boolean ${
        value
          ? "leave-policy-boolean-yes"
          : "leave-policy-boolean-no"
      }`}
    >
      {value ? "Yes" : "No"}
    </span>
  );
};

export default LeavePolicyTable;

