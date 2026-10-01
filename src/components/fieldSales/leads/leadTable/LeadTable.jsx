import {
  Eye,
  Edit2,
  MapPin,
  Users,
} from "lucide-react";

import IgniteLoader from "../../../common/IgniteLoader/IgniteLoader";

import "./LeadTable.css";

const formatStatus = (status) => {
  switch (status) {
    case "NEW":
      return "New";

    case "FOLLOW_UP":
      return "Follow-up";

    case "DEAL_WON":
      return "Deal Won";

    case "LOST":
      return "Lost";

    default:
      return status || "New";
  }
};

const LeadTable = ({
  leads = [],
  loading = false,
  onView,
  onEdit,
}) => {
  if (loading) {
    return (
      <div className="lead-table-card lead-table-card--loading">
        <IgniteLoader message="Loading leads..." />
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="lead-table-card lead-table-card--empty">
        <div className="lead-table-empty">
          <div className="lead-table-empty__icon">
            <Users size={24} />
          </div>

          <h3>No leads found</h3>

          <p>
            No leads match the current search or filters.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="lead-table-card">
      <div className="lead-table-wrapper">
        <table className="lead-table">
          <thead>
            <tr>
              <th>Lead</th>
              <th>Company</th>
              <th>Phone</th>
              <th>Assigned To</th>
              <th>Location</th>
              <th>Status</th>
              <th className="lead-table__actions-header">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id}>
                <td>
                  <div className="lead-table__lead">
                    <div className="lead-table__avatar">
                      {lead.firstName?.charAt(0)}
                      {lead.lastName?.charAt(0)}
                    </div>

                    <div className="lead-table__lead-info">
                      <strong>
                        {lead.firstName} {lead.lastName}
                      </strong>

                      <span>{lead.email}</span>
                    </div>
                  </div>
                </td>

                <td>
                  <span className="lead-table__company">
                    {lead.companyName || "—"}
                  </span>
                </td>

                <td>
                  <span className="lead-table__phone">
                    {lead.phone || "—"}
                  </span>
                </td>

                <td>
                  <span>
                    {lead.assignedTo?.name || "Unassigned"}
                  </span>
                </td>

                <td>
                  <div className="lead-table__location">
                    <MapPin size={14} />

                    <span>
                      {lead.address || "Location not added"}
                    </span>
                  </div>
                </td>

                <td>
                  <span
                    className={[
                      "lead-table__status",
                      `lead-table__status--${lead.status?.toLowerCase()}`,
                    ].join(" ")}
                  >
                    {formatStatus(lead.status)}
                  </span>
                </td>

                <td>
                  <div className="lead-table__actions">
                    <button
                      type="button"
                      className="lead-table__action"
                      title="View Lead"
                      onClick={() => onView?.(lead)}
                    >
                      <Eye size={15} />
                    </button>

                    <button
                      type="button"
                      className="lead-table__action"
                      title="Edit Lead"
                      onClick={() => onEdit?.(lead)}
                    >
                      <Edit2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/*
 * Kept local so this first UI slice does not introduce
 * another shared icon dependency.
 */
const FiUsersIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

export default LeadTable;