import DashboardWidget from "../../../DashboardWidget/DashboardWidget";
import "./ListWidget.css";

const ListWidget = ({
  title,
  items = [],
  renderItem,
  emptyMessage = "No data available.",
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
      className={`list-widget ${className}`}
    >
      <div className="list-widget__list">
        {items.length === 0 ? (
          <div className="list-widget__empty">
            {emptyMessage}
          </div>
        ) : (
          items.map((item, index) => (
            <div
              className="list-widget__item"
              key={item?.id ?? index}
            >
              {renderItem ? renderItem(item, index) : null}
            </div>
          ))
        )}
      </div>
    </DashboardWidget>
  );
};

export default ListWidget;