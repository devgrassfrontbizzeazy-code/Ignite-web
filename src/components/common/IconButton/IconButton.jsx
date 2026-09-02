import './IconButton.css';

export default function IconButton({
  icon,
  label,
  variant = 'default',
  size = 'md',
  disabled = false,
  className = '',
  onClick,
  type = 'button',
  ...props
}) {
  const buttonClassName = [
    'icon-button',
    `icon-button--${variant}`,
    `icon-button--${size}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type={type}
      className={buttonClassName}
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      <span className="icon-button__icon" aria-hidden="true">
        {icon}
      </span>
    </button>
  );
}