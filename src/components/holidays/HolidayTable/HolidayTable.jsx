import { CalendarDays } from "lucide-react";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import {
  canUpdateHolidays,
  canDeleteHolidays,
} from "../../../utils/permissionUtils";
import RowActions from "../../common/RowActions/RowActions";

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

  const canEdit = canUpdateHolidays();
  const canDelete = canDeleteHolidays();

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
          {holidays.map((holiday) => {
            const actions = [
              ...(canEdit
                ? [
                    {
                      key: "edit",
                      label: "Edit",
                      icon: FiEdit2,
                      onClick: () => onEdit(holiday),
                    },
                  ]
                : []),
              ...(canDelete && canEdit
                ? [{ key: "divider-1", isDivider: true }]
                : []),
              ...(canDelete
                ? [
                    {
                      key: "delete",
                      label: "Delete",
                      icon: FiTrash2,
                      isDanger: true,
                      onClick: () => onDelete(holiday.id),
                    },
                  ]
                : []),
            ];

            return (
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
                    className={`holiday-boolean ${
                      holiday.recurring_every_year ??
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
                  {actions.length > 0 ? (
                    <RowActions
                      actions={actions}
                      title={`Actions for ${holiday.name}`}
                    />
                  ) : (
                    <span
                      style={{
                        fontSize: "11px",
                        color: "var(--color-text-muted)",
                      }}
                    >
                      —
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default HolidayTable;
