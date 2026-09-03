import {
  Building2,
  CheckCircle2,
  CircleOff,
} from "lucide-react";

import StatCard from "../../common/StatCard/StatCard";
import "./DepartmentStats.css";

const DepartmentStats = ({
  total = 0,
  active = 0,
  inactive = 0,
}) => {
  const stats = [
    {
      title: "Total Departments",
      value: total,
      icon: <Building2 size={20} />,
      variant: "primary",
    },
    {
      title: "Active Departments",
      value: active,
      icon: <CheckCircle2 size={20} />,
      variant: "secondary",
    },
    {
      title: "Inactive Departments",
      value: inactive,
      icon: <CircleOff size={20} />,
      variant: "accent",
    },
  ];

  return (
    <section className="department-stats">
      {stats.map((stat) => (
        <StatCard
          key={stat.title}
          title={stat.title}
          value={stat.value}
          icon={stat.icon}
          variant={stat.variant}
        />
      ))}
    </section>
  );
};

export default DepartmentStats;