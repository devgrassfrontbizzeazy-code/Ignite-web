import WidgetRenderer from "../WidgetRenderer/WidgetRenderer";

import "./DashboardGrid.css";

const DashboardGrid = ({
  dashboardData,
  onApplyLeave,
}) => {
  return (
    <main className="dashboard-grid">
      <WidgetRenderer
        dashboardData={dashboardData}
        onApplyLeave={onApplyLeave}
      />
    </main>
  );
};

export default DashboardGrid;