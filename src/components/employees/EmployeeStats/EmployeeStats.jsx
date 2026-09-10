import StatCard from "../../common/StatCard/StatCard";
import "./EmployeeStats.css";

const EmployeeStats = ({ stats }) => {
  return (
    <div className="employee-stats">
      <StatCard
        title="Total Employees"
        value={stats.total}
        description="All employees"
      />

      <StatCard
        title="Active"
        value={stats.active}
        description="Currently active"
        variant="success"
      />

      <StatCard
        title="Inactive"
        value={stats.inactive}
        description="Currently inactive"
        variant="warning"
      />

      <StatCard
        title="Contract"
        value={stats.contract}
        description="Contract employees"
        variant="info"
      />
    </div>
  );
};

export default EmployeeStats;