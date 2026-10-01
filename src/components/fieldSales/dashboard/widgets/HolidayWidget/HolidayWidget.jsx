import { CalendarDays } from "lucide-react";
import ListWidget from "../../../../dashboard/widgets/generic/ListWidget/ListWidget";
import "./HolidayWidget.css";

const HolidayWidget = ({ holidays = [], loading }) => {
  return (
    <div className="dashboard-grid__item field-sales-holiday-widget">
      <ListWidget
        title="Upcoming Holidays"
        items={holidays.slice(0, 3)}
        action="View All"
        onAction={() => {
          window.location.href = "/holidays";
        }}
        emptyMessage="No upcoming holidays."
        renderItem={(holiday) => (
          <div className="upcoming-holiday-item" key={holiday?.id || holiday?.name}>
            <div className="upcoming-holiday-item__icon">
              <CalendarDays size={14} />
            </div>
            <div className="upcoming-holiday-item__info">
              <strong>{holiday?.name || holiday?.holiday_name || "Holiday"}</strong>
              <span>{holiday?.type || "Holiday"}</span>
            </div>
            <div className="upcoming-holiday-item__date">
              <strong>
                {holiday?.date
                  ? new Date(holiday.date).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })
                  : "--"}
              </strong>
            </div>
          </div>
        )}
        loading={loading}
      />
    </div>
  );
};

export default HolidayWidget;