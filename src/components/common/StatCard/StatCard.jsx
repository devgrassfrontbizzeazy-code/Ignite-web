import React from "react";
import "./StatCard.css";

export default function StatCard({
  title,
  label,
  value,
  icon,
  description,
  trend,
  trendLabel,
  variant = "default",
  className = "",
  onClick,
  action,
  style,
}) {
  const cardTitle = title || label;

  const renderIcon = () => {
  if (!icon) return null;

  // Lucide / React component
  if (typeof icon === "function") {
    const IconComponent = icon;
    return <IconComponent />;
  }

  // React element
  if (React.isValidElement(icon)) {
    return icon;
  }

  return null;
};
  const normalizedVariant = (() => {
    switch (variant) {
      case "primary":
      case "teal":
      case "rate":
      case "total":
        return "teal";
      case "secondary":
      case "emerald":
      case "green":
      case "present":
      case "active":
      case "success":
        return "emerald";
      case "accent":
      case "gold":
      case "warning":
      case "late":
      case "inactive":
        return "gold";
      case "danger":
      case "absent":
      case "red":
        return "danger";
      case "purple":
      case "hours":
      case "contract":
        return "purple";
      case "blue":
      case "info":
        return "blue";
      default:
        return variant || "default";
    }
  })();

  const isClickable = typeof onClick === "function";
  const Tag = isClickable ? "button" : "article";

  const statCardClassName = [
    "stat-card",
    `stat-card--${normalizedVariant}`,
    isClickable ? "stat-card--clickable" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Tag
      type={isClickable ? "button" : undefined}
      className={statCardClassName}
      onClick={onClick}
      style={style}
    >
      <div className="stat-card__top">
        <span className="stat-card__label">{cardTitle}</span>
        {icon && (
          <div className="stat-card__icon">
            {renderIcon()}
          </div>
        )}
      </div>

      <strong className="stat-card__value">
        {value}
      </strong>

      {description && (
        <p className="stat-card__description">
          {description}
        </p>
      )}

      {trend !== undefined && trend !== null && (
        <div className="stat-card__trend-pill">
          <span className="stat-card__trend-icon">
            {String(trend).startsWith("-") ? "↓" : "↑"}
          </span>
          <span className="stat-card__trend-value">{trend}</span>
          {trendLabel && (
            <span className="stat-card__trend-text">{trendLabel}</span>
          )}
        </div>
      )}

      {action && (
        <div className="stat-card__action">
          {action}
        </div>
      )}
    </Tag>
  );
}