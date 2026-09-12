import { useState } from "react";
import {
  CalendarDays,
  MoreVertical,
} from "lucide-react";

import "./LeaveRequests.css";

const FILTERS = [
  "All",
  "Pending",
  "Approved",
  "Rejected",
  "Cancelled",
];

const LeaveRequests = ({ requests = [] }) => {
  const [activeFilter, setActiveFilter] = useState("All");

  const filteredRequests =
    activeFilter === "All"
      ? requests
      : requests.filter(
          (request) => request.status === activeFilter
        );

  return (
    <div className="leave-requests">
      <div className="leave-requests__filters">
        {FILTERS.map((filter) => (
          <button
            key={filter}
            type="button"
            className={`leave-requests__filter ${
              activeFilter === filter
                ? "leave-requests__filter--active"
                : ""
            }`}
            onClick={() => setActiveFilter(filter)}
          >
            {filter}
          </button>
        ))}
      </div>

      <div className="leave-requests__table-wrapper">
        <table className="leave-requests__table">
          <thead>
            <tr>
              <th>Leave Type</th>
              <th>Dates</th>
              <th>Days</th>
              <th>Applied On</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {filteredRequests.length > 0 ? (
              filteredRequests.map((request) => (
                <tr key={request.id}>
                  <td>
                    <div className="leave-request-type">
                      <div className="leave-request-type__icon">
                        <CalendarDays size={15} />
                      </div>

                      <span>{request.type}</span>
                    </div>
                  </td>

                  <td>
                    <div className="leave-request-dates">
                      <span>{request.from}</span>

                      {request.from !== request.to && (
                        <span>
                          → {request.to}
                        </span>
                      )}
                    </div>
                  </td>

                  <td>
                    <span className="leave-request-days">
                      {request.days}{" "}
                      {request.days === 1
                        ? "Day"
                        : "Days"}
                    </span>
                  </td>

                  <td>
                    <span className="leave-request-applied">
                      {request.appliedOn}
                    </span>
                  </td>

                  <td>
                    <span
                      className={`leave-request-status leave-request-status--${request.status.toLowerCase()}`}
                    >
                      <span className="leave-request-status__dot" />
                      {request.status}
                    </span>
                  </td>

                  <td>
                    <button
                      type="button"
                      className="leave-request-menu"
                      aria-label="More options"
                    >
                      <MoreVertical size={17} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="6"
                  className="leave-requests__empty"
                >
                  No {activeFilter.toLowerCase()} leave
                  requests found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeaveRequests;