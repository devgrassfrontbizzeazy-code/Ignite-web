import "./Toggle.css";

const Toggle = ({
  checked = false,
  onChange,
  disabled = false,
  label,
  id,
  className = "",
}) => {
  return (
    <label
      className={`toggle ${disabled ? "toggle--disabled" : ""} ${className}`}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange?.(e.target.checked)}
        disabled={disabled}
      />

      <span className="toggle__slider">
        <span className="toggle__thumb" />
      </span>

      {label && <span className="toggle__label">{label}</span>}
    </label>
  );
};

export default Toggle;