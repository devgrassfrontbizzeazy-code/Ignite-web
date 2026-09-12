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
      title: "Active",
      value: stats?.active ?? 0,
      description: "Currently active staff",
      icon: FiUserCheck,
      variant: "emerald",
    },
    {
      title: "Inactive",
      value: stats?.inactive ?? 0,
      description: "Currently inactive",
      icon: FiUserX,
      variant: "gold",
    },
    {
      title: "Contract",
      value: stats?.contract ?? 0,
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