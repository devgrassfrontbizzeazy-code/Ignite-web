import DashboardWidget from "./DashboardWidget/DashboardWidget";

const TestWidget = ({ data }) => {
  return (
    <DashboardWidget title={data?.title || "Dashboard Widget"}>
      <p
        style={{
          margin: 0,
          color: "var(--color-text-secondary, #64748b)",
          fontSize: "13px",
        }}
      >
        This widget is rendered dynamically.
      </p>
    </DashboardWidget>
  );
};

const AnotherTestWidget = () => {
  return (
    <DashboardWidget title="Another Widget">
      <p
        style={{
          margin: 0,
          color: "var(--color-text-secondary, #64748b)",
          fontSize: "13px",
        }}
      >
        Widget system is working.
      </p>
    </DashboardWidget>
  );
};

export const dashboardWidgets = [
  {
    key: "test",
    enabled: true,
    component: TestWidget,
    data: {
      title: "Dynamic Dashboard",
    },
    config: {
      width: 6,
    },
  },

  {
    key: "another",
    enabled: true,
    component: AnotherTestWidget,
    data: {},
    config: {
      width: 6,
    },
  },
];