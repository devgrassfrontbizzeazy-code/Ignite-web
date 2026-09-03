import './StatCard.css';

export default function StatCard({
  title,
  value,
  icon,
  description,
  trend,
  trendLabel,
  variant = 'default',
  className = '',
}) {
  const statCardClassName = [
    'stat-card',
    `stat-card--${variant}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={statCardClassName}>
      <div className="stat-card__top">
        <div className="stat-card__title-wrapper">
          {icon && (
            <div className="stat-card__icon">
              {icon}
            </div>
          )}

          <span className="stat-card__title">
            {title}
          </span>
        </div>
      </div>

      <div className="stat-card__value">
        {value}
      </div>

      {(description || trend !== undefined) && (
        <div className="stat-card__footer">
          {trend !== undefined && (
            <span
              className={[
                'stat-card__trend',
                trend >= 0
                  ? 'stat-card__trend--positive'
                  : 'stat-card__trend--negative',
              ].join(' ')}
            >
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
            </span>
          )}

          {trendLabel && (
            <span className="stat-card__trend-label">
              {trendLabel}
            </span>
          )}

          {description && (
            <span className="stat-card__description">
              {description}
            </span>
          )}
        </div>
      )}
    </div>
  );
}