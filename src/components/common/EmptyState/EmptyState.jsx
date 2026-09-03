import './EmptyState.css';

export default function EmptyState({
  icon,
  title,
  description,
  action,
  className = '',
}) {
  const emptyStateClassName = [
    'empty-state',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={emptyStateClassName}>
      {icon && (
        <div className="empty-state__icon">
          {icon}
        </div>
      )}

      <h3 className="empty-state__title">
        {title}
      </h3>

      {description && (
        <p className="empty-state__description">
          {description}
        </p>
      )}

      {action && (
        <div className="empty-state__action">
          {action}
        </div>
      )}
    </div>
  );
}