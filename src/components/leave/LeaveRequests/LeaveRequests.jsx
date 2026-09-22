import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { FiEye, FiSlash } from "react-icons/fi";
import RowActions from "../../common/RowActions/RowActions";
import { useNotification } from "../../../context/NotificationContext";

import "./LeaveRequests.css";

const FILTERS = [
  "All",
  "Pending",
  "Approved",
  "Rejected",
  "Cancelled",
];

const LeaveRequests = ({ requests = [], onView, onCancel }) => {
  const { notify } = useNotification();
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
            className={`leave-requests__filter ${activeFilter === filter
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
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredRequests.length > 0 ? (
              filteredRequests.map((request) => {
                const isPending = request.status === "Pending";

                const actions = [
                  {
                    key: "view",
                    label: "View Details",
                    icon: FiEye,
                    onClick: () =>
                      onView
                        ? onView(request)
                        : notify.info(
                          `Leave Request: ${request.type} (${request.from} - ${request.to}) [${request.status}]`
                        ),
                  },
                  ...(isPending && onCancel
                    ? [
                      { key: "divider-1", isDivider: true },
                      {
                        key: "cancel",
                        label: "Cancel Request",
                        icon: FiSlash,
                        isDanger: true,
                        onClick: () => onCancel(request),
                      },
                    ]
                    : []),
                ];

                return (
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
                      <RowActions
                        actions={actions}
                        title={`Actions for ${request.type} request`}
                      />
                    </td>
                  </tr>
                );
              })
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