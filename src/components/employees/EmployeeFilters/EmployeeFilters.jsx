import SearchInput from "../../common/SearchInput/SearchInput";
import Select from "../../common/Select/Select";
import Button from "../../common/Button/Button";

import "./EmployeeFilters.css";

const EmployeeFilters = ({
  search,
  onSearchChange,
  filters,
  onFilterChange,
  onReset,
}) => {
  const departmentOptions = [
    { value: "all", label: "All Departments" },
    { value: "1", label: "Sales" },
    { value: "2", label: "Human Resources" },
    { value: "3", label: "Finance" },
  ];

  const designationOptions = [
    { value: "all", label: "All Designations" },
    { value: "1", label: "Sales Manager" },
    { value: "2", label: "Sales Executive" },
    { value: "3", label: "HR Executive" },
    { value: "4", label: "Accountant" },
  ];

  const employmentTypeOptions = [
    { value: "all", label: "All Employment Types" },
    { value: "FULL_TIME", label: "Full Time" },
    { value: "PART_TIME", label: "Part Time" },
    { value: "CONTRACT", label: "Contract" },
    { value: "INTERN", label: "Intern" },
  ];

  const employmentStatusOptions = [
    { value: "all", label: "All Statuses" },
    { value: "ACTIVE", label: "Active" },
    { value: "INACTIVE", label: "Inactive" },
    { value: "TERMINATED", label: "Terminated" },
    { value: "RESIGNED", label: "Resigned" },
  ];

  const workLocationOptions = [
    { value: "all", label: "All Locations" },
    { value: "Gurugram", label: "Gurugram" },
    { value: "Delhi", label: "Delhi" },
    { value: "Noida", label: "Noida" },
  ];

  return (
    <div className="employee-filters">
      <div className="employee-filters__search">
        <SearchInput
          value={search}
          onChange={onSearchChange}
          placeholder="Search by name, code, email or phone..."
        />
      </div>

      <div className="employee-filters__grid">
        <Select
          value={filters.department}
          onChange={(value) => onFilterChange("department", value)}
          options={departmentOptions}
          placeholder="Department"
        />

        <Select
          value={filters.designation}
          onChange={(value) => onFilterChange("designation", value)}
          options={designationOptions}
          placeholder="Designation"
        />

        <Select
          value={filters.employmentType}
          onChange={(value) => onFilterChange("employmentType", value)}
          options={employmentTypeOptions}
          placeholder="Employment Type"
        />

        <Select
          value={filters.employmentStatus}
          onChange={(value) => onFilterChange("employmentStatus", value)}
          options={employmentStatusOptions}
          placeholder="Employment Status"
        />

        <Select
          value={filters.workLocation}
          onChange={(value) => onFilterChange("workLocation", value)}
          options={workLocationOptions}
          placeholder="Work Location"
        />

        <Button
          variant="secondary"
          size="md"
          onClick={onReset}
          className="employee-filters__reset"
        >
          Reset
        </Button>
      </div>
    </div>
  );
};

export default EmployeeFilters;