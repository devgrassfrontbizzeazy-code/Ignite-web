import "./LoadingSkeleton.css";

export default function LoadingSkeleton({
  type = "table", // "table" | "cards" | "chart" | "details"
  rows = 5,
  cols = 6,
  cards = 4,
}) {
  if (type === "cards") {
    return (
      <div className="super-skeleton-cards">
        {Array.from({ length: cards }).map((_, i) => (
          <div key={i} className="super-skeleton-card">
            <div className="super-skeleton-line super-skeleton-line--short" />
            <div className="super-skeleton-line super-skeleton-line--value" />
            <div className="super-skeleton-line super-skeleton-line--subtext" />
          </div>
        ))}
      </div>
    );
  }

  if (type === "chart") {
    return (
      <div className="super-skeleton-chart-box">
        <div className="super-skeleton-line super-skeleton-line--medium" />
        <div className="super-skeleton-rect" />
      </div>
    );
  }

  if (type === "details") {
    return (
      <div className="super-skeleton-details">
        <div className="super-skeleton-details__header">
          <div className="super-skeleton-circle" />
          <div className="super-skeleton-details__titles">
            <div className="super-skeleton-line super-skeleton-line--large" />
            <div className="super-skeleton-line super-skeleton-line--medium" />
          </div>
        </div>
        <div className="super-skeleton-details__grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="super-skeleton-card">
              <div className="super-skeleton-line super-skeleton-line--short" />
              <div className="super-skeleton-line super-skeleton-line--value" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Default: Table skeleton
  return (
    <div className="super-skeleton-table-wrap">
      <div className="super-skeleton-table-header">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="super-skeleton-line" />
        ))}
      </div>
      <div className="super-skeleton-table-body">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="super-skeleton-table-row">
            {Array.from({ length: cols }).map((_, c) => (
              <div key={c} className="super-skeleton-line" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
