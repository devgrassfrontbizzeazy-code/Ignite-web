import {
  CalendarDays,
  List,
  Map,
} from "lucide-react";

import SearchInput from "../../../common/SearchInput/SearchInput";
import Select from "../../../common/Select/Select";
import "./VisitFilters.css";

const VisitFilters = ({
  search,
  onSearchChange,
  date,
  onDateChange,
  employee,
  onEmployeeChange,
  status,
  onStatusChange,
  viewMode,
  onViewModeChange,
  employees = [],
}) => {
  const employeeOptions = [
    { value: "", label: "All Employees" },
    ...employees.map((item) => ({
      value: item.id,
      label: item.name,
    })),
  ];

  const statusOptions = [
    { value: "", label: "All Visit Status" },
    { value: "NOT_STARTED", label: "Not Started" },
    { value: "CHECKED_IN", label: "In Progress" },
    { value: "CHECKED_OUT", label: "Completed" },
  ];

  return (
    <div className="visits__controls">
      <div className="visits__filters">
        <div className="visits__search">
          <SearchInput
            value={search}
            onChange={(event) =>
              onSearchChange(event.target.value)
            }
            placeholder="Search lead, company or employee..."
          />
        </div>

        <div className="visits__filter-date">
          <div className="visits__date-control">
            <CalendarDays size={16} />
            <input
              type="date"
              value={date}
              onChange={(event) =>
                onDateChange(event.target.value)
              }
            />
          </div>
        </div>

        <div className="visits__filter-select">
          <Select
            value={employee}
            onChange={onEmployeeChange}
            options={employeeOptions}
            placeholder="All Employees"
          />
        </div>

        <div className="visits__filter-select">
          <Select
            value={status}
            onChange={onStatusChange}
            options={statusOptions}
            placeholder="All Visit Status"
          />
        </div>
      </div>

      <div className="visits__view-toggle">
        <button
          type="button"
          className={
            viewMode === "map"
              ? "visits__view-button active"
              : "visits__view-button"
          }
          onClick={() => onViewModeChange("map")}
        >
          <Map size={15} />
          <span>Map</span>
        </button>

        <button
          type="button"
          className={
            viewMode === "list"
              ? "visits__view-button active"
              : "visits__view-button"
          }
          onClick={() => onViewModeChange("list")}
        >
          <List size={15} />
          <span>List</span>
        </button>
      </div>
    </div>
  );
};

export default VisitFilters;