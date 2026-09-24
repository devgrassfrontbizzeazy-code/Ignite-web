import DashboardWidget from "../../../DashboardWidget/DashboardWidget";
import "./SummaryWidget.css";

const SummaryWidget = ({
  title,
  value,
  subtitle,
  icon: Icon,
  stats = [],
  action,
  onAction,
  loading = false,
  className = "",
}) => {
  return (
    <DashboardWidget
      title={title}
      action={action}
      onAction={onAction}
      loading={loading}
      className={`summary-widget ${className}`}
    >
      <div className="summary-widget__content">
        {Icon && (
          <div className="summary-widget__icon">
            <Icon size={19} />
          </div>
        )}

        <div className="summary-widget__value-area">
          {value !== undefined && value !== null && (
            <strong className="summary-widget__value">
              {value}
            </strong>
          )}

          {subtitle && (
            <span className="summary-widget__subtitle">
              {subtitle}
            </span>
          )}
        </div>
      </div>

      {stats.length > 0 && (
        <div className="summary-widget__stats">
          {stats.map((stat) => (
            <div
              className="summary-widget__stat"
              key={stat.key}
            >
              <span className="summary-widget__stat-label">
                {stat.label}
              </span>

              <strong className="summary-widget__stat-value">
                {stat.value}
              </strong>
            </div>
          ))}
        </div>
      )}
    </DashboardWidget>
  );
};

export default SummaryWidget;