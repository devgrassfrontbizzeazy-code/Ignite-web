import { useEffect, useMemo, useState } from "react";

import SearchInput from "../../common/SearchInput/SearchInput";
import Select from "../../common/Select/Select";
import Button from "../../common/Button/Button";

import { getDepartments } from "../../../services/api/departmentAPI";
import { getDesignations } from "../../../services/api/designationAPI";

import "./EmployeeFilters.css";

const extractList = (response) => {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.results)) {
    return response.results;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  return [];
};

const normalizeDepartment = (department) => ({
  id:
    department.id ??
    department.department_id ??
    department.pk,

  name:
    department.name ??
    department.departmentName ??
    department.department_name ??
    "",

  isActive:
    department.is_active ??
    String(
      department.status ?? ""
    ).toLowerCase() === "active",
});

const normalizeDesignation = (designation) => ({
  id:
    designation.id ??
    designation.designation_id ??
    designation.pk,

  name:
    designation.name ??
    designation.designation_name ??
    designation.title ??
    "",

  departmentId:
    typeof designation.department === "object"
      ? designation.department?.id
      : (
          designation.department ??
          designation.department_id ??
          ""
        ),

  isActive:
    designation.is_active ??
    String(
      designation.status ?? ""
    ).toLowerCase() === "active",
});

const EmployeeFilters = ({
  search,
  onSearchChange,
  filters,
  onFilterChange,
  onReset,
  employees = [],
}) => {
  const [departments, setDepartments] =
    useState([]);

  const [designations, setDesignations] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    const loadOrganizationData =
      async () => {
        try {
          setLoading(true);

          const [
            departmentResponse,
            designationResponse,
          ] = await Promise.all([
            getDepartments(),
            getDesignations(),
          ]);

          const departmentList =
            extractList(
              departmentResponse
            );

          const designationList =
            extractList(
              designationResponse
            );

          setDepartments(
            departmentList
              .map(normalizeDepartment)
              .filter(
                (department) =>
                  department.id &&
                  department.isActive
              )
          );

          setDesignations(
            designationList
              .map(normalizeDesignation)
              .filter(
                (designation) =>
                  designation.id &&
                  designation.isActive
              )
          );
        } catch (error) {
          console.error(
            "Failed to load employee filters:",
            error
          );
        } finally {
          setLoading(false);
        }
      };

    loadOrganizationData();
  }, []);

  const departmentOptions = [
    {
      value: "all",
      label: "All Departments",
    },

    ...departments.map(
      (department) => ({
        value: String(
          department.id
        ),
        label: department.name,
      })
    ),
  ];

  const designationOptions =
    useMemo(() => {
      return [
        {
          value: "all",
          label: "All Designations",
        },

        ...designations.map(
          (designation) => ({
            value: String(
              designation.id
            ),
            label: designation.name,
          })
        ),
      ];
    }, [designations]);

  const employmentTypeOptions = [
    {
      value: "all",
      label: "All Employment Types",
    },
    {
      value: "FULL_TIME",
      label: "Full Time",
    },
    {
      value: "PART_TIME",
      label: "Part Time",
    },
    {
      value: "CONTRACT",
      label: "Contract",
    },
    {
      value: "INTERN",
      label: "Intern",
    },
  ];

  const employmentStatusOptions = [
    {
      value: "all",
      label: "All Statuses",
    },
    {
      value: "ACTIVE",
      label: "Active",
    },
    {
      value: "INACTIVE",
      label: "Inactive",
    },
    {
      value: "TERMINATED",
      label: "Terminated",
    },
    {
      value: "RESIGNED",
      label: "Resigned",
    },
  ];

  const workLocationOptions = [
    {
      value: "all",
      label: "All Locations",
    },
    {
      value: "Gurugram",
      label: "Gurugram",
    },
    {
      value: "Delhi",
      label: "Delhi",
    },
    {
      value: "Noida",
      label: "Noida",
    },
  ];

  const managerOptions = [
    {
      value: "all",
      label: "All Managers",
    },

    ...employees
      .filter(
        (employee) =>
          !employee.deleted_at
      )
      .map((employee) => ({
        value: String(
          employee.id
        ),

        label: [
          employee.first_name,
          employee.middle_name,
          employee.last_name,
        ]
          .filter(Boolean)
          .join(" "),
      })),
  ];

  return (
    <div className="employee-filters">
      <div className="employee-filters__heading">
        <div>
          <span className="employee-filters__eyebrow">
            Employee Directory
          </span>

          <h3>Search & Filter</h3>
        </div>
      </div>

      <div className="employee-filters__search">
        <SearchInput
          value={search}
          onChange={onSearchChange}
          placeholder="Search by name, code, email or phone..."
        />
      </div>

      <div className="employee-filters__grid">
        <div className="employee-filter">
          <span className="employee-filter__label">
            Department
          </span>

          <Select
            value={filters.department}
            onChange={(value) =>
              onFilterChange(
                "department",
                value
              )
            }
            options={departmentOptions}
            placeholder={
              loading
                ? "Loading departments..."
                : "All Departments"
            }
          />
        </div>

        <div className="employee-filter">
          <span className="employee-filter__label">
            Designation
          </span>

          <Select
            value={filters.designation}
            onChange={(value) =>
              onFilterChange(
                "designation",
                value
              )
            }
            options={designationOptions}
            placeholder={
              loading
                ? "Loading designations..."
                : "All Designations"
            }
          />
        </div>

        <div className="employee-filter">
          <span className="employee-filter__label">
            Employment Type
          </span>

          <Select
            value={
              filters.employmentType
            }
            onChange={(value) =>
              onFilterChange(
                "employmentType",
                value
              )
            }
            options={
              employmentTypeOptions
            }
            placeholder="All Types"
          />
        </div>

        <div className="employee-filter">
          <span className="employee-filter__label">
            Employment Status
          </span>

          <Select
            value={
              filters.employmentStatus
            }
            onChange={(value) =>
              onFilterChange(
                "employmentStatus",
                value
              )
            }
            options={
              employmentStatusOptions
            }
            placeholder="All Statuses"
          />
        </div>

        <div className="employee-filter">
          <span className="employee-filter__label">
            Work Location
          </span>

          <Select
            value={
              filters.workLocation
            }
            onChange={(value) =>
              onFilterChange(
                "workLocation",
                value
              )
            }
            options={
              workLocationOptions
            }
            placeholder="All Locations"
          />
        </div>

        <div className="employee-filter">
          <span className="employee-filter__label">
            Reporting Manager
          </span>

          <Select
            value={
              filters.reportingManager
            }
            onChange={(value) =>
              onFilterChange(
                "reportingManager",
                value
              )
            }
            options={managerOptions}
            placeholder="All Managers"
          />
        </div>
      </div>

      <div className="employee-filters__footer">
        <span className="employee-filters__hint">
          Use filters together to narrow down employees.
        </span>

        <Button
          variant="secondary"
          size="md"
          onClick={onReset}
          className="employee-filters__reset"
        >
          Reset Filters
        </Button>
      </div>
    </div>
  );
};

export default EmployeeFilters;