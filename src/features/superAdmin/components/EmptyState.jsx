import { Inbox } from "lucide-react";
import "./EmptyState.css";

export default function EmptyState({
  icon: Icon = Inbox,
  title = "No data found",
  description = "No records match the current filters or directory criteria.",
  actionLabel,
  onAction,
}) {
  return (
    <div className="super-empty-state">
      <div className="super-empty-state__icon-wrap">
        <Icon size={28} className="super-empty-state__icon" />
      </div>
      <h3 className="super-empty-state__title">{title}</h3>
      <p className="super-empty-state__desc">{description}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          className="super-empty-state__btn"
          onClick={onAction}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
