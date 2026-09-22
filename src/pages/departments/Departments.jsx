import { useEffect, useMemo, useState } from "react";

import Button from "../../components/common/Button/Button";
import IgniteLoader from "../../components/common/IgniteLoader/IgniteLoader";
import PageHeader from "../../components/common/PageHeader/PageHeader";

import DepartmentDetails from "../../components/departments/DepartmentDetails/DepartmentDetails";
import DepartmentFilters from "../../components/departments/DepartmentFilters/DepartmentFilters";
import DepartmentForm from "../../components/departments/DepartmentForm/DepartmentForm";
import DepartmentStats from "../../components/departments/DepartmentStats/DepartmentStats";
import DepartmentTable from "../../components/departments/DepartmentTable/DepartmentTable";
import ConfirmModal from "../../components/common/ConfirmModal/ConfirmModal";

import {
  getDepartments,
  createDepartment,
  updateDepartment,
  patchDepartment,
  deleteDepartment,
} from "../../services/api/departmentAPI";

import roleService from "../../services/roleService";
import { useNotification } from "../../context/NotificationContext";

import "./Departments.css";

const extractDepartmentList = (response) => {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.results)) {
    return response.results;
  }

  if (Array.isArray(response?.data?.results)) {
    return response.data.results;
  }

  return [];
};

const normalizeDepartment = (department) => {
  if (!department) {
    return null;
  }

  const rawStatus = department.status ?? department.is_active;

  let normalizedStatus = "active";

  if (typeof rawStatus === "boolean") {
    normalizedStatus = rawStatus ? "active" : "inactive";
  } else if (typeof rawStatus === "string") {
    normalizedStatus =
      rawStatus.toLowerCase() === "active" || rawStatus.toLowerCase() === "true"
        ? "active"
        : "inactive";
  }

  return {
    ...department,
    id: department.id ?? department.department_id,
    departmentName:
      department.departmentName ??
      department.name ??
      department.department_name ??
      "Unnamed Department",
    departmentCode:
      department.departmentCode ??
      department.code ??
      department.department_code ??
      "—",
    description: department.description ?? "",
    status: normalizedStatus,
    createdAt:
      department.createdAt ??
      department.created_at ??
      new Date().toISOString(),

    headOfDepartment:
      department.headOfDepartment ??
      department.head_of_department ??
      department.manager ??
      null,

    employeeCount:
      department.employeeCount ??
      department.employee_count ??
      department.total_employees ??
      0,

    rolesCount:
      department.rolesCount ??
      department.roles_count ??
      department.total_roles ??
      0,
  };
};

const extractApiError = (error, fallbackContext = {}) => {
  const data = error?.response?.data;

  if (!data) {
    return {
      fieldErrors: {},
      generalError: error?.message || "An unexpected error occurred.",
    };
  }

  if (typeof data === "string") {
    return {
      fieldErrors: {},
      generalError: data,
    };
  }

  const fieldErrors = {};
  let generalError = "";

  if (data.detail && typeof data.detail === "string") {
    generalError = data.detail;
  } else if (data.message && typeof data.message === "string") {
    generalError = data.message;
  } else if (data.error && typeof data.error === "string") {
    generalError = data.error;
  }

  Object.keys(data).forEach((key) => {
    if (
      key === "detail" ||
      key === "message" ||
      key === "error" ||
      key === "status_code"
    ) {
      return;
    }

    const value = data[key];

    if (Array.isArray(value)) {
      fieldErrors[key] = value.join(" ");
    } else if (typeof value === "string") {
      fieldErrors[key] = value;
    }
  });

  return {
    fieldErrors,
    generalError:
      generalError ||
      (Object.keys(fieldErrors).length > 0
        ? "Please fix the validation errors below."
        : "Failed to process request."),
  };
};

const Departments = () => {
  const { notify } = useNotification();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [sortBy, setSortBy] = useState("name");

  const [showForm, setShowForm] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const [formFieldErrors, setFormFieldErrors] = useState({});

  const [deleteModal, setDeleteModal] = useState({
    open: false,
    department: null,
    loading: false,
  });

  const loadDepartments = async () => {
    try {
      setLoading(true);

      const response = await getDepartments();
      const departmentList = extractDepartmentList(response);

      const normalizedDepartments = departmentList
        .map(normalizeDepartment)
        .filter(Boolean);

      setDepartments(normalizedDepartments);
    } catch (error) {
      console.error("Failed to load departments:", error);

      const { generalError } = extractApiError(error, {
        context: "department",
        action: "load",
      });

      notify.error(generalError || "Failed to load departments. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  const stats = useMemo(() => {
    const total = departments.length;
    const active = departments.filter((d) => d.status === "active").length;
    const inactive = departments.filter((d) => d.status === "inactive").length;

    return { total, active, inactive };
  }, [departments]);

  const filteredDepartments = useMemo(() => {
    let result = [...departments];

    if (search.trim()) {
      const searchValue = search.toLowerCase().trim();
      result = result.filter(
        (department) =>
          department.departmentName?.toLowerCase().includes(searchValue) ||
          department.departmentCode?.toLowerCase().includes(searchValue) ||
          department.description?.toLowerCase().includes(searchValue),
      );
    }

    if (status !== "all") {
      result = result.filter((department) => department.status === status);
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt) - new Date(a.createdAt);
        case "oldest":
          return new Date(a.createdAt) - new Date(b.createdAt);
        case "code":
          return (a.departmentCode || "").localeCompare(b.departmentCode || "");
        case "employees":
          return (b.employeeCount || 0) - (a.employeeCount || 0);
        case "name":
        default:
          return (a.departmentName || "").localeCompare(b.departmentName || "");
      }
    });

    return result;
  }, [departments, search, status, sortBy]);

  const handleAddDepartment = () => {
    setFormFieldErrors({});
    setSelectedDepartment(null);
    setShowForm(true);
  };

  const handleViewDepartment = (department) => {
    setSelectedDepartment(department);
    setShowDetails(true);
  };

  const handleEditDepartment = (department) => {
    setFormFieldErrors({});
    setShowDetails(false);
    setSelectedDepartment(department);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setSelectedDepartment(null);
    setFormFieldErrors({});
  };

  const handleCloseDetails = () => {
    setShowDetails(false);
    setSelectedDepartment(null);
  };

  const handleDeleteClick = (department) => {
    if (!department?.id) {
      notify.error("Unable to delete department: department ID is missing.");
      return;
    }

    setDeleteModal({
      open: true,
      department,
      loading: false,
    });
  };

  const handleConfirmDelete = async () => {
    const department = deleteModal.department;
    if (!department) return;

    try {
      setDeleteModal((prev) => ({ ...prev, loading: true }));

      await deleteDepartment(department.id);

      setDepartments((previous) =>
        previous.filter((item) => item.id !== department.id),
      );

      if (selectedDepartment?.id === department.id) {
        setSelectedDepartment(null);
        setShowDetails(false);
      }

      setDeleteModal({ open: false, department: null, loading: false });
      notify.success(`Department "${department.departmentName}" deleted successfully.`);
    } catch (error) {
      console.error("Failed to delete department:", error);

      const { generalError } = extractApiError(error, {
        context: "department",
        action: "delete",
      });

      setDeleteModal((prev) => ({ ...prev, loading: false }));
      notify.error(generalError || "Failed to delete department. Please try again.");
    }
  };

  const handleToggleDepartmentStatus = async (department) => {
    if (!department?.id) {
      notify.error("Unable to update department: department ID is missing.");
      return;
    }

    try {
      setLoading(true);

      const newStatus = department.status === "active" ? "Inactive" : "Active";

      await patchDepartment(department.id, {
        status: newStatus,
        is_active: newStatus === "Active",
      });

      const response = await getDepartments();
      const departmentList = extractDepartmentList(response);
      const normalizedDepartments = departmentList
        .map(normalizeDepartment)
        .filter(Boolean);

      setDepartments(normalizedDepartments);

      const updatedDepartment = normalizedDepartments.find(
        (item) => item.id === department.id,
      );

      if (updatedDepartment) {
        setSelectedDepartment(updatedDepartment);
      }

      notify.success(
        `Department "${department.departmentName}" ${newStatus === "Active" ? "activated" : "deactivated"} successfully.`,
      );
    } catch (error) {
      console.error("Failed to update department status:", error);

      const { generalError } = extractApiError(error, {
        context: "department",
        action: "toggle",
      });

      notify.error(generalError || "Failed to update department status. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitDepartment = async (formData) => {
    try {
      setLoading(true);
      setFormFieldErrors({});

      const payload = {
        department_code: formData.departmentCode?.trim() || "",
        department_name: formData.departmentName?.trim() || "",
        description: formData.description?.trim() || "",
        status: formData.status || "Active",
        is_active: (formData.status || "Active") === "Active",
      };

      if (selectedDepartment?.id) {
        await updateDepartment(selectedDepartment.id, payload);

        if (formData.defaultRoleId) {
          roleService.setDepartmentRole(
            selectedDepartment.id,
            formData.defaultRoleId,
          );
        }

        notify.success("Department updated successfully.");
      } else {
        const response = await createDepartment(payload);

        const newDeptId =
          response?.data?.id || response?.id || response?.department_id;

        if (newDeptId && formData.defaultRoleId) {
          roleService.setDepartmentRole(newDeptId, formData.defaultRoleId);
        }

        notify.success("Department created successfully.");
      }

      await loadDepartments();
      handleCloseForm();
    } catch (error) {
      console.error("Failed to save department:", error);

      const { fieldErrors, generalError } = extractApiError(error, {
        context: "department",
        action: selectedDepartment ? "update" : "create",
      });

      setFormFieldErrors(fieldErrors);
      notify.error(generalError || "Failed to save department.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="departments-page">
      <PageHeader
        eyebrow="Organization"
        title="Departments"
        description="Manage organizational units, structure, and department assignments."
        action={
          <Button variant="primary" onClick={handleAddDepartment}>
            + Add Department
          </Button>
        }
      />

      <DepartmentStats stats={stats} />

      <section className="departments-page__content">
        <DepartmentFilters
          search={search}
          onSearchChange={setSearch}
          status={status}
          onStatusChange={setStatus}
          sortBy={sortBy}
          onSortByChange={setSortBy}
        />

        {loading ? (
          <div className="departments-page__loading">
            <IgniteLoader message="Loading departments..." />
          </div>
        ) : (
          <DepartmentTable
            departments={filteredDepartments}
            onView={handleViewDepartment}
            onEdit={handleEditDepartment}
            onDelete={handleDeleteClick}
            onToggleStatus={handleToggleDepartmentStatus}
          />
        )}
      </section>

      {showForm && (
        <DepartmentForm
          department={selectedDepartment}
          onSubmit={handleSubmitDepartment}
          onCancel={handleCloseForm}
          errors={formFieldErrors}
        />
      )}

      {showDetails && selectedDepartment && (
        <DepartmentDetails
          department={selectedDepartment}
          onClose={handleCloseDetails}
          onEdit={() => handleEditDepartment(selectedDepartment)}
          onDelete={() => handleDeleteClick(selectedDepartment)}
          onToggleStatus={() => handleToggleDepartmentStatus(selectedDepartment)}
        />
      )}

      {deleteModal.open && (
        <ConfirmModal
          open={deleteModal.open}
          onClose={() => setDeleteModal({ open: false, department: null, loading: false })}
          onConfirm={handleConfirmDelete}
          title="Delete Department?"
          itemName={deleteModal.department?.departmentName}
          confirmText="Delete"
          loading={deleteModal.loading}
        />
      )}
    </main>
  );
};

export default Departments;
