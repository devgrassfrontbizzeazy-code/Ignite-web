import './ProgressBar.css';

export default function ProgressBar({
  value = 0,
  showLabel = false,
  size = 'md',
  className = '',
}) {
  const progress = Math.min(100, Math.max(0, Number(value) || 0));

  const progressClassName = [
    'progress-bar',
    `progress-bar--${size}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={progressClassName}>
      <div className="progress-bar__track">
        <div
          className="progress-bar__fill"
          style={{ width: `${progress}%` }}
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin="0"
          aria-valuemax="100"
        />
      </div>

      {showLabel && (
        <span className="progress-bar__label">
          {progress}%
        </span>
      )}
    </div>
  );
}