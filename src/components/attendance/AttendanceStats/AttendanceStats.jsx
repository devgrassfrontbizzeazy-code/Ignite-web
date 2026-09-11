import {
  FiActivity,
  FiAlertCircle,
  FiClock,
  FiCheckCircle,
  FiXCircle,
} from "react-icons/fi";

import "./AttendanceStats.css";

const STATS = [
  {
    label: "Attendance Rate",
    value: "92%",
    description: "vs. 88% last month",
    icon: FiActivity,
    trend: "+4%",
  },
  {
    label: "Present Days",
    value: "20",
    description: "Out of 22 scheduled days",
    icon: FiCheckCircle,
  },
  {
    label: "Absent Days",
    value: "1",
    description: "1 unplanned absence",
    icon: FiXCircle,
  },
  {
    label: "Late Arrivals",
    value: "2",
    description: "Avg delay: 14 mins",
    icon: FiAlertCircle,
  },
  {
    label: "Working Hours",
    value: "154h 32m",
    description: "Avg 7h 58m / day",
    icon: FiClock,
  },
];

const AttendanceStats = () => {
  return (
    <section className="attendance-stats">
      {STATS.map((stat) => {
        const Icon = stat.icon;

        return (
          <article
            className="attendance-stat-card"
            key={stat.label}
          >
            <div className="attendance-stat-card__top">
              <span className="attendance-stat-card__label">
                {stat.label}
              </span>

              <div className="attendance-stat-card__icon">
                <Icon />
              </div>
            </div>

            <strong className="attendance-stat-card__value">
              {stat.value}
            </strong>

            <p className="attendance-stat-card__description">
              {stat.description}
            </p>

            {stat.trend && (
              <div className="attendance-stat-card__trend">
                <span>↑</span>
                <strong>{stat.trend}</strong>
                <small>from last month</small>
              </div>
            )}
          </article>
        );
      })}
    </section>
  );
};

export default AttendanceStats;