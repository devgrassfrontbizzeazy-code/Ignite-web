import {
  FiActivity,
  FiAlertCircle,
  FiClock,
  FiCheckCircle,
  FiXCircle,
} from "react-icons/fi";

import "./AttendanceStats.css";

const STAT_CONFIG = {
  "Attendance Rate": {
    className: "attendance-stat-card--rate",
    icon: FiActivity,
    defaultValue: "92%",
    defaultDescription: "vs. 88% last month",
    defaultTrend: "+4%",
  },
  "Present Days": {
    className: "attendance-stat-card--present",
    icon: FiCheckCircle,
    defaultValue: "20",
    defaultDescription: "Out of 22 scheduled days",
  },
  "Absent Days": {
    className: "attendance-stat-card--absent",
    icon: FiXCircle,
    defaultValue: "1",
    defaultDescription: "1 unplanned absence",
  },
  "Late Arrivals": {
    className: "attendance-stat-card--late",
    icon: FiAlertCircle,
    defaultValue: "2",
    defaultDescription: "Avg delay: 14 mins",
  },
  "Working Hours": {
    className: "attendance-stat-card--hours",
    icon: FiClock,
    defaultValue: "154h 32m",
    defaultDescription: "Avg 7h 58m / day",
  },
};

const DEFAULT_STATS = [
  {
    label: "Attendance Rate",
    value: "92%",
    description: "vs. 88% last month",
    trend: "+4%",
  },
  {
    label: "Present Days",
    value: "20",
    description: "Out of 22 scheduled days",
  },
  {
    label: "Absent Days",
    value: "1",
    description: "1 unplanned absence",
  },
  {
    label: "Late Arrivals",
    value: "2",
    description: "Avg delay: 14 mins",
  },
  {
    label: "Working Hours",
    value: "154h 32m",
    description: "Avg 7h 58m / day",
  },
];

const AttendanceStats = ({ stats = [] }) => {
  // If stats is provided and has items with non-empty values, use them, otherwise use standard defaults
  const displayStats =
    Array.isArray(stats) && stats.length === 5
      ? stats
      : DEFAULT_STATS;

  return (
    <section className="attendance-stats">
      {displayStats.map((stat) => {
        const config = STAT_CONFIG[stat.label] || {
          className: "attendance-stat-card--rate",
          icon: FiClock,
          defaultValue: stat.value,
          defaultDescription: stat.description,
        };

        const Icon = config.icon;
        const val = stat.value || config.defaultValue;
        const desc = stat.description || config.defaultDescription;
        const trend = stat.trend || config.defaultTrend;

        return (
          <article
            className={`attendance-stat-card ${config.className}`}
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
              {val}
            </strong>

            <p className="attendance-stat-card__description">
              {desc}
            </p>

            {trend && (
              <div className="attendance-stat-card__trend-pill">
                <span className="attendance-stat-card__trend-icon">↑</span>
                <span className="attendance-stat-card__trend-value">{trend}</span>
                <span className="attendance-stat-card__trend-text">from last month</span>
              </div>
            )}
          </article>
        );
      })}
    </section>
  );
};

export default AttendanceStats;