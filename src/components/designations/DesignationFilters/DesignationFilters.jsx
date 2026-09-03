import SearchInput from "../../common/SearchInput/SearchInput";
import Select from "../../common/Select/Select";

import "./DesignationFilters.css";

const DesignationFilters = ({
  search = "",
  onSearch,
  department = "all",
  onDepartmentChange,
  status = "all",
  onStatusChange,
  sortBy = "name",
  onSortChange,
  departments = [],
}) => {
  const departmentOptions = [
    {
      label: "All Departments",
      value: "all",
    },
    ...departments.map((item) => ({
      label: item.name,
      value: item.id,
    })),
  ];

  const statusOptions = [
    {
      label: "All Status",
      value: "all",
    },
    {
      label: "Active",
      value: "active",
    },
    {
      label: "Inactive",
      value: "inactive",
    },
  ];

  const sortOptions = [
    {
      label: "Name",
      value: "name",
    },
    {
      label: "Newest",
      value: "newest",
    },
    {
      label: "Oldest",
      value: "oldest",
    },
    {
      label: "Employees",
      value: "employees",
    },
  ];

  return (
    <div className="designation-filters">
      <div className="designation-filters__search">
        <SearchInput
          value={search}
          onChange={onSearch}
          placeholder="Search designations..."
        />
      </div>

      <div className="designation-filters__actions">
        <Select
          value={department}
          onChange={onDepartmentChange}
          options={departmentOptions}
        />

        <Select
          value={status}
          onChange={onStatusChange}
          options={statusOptions}
        />

        <Select
          value={sortBy}
          onChange={onSortChange}
          options={sortOptions}
        />
      </div>
    </div>
  );
};

export default DesignationFilters;