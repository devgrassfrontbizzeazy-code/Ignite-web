
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiUsers } from "react-icons/fi";

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
    .join(" ") || employee.full_name || "Employee";

const Employees = () => {
  const navigate = useNavigate();

  /*
   * EMPLOYEE DATA
   */
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedbackMessage, setFeedbackMessage] = useState({
    type: "",
    text: "",
  });

  /*
   * SEARCH & FILTERS
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
   * EMPLOYEE DETAILS MODAL
   */
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const showNotification = (type, text) => {
    setFeedbackMessage({ type, text });

    setTimeout(() => {
      setFeedbackMessage({ type: "", text: "" });
    }, 4500);
  };

  /*
   * LOAD EMPLOYEES FROM API
   */
  const loadEmployees = async () => {
    try {
      setLoading(true);

      const data = await employeeService.getAll();

      setEmployees(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load employees:", error);

      setEmployees([]);

      showNotification(
        "error",
        "Failed to load employees from server."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  /*
   * FILTERED EMPLOYEES
   */
  const filteredEmployees = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return employees.filter((employee) => {
      const employeeName =
        formatEmployeeName(employee).toLowerCase();

      const matchesSearch =
        !searchValue ||
        employeeName.includes(searchValue) ||
        employee.employee_code
          ?.toLowerCase()
          .includes(searchValue) ||
        employee.email
          ?.toLowerCase()
          .includes(searchValue) ||
        employee.phone
          ?.toLowerCase()
          .includes(searchValue);

      const matchesDepartment =
        filters.department === "all" ||
        String(employee.department_id) ===
          String(filters.department);

      const matchesDesignation =
        filters.designation === "all" ||
        String(employee.designation_id) ===
          String(filters.designation);

      const matchesEmploymentType =
        filters.employmentType === "all" ||
        employee.employment_type ===
          filters.employmentType;

      const matchesEmploymentStatus =
        filters.employmentStatus === "all" ||
        employee.employment_status ===
          filters.employmentStatus;

      const matchesWorkLocation =
        filters.workLocation === "all" ||
        employee.work_location ===
          filters.workLocation;

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
   * EMPLOYEE STATS
   */
  const stats = useMemo(() => {
    return {
      total: employees.length,

      active: employees.filter(
        (employee) =>
          employee.employment_status === "ACTIVE"
      ).length,

      inactive: employees.filter(
        (employee) =>
          employee.employment_status === "INACTIVE"
      ).length,

      contract: employees.filter(
        (employee) =>
          employee.employment_type === "CONTRACT"
      ).length,
    };
  }, [employees]);

  /*
   * FILTER HANDLERS
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
   * VIEW EMPLOYEE
   */
  const handleViewEmployee = (employee) => {
    setSelectedEmployee(employee);
    setShowDetails(true);
  };

  /*
   * EDIT EMPLOYEE
   */
  const handleEditEmployee = (employee) => {
    navigate(`/employees/${employee.id}/edit`);
  };

  /*
   * RESEND INVITATION EMAIL
   */
  const handleResendInvite = async (employee) => {
    try {
      await employeeService.resendInvite(employee.id);

      showNotification(
        "success",
        `Invitation email resent successfully to ${employee.email}!`
      );
    } catch (error) {
      console.error(
        "Failed to resend invitation:",
        error
      );

      showNotification(
        "error",
        error.response?.data?.message ||
          "Failed to resend invitation email."
      );
    }
  };

  /*
   * ACTIVATE / DEACTIVATE
   */
  const handleToggleStatus = async (employee) => {
    const isActive =
      employee.employment_status === "ACTIVE";

    const nextStatus = isActive
      ? "INACTIVE"
      : "ACTIVE";

    const actionText = isActive
      ? "deactivate"
      : "activate";

    const confirmed = window.confirm(
      `Are you sure you want to ${actionText} ${formatEmployeeName(
        employee
      )}?`
    );

    if (!confirmed) return;

    try {
      await employeeService.changeStatus(
        employee.id,
        nextStatus
      );

      showNotification(
        "success",
        `Employee status updated to ${nextStatus}.`
      );

      await loadEmployees();

      if (selectedEmployee?.id === employee.id) {
        const updated =
          await employeeService.getById(employee.id);

        setSelectedEmployee(updated);
      }
    } catch (error) {
      console.error(
        "Failed to change employee status:",
        error
      );

      showNotification(
        "error",
        error.response?.data?.message ||
          "Unable to update employee status."
      );
    }
  };

  /*
   * TERMINATE EMPLOYEE
   */
  const handleTerminateEmployee = async (employee) => {
    const confirmed = window.confirm(
      `Are you sure you want to terminate ${formatEmployeeName(
        employee
      )}?`
    );

    if (!confirmed) return;

    try {
      await employeeService.terminate(employee.id);

      showNotification(
        "success",
        "Employee has been marked as Terminated."
      );

      await loadEmployees();

      setShowDetails(false);
      setSelectedEmployee(null);
    } catch (error) {
      console.error(
        "Failed to terminate employee:",
        error
      );

      showNotification(
        "error",
        error.response?.data?.message ||
          "Unable to update employee status."
      );
    }
  };

  /*
   * RESIGN EMPLOYEE
   */
  const handleResignEmployee = async (employee) => {
    const confirmed = window.confirm(
      `Are you sure you want to mark ${formatEmployeeName(
        employee
      )} as resigned?`
    );

    if (!confirmed) return;

    try {
      await employeeService.resign(employee.id);

      showNotification(
        "success",
        "Employee has been marked as Resigned."
      );

      await loadEmployees();

      setShowDetails(false);
      setSelectedEmployee(null);
    } catch (error) {
      console.error(
        "Failed to resign employee:",
        error
      );

      showNotification(
        "error",
        error.response?.data?.message ||
          "Unable to update employee status."
      );
    }
  };

  /*
   * SOFT DELETE EMPLOYEE
   */
  const handleDeleteEmployee = async (employee) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${formatEmployeeName(
        employee
      )}? This employee will be removed from the active directory.`
    );

    if (!confirmed) return;

    try {
      await employeeService.delete(employee.id);

      showNotification(
        "success",
        "Employee deleted successfully."
      );

      await loadEmployees();

      setShowDetails(false);
      setSelectedEmployee(null);
    } catch (error) {
      console.error(
        "Failed to delete employee:",
        error
      );

      showNotification(
        "error",
        error.response?.data?.message ||
          "Unable to delete employee."
      );
    }
  };

  /*
   * ADD EMPLOYEE
   */
  const handleAddEmployee = () => {
    navigate("/employees/add");
  };

  /*
   * CLOSE DETAILS
   */
  const handleCloseDetails = () => {
    setShowDetails(false);
    setSelectedEmployee(null);
  };

  /*
   * FORMATTED CURRENT DATE
   */
  const formattedDate = new Intl.DateTimeFormat(
    "en-IN",
    {
      weekday: "long",
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  ).format(new Date());

  /*
   * LOADING STATE
   */
  if (loading && employees.length === 0) {
    return (
      <main className="employees-page">
        <header className="employees-page__header">
          <div>
            <span className="employees-page__eyebrow">
              EMPLOYEES
            </span>

            <h1>Employees</h1>

            <p>
              Manage employees, organization assignments
              and employee access.
            </p>
          </div>

          <div className="employees-page__header-actions">
            <div className="employees-page__date">
              <FiUsers />
              <span>{formattedDate}</span>
            </div>
          </div>
        </header>

        <div className="employees-page__loading">
          Loading employees from server...
        </div>
      </main>
    );
  }

  /*
   * PAGE RENDER
   */
  return (
    <main className="employees-page">
      {/* HEADER */}
      <header className="employees-page__header">
        <div>
          <span className="employees-page__eyebrow">
            EMPLOYEES
          </span>

          <h1>Employees</h1>

          <p>
            Manage employees, organization assignments
            and employee access.
          </p>
        </div>

        <div className="employees-page__header-actions">
          <div className="employees-page__date">
            <FiUsers />
            <span>{formattedDate}</span>
          </div>

          <Button
            variant="primary"
            onClick={handleAddEmployee}
          >
            + Add Employee
          </Button>
        </div>
      </header>

      {/* FEEDBACK */}
      {feedbackMessage.text && (
        <div
          className={`employees-page__feedback employees-page__feedback--${feedbackMessage.type}`}
        >
          {feedbackMessage.text}
        </div>
      )}

      {/* STATS */}
      <EmployeeStats stats={stats} />

      {/* FILTERS */}
      <EmployeeFilters
        search={search}
        onSearchChange={setSearch}
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
        employees={employees}
      />

      {/* TABLE */}
      <EmployeeTable
        employees={filteredEmployees}
        onView={handleViewEmployee}
        onEdit={handleEditEmployee}
        onResendInvite={handleResendInvite}
        onToggleStatus={handleToggleStatus}
        onTerminate={handleTerminateEmployee}
        onResign={handleResignEmployee}
        onDelete={handleDeleteEmployee}
      />

      {/* DETAILS */}
      <EmployeeDetails
        open={showDetails}
        employee={selectedEmployee}
        onClose={handleCloseDetails}
        onResendInvite={handleResendInvite}
      />
    </main>
  );
};

export default Employees;

