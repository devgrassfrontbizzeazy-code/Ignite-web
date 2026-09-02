import './Card.css';

export default function Card({
  children,
  title,
  description,
  headerAction,
  footer,
  className = '',
}) {
  const cardClassName = `card ${className}`.trim();

  return (
    <section className={cardClassName}>
      {(title || description || headerAction) && (
        <div className="card__header">
          <div className="card__header-content">
            {title && <h3 className="card__title">{title}</h3>}

            {description && (
              <p className="card__description">{description}</p>
            )}
          </div>

          {headerAction && (
            <div className="card__header-action">
              {headerAction}
            </div>
          )}
        </div>
      )}

      <div className="card__body">
        {children}
      </div>

      {footer && <div className="card__footer">{footer}</div>}
    </section>
  );
}

