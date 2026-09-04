
import { useMemo, useState } from "react";

import {
  useOrganization,
} from "../../context/OrganizationContext/OrganizationContext";

import PageHeader from "../../components/common/PageHeader/PageHeader";
import Button from "../../components/common/Button/Button";
import EmptyState from "../../components/common/EmptyState/EmptyState";
import Modal from "../../components/common/Modal/Modal";

import DesignationStats from "../../components/designations/DesignationStats/DesignationStats";
import DesignationFilters from "../../components/designations/DesignationFilters/DesignationFilters";
import DesignationTable from "../../components/designations/DesignationTable/DesignationTable";
import DesignationForm from "../../components/designations/DesignationForm/DesignationForm";
import DesignationDetails from "../../components/designations/DesignationDetails/DesignationDetails";

import "./Designations.css";

const Designations = () => {
  const { departments } = useOrganization();

  const [designations, setDesignations] =
    useState([]);

  const [search, setSearch] = useState("");
  const [department, setDepartment] =
    useState("all");
  const [status, setStatus] = useState("all");
  const [sortBy, setSortBy] = useState("name");

  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] =
    useState(false);

  const [selectedDesignation, setSelectedDesignation] =
    useState(null);

  const [loading, setLoading] = useState(false);

  /*
   * -------------------------------------------------------
   * Non-deleted designations
   * -------------------------------------------------------
   */

  const activeDesignations = useMemo(() => {
    return designations.filter(
      (designation) => !designation.deletedAt,
    );
  }, [designations]);

  /*
   * -------------------------------------------------------
   * Stats
   * -------------------------------------------------------
   */

  const stats = useMemo(() => {
    const total = activeDesignations.length;

    const active = activeDesignations.filter(
      (designation) =>
        designation.status === "active",
    ).length;

    const inactive = activeDesignations.filter(
      (designation) =>
        designation.status === "inactive",
    ).length;

    return {
      total,
      active,
      inactive,
    };
  }, [activeDesignations]);

  /*
   * -------------------------------------------------------
   * Filtering + Sorting
   * -------------------------------------------------------
   */

  const filteredDesignations = useMemo(() => {
    let result = [...activeDesignations];

    /*
     * Search by:
     * - Designation Code
     * - Designation Name
     * - Department Name
     * - Description
     */
    if (search.trim()) {
      const searchValue =
        search.toLowerCase().trim();

      result = result.filter(
        (designation) => {
          return (
            designation.designationCode
              ?.toLowerCase()
              .includes(searchValue) ||
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
        },
      );
    }

    /*
     * Department filter
     */
    if (department !== "all") {
      result = result.filter(
        (designation) =>
          String(
            designation.departmentId,
          ) === String(department),
      );
    }

    /*
     * Status filter
     */
    if (status !== "all") {
      result = result.filter(
        (designation) =>
          designation.status === status,
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
            a.designationName || ""
          ).localeCompare(
            b.designationName || "",
          );
      }
    });

    return result;
  }, [
    activeDesignations,
    search,
    department,
    status,
    sortBy,
  ]);

  /*
   * -------------------------------------------------------
   * Add
   * -------------------------------------------------------
   */

  const handleAddDesignation = () => {
    setSelectedDesignation(null);
    setShowForm(true);
  };

  /*
   * -------------------------------------------------------
   * View
   * -------------------------------------------------------
   */

  const handleViewDesignation = (
    designation,
  ) => {
    setSelectedDesignation(designation);
    setShowDetails(true);
  };

  /*
   * -------------------------------------------------------
   * Edit
   * -------------------------------------------------------
   */

  const handleEditDesignation = (
    designation,
  ) => {
    setShowDetails(false);
    setSelectedDesignation(designation);
    setShowForm(true);
  };

  /*
   * -------------------------------------------------------
   * Delete - Soft Delete
   * -------------------------------------------------------
   */

  const handleDeleteDesignation = (
    designation,
  ) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${designation.designationName}"?`,
    );

    if (!confirmed) {
      return;
    }

    const deletedAt =
      new Date().toISOString();

    setDesignations((previous) =>
      previous.map((item) =>
        item.id === designation.id
          ? {
              ...item,
              deletedAt,
              updatedAt: deletedAt,
            }
          : item,
      ),
    );

    if (
      selectedDesignation?.id ===
      designation.id
    ) {
      setSelectedDesignation(null);
      setShowDetails(false);
    }
  };

  /*
   * -------------------------------------------------------
   * Activate / Deactivate
   * -------------------------------------------------------
   */

  const handleToggleDesignationStatus = (
    designation,
  ) => {
    const updatedAt =
      new Date().toISOString();

    const nextStatus =
      designation.status === "active"
        ? "inactive"
        : "active";

    setDesignations((previous) =>
      previous.map((item) =>
        item.id === designation.id
          ? {
              ...item,
              status: nextStatus,
              updatedAt,
            }
          : item,
      ),
    );

    /*
     * Keep details modal synchronized
     * if this designation is currently open.
     */
    setSelectedDesignation((previous) => {
      if (
        previous?.id !==
        designation.id
      ) {
        return previous;
      }

      return {
        ...previous,
        status: nextStatus,
        updatedAt,
      };
    });
  };

  /*
   * -------------------------------------------------------
   * Add / Edit Submit
   * -------------------------------------------------------
   */

  const handleSubmitDesignation = (
    formData,
  ) => {
    setLoading(true);

    /*
     * Temporary mock delay.
     * Will later be replaced by API request.
     */
    setTimeout(() => {
      const now =
        new Date().toISOString();

      if (selectedDesignation) {
        /*
         * EDIT
         */
        setDesignations((previous) =>
          previous.map(
            (designation) =>
              designation.id ===
              selectedDesignation.id
                ? {
                    ...designation,
                    ...formData,
                    updatedAt: now,
                  }
                : designation,
          ),
        );
      } else {
        /*
         * CREATE
         */
        const newDesignation = {
          id: Date.now(),

          designationCode:
            formData.designationCode,

          designationName:
            formData.designationName,

          departmentId:
            formData.departmentId,

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

        setDesignations((previous) => [
          ...previous,
          newDesignation,
        ]);
      }

      setLoading(false);
      setShowForm(false);
      setSelectedDesignation(null);
    }, 500);
  };

  /*
   * -------------------------------------------------------
   * Close Details
   * -------------------------------------------------------
   */

  const handleCloseDetails = () => {
    setShowDetails(false);
    setSelectedDesignation(null);
  };

  /*
   * -------------------------------------------------------
   * Cancel Form
   * -------------------------------------------------------
   */

  const handleCancelForm = () => {
    setShowForm(false);
    setSelectedDesignation(null);
  };

  /*
   * -------------------------------------------------------
   * Render
   * -------------------------------------------------------
   */

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
        <DesignationStats
          total={stats.total}
          active={stats.active}
          inactive={stats.inactive}
        />

        {activeDesignations.length > 0 && (
          <DesignationFilters
            search={search}
            onSearch={(value) =>
              setSearch(
                value?.target?.value ??
                  value ??
                  "",
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

        {activeDesignations.length ===
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

      {/* --------------------------------------------------
          Designation Details Modal
         -------------------------------------------------- */}

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

      {/* --------------------------------------------------
          Add / Edit Designation Modal
         -------------------------------------------------- */}

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
          loading={loading}
        />
      </Modal>
    </div>
  );
};

export default Designations;

