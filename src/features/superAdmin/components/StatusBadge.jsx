import "./StatusBadge.css";

export default function StatusBadge({
  type = "default", // "active" | "fieldSales" | "employment" | "superuser" | "custom"
  value,
  label,
  variant, // "success" | "danger" | "warning" | "info" | "neutral"
}) {
  let computedLabel = label;
  let computedVariant = variant || "neutral";

  if (type === "active") {
    const isActive = Boolean(value);
    computedLabel = isActive ? "Active" : "Inactive";
    computedVariant = isActive ? "success" : "neutral";
  } else if (type === "fieldSales") {
    const isEnabled = Boolean(value);
    computedLabel = isEnabled ? "Enabled" : "Disabled";
    computedVariant = isEnabled ? "success" : "neutral";
  } else if (type === "superuser") {
    const isSuper = Boolean(value);
    computedLabel = isSuper ? "Super Admin" : "Standard User";
    computedVariant = isSuper ? "gold" : "neutral";
  } else if (type === "employment") {
    const status = String(value || "").toUpperCase();
    if (status === "ACTIVE") {
      computedLabel = "Active";
      computedVariant = "success";
    } else if (status === "ON_LEAVE") {
      computedLabel = "On Leave";
      computedVariant = "warning";
    } else if (status === "PROBATION") {
      computedLabel = "Probation";
      computedVariant = "info";
    } else if (status === "TERMINATED") {
      computedLabel = "Terminated";
      computedVariant = "danger";
    } else {
      computedLabel = value || "Inactive";
      computedVariant = "neutral";
    }
  }

  return (
    <span className={`super-status-badge super-status-badge--${computedVariant}`}>
      <span className="super-status-badge__dot" />
      <span className="super-status-badge__text">{computedLabel}</span>
    </span>
  );
}
