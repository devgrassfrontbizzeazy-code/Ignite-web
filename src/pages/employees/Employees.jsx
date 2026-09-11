import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import PageHeader from "../../components/common/PageHeader/PageHeader";
import Button from "../../components/common/Button/Button";

import EmployeeStats from "../../components/employees/EmployeeStats/EmployeeStats";
import EmployeeFilters from "../../components/employees/EmployeeFilters/EmployeeFilters";
import EmployeeTable from "../../components/employees/EmployeeTable/EmployeeTable";
import EmployeeDetails from "../../components/employees/EmployeeDetails/EmployeeDetails";

import employeeService from "../../services/employeeService";

import "./Employees.css";

const formatEmployeeName = (employee) =>
  [employee.first_name, employee.middle_name, employee.last_name]
    .filter(Boolean)
    .join(" ");

const Employees = () => {
  const navigate = useNavigate();

  /*
   * ============================================================
   * EMPLOYEE DATA
   * ============================================================
   */

  const [employees, setEmployees] = useState([]);

  const [loading, setLoading] = useState(true);

  /*
   * ============================================================
   * SEARCH & FILTERS
   * ============================================================
   */

  const [search, setSearch] = useState("");

  const [filters, setFilters] = useState({
    department: "all",
    designation: "all",
    employmentType: "all",
    employmentStatus: "all",
    workLocation: "all",
    reportingManager: "all",
  });

  /*
   * ============================================================
   * EMPLOYEE DETAILS
   * ============================================================
   */

  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const [showDetails, setShowDetails] = useState(false);

  /*
   * ============================================================
   * LOAD EMPLOYEES
   * ============================================================
   */

  const loadEmployees = () => {
    try {
      setLoading(true);

      const data = employeeService.getAll();

      setEmployees(data);
    } catch (error) {
      console.error("Failed to load employees:", error);

      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  /*
   * ============================================================
   * FILTERED EMPLOYEES
   * ============================================================
   */

  const filteredEmployees = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return employees.filter((employee) => {
      const employeeName = formatEmployeeName(employee).toLowerCase();

      const matchesSearch =
        !searchValue ||
        employeeName.includes(searchValue) ||
        employee.employee_code?.toLowerCase().includes(searchValue) ||
        employee.email?.toLowerCase().includes(searchValue) ||
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

      const matchesReportingManager =
        filters.reportingManager === "all" ||
        String(employee.reporting_manager_id || "") ===
          String(filters.reportingManager);

      return (
        matchesSearch &&
        matchesDepartment &&
        matchesDesignation &&
        matchesEmploymentType &&
        matchesEmploymentStatus &&
        matchesWorkLocation &&
        matchesReportingManager
      );
    });
  }, [employees, search, filters]);

  /*
   * ============================================================
   * EMPLOYEE STATS
   * ============================================================
   */

  const stats = useMemo(() => {
    return {
      total: employees.length,

      active: employees.filter(
        (employee) => employee.employment_status === "ACTIVE",
      ).length,

      inactive: employees.filter(
        (employee) => employee.employment_status === "INACTIVE",
      ).length,

      contract: employees.filter(
        (employee) => employee.employment_type === "CONTRACT",
      ).length,
    };
  }, [employees]);

  /*
   * ============================================================
   * FILTER HANDLERS
   * ============================================================
   */

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
      reportingManager: "all",
    });
  };

  /*
   * ============================================================
   * VIEW EMPLOYEE
   * ============================================================
   */

  const handleViewEmployee = (employee) => {
    setSelectedEmployee(employee);
    setShowDetails(true);
  };

  /*
   * ============================================================
   * EDIT EMPLOYEE
   * ============================================================
   */

  const handleEditEmployee = (employee) => {
    navigate(`/employees/${employee.id}/edit`);
  };

  /*
   * ============================================================
   * ACTIVATE / DEACTIVATE
   * ============================================================
   */

  const handleToggleStatus = (employee) => {
    const isActive = employee.employment_status === "ACTIVE";

    const nextStatus = isActive ? "INACTIVE" : "ACTIVE";

    const actionText = isActive ? "deactivate" : "activate";

    const confirmed = window.confirm(
      `Are you sure you want to ${actionText} ${formatEmployeeName(employee)}?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      employeeService.changeStatus(employee.id, nextStatus);

      loadEmployees();

      /*
       * Keep details modal synchronized
       * if the same employee is currently open.
       */
      if (selectedEmployee?.id === employee.id) {
        const updated = employeeService.getById(employee.id);

        setSelectedEmployee(updated);
      }
    } catch (error) {
      console.error("Failed to change employee status:", error);

      window.alert("Unable to update employee status.");
    }
  };

  /*
   * ============================================================
   * TERMINATE EMPLOYEE
   * ============================================================
   */

  const handleTerminateEmployee = (employee) => {
    const confirmed = window.confirm(
      `Are you sure you want to terminate ${formatEmployeeName(employee)}?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      employeeService.terminate(employee.id);

      loadEmployees();

      setShowDetails(false);
      setSelectedEmployee(null);
    } catch (error) {
      console.error("Failed to terminate employee:", error);

      window.alert("Unable to terminate employee.");
    }
  };

  /*
   * ============================================================
   * RESIGN EMPLOYEE
   * ============================================================
   */

  const handleResignEmployee = (employee) => {
    const confirmed = window.confirm(
      `Are you sure you want to mark ${formatEmployeeName(
        employee,
      )} as resigned?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      employeeService.resign(employee.id);

      loadEmployees();

      setShowDetails(false);
      setSelectedEmployee(null);
    } catch (error) {
      console.error("Failed to resign employee:", error);

      window.alert("Unable to update employee.");
    }
  };

  /*
   * ============================================================
   * SOFT DELETE EMPLOYEE
   * ============================================================
   */

  const handleDeleteEmployee = (employee) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${formatEmployeeName(
        employee,
      )}? This employee will be removed from the active directory.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      employeeService.delete(employee.id);

      loadEmployees();

      setShowDetails(false);
      setSelectedEmployee(null);
    } catch (error) {
      console.error("Failed to delete employee:", error);

      window.alert("Unable to delete employee.");
    }
  };

  /*
   * ============================================================
   * ADD EMPLOYEE
   * ============================================================
   */

  const handleAddEmployee = () => {
    navigate("/employees/add");
  };

  /*
   * ============================================================
   * CLOSE DETAILS
   * ============================================================
   */

  const handleCloseDetails = () => {
    setShowDetails(false);
    setSelectedEmployee(null);
  };

  /*
   * ============================================================
   * LOADING STATE
   * ============================================================
   */

  if (loading) {
    return (
      <div className="employees-page">
        <PageHeader
          title="Employees"
          description="Manage employees, organization assignments and employee access."
        />

        <div className="employees-page__loading">Loading employees...</div>
      </div>
    );
  }

  /*
   * ============================================================
   * PAGE
   * ============================================================
   */

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
        onClose={handleCloseDetails}
      />
    </div>
  );
};

export default Employees;
