import { Power } from "lucide-react";
import { FiEdit2, FiPower, FiTrash2 } from "react-icons/fi";
import RowActions from "../../common/RowActions/RowActions";

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
          Create your first leave policy to define the leave
          options available to employees.
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
            <th>Paid</th>
            <th>Status</th>
            <th className="leave-policy-actions-header">
              Actions
            </th>
          </tr>
        </thead>

        <tbody>
          {policies.map((policy) => {
            const isActive = policy.status === "Active";

            const actions = [
              {
                key: "edit",
                label: "Edit",
                icon: FiEdit2,
                onClick: () => onEdit(policy),
              },
              ...(onToggleStatus
                ? [
                    {
                      key: "toggleStatus",
                      label: isActive ? "Deactivate" : "Activate",
                      icon: FiPower,
                      onClick: () => onToggleStatus(policy.id),
                    },
                  ]
                : []),
              { key: "divider-1", isDivider: true },
              {
                key: "delete",
                label: "Delete",
                icon: FiTrash2,
                isDanger: true,
                onClick: () => onDelete(policy.id),
              },
            ];

            return (
              <tr key={policy.id}>
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

                <td>
                  <div className="leave-policy-allocation">
                    <span className="leave-policy-allocation-value">
                      {policy.days === null ||
                      policy.days === undefined
                        ? "Unlimited"
                        : `${policy.days} ${
                            policy.allocationType ===
                            "MONTHLY"
                              ? "day/month"
                              : "days/year"
                          }`}
                    </span>

                    <span className="leave-policy-allocation-type">
                      {policy.allocationType ===
                      "MONTHLY"
                        ? "Monthly"
                        : "Yearly"}
                    </span>
                  </div>
                </td>

                <td>
                  {policy.carryForward ? (
                    <span className="leave-policy-carry-value">
                      {policy.carryForwardType ===
                      "MAXIMUM"
                        ? `Up to ${policy.carryForwardLimit} days`
                        : policy.carryForwardType ===
                            "ALL"
                          ? "All unused days"
                          : "No carry forward"}
                    </span>
                  ) : (
                    <PolicyBoolean value={false} />
                  )}
                </td>

                <td>
                  <PolicyBoolean
                    value={policy.halfDayAllowed}
                  />
                </td>

                <td>
                  <PolicyBoolean
                    value={policy.requiresApproval}
                  />
                </td>

                <td>
                  <PolicyBoolean
                    value={policy.isPaid}
                  />
                </td>

                <td>
                  <button
                    type="button"
                    className={`leave-policy-status ${
                      isActive
                        ? "leave-policy-status-active"
                        : "leave-policy-status-inactive"
                    }`}
                    onClick={() =>
                      onToggleStatus?.(policy.id)
                    }
                    title="Toggle status"
                  >
                    <span className="leave-policy-status-dot" />
                    {policy.status}
                  </button>
                </td>

                <td>
                  <RowActions
                    actions={actions}
                    title={`Actions for ${policy.name}`}
                  />
                </td>
              </tr>
            );
          })}
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