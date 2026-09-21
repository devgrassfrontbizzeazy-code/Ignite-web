
import { CalendarDays, Pencil, Trash2 } from "lucide-react";
import {
  canUpdateHolidays,
  canDeleteHolidays,
} from "../../../utils/permissionUtils";

import "./HolidayTable.css";

const HolidayTable = ({
  holidays,
  onEdit,
  onDelete,
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
            <th className="holiday-actions-header">
              Actions
            </th>
          </tr>
        </thead>

        <tbody>
          {holidays.map((holiday) => (
            <tr key={holiday.id}>
              {/* Holiday */}
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

              {/* Date */}
              <td>
                <span className="holiday-date">
                  {holiday.date}
                </span>
              </td>

              {/* Day */}
              <td>
                <span className="holiday-day">
                  {holiday.day ||
                    new Date(
                      `${holiday.date}T00:00:00`
                    ).toLocaleDateString("en-US", {
                      weekday: "long",
                    })}
                </span>
              </td>

              {/* Type */}
              <td>
                <span
                  className={`holiday-type holiday-type-${String(
                    holiday.type || ""
                  )
                    .toLowerCase()
                    .replace(/\s+/g, "-")}`}
                >
                  {holiday.type || "—"}
                </span>
              </td>

              {/* Recurring */}
              <td>
                <span
                  className={`holiday-boolean ${holiday.recurring_every_year ??
                      holiday.recurringEveryYear ??
                      holiday.recurring
                      ? "holiday-boolean-yes"
                      : "holiday-boolean-no"
                    }`}
                >
                  {holiday.recurring_every_year ??
                    holiday.recurringEveryYear ??
                    holiday.recurring
                    ? "Yes"
                    : "No"}
                </span>
              </td>

              {/* Actions */}
              <td>
                <div className="holiday-actions">
                  {canUpdateHolidays() && (
                    <button
                      type="button"
                      className="holiday-action-button"
                      onClick={() => onEdit(holiday)}
                      title="Edit holiday"
                      aria-label={`Edit ${holiday.name}`}
                    >
                      <Pencil size={15} strokeWidth={2} />
                    </button>
                  )}

                  {canDeleteHolidays() && (
                    <button
                      type="button"
                      className="holiday-action-button holiday-action-danger"
                      onClick={() => onDelete(holiday.id)}
                      title="Delete holiday"
                      aria-label={`Delete ${holiday.name}`}
                    >
                      <Trash2 size={15} strokeWidth={2} />
                    </button>
                  )}

                  {!canUpdateHolidays() && !canDeleteHolidays() && (
                    <span
                      style={{
                        fontSize: "11px",
                        color: "var(--color-text-muted)",
                      }}
                    >
                      —
                    </span>
                  )}
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

