
import { useMemo, useState } from "react";

import {
  useOrganization,
} from "../../context/OrganizationContext/OrganizationContext";

import PageHeader from "../../components/common/PageHeader/PageHeader";
import Button from "../../components/common/Button/Button";
import EmptyState from "../../components/common/EmptyState/EmptyState";
import Modal from "../../components/common/Modal/Modal";

import DepartmentStats from "../../components/departments/DepartmentStats/DepartmentStats";
import DepartmentFilters from "../../components/departments/DepartmentFilters/DepartmentFilters";
import DepartmentTable from "../../components/departments/DepartmentTable/DepartmentTable";

import DepartmentForm from "../../components/departments/DepartmentForm/DepartmentForm";
import DepartmentDetails from "../../components/departments/DepartmentDetails/DepartmentDetails";

import "./Departments.css";

const Departments = () => {
  const {
    departments,
    setDepartments,
  } = useOrganization();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [sortBy, setSortBy] = useState("name");

  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const [selectedDepartment, setSelectedDepartment] =
    useState(null);

  const [loading, setLoading] = useState(false);

  /*
   * Only non-deleted departments are counted
   * in the dashboard statistics.
   */
  const activeDepartments = useMemo(() => {
    return departments.filter(
      (department) => !department.deletedAt,
    );
  }, [departments]);

  const stats = useMemo(() => {
    const total = activeDepartments.length;

    const active = activeDepartments.filter(
      (department) =>
        department.status === "active",
    ).length;

    const inactive = activeDepartments.filter(
      (department) =>
        department.status === "inactive",
    ).length;

    return {
      total,
      active,
      inactive,
    };
  }, [activeDepartments]);

  const filteredDepartments = useMemo(() => {
    let result = [...activeDepartments];

    /*
     * Search by:
     * - Department Code
     * - Department Name
     * - Description
     */
    if (search.trim()) {
      const searchValue =
        search.toLowerCase().trim();

      result = result.filter((department) => {
        return (
          department.departmentCode
            ?.toLowerCase()
            .includes(searchValue) ||
          department.departmentName
            ?.toLowerCase()
            .includes(searchValue) ||
          department.description
            ?.toLowerCase()
            .includes(searchValue)
        );
      });
    }

    /*
     * Status filter
     */
    if (status !== "all") {
      result = result.filter(
        (department) =>
          department.status === status,
      );
    }

    /*
     * Sorting
     */
    result.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return (
            new Date(b.createdAt) -
            new Date(a.createdAt)
          );

        case "oldest":
          return (
            new Date(a.createdAt) -
            new Date(b.createdAt)
          );

        case "name":
        default:
          return (
            a.departmentName || ""
          ).localeCompare(
            b.departmentName || "",
          );
      }
    });

    return result;
  }, [
    activeDepartments,
    search,
    status,
    sortBy,
  ]);

  const handleAddDepartment = () => {
    setSelectedDepartment(null);
    setShowForm(true);
  };

  const handleViewDepartment = (department) => {
    setSelectedDepartment(department);
    setShowDetails(true);
  };

  const handleEditDepartment = (department) => {
    setShowDetails(false);
    setSelectedDepartment(department);
    setShowForm(true);
  };

  const handleCloseDetails = () => {
    setShowDetails(false);
    setSelectedDepartment(null);
  };

  /*
   * Soft delete:
   * The record stays in state but gets deletedAt.
   * It is excluded from the normal department list.
   */
  const handleDeleteDepartment = (department) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${department.departmentName}"?`,
    );

    if (!confirmed) {
      return;
    }

    const deletedAt =
      new Date().toISOString();

    setDepartments((previous) =>
      previous.map((item) =>
        item.id === department.id
          ? {
              ...item,
              deletedAt,
            }
          : item,
      ),
    );

    if (
      selectedDepartment?.id ===
      department.id
    ) {
      setSelectedDepartment(null);
      setShowDetails(false);
    }
  };

  /*
   * Activate / Deactivate department
   */
  const handleToggleDepartmentStatus = (
    department,
  ) => {
    setDepartments((previous) =>
      previous.map((item) =>
        item.id === department.id
          ? {
              ...item,
              status:
                item.status === "active"
                  ? "inactive"
                  : "active",
              updatedAt:
                new Date().toISOString(),
            }
          : item,
      ),
    );

    /*
     * Keep the details modal in sync
     * if the same department is currently open.
     */
    setSelectedDepartment((previous) => {
      if (
        previous?.id !== department.id
      ) {
        return previous;
      }

      return {
        ...previous,
        status:
          previous.status === "active"
            ? "inactive"
            : "active",
        updatedAt:
          new Date().toISOString(),
      };
    });
  };

  /*
   * Add / Edit Department
   */
  const handleSubmitDepartment = (
    formData,
  ) => {
    setLoading(true);

    setTimeout(() => {
      const now =
        new Date().toISOString();

      if (selectedDepartment) {
        setDepartments((previous) =>
          previous.map((department) =>
            department.id ===
            selectedDepartment.id
              ? {
                  ...department,
                  ...formData,
                  updatedAt: now,
                }
              : department,
          ),
        );
      } else {
        const newDepartment = {
          id: Date.now(),

          departmentCode:
            formData.departmentCode,

          departmentName:
            formData.departmentName,

          description:
            formData.description,

          status:
            formData.status,

          createdAt: now,
          updatedAt: now,

          deletedAt: null,
        };

        setDepartments((previous) => [
          ...previous,
          newDepartment,
        ]);
      }

      setLoading(false);
      setShowForm(false);
      setSelectedDepartment(null);
    }, 500);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setSelectedDepartment(null);
  };

  return (
    <div className="departments-page">
      <div className="departments-page__header">
        <PageHeader
          title="Departments"
          description="Manage your organization's departments and structure."
        />

        <Button
          variant="primary"
          onClick={handleAddDepartment}
        >
          + Add Department
        </Button>
      </div>

      <div className="departments-page__content">
        <DepartmentStats
          total={stats.total}
          active={stats.active}
          inactive={stats.inactive}
        />

        {activeDepartments.length > 0 && (
          <DepartmentFilters
            search={search}
            onSearch={(value) =>
              setSearch(
                value?.target?.value ??
                  value ??
                  "",
              )
            }
            status={status}
            onStatusChange={setStatus}
            sortBy={sortBy}
            onSortChange={setSortBy}
          />
        )}

        {activeDepartments.length === 0 ? (
          <div className="departments-page__empty">
            <EmptyState
              title="No departments yet"
              description="Create your first department to start organizing your workforce."
              action={
                <Button
                  variant="primary"
                  onClick={handleAddDepartment}
                >
                  + Add Department
                </Button>
              }
            />
          </div>
        ) : filteredDepartments.length === 0 ? (
          <div className="departments-page__empty">
            <EmptyState
              title="No departments found"
              description="Try changing your search or status filter."
            />
          </div>
        ) : (
          <div className="departments-page__table">
            <DepartmentTable
              departments={
                filteredDepartments
              }
              onView={handleViewDepartment}
              onEdit={handleEditDepartment}
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

      {/* Department Details */}
      <Modal
        open={
          showDetails &&
          !!selectedDepartment
        }
        onClose={handleCloseDetails}
        size="medium"
      >
        <DepartmentDetails
          department={selectedDepartment}
          onClose={handleCloseDetails}
          onEdit={handleEditDepartment}
        />
      </Modal>

      {/* Add / Edit Department */}
      <Modal
        open={showForm}
        onClose={handleCancelForm}
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
          onCancel={handleCancelForm}
          loading={loading}
        />
      </Modal>
    </div>
  );
};

export default Departments;

