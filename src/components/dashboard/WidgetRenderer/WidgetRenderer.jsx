import { dashboardWidgets } from "../widgetRegistry";

const getColSpan = (width) => {
  if (!width) {
    return 12;
  }

  return Math.min(
    Math.max(Number(width), 1),
    12,
  );
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

        const span = getColSpan(widget.config?.width);

        return (
          <div
            className={`dashboard-grid__item dashboard-grid__item--span-${span}`}
            key={widget.key}
            style={{
              "--col-span": span,
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