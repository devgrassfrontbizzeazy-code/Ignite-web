
import { CalendarDays, Pencil, Power, Trash2 } from "lucide-react";

import "./HolidayTable.css";

const HolidayTable = ({
  holidays,
  onEdit,
  onDelete,
  onToggleStatus,
}) => {
  if (!holidays.length) {
    return (
      <div className="holiday-table-empty">
        <div className="holiday-table-empty-icon">
          <CalendarDays size={22} strokeWidth={1.8} />
        </div>

        <h3>No holidays found</h3>

        <p>
          Add your first holiday to start managing the company holiday
          calendar.
        </p>
      </div>
    );
  }

  return (
    <div className="holiday-table-wrapper">
      <table className="holiday-table">
        <thead>
          <tr>
            <th>Holiday</th>
            <th>Date</th>
            <th>Day</th>
            <th>Type</th>
            <th>Recurring</th>
            <th>Status</th>
            <th className="holiday-actions-header">
              Actions
            </th>
          </tr>
        </thead>

        <tbody>
          {holidays.map((holiday) => (
            <tr key={holiday.id}>
              <td>
                <div className="holiday-name-cell">
                  <div className="holiday-name-icon">
                    <CalendarDays size={16} strokeWidth={1.8} />
                  </div>

                  <div>
                    <div className="holiday-name">
                      {holiday.name}
                    </div>

                    {holiday.description && (
                      <div className="holiday-description">
                        {holiday.description}
                      </div>
                    )}
                  </div>
                </div>
              </td>

              <td>
                <span className="holiday-date">
                  {holiday.date}
                </span>
              </td>

              <td>
                <span className="holiday-day">
                  {holiday.day}
                </span>
              </td>

              <td>
                <span
                  className={`holiday-type holiday-type-${holiday.type
                    .toLowerCase()
                    .replace(/\s+/g, "-")}`}
                >
                  {holiday.type}
                </span>
              </td>

              <td>
                <span
                  className={`holiday-boolean ${
                    holiday.recurring
                      ? "holiday-boolean-yes"
                      : "holiday-boolean-no"
                  }`}
                >
                  {holiday.recurring ? "Yes" : "No"}
                </span>
              </td>

              <td>
                <button
                  type="button"
                  className={`holiday-status ${
                    holiday.status === "Active"
                      ? "holiday-status-active"
                      : "holiday-status-inactive"
                  }`}
                  onClick={() => onToggleStatus(holiday.id)}
                  title="Toggle status"
                >
                  <span className="holiday-status-dot" />
                  {holiday.status}
                </button>
              </td>

              <td>
                <div className="holiday-actions">
                  <button
                    type="button"
                    className="holiday-action-button"
                    onClick={() => onEdit(holiday)}
                    title="Edit holiday"
                    aria-label={`Edit ${holiday.name}`}
                  >
                    <Pencil size={15} strokeWidth={2} />
                  </button>

                  <button
                    type="button"
                    className="holiday-action-button holiday-action-danger"
                    onClick={() => onDelete(holiday.id)}
                    title="Delete holiday"
                    aria-label={`Delete ${holiday.name}`}
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

export default HolidayTable;

