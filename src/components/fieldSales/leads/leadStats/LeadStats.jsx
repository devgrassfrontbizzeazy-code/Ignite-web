import {
  FiUsers,
  FiUserPlus,
  FiClock,
  FiCheckCircle,
  FiXCircle,
} from "react-icons/fi";

import StatCard from "../../../common/StatCard/StatCard";
import "./LeadStats.css";

const LeadStats = ({ stats = {} }) => {
  const cards = [
    {
      title: "Total Leads",
      value: stats?.total ?? 0,
      description: "All leads in pipeline",
      icon: FiUsers,
      variant: "teal",
    },
    {
      title: "New",
      value: stats?.new ?? 0,
      description: "Newly created leads",
      icon: FiUserPlus,
      variant: "emerald",
    },
    {
      title: "Follow-up",
      value: stats?.followUp ?? 0,
      description: "Leads requiring follow-up",
      icon: FiClock,
      variant: "gold",
    },
    {
      title: "Deal Won",
      value: stats?.won ?? 0,
      description: "Successfully converted",
      icon: FiCheckCircle,
      variant: "purple",
    },
    {
      title: "Lost",
      value: stats?.lost ?? 0,
      description: "Unsuccessful leads",
      icon: FiXCircle,
      variant: "danger",
    },
  ];

  return (
    <section className="lead-stats stats-grid stats-grid--5">
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

export default LeadStats;