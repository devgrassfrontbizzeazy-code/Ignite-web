
import SearchInput from "../../common/SearchInput/SearchInput";
import Select from "../../common/Select/Select";

import "./DepartmentFilters.css";

const DepartmentFilters = ({
  search = "",
  onSearch,
  status = "all",
  onStatusChange,
  sortBy = "name",
  onSortChange,
}) => {
  const statusOptions = [
    { label: "All Status", value: "all" },
    { label: "Active", value: "active" },
    { label: "Inactive", value: "inactive" },
  ];

  const sortOptions = [
    { label: "Name", value: "name" },
    { label: "Newest", value: "newest" },
    { label: "Oldest", value: "oldest" },
  ];

  return (
    <div className="department-filters">
      <div className="department-filters__search">
        <SearchInput
          value={search}
          onChange={onSearch}
          placeholder="Search by code or department name..."
        />
      </div>

      <div className="department-filters__actions">
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

export default DepartmentFilters;

