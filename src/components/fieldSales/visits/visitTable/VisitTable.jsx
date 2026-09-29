import {
  ArrowRight,
  Clock3,
  MapPin,
} from "lucide-react";

import "./VisitTable.css";

const VISIT_STATUS_LABELS = {
  NOT_STARTED: "Not Started",
  CHECKED_IN: "In Progress",
  CHECKED_OUT: "Completed",
};

const OUTCOME_LABELS = {
  FOLLOW_UP: "Follow-up",
  DEAL_WON: "Deal Won",
  LOST: "Lost",
};

const VisitTable = ({
  visits,
  onViewVisit,
}) => {
  return (
    <div className="visits-table-card">
      <div className="visits-table-card__header">
        <div>
          <h3>Visit Activity</h3>
          <p>
            Track scheduled and completed field visits.
          </p>
        </div>

        <span className="visits-table-card__count">
          {visits.length} visits
        </span>
      </div>

      <div className="visits-table-wrapper">
        <table className="visits-table">
          <thead>
            <tr>
              <th>Lead</th>
              <th>Employee</th>
              <th>Scheduled</th>
              <th>Location</th>
              <th>Visit Status</th>
              <th>Outcome</th>
              <th className="visits-table__action-header">
                Action
              </th>
            </tr>
          </thead>

          <tbody>
            {visits.length === 0 ? (
              <tr>
                <td
                  colSpan="7"
                  className="visits-table__empty"
                >
                  No visits found for the selected filters.
                </td>
              </tr>
            ) : (
              visits.map((visit) => (
                <tr key={visit.id}>
                  <td>
                    <div className="visits-table__lead">
                      <strong>{visit.leadName}</strong>
                      <span>{visit.companyName}</span>
                    </div>
                  </td>

                  <td>
                    <div className="visits-table__employee">
                      <span className="visits-table__avatar">
                        {visit.employeeName
                          .split(" ")
                          .map((name) => name[0])
                          .slice(0, 2)
                          .join("")}
                      </span>

                      <span>{visit.employeeName}</span>
                    </div>
                  </td>

                  <td>
                    <div className="visits-table__scheduled">
                      <strong>{visit.scheduledTime}</strong>
                      <span>
                        <Clock3 size={13} />
                        {visit.scheduledDate}
                      </span>
                    </div>
                  </td>

                  <td>
                    <div className="visits-table__location">
                      <MapPin size={14} />
                      <span>{visit.location}</span>
                    </div>
                  </td>

                  <td>
                    <span
                      className={`visit-status visit-status--${visit.visitStatus.toLowerCase()}`}
                    >
                      <span className="visit-status__dot" />
                      {VISIT_STATUS_LABELS[
                        visit.visitStatus
                      ]}
                    </span>
                  </td>

                  <td>
                    {visit.outcome ? (
                      <span
                        className={`visit-outcome visit-outcome--${visit.outcome.toLowerCase()}`}
                      >
                        {OUTCOME_LABELS[visit.outcome]}
                      </span>
                    ) : (
                      <span className="visits-table__muted">
                        —
                      </span>
                    )}
                  </td>

                  <td className="visits-table__action-cell">
                    <button
                      type="button"
                      className="visits-table__view"
                      onClick={() =>
                        onViewVisit(visit)
                      }
                    >
                      View
                      <ArrowRight size={14} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default VisitTable;