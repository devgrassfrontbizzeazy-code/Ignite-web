import DashboardWidget from "../../../DashboardWidget/DashboardWidget";
import "./ActionWidget.css";

const ActionWidget = ({
  title = "Quick Actions",
  actions = [],
  columns = 1,
  loading = false,
  className = "",
}) => {
  return (
    <DashboardWidget
      title={title}
      loading={loading}
      className={`action-widget ${className}`}
    >
      <div
        className="action-widget__grid"
        style={{
          "--action-columns": columns,
        }}
      >
        {actions.length === 0 ? (
          <div className="action-widget__empty">
            No actions available.
          </div>
        ) : (
          actions.map((action) => {
            const Icon = action.icon;

            return (
              <button
                type="button"
                className="action-widget__action"
                key={action.key}
                onClick={action.onClick}
                disabled={action.disabled}
              >
                {Icon && (
                  <span className="action-widget__icon">
                    <Icon size={16} />
                  </span>
                )}

                <span className="action-widget__label">
                  {action.label}
                </span>
              </button>
            );
          })
        )}
      </div>
    </DashboardWidget>
  );
};

export default ActionWidget;