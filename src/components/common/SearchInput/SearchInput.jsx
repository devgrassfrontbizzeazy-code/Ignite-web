import './SearchInput.css';

export default function SearchInput({
  value = '',
  onChange,
  placeholder = 'Search...',
  disabled = false,
  className = '',
}) {
  const inputClassName = [
    'search-input',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={inputClassName}>
      <span
        className="search-input__icon"
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-4-4" />
        </svg>
      </span>

      <input
        type="search"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className="search-input__field"
        aria-label={placeholder}
      />
    </div>
  );
}