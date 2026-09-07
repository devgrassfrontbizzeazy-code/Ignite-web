import { useEffect, useMemo, useState } from "react";

import PageHeader from "../../components/common/PageHeader/PageHeader";
import Button from "../../components/common/Button/Button";
import EmptyState from "../../components/common/EmptyState/EmptyState";
import Modal from "../../components/common/Modal/Modal";

import DepartmentStats from "../../components/departments/DepartmentStats/DepartmentStats";
import DepartmentFilters from "../../components/departments/DepartmentFilters/DepartmentFilters";
import DepartmentTable from "../../components/departments/DepartmentTable/DepartmentTable";

import DepartmentForm from "../../components/departments/DepartmentForm/DepartmentForm";
import DepartmentDetails from "../../components/departments/DepartmentDetails/DepartmentDetails";

import {
  getDepartments,
  createDepartment,
  updateDepartment,
  patchDepartment,
  deleteDepartment,
} from "../../services/api/departmentAPI";

import "./Departments.css";

/*
 * Convert backend department data into
 * the structure expected by frontend components.
 */
const normalizeDepartment = (department) => {
  if (!department) {
    return null;
  }

  return {
    id:
      department.id ??
      department.department_id ??
      department.pk,

    departmentName:
      department.name ??
      department.department_name ??
      "",

    description:
      department.description ?? "",

    status: (
      department.status ??
      (department.is_active
        ? "Active"
        : "Inactive")
    ).toLowerCase(),

    isActive:
      Boolean(department.is_active),

    company:
      department.company,

    companyName:
      department.company_name,

    createdAt:
      department.created_at ??
      department.createdAt,

    updatedAt:
      department.updated_at ??
      department.updatedAt,
  };
};

/*
 * Extract department array from the API response.
 *
 * Supports:
 * - Direct array
 * - { results: [] }
 * - { data: [] }
 */
const extractDepartmentList = (response) => {
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

const Departments = () => {
  const [departments, setDepartments] =
    useState([]);

  const [search, setSearch] =
    useState("");

  const [status, setStatus] =
    useState("all");

  const [sortBy, setSortBy] =
    useState("name");

  const [showForm, setShowForm] =
    useState(false);

  const [showDetails, setShowDetails] =
    useState(false);

  const [selectedDepartment, setSelectedDepartment] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  /*
   * Load all departments.
   */
  const loadDepartments = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await getDepartments();

      const departmentList =
        extractDepartmentList(response);

      const normalizedDepartments =
        departmentList
          .map(normalizeDepartment)
          .filter(Boolean);

      setDepartments(
        normalizedDepartments
      );
    } catch (error) {
      console.error(
        "Failed to load departments:",
        error
      );

      setError(
        error.response?.data?.detail ||
          error.response?.data?.message ||
          "Failed to load departments."
      );
    } finally {
      setLoading(false);
    }
  };

  /*
   * Load departments when page mounts.
   */
  useEffect(() => {
    loadDepartments();
  }, []);

  /*
   * Department statistics.
   */
  const stats = useMemo(() => {
    const total =
      departments.length;

    const active =
      departments.filter(
        (department) =>
          department.status ===
          "active"
      ).length;

    const inactive =
      departments.filter(
        (department) =>
          department.status ===
          "inactive"
      ).length;

    return {
      total,
      active,
      inactive,
    };
  }, [departments]);

  /*
   * Search, filter and sort departments.
   */
  const filteredDepartments =
    useMemo(() => {
      let result = [
        ...departments,
      ];

      /*
       * Search by department name
       * or description.
       */
      if (search.trim()) {
        const searchValue =
          search
            .toLowerCase()
            .trim();

        result = result.filter(
          (department) =>
            department.departmentName
              ?.toLowerCase()
              .includes(
                searchValue
              ) ||
            department.description
              ?.toLowerCase()
              .includes(
                searchValue
              )
        );
      }

      /*
       * Status filter.
       */
      if (status !== "all") {
        result =
          result.filter(
            (department) =>
              department.status ===
              status
          );
      }

      /*
       * Sorting.
       */
      result.sort((a, b) => {
        switch (sortBy) {
          case "newest":
            return (
              new Date(
                b.createdAt
              ) -
              new Date(
                a.createdAt
              )
            );

          case "oldest":
            return (
              new Date(
                a.createdAt
              ) -
              new Date(
                b.createdAt
              )
            );

          case "name":
          default:
            return (
              a.departmentName ||
              ""
            ).localeCompare(
              b.departmentName ||
                ""
            );
        }
      });

      return result;
    }, [
      departments,
      search,
      status,
      sortBy,
    ]);

  /*
   * Open Add Department form.
   */
  const handleAddDepartment = () => {
    setError("");
    setSelectedDepartment(null);
    setShowForm(true);
  };

  /*
   * View Department.
   *
   * Fetches the latest department
   * details from the backend.
   */
  const handleViewDepartment = (department) => {
  setError("");
  setSelectedDepartment(department);
  setShowDetails(true);
};

  /*
   * Open Edit Department form.
   */
  const handleEditDepartment =
    (department) => {
      setError("");
      setShowDetails(false);
      setSelectedDepartment(
        department
      );
      setShowForm(true);
    };

  /*
   * Close Details modal.
   */
  const handleCloseDetails =
    () => {
      setShowDetails(false);
      setSelectedDepartment(null);
    };

  /*
   * Delete Department.
   */
  const handleDeleteDepartment =
    async (department) => {
      if (!department?.id) {
        setError(
          "Unable to delete department: department ID is missing."
        );
        return;
      }

      const confirmed =
        window.confirm(
          `Are you sure you want to delete "${department.departmentName}"?`
        );

      if (!confirmed) {
        return;
      }

      try {
        setLoading(true);
        setError("");

        await deleteDepartment(
          department.id
        );

        /*
         * Remove deleted department
         * from local state.
         */
        setDepartments(
          (previous) =>
            previous.filter(
              (item) =>
                item.id !==
                department.id
            )
        );

        /*
         * Close details if the
         * deleted department was open.
         */
        if (
          selectedDepartment?.id ===
          department.id
        ) {
          setSelectedDepartment(
            null
          );
          setShowDetails(false);
        }
      } catch (error) {
        console.error(
          "Failed to delete department:",
          error
        );

        setError(
          error.response?.data
            ?.detail ||
            error.response?.data
              ?.message ||
            "Failed to delete department."
        );
      } finally {
        setLoading(false);
      }
    };

  /*
   * Activate / Deactivate Department.
   */
  const handleToggleDepartmentStatus =
  async (department) => {
    if (!department?.id) {
      setError(
        "Unable to update department: department ID is missing."
      );
      return;
    }

    try {
      setLoading(true);
      setError("");

      const newStatus =
        department.status === "active"
          ? "Inactive"
          : "Active";

      await patchDepartment(
        department.id,
        {
          status: newStatus,
          is_active:
            newStatus === "Active",
        }
      );

      /*
       * Reload departments from backend
       * so the UI always reflects the
       * actual saved state.
       */
      const response =
        await getDepartments();

      const departmentList =
        extractDepartmentList(response);

      const normalizedDepartments =
        departmentList
          .map(normalizeDepartment)
          .filter(Boolean);

      setDepartments(
        normalizedDepartments
      );

      /*
       * Keep details modal synchronized.
       */
      const updatedDepartment =
        normalizedDepartments.find(
          (item) =>
            item.id === department.id
        );

      if (updatedDepartment) {
        setSelectedDepartment(
          updatedDepartment
        );
      }
    } catch (error) {
      console.error(
        "Failed to update department status:",
        error
      );

      setError(
        error.response?.data?.detail ||
          error.response?.data?.message ||
          "Failed to update department status."
      );
    } finally {
      setLoading(false);
    }
  };

  /*
   * Add / Edit Department.
   */
  const handleSubmitDepartment =
    async (formData) => {
      try {
        setLoading(true);
        setError("");

        const payload = {
          name:
            formData.departmentName
              ?.trim() || "",

          description:
            formData.description
              ?.trim() || "",

          status:
            formData.status ===
            "active"
              ? "Active"
              : "Inactive",

          is_active:
            formData.status ===
            "active",
        };

        /*
         * Edit existing department.
         */
        if (selectedDepartment) {
          await updateDepartment(
            selectedDepartment.id,
            payload
          );
        }

        /*
         * Create new department.
         */
        else {
          await createDepartment(
            payload
          );
        }

        /*
         * Always reload from backend
         * after create/update.
         *
         * This guarantees that the
         * frontend uses the same data
         * structure as a page refresh.
         */
        const response =
          await getDepartments();

        const departmentList =
          extractDepartmentList(
            response
          );

        const normalizedDepartments =
          departmentList
            .map(normalizeDepartment)
            .filter(Boolean);

        setDepartments(
          normalizedDepartments
        );

        /*
         * Close form.
         */
        setShowForm(false);
        setSelectedDepartment(
          null
        );
      } catch (error) {
        console.error(
          "Failed to save department:",
          error
        );

        setError(
          error.response?.data
            ?.detail ||
            error.response?.data
              ?.message ||
            "Failed to save department."
        );
      } finally {
        setLoading(false);
      }
    };

  /*
   * Cancel Add / Edit form.
   */
  const handleCancelForm = () => {
    setShowForm(false);
    setSelectedDepartment(null);
    setError("");
  };

  return (
    <div className="departments-page">
      {/* Page Header */}
      <div className="departments-page__header">
        <PageHeader
          title="Departments"
          description="Manage your organization's departments and structure."
        />

        <Button
          variant="primary"
          onClick={
            handleAddDepartment
          }
        >
          + Add Department
        </Button>
      </div>

      <div className="departments-page__content">
        {/* Error */}
        {error && (
          <div
            className="departments-page__error"
            role="alert"
          >
            {error}
          </div>
        )}

        {/* Statistics */}
        <DepartmentStats
          total={stats.total}
          active={stats.active}
          inactive={stats.inactive}
        />

        {/* Filters */}
        {departments.length >
          0 && (
          <DepartmentFilters
            search={search}
            onSearch={(value) =>
              setSearch(
                value?.target
                  ?.value ??
                  value ??
                  ""
              )
            }
            status={status}
            onStatusChange={
              setStatus
            }
            sortBy={sortBy}
            onSortChange={
              setSortBy
            }
          />
        )}

        {/* Loading */}
        {loading &&
        departments.length ===
          0 ? (
          <div className="departments-page__empty">
            <EmptyState
              title="Loading departments..."
              description="Please wait while we load your departments."
            />
          </div>
        ) : departments.length ===
          0 ? (
          /* No Departments */
          <div className="departments-page__empty">
            <EmptyState
              title="No departments yet"
              description="Create your first department to start organizing your workforce."
              action={
                <Button
                  variant="primary"
                  onClick={
                    handleAddDepartment
                  }
                >
                  + Add Department
                </Button>
              }
            />
          </div>
        ) : filteredDepartments.length ===
          0 ? (
          /* No Search Results */
          <div className="departments-page__empty">
            <EmptyState
              title="No departments found"
              description="Try changing your search or status filter."
            />
          </div>
        ) : (
          /* Department Table */
          <div className="departments-page__table">
            <DepartmentTable
              departments={
                filteredDepartments
              }
              onView={
                handleViewDepartment
              }
              onEdit={
                handleEditDepartment
              }
              onDelete={
                handleDeleteDepartment
              }
              onToggleStatus={
                handleToggleDepartmentStatus
              }
            />
          </div>
        )}
      </div>

      {/* Department Details Modal */}
      <Modal
        open={
          showDetails &&
          !!selectedDepartment
        }
        onClose={
          handleCloseDetails
        }
        size="medium"
      >
        <DepartmentDetails
          department={
            selectedDepartment
          }
          onClose={
            handleCloseDetails
          }
          onEdit={
            handleEditDepartment
          }
        />
      </Modal>

      {/* Add / Edit Modal */}
      <Modal
        open={showForm}
        onClose={
          handleCancelForm
        }
        title={
          selectedDepartment
            ? "Edit Department"
            : "Add Department"
        }
        description={
          selectedDepartment
            ? "Update the department details below."
            : "Add a new department to your organization."
        }
        size="medium"
      >
        <DepartmentForm
          initialData={
            selectedDepartment || {}
          }
          onSubmit={
            handleSubmitDepartment
          }
          onCancel={
            handleCancelForm
          }
          loading={loading}
        />
      </Modal>
    </div>
  );
};

export default Departments;