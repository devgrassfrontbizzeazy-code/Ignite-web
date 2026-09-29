import SearchInput from "../../../common/SearchInput/SearchInput";
import Select from "../../../common/Select/Select";

import "./LeadFilters.css";

const LeadFilters = ({
  search,
  onSearchChange,
  filters,
  onFilterChange,
  onReset,
  employees = [],
}) => {
  const employeeOptions = [
    {
      value: "all",
      label: "All Employees",
    },
    ...employees.map((employee) => ({
      value: employee.id,
      label:
        [employee.first_name, employee.last_name]
          .filter(Boolean)
          .join(" ") ||
        employee.full_name ||
        employee.name ||
        "Employee",
    })),
  ];

  const statusOptions = [
    {
      value: "all",
      label: "All Statuses",
    },
    {
      value: "NEW",
      label: "New",
    },
    {
      value: "FOLLOW_UP",
      label: "Follow-up",
    },
    {
      value: "DEAL_WON",
      label: "Deal Won",
    },
    {
      value: "LOST",
      label: "Lost",
    },
  ];

  const handleReset = () => {
    onSearchChange("");
    onReset();
  };

  return (
    <section className="lead-filters">
      <div className="lead-filters__main">
        <SearchInput
          value={search}
          onChange={(event) =>
            onSearchChange(event.target.value)
          }
          placeholder="Search leads..."
          className="lead-filters__search"
        />

        <Select
          value={filters.status}
          onChange={(value) =>
            onFilterChange("status", value)
          }
          options={statusOptions}
          placeholder="All Statuses"
          className="lead-filters__select"
        />

        <Select
          value={filters.assignedTo}
          onChange={(value) =>
            onFilterChange("assignedTo", value)
          }
          options={employeeOptions}
          placeholder="All Employees"
          className="lead-filters__select"
        />
      </div>

      <button
        type="button"
        className="lead-filters__reset"
        onClick={handleReset}
      >
        Reset Filters
      </button>
    </section>
  );
};

export default LeadFilters;