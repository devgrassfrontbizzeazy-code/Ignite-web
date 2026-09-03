import {
  BriefcaseBusiness,
  CheckCircle2,
  CircleOff,
} from "lucide-react";

import StatCard from "../../common/StatCard/StatCard";

import "./DesignationStats.css";

const DesignationStats = ({
  total = 0,
  active = 0,
  inactive = 0,
}) => {
  const stats = [
    {
      title: "Total Designations",
      value: total,
      icon: <BriefcaseBusiness size={20} />,
      variant: "primary",
    },
    {
      title: "Active Designations",
      value: active,
      icon: <CheckCircle2 size={20} />,
      variant: "secondary",
    },
    {
      title: "Inactive Designations",
      value: inactive,
      icon: <CircleOff size={20} />,
      variant: "accent",
    },
  ];

  return (
    <section className="designation-stats">
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

export default DesignationStats;