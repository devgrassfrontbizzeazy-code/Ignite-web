import { dashboardWidgets } from "../widgetRegistry";
import useDashboardData from "../hooks/useDashboardData";

const getGridColumn = (width) => {
  if (!width) {
    return "span 12";
  }

  const normalizedWidth = Math.min(Math.max(Number(width), 1), 12);

  return `span ${normalizedWidth}`;
};

const WidgetRenderer = () => {
  const dashboardData = useDashboardData();

  return (
    <>
      {dashboardWidgets.map((widget) => {
        if (!widget?.enabled || !widget?.component) {
          return null;
        }

        const WidgetComponent = widget.component;

        return (
          <div
            key={widget.key}
            style={{
              gridColumn: getGridColumn(widget.config?.width),
            }}
          >
            <WidgetComponent
              data={dashboardData}
              config={widget.config}
              loading={dashboardData.loading}
            />
          </div>
        );
      })}
    </>
  );
};

export default WidgetRenderer;