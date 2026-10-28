import "./StatCard.css";

export default function StatCard({
  title,
  value,
  subtext,
  icon: Icon,
  variant = "teal", // "teal" | "emerald" | "gold" | "neutral"
  badge,
}) {
  const formattedValue =
    typeof value === "number" ? value.toLocaleString() : value ?? "—";

  return (
    <div className={`super-stat-card super-stat-card--${variant}`}>
      <div className="super-stat-card__header">
        <span className="super-stat-card__title">{title}</span>
        {Icon && (
          <div className="super-stat-card__icon-wrap">
            <Icon size={18} />
          </div>
        )}
      </div>

      <div className="super-stat-card__body">
        <div className="super-stat-card__value-row">
          <span className="super-stat-card__value">{formattedValue}</span>
          {badge && <span className="super-stat-card__badge">{badge}</span>}
        </div>
        {subtext && <span className="super-stat-card__subtext">{subtext}</span>}
      </div>
    </div>
  );
}
