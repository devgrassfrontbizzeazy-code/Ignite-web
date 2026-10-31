import {
  FiUsers,
  FiUserCheck,
  FiUserX,
  FiFileText,
} from "react-icons/fi";

import StatCard from "../../common/StatCard/StatCard";
import "./EmployeeStats.css";

const EmployeeStats = ({ stats = {} }) => {
  const cards = [
    {
      title: "Total Employees",
      value: stats?.total ?? 0,
      description: "All employees in organization",
      icon: FiUsers,
      variant: "teal",
    },
    {
      title: "Active Employees",
      value: stats?.active ?? stats?.activeEmployees ?? 0,
      description: "Currently active staff",
      icon: FiUserCheck,
      variant: "emerald",
    },
    {
      title: "Inactive Employees",
      value: stats?.inactive ?? stats?.inactiveEmployees ?? 0,
      description: "Currently inactive",
      icon: FiUserX,
      variant: "gold",
    },
    {
      title: "Contract Employees",
      value: stats?.contract ?? stats?.contractEmployees ?? 0,
      description: "Contract employees",
      icon: FiFileText,
      variant: "purple",
    },
  ];

  return (
    <section className="employee-stats">
      {cards.map((card) => (
        <StatCard
          key={card.title}
          title={card.title}
          value={card.value}
          description={card.description}
          icon={card.icon}
          variant={card.variant}
        />
      ))}
    </section>
  );
};

export default EmployeeStats;