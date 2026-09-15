import DashboardHeader from "../../components/dashboard/DashboardHeader/DashboardHeader";
import DashboardGrid from "../../components/dashboard/DashboardGrid/DashboardGrid";

import "./Dashboard.css";

const Dashboard = () => {
  return (
    <div className="dashboard-page">
      <DashboardHeader />
      <DashboardGrid />
    </div>
  );
};

export default Dashboard;