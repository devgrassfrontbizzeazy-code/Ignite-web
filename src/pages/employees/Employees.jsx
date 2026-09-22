import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiUsers } from "react-icons/fi";

import Button from "../../components/common/Button/Button";
import IgniteLoader from "../../components/common/IgniteLoader/IgniteLoader";

import EmployeeStats from "../../components/employees/EmployeeStats/EmployeeStats";
import EmployeeFilters from "../../components/employees/EmployeeFilters/EmployeeFilters";
import EmployeeTable from "../../components/employees/EmployeeTable/EmployeeTable";
import EmployeeDetails from "../../components/employees/EmployeeDetails/EmployeeDetails";
import ConfirmModal from "../../components/common/ConfirmModal/ConfirmModal";

import employeeService from "../../services/employeeService";
import { canCreateEmployees, getCurrentUser } from "../../utils/permissionUtils";
import { useNotification } from "../../context/NotificationContext";

import "./Employees.css";

const formatEmployeeName = (employee) =>
  [employee?.first_name, employee?.middle_name, employee?.last_name]
    .filter(Boolean)
    .join(" ") || employee?.full_name || "Employee";

const Employees = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [currentUser, setCurrentUser] = useState(getCurrentUser());

  useEffect(() => {
    const handleUserUpdate = () => {
      setCurrentUser(getCurrentUser());
    };
    window.addEventListener("ignite:user-updated", handleUserUpdate);
    window.addEventListener("storage", handleUserUpdate);
    return () => {
      window.removeEventListener("ignite:user-updated", handleUserUpdate);
      window.removeEventListener("storage", handleUserUpdate);
    };
  }, []);

  const canAddEmployee = canCreateEmployees(currentUser);

  /*
   * EMPLOYEE DATA
   */
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

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

  /*
   * CONFIRMATION MODAL STATE
   */
  const [confirmState, setConfirmState] = useState({
    open: false,
    title: "",
    itemName: "",
    description: "",
    confirmText: "Confirm",
    variant: "danger",
    loading: false,
    onConfirm: null,
  });

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
   * FILTER CHANGE HANDLER
   */
  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
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
   * FILTER EMPLOYEES
   */
  const filteredEmployees = useMemo(() => {
    return employees.filter((employee) => {
      const name = formatEmployeeName(employee).toLowerCase();
      const email = (employee.email || "").toLowerCase();
      const code = (employee.employee_code || "").toLowerCase();
      const searchValue = search.toLowerCase().trim();

      const matchesSearch =
        !searchValue ||
        name.includes(searchValue) ||
        email.includes(searchValue) ||
        code.includes(searchValue);

      const matchesDept =
        filters.department === "all" ||
        String(employee.department?.id || employee.department_id || "") ===
        String(filters.department);

      const matchesDesig =
        filters.designation === "all" ||
        String(employee.designation?.id || employee.designation_id || "") ===
        String(filters.designation);

      const matchesType =
        filters.employmentType === "all" ||
        employee.employment_type === filters.employmentType;

      const matchesStatus =
        filters.employmentStatus === "all" ||
        employee.employment_status === filters.employmentStatus;

      const matchesLocation =
        filters.workLocation === "all" ||
        employee.work_location === filters.workLocation;

      const matchesManager =
        filters.reportingManager === "all" ||
        String(
          employee.reporting_manager?.id ||
          employee.reporting_manager_id ||
          ""
        ) === String(filters.reportingManager);

      return (
        matchesSearch &&
        matchesDept &&
        matchesDesig &&
        matchesType &&
        matchesStatus &&
        matchesLocation &&
        matchesManager
      );
    });
  }, [employees, search, filters]);

  /*
   * CALCULATE STATS
   */
  const stats = useMemo(() => {
    const total = employees.length;
    const active = employees.filter(
      (e) => e.employment_status === "ACTIVE"
    ).length;
    const pending = employees.filter(
      (e) =>
        e.invitation_status === "PENDING" || e.invitation_status === "SENT"
    ).length;
    const inactive = employees.filter(
      (e) =>
        e.employment_status === "INACTIVE" ||
        e.employment_status === "TERMINATED" ||
        e.employment_status === "RESIGNED"
    ).length;

    return { total, active, pending, inactive };
  }, [employees]);

  /*
   * VIEW DETAILS
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
   * RESEND INVITATION
   */
  const handleResendInvite = async (employee) => {
    try {
      await employeeService.resendInvite(employee.id);

      showNotification(
        "success",
        `Invitation resent to ${employee.email}.`
      );
    } catch (error) {
      console.error("Failed to resend invite:", error);

      showNotification(
        "error",
        error.response?.data?.message ||
        "Failed to resend invitation email."
      );
    }
  };

  /*
   * TOGGLE STATUS
   */
  const handleToggleStatus = (employee) => {
    const isActive = employee.employment_status === "ACTIVE";
    const nextStatus = isActive ? "INACTIVE" : "ACTIVE";
    const actionText = isActive ? "deactivate" : "activate";

    setConfirmState({
      open: true,
      title: `${isActive ? "Deactivate" : "Activate"} Employee?`,
      itemName: formatEmployeeName(employee),
      description: `Are you sure you want to ${actionText} ${formatEmployeeName(employee)}?`,
      confirmText: isActive ? "Deactivate" : "Activate",
      variant: isActive ? "danger" : "primary",
      loading: false,
      onConfirm: async () => {
        try {
          setConfirmState((prev) => ({ ...prev, loading: true }));
          await employeeService.changeStatus(employee.id, nextStatus);

          showNotification(
            "success",
            `Employee status updated to ${nextStatus}.`
          );

          await loadEmployees();

          if (selectedEmployee?.id === employee.id) {
            const updated = await employeeService.getById(employee.id);
            setSelectedEmployee(updated);
          }

          setConfirmState({ open: false, loading: false });
        } catch (error) {
          console.error("Failed to change status:", error);
          setConfirmState((prev) => ({ ...prev, loading: false }));
          showNotification(
            "error",
            error.response?.data?.message || "Unable to update status."
          );
        }
      },
    });
  };

  /*
   * TERMINATE EMPLOYEE
   */
  const handleTerminateEmployee = (employee) => {
    setConfirmState({
      open: true,
      title: "Terminate Employee?",
      itemName: formatEmployeeName(employee),
      description: `Are you sure you want to terminate ${formatEmployeeName(employee)}? This action cannot be undone.`,
      confirmText: "Terminate",
      variant: "danger",
      loading: false,
      onConfirm: async () => {
        try {
          setConfirmState((prev) => ({ ...prev, loading: true }));
          await employeeService.terminate(employee.id);

          showNotification(
            "success",
            "Employee has been marked as Terminated."
          );

          await loadEmployees();
          setShowDetails(false);
          setSelectedEmployee(null);
          setConfirmState({ open: false, loading: false });
        } catch (error) {
          console.error("Failed to terminate employee:", error);
          setConfirmState((prev) => ({ ...prev, loading: false }));
          showNotification(
            "error",
            error.response?.data?.message || "Unable to terminate employee."
          );
        }
      },
    });
  };

  /*
   * RESIGN EMPLOYEE
   */
  const handleResignEmployee = (employee) => {
    setConfirmState({
      open: true,
      title: "Resign Employee?",
      itemName: formatEmployeeName(employee),
      description: `Are you sure you want to mark ${formatEmployeeName(employee)} as resigned?`,
      confirmText: "Mark Resigned",
      variant: "danger",
      loading: false,
      onConfirm: async () => {
        try {
          setConfirmState((prev) => ({ ...prev, loading: true }));
          await employeeService.resign(employee.id);

          showNotification(
            "success",
            "Employee has been marked as Resigned."
          );

          await loadEmployees();
          setShowDetails(false);
          setSelectedEmployee(null);
          setConfirmState({ open: false, loading: false });
        } catch (error) {
          console.error("Failed to resign employee:", error);
          setConfirmState((prev) => ({ ...prev, loading: false }));
          showNotification(
            "error",
            error.response?.data?.message || "Unable to resign employee."
          );
        }
      },
    });
  };

  /*
   * SOFT DELETE EMPLOYEE
   */
  const handleDeleteEmployee = (employee) => {
    setConfirmState({
      open: true,
      title: "Delete Employee?",
      itemName: formatEmployeeName(employee),
      description: `Are you sure you want to delete ${formatEmployeeName(employee)}? This employee will be removed from the active directory. This action cannot be undone.`,
      confirmText: "Delete",
      variant: "danger",
      loading: false,
      onConfirm: async () => {
        try {
          setConfirmState((prev) => ({ ...prev, loading: true }));
          await employeeService.delete(employee.id);

          showNotification(
            "success",
            "Employee deleted successfully."
          );

          await loadEmployees();
          setShowDetails(false);
          setSelectedEmployee(null);
          setConfirmState({ open: false, loading: false });
        } catch (error) {
          console.error("Failed to delete employee:", error);
          setConfirmState((prev) => ({ ...prev, loading: false }));
          showNotification(
            "error",
            error.response?.data?.message || "Unable to delete employee."
          );
        }
      },
    });
  };

  const handleAddEmployee = () => {
    navigate("/employees/add");
  };

  const handleCloseDetails = () => {
    setShowDetails(false);
    setSelectedEmployee(null);
  };

  const formattedDate = new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date());

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
              Manage employees, organization assignments and employee access.
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
          <IgniteLoader message="Loading employees..." />
        </div>
      </main>
    );
  }

  return (
    <main className="employees-page">
      <header className="employees-page__header">
        <div>
          <span className="employees-page__eyebrow">
            EMPLOYEES
          </span>
          <h1>Employees</h1>
          <p>
            Manage employees, organization assignments and employee access.
          </p>
        </div>

        <div className="employees-page__header-actions">
          <div className="employees-page__date">
            <FiUsers />
            <span>{formattedDate}</span>
          </div>

          {canAddEmployee && (
            <Button variant="primary" onClick={handleAddEmployee}>
              + Add Employee
            </Button>
          )}
        </div>
      </header>

      <EmployeeStats stats={stats} />

      <EmployeeFilters
        search={search}
        onSearchChange={setSearch}
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
        employees={employees}
      />

      <section className="employees-page__content">
        <EmployeeTable
          employees={filteredEmployees}
          loading={loading}
          onView={handleViewEmployee}
          onEdit={handleEditEmployee}
          onResendInvite={handleResendInvite}
          onToggleStatus={handleToggleStatus}
          onTerminate={handleTerminateEmployee}
          onResign={handleResignEmployee}
          onDelete={handleDeleteEmployee}
        />
      </section>

      {showDetails && selectedEmployee && (
        <EmployeeDetails
          employee={selectedEmployee}
          onClose={handleCloseDetails}
          onEdit={handleEditEmployee}
          onResendInvite={handleResendInvite}
          onToggleStatus={handleToggleStatus}
          onTerminate={handleTerminateEmployee}
          onResign={handleResignEmployee}
          onDelete={handleDeleteEmployee}
        />
      )}

      {confirmState.open && (
        <ConfirmModal
          open={confirmState.open}
          onClose={() => setConfirmState({ open: false, loading: false })}
          onConfirm={confirmState.onConfirm}
          title={confirmState.title}
          itemName={confirmState.itemName}
          description={confirmState.description}
          confirmText={confirmState.confirmText}
          variant={confirmState.variant}
          loading={confirmState.loading}
        />
      )}
    </main>
  );
};

export default Employees;
