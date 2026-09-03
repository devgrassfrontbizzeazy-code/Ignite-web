import './PageHeader.css';

export default function PageHeader({
  title,
  description,
  action,
  className = '',
}) {
  const headerClassName = [
    'page-header',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={headerClassName}>
      <div className="page-header__content">
        <h1 className="page-header__title">
          {title}
        </h1>

        {description && (
          <p className="page-header__description">
            {description}
          </p>
        )}
      </div>

      {action && (
        <div className="page-header__action">
          {action}
        </div>
      )}
    </div>
  );
}