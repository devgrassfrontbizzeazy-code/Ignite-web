import { useMemo, useState } from "react";
import PageHeader from "../../components/common/PageHeader/PageHeader";
import Button from "../../components/common/Button/Button";

import EmployeeStats from "../../components/employees/EmployeeStats/EmployeeStats";
import EmployeeFilters from "../../components/employees/EmployeeFilters/EmployeeFilters";
import EmployeeTable from "../../components/employees/EmployeeTable/EmployeeTable";
import EmployeeDetails from "../../components/employees/EmployeeDetails/EmployeeDetails";

import "./Employees.css";

const MOCK_EMPLOYEES = [
  {
    id: 1,
    employee_code: "EMP001",
    first_name: "Rahul",
    middle_name: "",
    last_name: "Sharma",
    email: "rahul.sharma@company.com",
    phone: "9876543210",
    profile_photo: "",
    date_of_birth: "1995-06-15",
    gender: "MALE",
    date_of_joining: "2024-01-10",
    department_id: 1,
    department_name: "Sales",
    designation_id: 1,
    designation_name: "Sales Manager",
    default_role_name: "Sales Manager",
    reporting_manager_id: null,
    reporting_manager_name: "—",
    employment_type: "FULL_TIME",
    employment_status: "ACTIVE",
    work_location: "Gurugram",
    address: "Gurugram, Haryana",
    emergency_contact_name: "Priya Sharma",
    emergency_contact_phone: "9876500000",
    date_of_exit: null,
  },
  {
    id: 2,
    employee_code: "EMP002",
    first_name: "Priya",
    middle_name: "",
    last_name: "Verma",
    email: "priya.verma@company.com",
    phone: "9876543211",
    profile_photo: "",
    date_of_birth: "1997-08-21",
    gender: "FEMALE",
    date_of_joining: "2024-03-05",
    department_id: 1,
    department_name: "Sales",
    designation_id: 2,
    designation_name: "Sales Executive",
    default_role_name: "Sales Executive",
    reporting_manager_id: 1,
    reporting_manager_name: "Rahul Sharma",
    employment_type: "FULL_TIME",
    employment_status: "ACTIVE",
    work_location: "Delhi",
    address: "Delhi",
    emergency_contact_name: "Amit Verma",
    emergency_contact_phone: "9876500001",
    date_of_exit: null,
  },
  {
    id: 3,
    employee_code: "EMP003",
    first_name: "Amit",
    middle_name: "",
    last_name: "Kumar",
    email: "amit.kumar@company.com",
    phone: "9876543212",
    profile_photo: "",
    date_of_birth: "1998-02-11",
    gender: "MALE",
    date_of_joining: "2024-06-01",
    department_id: 2,
    department_name: "Human Resources",
    designation_id: 3,
    designation_name: "HR Executive",
    default_role_name: "HR Executive",
    reporting_manager_id: null,
    reporting_manager_name: "—",
    employment_type: "FULL_TIME",
    employment_status: "ACTIVE",
    work_location: "Gurugram",
    address: "Gurugram, Haryana",
    emergency_contact_name: "Neha Kumar",
    emergency_contact_phone: "9876500002",
    date_of_exit: null,
  },
  {
    id: 4,
    employee_code: "EMP004",
    first_name: "Neha",
    middle_name: "",
    last_name: "Singh",
    email: "neha.singh@company.com",
    phone: "9876543213",
    profile_photo: "",
    date_of_birth: "1994-11-09",
    gender: "FEMALE",
    date_of_joining: "2023-09-15",
    department_id: 3,
    department_name: "Finance",
    designation_id: 4,
    designation_name: "Accountant",
    default_role_name: "Finance Executive",
    reporting_manager_id: null,
    reporting_manager_name: "—",
    employment_type: "FULL_TIME",
    employment_status: "INACTIVE",
    work_location: "Gurugram",
    address: "Gurugram, Haryana",
    emergency_contact_name: "Rohit Singh",
    emergency_contact_phone: "9876500003",
    date_of_exit: null,
  },
  {
    id: 5,
    employee_code: "EMP005",
    first_name: "Vikas",
    middle_name: "",
    last_name: "Mehta",
    email: "vikas.mehta@company.com",
    phone: "9876543214",
    profile_photo: "",
    date_of_birth: "1999-04-19",
    gender: "MALE",
    date_of_joining: "2025-01-20",
    department_id: 1,
    department_name: "Sales",
    designation_id: 2,
    designation_name: "Sales Executive",
    default_role_name: "Sales Executive",
    reporting_manager_id: 1,
    reporting_manager_name: "Rahul Sharma",
    employment_type: "CONTRACT",
    employment_status: "ACTIVE",
    work_location: "Noida",
    address: "Noida, Uttar Pradesh",
    emergency_contact_name: "Karan Mehta",
    emergency_contact_phone: "9876500004",
    date_of_exit: null,
  },
];

const formatEmployeeName = (employee) =>
  [employee.first_name, employee.middle_name, employee.last_name]
    .filter(Boolean)
    .join(" ");

const Employees = () => {
  const [employees, setEmployees] = useState(MOCK_EMPLOYEES);

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    department: "all",
    designation: "all",
    employmentType: "all",
    employmentStatus: "all",
    workLocation: "all",
  });

  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const filteredEmployees = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return employees.filter((employee) => {
      const employeeName = formatEmployeeName(employee).toLowerCase();

      const matchesSearch =
        !searchValue ||
        employeeName.includes(searchValue) ||
        employee.employee_code.toLowerCase().includes(searchValue) ||
        employee.email.toLowerCase().includes(searchValue) ||
        employee.phone?.toLowerCase().includes(searchValue);

      const matchesDepartment =
        filters.department === "all" ||
        String(employee.department_id) === String(filters.department);

      const matchesDesignation =
        filters.designation === "all" ||
        String(employee.designation_id) === String(filters.designation);

      const matchesEmploymentType =
        filters.employmentType === "all" ||
        employee.employment_type === filters.employmentType;

      const matchesEmploymentStatus =
        filters.employmentStatus === "all" ||
        employee.employment_status === filters.employmentStatus;

      const matchesWorkLocation =
        filters.workLocation === "all" ||
        employee.work_location === filters.workLocation;

      return (
        matchesSearch &&
        matchesDepartment &&
        matchesDesignation &&
        matchesEmploymentType &&
        matchesEmploymentStatus &&
        matchesWorkLocation
      );
    });
  }, [employees, search, filters]);

  const stats = useMemo(() => {
    return {
      total: employees.length,
      active: employees.filter(
        (employee) => employee.employment_status === "ACTIVE"
      ).length,
      inactive: employees.filter(
        (employee) => employee.employment_status === "INACTIVE"
      ).length,
      contract: employees.filter(
        (employee) => employee.employment_type === "CONTRACT"
      ).length,
    };
  }, [employees]);

  const handleFilterChange = (name, value) => {
    setFilters((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleResetFilters = () => {
    setSearch("");

    setFilters({
      department: "all",
      designation: "all",
      employmentType: "all",
      employmentStatus: "all",
      workLocation: "all",
    });
  };

  const handleViewEmployee = (employee) => {
    setSelectedEmployee(employee);
    setShowDetails(true);
  };

  const handleEditEmployee = (employee) => {
    console.log("Edit employee:", employee);
  };

  const handleToggleStatus = (employee) => {
    setEmployees((previous) =>
      previous.map((item) =>
        item.id === employee.id
          ? {
              ...item,
              employment_status:
                item.employment_status === "ACTIVE"
                  ? "INACTIVE"
                  : "ACTIVE",
            }
          : item
      )
    );
  };

  const handleTerminateEmployee = (employee) => {
    setEmployees((previous) =>
      previous.map((item) =>
        item.id === employee.id
          ? {
              ...item,
              employment_status: "TERMINATED",
              date_of_exit:
                item.date_of_exit || new Date().toISOString().split("T")[0],
            }
          : item
      )
    );
  };

  const handleResignEmployee = (employee) => {
    setEmployees((previous) =>
      previous.map((item) =>
        item.id === employee.id
          ? {
              ...item,
              employment_status: "RESIGNED",
              date_of_exit:
                item.date_of_exit || new Date().toISOString().split("T")[0],
            }
          : item
      )
    );
  };

  const handleDeleteEmployee = (employee) => {
    setEmployees((previous) =>
      previous.filter((item) => item.id !== employee.id)
    );
  };

  const handleAddEmployee = () => {
    console.log("Add employee");
  };

  return (
    <div className="employees-page">
      <PageHeader
        title="Employees"
        description="Manage employees, organization assignments and employee access."
        action={
          <Button variant="primary" onClick={handleAddEmployee}>
            + Add Employee
          </Button>
        }
      />

      <EmployeeStats stats={stats} />

      <EmployeeFilters
        search={search}
        onSearchChange={setSearch}
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
        employees={employees}
      />

      <EmployeeTable
        employees={filteredEmployees}
        onView={handleViewEmployee}
        onEdit={handleEditEmployee}
        onToggleStatus={handleToggleStatus}
        onTerminate={handleTerminateEmployee}
        onResign={handleResignEmployee}
        onDelete={handleDeleteEmployee}
      />

      <EmployeeDetails
        open={showDetails}
        employee={selectedEmployee}
        onClose={() => {
          setShowDetails(false);
          setSelectedEmployee(null);
        }}
      />
    </div>
  );
};

export default Employees;