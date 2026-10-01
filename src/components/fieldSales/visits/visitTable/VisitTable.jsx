import {
  Clock3,
  MapPin,
} from "lucide-react";

import "./VisitTable.css";

const VISIT_STATUS_LABELS = {
  NOT_STARTED: "Not Started",
  CHECKED_IN: "In Progress",
  CHECKED_OUT: "Completed",
};

const getInitials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

const getVisitStatus = (visit) => {
  const status = visit.visitStatus || "NOT_STARTED";

  return {
    key: status.toLowerCase(),
    label:
      VISIT_STATUS_LABELS[status] ||
      visit.rawStatus ||
      status,
  };
};

const VisitTable = ({
  visits = [],
  onViewVisit,
  showEmployee = true,
}) => {
  return (
    <div className="visits-table-card">

      {/* Header */}
      <div className="visits-table-card__header">
        <div className="visits-table-card__heading">
          <div className="visits-table-card__title-row">
            <h3>Visit Activity</h3>

            <span className="visits-table-card__count">
              {visits.length}
            </span>
          </div>

          <p>
            Track scheduled, active and completed field visits.
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="visits-table-wrapper">
        <table className="visits-table">
          <thead>
            <tr>
              <th>Lead / Client</th>

              {showEmployee && <th>Employee</th>}

              <th>Scheduled</th>

              <th>Location</th>

              <th>Visit Status</th>

              <th className="visits-table__action-header">
                Action
              </th>
            </tr>
          </thead>

          <tbody>
            {visits.length === 0 ? (
              <tr>
                <td
                  colSpan={showEmployee ? 6 : 5}
                  className="visits-table__empty"
                >
                  <div className="visits-table__empty-content">
                    <div className="visits-table__empty-icon">
                      <MapPin size={18} />
                    </div>

                    <strong>No visits found</strong>

                    <span>
                      Try adjusting the selected filters.
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              visits.map((visit) => {
                const status = getVisitStatus(visit);

                return (
                  <tr key={visit.id}>

                    {/* Lead / Client */}
                    <td>
                      <div className="visits-table__lead">
                        <strong title={visit.leadName}>
                          {visit.leadName}
                        </strong>

                        <span title={visit.companyName}>
                          {visit.companyName || "—"}
                        </span>
                      </div>
                    </td>

                    {/* Employee */}
                    {showEmployee && (
                      <td>
                        <div className="visits-table__employee">
                          <span className="visits-table__avatar">
                            {getInitials(visit.employeeName)}
                          </span>

                          <span
                            className="visits-table__employee-name"
                            title={visit.employeeName}
                          >
                            {visit.employeeName}
                          </span>
                        </div>
                      </td>
                    )}

                    {/* Scheduled */}
                    <td>
                      <div className="visits-table__scheduled">
                        <strong>
                          {visit.scheduledTime}
                        </strong>

                        <span>
                          <Clock3 size={13} />
                          {visit.scheduledDate}
                        </span>
                      </div>
                    </td>

                    {/* Location */}
                    <td>
                      <div
                        className="visits-table__location"
                        title={visit.location}
                      >
                        <MapPin size={14} />

                        <span>
                          {visit.location}
                        </span>
                      </div>
                    </td>

                    {/* Visit Status */}
                    <td>
                      <span
                        className={`visit-status visit-status--${status.key}`}
                      >
                        <span className="visit-status__dot" />

                        {status.label}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="visits-table__action-cell">
                      <button
                        type="button"
                        className="visits-table__view"
                        onClick={() => onViewVisit(visit)}
                        aria-label={`View visit for ${visit.leadName}`}
                      >
                        View
                      </button>
                    </td>

                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default VisitTable;