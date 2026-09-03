import Button from '../common/Button/Button';
import './SetupStep.css';

export default function SetupStep({
  number,
  title,
  description,
  completed = false,
  actionLabel,
  onAction,
}) {
  return (
    <div
      className={`setup-step${
        completed ? ' setup-step--completed' : ''
      }`}
    >
      <div className="setup-step__indicator">
        {completed ? '✓' : number}
      </div>

      <div className="setup-step__content">
        <h4 className="setup-step__title">{title}</h4>
        <p className="setup-step__description">
          {description}
        </p>
      </div>

      {completed ? (
        <span className="setup-step__status">
          Completed
        </span>
      ) : (
        actionLabel && (
          <Button
            variant="outline"
            size="sm"
            onClick={onAction}
          >
            {actionLabel}
          </Button>
        )
      )}
    </div>
  );
}