import { dashboardWidgets } from "../widgetRegistry";

const getGridColumn = (width) => {
  if (!width) {
    return "span 12";
  }

  const normalizedWidth = Math.min(
    Math.max(Number(width), 1),
    12,
  );

  return `span ${normalizedWidth}`;
};

const WidgetRenderer = ({
  dashboardData,
  onApplyLeave,
}) => {
  return (
    <>
      {dashboardWidgets.map((widget) => {
        if (!widget?.enabled || !widget?.component) {
          return null;
        }

        /*
         * Optional widget-level eligibility.
         *
         * If a widget defines canShow(), render it only
         * when the current user satisfies that condition.
         */
        if (
          typeof widget.canShow === "function" &&
          !widget.canShow(dashboardData)
        ) {
          return null;
        }

        const WidgetComponent = widget.component;

        const widgetProps =
          typeof widget.getProps === "function"
            ? widget.getProps(dashboardData, {
                onApplyLeave,
              })
            : {};

        return (
          <div
            className="dashboard-grid__item"
            key={widget.key}
            style={{
              gridColumn: getGridColumn(
                widget.config?.width,
              ),
            }}
          >
            <WidgetComponent
  {...widgetProps}
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