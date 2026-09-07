import { useEffect, useMemo, useState } from "react";

import PageHeader from "../../components/common/PageHeader/PageHeader";
import Button from "../../components/common/Button/Button";
import EmptyState from "../../components/common/EmptyState/EmptyState";
import Modal from "../../components/common/Modal/Modal";

import DesignationStats from "../../components/designations/DesignationStats/DesignationStats";
import DesignationFilters from "../../components/designations/DesignationFilters/DesignationFilters";
import DesignationTable from "../../components/designations/DesignationTable/DesignationTable";
import DesignationForm from "../../components/designations/DesignationForm/DesignationForm";
import DesignationDetails from "../../components/designations/DesignationDetails/DesignationDetails";

import {
  getDesignations,
  createDesignation,
  updateDesignation,
  patchDesignation,
  deleteDesignation,
} from "../../services/api/designationAPI";

import { getDepartments } from "../../services/api/departmentAPI";

import "./Designations.css";

const normalizeDesignation = (designation) => {
  if (!designation) {
    return null;
  }

  return {
    id:
      designation.id ??
      designation.designation_id ??
      designation.pk,

    designationName:
      designation.name ??
      designation.designation_name ??
      designation.title ??
      "",

    departmentId:
      typeof designation.department === "object"
        ? designation.department?.id
        : designation.department ??
          designation.department_id ??
          "",

    departmentName:
      designation.department_name ??
      designation.department?.name ??
      "",

    description:
      designation.description ?? "",

    status: String(
      designation.status ??
        (designation.is_active ? "Active" : "Inactive")
    ).toLowerCase(),

    isActive:
      designation.is_active ??
      String(designation.status).toLowerCase() === "active",

    company: designation.company,

    companyName: designation.company_name,

    createdAt:
      designation.created_at ??
      designation.createdAt,

    updatedAt:
      designation.updated_at ??
      designation.updatedAt,
  };
};

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
      department.departmentName ??
      department.name ??
      "",

    name:
      department.name ??
      department.departmentName ??
      "",

    description:
      department.description ?? "",

    status: String(
      department.status ??
        (department.is_active ? "Active" : "Inactive")
    ).toLowerCase(),

    isActive:
      department.is_active ??
      String(department.status).toLowerCase() === "active",

    company: department.company,

    companyName: department.company_name,

    createdAt:
      department.created_at ??
      department.createdAt,

    updatedAt:
      department.updated_at ??
      department.updatedAt,
  };
};

const Designations = () => {
  const [designations, setDesignations] = useState([]);

  const [departments, setDepartments] = useState([]);

  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("all");
  const [status, setStatus] = useState("all");
  const [sortBy, setSortBy] = useState("name");

  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const [selectedDesignation, setSelectedDesignation] =
    useState(null);

  const [loading, setLoading] = useState(false);
  const [departmentsLoading, setDepartmentsLoading] =
    useState(false);

  const [error, setError] = useState("");

  /*
   * Load Departments
   */
  const loadDepartments = async () => {
    try {
      setDepartmentsLoading(true);

      const response = await getDepartments();

      const departmentList = extractList(response);

      const normalizedDepartments = departmentList
        .map(normalizeDepartment)
        .filter(Boolean);

      setDepartments(normalizedDepartments);
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
      setDepartmentsLoading(false);
    }
  };

  /*
   * Load Designations
   */
  const loadDesignations = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getDesignations();

      const designationList = extractList(response);

      const normalizedDesignations = designationList
        .map(normalizeDesignation)
        .filter(Boolean);

      setDesignations(normalizedDesignations);
    } catch (error) {
      console.error(
        "Failed to load designations:",
        error
      );

      setError(
        error.response?.data?.detail ||
          error.response?.data?.message ||
          "Failed to load designations."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDepartments();
    loadDesignations();
  }, []);

  /*
   * Stats
   */
  const stats = useMemo(() => {
    const total = designations.length;

    const active = designations.filter(
      (designation) =>
        designation.status === "active"
    ).length;

    const inactive = designations.filter(
      (designation) =>
        designation.status === "inactive"
    ).length;

    return {
      total,
      active,
      inactive,
    };
  }, [designations]);

  /*
   * Filters + Sorting
   */
  const filteredDesignations = useMemo(() => {
    let result = [...designations];

    if (search.trim()) {
      const searchValue =
        search.toLowerCase().trim();

      result = result.filter(
        (designation) =>
          designation.designationName
            ?.toLowerCase()
            .includes(searchValue) ||
          designation.departmentName
            ?.toLowerCase()
            .includes(searchValue) ||
          designation.description
            ?.toLowerCase()
            .includes(searchValue)
      );
    }

    if (department !== "all") {
      result = result.filter(
        (designation) =>
          String(designation.departmentId) ===
          String(department)
      );
    }

    if (status !== "all") {
      result = result.filter(
        (designation) =>
          designation.status === status
      );
    }

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
            a.designationName || ""
          ).localeCompare(
            b.designationName || ""
          );
      }
    });

    return result;
  }, [
    designations,
    search,
    department,
    status,
    sortBy,
  ]);

  /*
   * Add
   */
  const handleAddDesignation = () => {
    setError("");
    setSelectedDesignation(null);
    setShowForm(true);
  };

  /*
   * View
   */
  const handleViewDesignation = (
    designation
  ) => {
    setError("");
    setSelectedDesignation(designation);
    setShowDetails(true);
  };

  /*
   * Edit
   */
  const handleEditDesignation = (
    designation
  ) => {
    setError("");
    setShowDetails(false);
    setSelectedDesignation(designation);
    setShowForm(true);
  };

  /*
   * Delete
   */
  const handleDeleteDesignation = async (
    designation
  ) => {
    if (!designation?.id) {
      setError(
        "Unable to delete designation: designation ID is missing."
      );
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete "${designation.designationName}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      await deleteDesignation(
        designation.id
      );

      setDesignations((previous) =>
        previous.filter(
          (item) =>
            item.id !== designation.id
        )
      );

      if (
        selectedDesignation?.id ===
        designation.id
      ) {
        setSelectedDesignation(null);
        setShowDetails(false);
      }
    } catch (error) {
      console.error(
        "Failed to delete designation:",
        error
      );

      setError(
        error.response?.data?.detail ||
          error.response?.data?.message ||
          "Failed to delete designation."
      );
    } finally {
      setLoading(false);
    }
  };

  /*
   * Toggle Status
   */
  const handleToggleDesignationStatus =
    async (designation) => {
      if (!designation?.id) {
        setError(
          "Unable to update designation: designation ID is missing."
        );
        return;
      }

      try {
        setLoading(true);
        setError("");

        const newStatus =
          designation.status === "active"
            ? "Inactive"
            : "Active";

        await patchDesignation(
          designation.id,
          {
            status: newStatus,
            is_active:
              newStatus === "Active",
          }
        );

        await loadDesignations();

        const updatedDesignation =
          designations.find(
            (item) =>
              item.id === designation.id
          );

        if (updatedDesignation) {
          setSelectedDesignation(
            updatedDesignation
          );
        }
      } catch (error) {
        console.error(
          "Failed to update designation status:",
          error
        );

        setError(
          error.response?.data?.detail ||
            error.response?.data?.message ||
            "Failed to update designation status."
        );
      } finally {
        setLoading(false);
      }
    };

  /*
   * Submit Add/Edit
   */
  const handleSubmitDesignation =
    async (formData) => {
      try {
        setLoading(true);
        setError("");

        const payload = {
          name:
            formData.designationName
              ?.trim() || "",

          department:
            Number(formData.departmentId),

          description:
            formData.description
              ?.trim() || "",

          status:
            formData.status === "active"
              ? "Active"
              : "Inactive",

          is_active:
            formData.status === "active",
        };

        if (selectedDesignation) {
          await updateDesignation(
            selectedDesignation.id,
            payload
          );
        } else {
          await createDesignation(
            payload
          );
        }

        await loadDesignations();

        setShowForm(false);
        setSelectedDesignation(null);
      } catch (error) {
        console.error(
          "Failed to save designation:",
          error
        );

        setError(
          error.response?.data?.detail ||
            error.response?.data?.message ||
            "Failed to save designation."
        );
      } finally {
        setLoading(false);
      }
    };

  /*
   * Close Details
   */
  const handleCloseDetails = () => {
    setShowDetails(false);
    setSelectedDesignation(null);
  };

  /*
   * Cancel Form
   */
  const handleCancelForm = () => {
    setShowForm(false);
    setSelectedDesignation(null);
    setError("");
  };

  return (
    <div className="designations-page">
      <div className="designations-page__header">
        <PageHeader
          title="Designations"
          description="Manage your organization's designations and their department assignments."
        />

        <Button
          variant="primary"
          onClick={handleAddDesignation}
        >
          + Add Designation
        </Button>
      </div>

      <div className="designations-page__content">
        {error && (
          <div
            className="designations-page__error"
            role="alert"
          >
            {error}
          </div>
        )}

        <DesignationStats
          total={stats.total}
          active={stats.active}
          inactive={stats.inactive}
        />

        {designations.length > 0 && (
          <DesignationFilters
            search={search}
            onSearch={(value) =>
              setSearch(
                value?.target?.value ??
                  value ??
                  ""
              )
            }
            department={department}
            onDepartmentChange={
              setDepartment
            }
            status={status}
            onStatusChange={setStatus}
            sortBy={sortBy}
            onSortChange={setSortBy}
            departments={departments}
          />
        )}

        {loading &&
        designations.length === 0 ? (
          <div className="designations-page__empty">
            <EmptyState
              title="Loading designations..."
              description="Please wait while we load your designations."
            />
          </div>
        ) : designations.length ===
          0 ? (
          <div className="designations-page__empty">
            <EmptyState
              title="No designations yet"
              description="Create your first designation to start defining job positions in your organization."
              action={
                <Button
                  variant="primary"
                  onClick={
                    handleAddDesignation
                  }
                >
                  + Add Designation
                </Button>
              }
            />
          </div>
        ) : filteredDesignations.length ===
          0 ? (
          <div className="designations-page__empty">
            <EmptyState
              title="No designations found"
              description="Try changing your search or filter options."
            />
          </div>
        ) : (
          <div className="designations-page__table">
            <DesignationTable
              designations={
                filteredDesignations
              }
              onView={
                handleViewDesignation
              }
              onEdit={
                handleEditDesignation
              }
              onDelete={
                handleDeleteDesignation
              }
              onToggleStatus={
                handleToggleDesignationStatus
              }
            />
          </div>
        )}
      </div>

      <Modal
        open={
          showDetails &&
          !!selectedDesignation
        }
        onClose={handleCloseDetails}
        title="Designation Details"
        size="medium"
      >
        <DesignationDetails
          designation={
            selectedDesignation
          }
          onClose={
            handleCloseDetails
          }
          onEdit={
            handleEditDesignation
          }
        />
      </Modal>

      <Modal
        open={showForm}
        onClose={handleCancelForm}
        title={
          selectedDesignation
            ? "Edit Designation"
            : "Add Designation"
        }
        description={
          selectedDesignation
            ? "Update the designation details below."
            : "Add a new designation to your organization."
        }
        size="medium"
      >
        <DesignationForm
          initialData={
            selectedDesignation || {}
          }
          departments={departments}
          onSubmit={
            handleSubmitDesignation
          }
          onCancel={
            handleCancelForm
          }
          loading={
            loading ||
            departmentsLoading
          }
        />
      </Modal>
    </div>
  );
};

export default Designations;