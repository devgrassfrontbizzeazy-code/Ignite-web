import { Search, X, RotateCcw } from "lucide-react";
import "./FilterBar.css";

export default function FilterBar({
  searchValue = "",
  onSearchChange,
  searchPlaceholder = "Search...",
  filters = [], // Array of { key, label, value, options: [{ label, value }], onChange }
  onClearFilters,
  hasActiveFilters = false,
  totalResults,
}) {
  return (
    <div className="super-filter-bar">
      <div className="super-filter-bar__main">
        {/* Search Input */}
        {onSearchChange && (
          <div className="super-filter-bar__search">
            <Search size={16} className="super-filter-bar__search-icon" />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="super-filter-bar__search-input"
            />
            {searchValue && (
              <button
                type="button"
                className="super-filter-bar__search-clear"
                onClick={() => onSearchChange("")}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
        )}

        {/* Dropdown Filters */}
        <div className="super-filter-bar__dropdowns">
          {filters.map((filter) => (
            <div key={filter.key} className="super-filter-bar__select-wrap">
              <label htmlFor={`filter-${filter.key}`} className="visually-hidden">
                {filter.label}
              </label>
              <select
                id={`filter-${filter.key}`}
                value={filter.value ?? ""}
                onChange={(e) => filter.onChange(e.target.value)}
                className={`super-filter-bar__select ${
                  filter.value ? "super-filter-bar__select--active" : ""
                }`}
              >
                <option value="">{filter.label}</option>
                {filter.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          ))}

          {/* Reset All Filters */}
          {hasActiveFilters && onClearFilters && (
            <button
              type="button"
              className="super-filter-bar__reset-btn"
              onClick={onClearFilters}
              title="Reset all search filters"
            >
              <RotateCcw size={13} />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {typeof totalResults === "number" && (
        <div className="super-filter-bar__count">
          <span>{totalResults.toLocaleString()} records</span>
        </div>
      )}
    </div>
  );
}
