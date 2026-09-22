import { useEffect, useMemo, useState } from "react";

import Button from "../../components/common/Button/Button";
import IgniteLoader from "../../components/common/IgniteLoader/IgniteLoader";
import PageHeader from "../../components/common/PageHeader/PageHeader";

import DesignationDetails from "../../components/designations/DesignationDetails/DesignationDetails";
import DesignationFilters from "../../components/designations/DesignationFilters/DesignationFilters";
import DesignationForm from "../../components/designations/DesignationForm/DesignationForm";
import DesignationStats from "../../components/designations/DesignationStats/DesignationStats";
import DesignationTable from "../../components/designations/DesignationTable/DesignationTable";
import ConfirmModal from "../../components/common/ConfirmModal/ConfirmModal";
import Modal from "../../components/common/Modal/Modal";

import { getDepartments } from "../../services/api/departmentAPI";
import {
  getDesignations,
  createDesignation,
  updateDesignation,
  patchDesignation,
  deleteDesignation,
} from "../../services/api/designationAPI";

import roleService from "../../services/roleService";
import { useNotification } from "../../context/NotificationContext";

import "./Designations.css";

const extractDataList = (response) => {
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

const normalizeDepartmentOption = (dept) => {
  if (!dept) return null;

  return {
    id: dept.id ?? dept.department_id,
    name:
      dept.departmentName ??
      dept.name ??
      dept.department_name ??
      "Unnamed Department",
  };
};

const normalizeDesignation = (designation, departmentMap = {}) => {
  if (!designation) {
    return null;
  }

  const rawStatus = designation.status ?? designation.is_active;

  let normalizedStatus = "active";

  if (typeof rawStatus === "boolean") {
    normalizedStatus = rawStatus ? "active" : "inactive";
  } else if (typeof rawStatus === "string") {
    normalizedStatus =
      rawStatus.toLowerCase() === "active" || rawStatus.toLowerCase() === "true"
        ? "active"
        : "inactive";
  }

  const deptId =
    designation.departmentId ??
    designation.department ??
    designation.department_id ??
    null;

  const deptNameFromMap = deptId ? departmentMap[deptId] : null;

  const deptObj = designation.department_detail || designation.department_info;

  const deptNameFromObj = deptObj
    ? deptObj.name || deptObj.department_name
    : null;

  const finalDeptName =
    deptNameFromMap ||
    deptNameFromObj ||
    designation.departmentName ||
    designation.department_name ||
    "—";

  const defaultRole = roleService.getDesignationRole(
    designation.id ?? designation.designation_id,
  );
  const responseDefaultRole =
    designation.defaultRole ??
    designation.default_role ??
    designation.default_role_id ??
    designation.defaultRoleId;
  const responseDefaultRoleId =
    typeof responseDefaultRole === "object"
      ? responseDefaultRole?.id
      : responseDefaultRole;
  const responseDefaultRoleName =
    typeof responseDefaultRole === "object"
      ? responseDefaultRole?.roleName || responseDefaultRole?.name
      : null;

  return {
    ...designation,
    id: designation.id ?? designation.designation_id,
    designationName:
      designation.designationName ??
      designation.name ??
      designation.designation_name ??
      "Unnamed Designation",
    designationCode:
      designation.designationCode ??
      designation.code ??
      designation.designation_code ??
      "—",
    departmentId: deptId,
    departmentName: finalDeptName,

    defaultRoleId:
      responseDefaultRoleId ??
      defaultRole?.id ??
      null,

    defaultRoleName:
      designation.defaultRoleName ??
      designation.default_role_name ??
      responseDefaultRoleName ??
      defaultRole?.roleName ??
      "—",

    description: designation.description ?? "",
    status: normalizedStatus,
    createdAt:
      designation.createdAt ??
      designation.created_at ??
      new Date().toISOString(),

    employeeCount:
      designation.employeeCount ??
      designation.employee_count ??
      designation.total_employees ??
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

const Designations = () => {
  const { notify } = useNotification();
  const [designations, setDesignations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("all");
  const [status, setStatus] = useState("all");
  const [sortBy, setSortBy] = useState("name");

  const [showForm, setShowForm] = useState(false);
  const [selectedDesignation, setSelectedDesignation] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [formFieldErrors, setFormFieldErrors] = useState({});

  const [deleteModal, setDeleteModal] = useState({
    open: false,
    designation: null,
    loading: false,
  });

  const loadData = async () => {
    try {
      setLoading(true);

      const [deptRes, desigRes] = await Promise.all([
        getDepartments(),
        getDesignations(),
      ]);

      const deptList = extractDataList(deptRes)
        .map(normalizeDepartmentOption)
        .filter(Boolean);

      setDepartments(deptList);

      const deptMap = {};
      deptList.forEach((d) => {
        deptMap[d.id] = d.name;
      });

      const desigList = extractDataList(desigRes);
      const normalized = desigList
        .map((d) => normalizeDesignation(d, deptMap))
        .filter(Boolean);

      setDesignations(normalized);
    } catch (error) {
      console.error("Failed to load designations data:", error);
      const { generalError } = extractApiError(error, {
        context: "designation",
        action: "load",
      });
      notify.error(
        generalError || "Failed to load designations. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const stats = useMemo(() => {
    const total = designations.length;
    const active = designations.filter((d) => d.status === "active").length;
    const inactive = designations.filter((d) => d.status === "inactive").length;

    return { total, active, inactive };
  }, [designations]);

  const filteredDesignations = useMemo(() => {
    let result = [...designations];

    if (search.trim()) {
      const searchValue = search.toLowerCase().trim();
      result = result.filter(
        (designation) =>
          designation.designationName?.toLowerCase().includes(searchValue) ||
          designation.designationCode?.toLowerCase().includes(searchValue) ||
          designation.departmentName?.toLowerCase().includes(searchValue) ||
          designation.defaultRoleName?.toLowerCase().includes(searchValue) ||
          designation.description?.toLowerCase().includes(searchValue),
      );
    }

    if (department !== "all") {
      result = result.filter(
        (designation) =>
          String(designation.departmentId) === String(department),
      );
    }

    if (status !== "all") {
      result = result.filter((designation) => designation.status === status);
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt) - new Date(a.createdAt);
        case "oldest":
          return new Date(a.createdAt) - new Date(b.createdAt);
        case "name":
        default:
          return (a.designationName || "").localeCompare(
            b.designationName || "",
          );
      }
    });

    return result;
  }, [designations, search, department, status, sortBy]);

  const handleAddDesignation = () => {
    setFormFieldErrors({});
    setSelectedDesignation(null);
    setShowForm(true);
  };

  const handleViewDesignation = (designation) => {
    setSelectedDesignation(designation);
    setShowDetails(true);
  };

  const handleEditDesignation = (designation) => {
    setFormFieldErrors({});
    setShowDetails(false);
    setSelectedDesignation(designation);
    setShowForm(true);
  };

  const handleDeleteClick = (designation) => {
    if (!designation?.id) {
      notify.error("Unable to delete designation: designation ID is missing.");
      return;
    }

    setDeleteModal({
      open: true,
      designation,
      loading: false,
    });
  };

  const handleConfirmDelete = async () => {
    const designation = deleteModal.designation;
    if (!designation) return;

    try {
      setDeleteModal((prev) => ({ ...prev, loading: true }));

      await deleteDesignation(designation.id);
      roleService.setDesignationRole(designation.id, null);

      setDesignations((previous) =>
        previous.filter((item) => item.id !== designation.id),
      );

      if (selectedDesignation?.id === designation.id) {
        setSelectedDesignation(null);
        setShowDetails(false);
      }

      setDeleteModal({ open: false, designation: null, loading: false });
      notify.success(
        `Designation "${designation.designationName}" deleted successfully.`,
      );
    } catch (error) {
      console.error("Failed to delete designation:", error);
      const { generalError } = extractApiError(error, {
        context: "designation",
        action: "delete",
      });
      setDeleteModal((prev) => ({ ...prev, loading: false }));
      notify.error(
        generalError || "Failed to delete designation. Please try again.",
      );
    }
  };

  const handleToggleStatus = async (designation) => {
    if (!designation?.id) {
      notify.error("Unable to update designation: designation ID is missing.");
      return;
    }

    try {
      setLoading(true);

      const newStatus = designation.status === "active" ? "Inactive" : "Active";

      await patchDesignation(designation.id, {
        status: newStatus,
        is_active: newStatus === "Active",
      });

      await loadData();
      notify.success(
        `Designation "${designation.designationName}" ${newStatus === "Active" ? "activated" : "deactivated"} successfully.`,
      );
    } catch (error) {
      console.error("Failed to toggle designation status:", error);
      const { generalError } = extractApiError(error, {
        context: "designation",
        action: "toggle",
      });
      notify.error(
        generalError ||
          "Failed to update designation status. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitDesignation = async (formData) => {
    try {
      setLoading(true);
      setFormFieldErrors({});

      const isActive = String(formData.status || "active").toLowerCase() === "active";

      const payload = {
        designation_code: formData.designationCode?.trim() || "",
        designation_name: formData.designationName?.trim() || "",
        department: formData.departmentId
          ? Number(formData.departmentId)
          : null,
        description: formData.description?.trim() || "",
        status: isActive ? "Active" : "Inactive",
        is_active: isActive,
        default_role: formData.default_role ?? formData.defaultRole ?? null,
      };

      if (selectedDesignation?.id) {
        await updateDesignation(selectedDesignation.id, payload);

        roleService.setDesignationRole(
          selectedDesignation.id,
          formData.defaultRoleId || null,
        );

        notify.success("Designation updated successfully.");
      } else {
        const response = await createDesignation(payload);

        const newId =
          response?.data?.id || response?.id || response?.designation_id;

        if (newId && formData.defaultRoleId) {
          roleService.setDesignationRole(newId, formData.defaultRoleId);
        }

        notify.success("Designation created successfully.");
      }

      await loadData();
      setShowForm(false);
      setSelectedDesignation(null);
    } catch (error) {
      console.error("Failed to save designation:", error);
      const { fieldErrors, generalError } = extractApiError(error, {
        context: "designation",
        action: selectedDesignation ? "update" : "create",
      });

      setFormFieldErrors(fieldErrors);
      notify.error(generalError || "Failed to save designation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="designations-page">
      <PageHeader
        eyebrow="Organization"
        title="Designations"
        description="Manage job titles, roles, hierarchy, and department links."
        action={
          <Button variant="primary" onClick={handleAddDesignation}>
            + Add Designation
          </Button>
        }
      />

      <DesignationStats {...stats} />

      <section className="designations-page__content">
        <DesignationFilters
          search={search}
          onSearchChange={setSearch}
          department={department}
          onDepartmentChange={setDepartment}
          status={status}
          onStatusChange={setStatus}
          sortBy={sortBy}
          onSortByChange={setSortBy}
          departments={departments}
        />

        {loading ? (
          <div className="designations-page__loading">
            <IgniteLoader message="Loading designations..." />
          </div>
        ) : (
          <DesignationTable
            designations={filteredDesignations}
            onView={handleViewDesignation}
            onEdit={handleEditDesignation}
            onDelete={handleDeleteClick}
            onToggleStatus={handleToggleStatus}
          />
        )}
      </section>

      {showForm && (
        <Modal
          open={showForm}
          onClose={() => {
            setShowForm(false);
            setSelectedDesignation(null);
          }}
          title={selectedDesignation ? "Edit Designation" : "Add Designation"}
          description="Manage designation details, department, and default role."
          size="large"
        >
          <DesignationForm
            initialData={selectedDesignation || {}}
            departments={departments}
            onSubmit={handleSubmitDesignation}
            onCancel={() => {
              setShowForm(false);
              setSelectedDesignation(null);
            }}
            loading={loading}
            fieldErrors={formFieldErrors}
          />
        </Modal>
      )}

      {showDetails && selectedDesignation && (
        <Modal
          open={showDetails}
          onClose={() => {
            setShowDetails(false);
            setSelectedDesignation(null);
          }}
          title="Designation Details"
          size="large"
        >
          <DesignationDetails
            designation={selectedDesignation}
            onClose={() => {
              setShowDetails(false);
              setSelectedDesignation(null);
            }}
            onEdit={() => handleEditDesignation(selectedDesignation)}
            onDelete={() => handleDeleteClick(selectedDesignation)}
            onToggleStatus={() => handleToggleStatus(selectedDesignation)}
          />
        </Modal>
      )}

      {deleteModal.open && (
        <ConfirmModal
          open={deleteModal.open}
          onClose={() =>
            setDeleteModal({ open: false, designation: null, loading: false })
          }
          onConfirm={handleConfirmDelete}
          title="Delete Designation?"
          itemName={deleteModal.designation?.designationName}
          confirmText="Delete"
          loading={deleteModal.loading}
        />
      )}
    </main>
  );
};

export default Designations;
