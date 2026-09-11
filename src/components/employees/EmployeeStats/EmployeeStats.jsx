import {
  FiUsers,
  FiUserCheck,
  FiUserX,
  FiFileText,
} from "react-icons/fi";

import "./EmployeeStats.css";

const EmployeeStats = ({ stats }) => {
  const cards = [
    {
      title: "Total Employees",
      value: stats.total,
      description: "All employees",
      icon: FiUsers,
      variant: "total",
    },
    {
      title: "Active",
      value: stats.active,
      description: "Currently active",
      icon: FiUserCheck,
      variant: "active",
    },
    {
      title: "Inactive",
      value: stats.inactive,
      description: "Currently inactive",
      icon: FiUserX,
      variant: "inactive",
    },
    {
      title: "Contract",
      value: stats.contract,
      description: "Contract employees",
      icon: FiFileText,
      variant: "contract",
    },
  ];

  return (
    <section className="employee-stats">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <article
            key={card.title}
            className={`employee-stat-card employee-stat-card--${card.variant}`}
          >
            <div className="employee-stat-card__top">
              <span className="employee-stat-card__label">
                {card.title}
              </span>

              <div className="employee-stat-card__icon">
                <Icon />
              </div>
            </div>

            <strong className="employee-stat-card__value">
              {card.value}
            </strong>

            <p className="employee-stat-card__description">
              {card.description}
            </p>
          </article>
        );
      })}
    </section>
  );
};

export default EmployeeStats;