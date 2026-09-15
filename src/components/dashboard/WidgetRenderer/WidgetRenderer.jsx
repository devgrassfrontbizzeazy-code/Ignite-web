import { dashboardWidgets } from "../widgetRegistry";

const getGridColumn = (width) => {
  if (!width) {
    return "span 12";
  }

  const normalizedWidth = Math.min(Math.max(Number(width), 1), 12);

  return `span ${normalizedWidth}`;
};

const WidgetRenderer = () => {
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
              data={widget.data}
              config={widget.config}
            />
          </div>
        );
      })}
    </>
  );
};

export default WidgetRenderer;