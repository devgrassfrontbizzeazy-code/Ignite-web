import "./Select.css";

export default function Select({
  value = "",
  onChange,
  options = [],
  placeholder,
  label,
  disabled = false,
  className = "",
  name,
  id,
}) {
  const selectId = id || name;

  const selectClassName = ["select", className].filter(Boolean).join(" ");

  return (
    <div className="select-wrapper">
      {label && (
        <label htmlFor={selectId} className="select__label">
          {label}
        </label>
      )}

      <div className={selectClassName}>
        <select
          id={selectId}
          name={name}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          disabled={disabled}
          className="select__field"
        >
          {placeholder && <option value="">{placeholder}</option>}

          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>

        <span className="select__icon" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </div>
    </div>
  );
}
