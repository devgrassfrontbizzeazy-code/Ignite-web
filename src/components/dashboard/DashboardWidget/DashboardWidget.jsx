import "./DashboardWidget.css";

const DashboardWidget = ({
  title,
  action,
  onAction,
  children,
  className = "",
  loading = false,
}) => {
  return (
    <section className={`dashboard-widget ${className}`}>
      <div className="dashboard-widget__header">
        <h2 className="dashboard-widget__title">{title}</h2>

        {action && (
          <button
            type="button"
            className="dashboard-widget__action"
            onClick={onAction}
          >
            {action}
          </button>
        )}
      </div>

      <div className="dashboard-widget__content">
        {loading ? (
          <div className="dashboard-widget__loading">
            <span className="dashboard-widget__loading-spinner" />
            Loading...
          </div>
        ) : (
          children
        )}
      </div>
    </section>
  );
};

export default DashboardWidget;