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

  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [loading, setLoading] = useState(false);

  const stats = useMemo(() => {
    const total = departments.length;

    const active = departments.filter(
      (department) => department.status === "active",
    ).length;

    const inactive = departments.filter(
      (department) => department.status === "inactive",
    ).length;

    return {
      total,
      active,
      inactive,
    };
  }, [departments]);

  const filteredDepartments = useMemo(() => {
    let result = [...departments];

    if (search.trim()) {
      const searchValue = search.toLowerCase().trim();

      result = result.filter((department) => {
        return (
          department.name.toLowerCase().includes(searchValue) ||
          department.head?.toLowerCase().includes(searchValue)
        );
      });
    }

    if (status !== "all") {
      result = result.filter(
        (department) => department.status === status,
      );
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return b.id - a.id;

        case "oldest":
          return a.id - b.id;

        case "employees":
          return b.employeeCount - a.employeeCount;

        case "name":
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return result;
  }, [departments, search, status, sortBy]);

  const handleAddDepartment = () => {
    setSelectedDepartment(null);
    setShowForm(true);
  };

  const handleEditDepartment = (department) => {
    setShowDetails(false);
    setSelectedDepartment(department);
    setShowForm(true);
  };

  const handleViewDepartment = (department) => {
    setSelectedDepartment(department);
    setShowDetails(true);
  };

  const handleCloseDetails = () => {
    setShowDetails(false);
    setSelectedDepartment(null);
  };

  const handleDeleteDepartment = (department) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${department.name}"?`,
    );

    if (!confirmed) {
      return;
    }

    setDepartments((previous) =>
      previous.filter((item) => item.id !== department.id),
    );
  };

  const handleSubmitDepartment = (formData) => {
    setLoading(true);

    setTimeout(() => {
      if (selectedDepartment) {
        setDepartments((previous) =>
          previous.map((department) =>
            department.id === selectedDepartment.id
              ? {
                  ...department,
                  ...formData,
                  head: formData.head || department.head,
                }
              : department,
          ),
        );
      } else {
        const newDepartment = {
          id: Date.now(),
          name: formData.name,
          head: formData.head,
          description: formData.description,
          employeeCount: 0,
          status: formData.status,
          createdAt: new Date().toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }),
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
          description="Manage your organization's departments, department heads and workforce structure."
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

        {departments.length > 0 && (
          <DepartmentFilters
            search={search}
            onSearch={(value) =>
              setSearch(
                value?.target?.value ?? value ?? "",
              )
            }
            status={status}
            onStatusChange={setStatus}
            sortBy={sortBy}
            onSortChange={setSortBy}
          />
        )}

        {departments.length === 0 ? (
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
              departments={filteredDepartments}
              onView={handleViewDepartment}
              onEdit={handleEditDepartment}
              onDelete={handleDeleteDepartment}
            />
          </div>
        )}
      </div>

      {/* Department Details */}
      <Modal
        open={showDetails && !!selectedDepartment}
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
          initialData={selectedDepartment || {}}
          employees={[]}
          onSubmit={handleSubmitDepartment}
          onCancel={handleCancelForm}
          loading={loading}
        />
      </Modal>
    </div>
  );
};

export default Departments;