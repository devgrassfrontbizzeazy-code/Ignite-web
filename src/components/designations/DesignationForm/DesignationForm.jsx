import { useEffect, useMemo, useState } from "react";
import FormField from "../../common/FormField/FormField";
import Select from "../../common/Select/Select";
import Toggle from "../../common/Toggle/Toggle";
import Button from "../../common/Button/Button";
import roleService from "../../../services/roleService";
import "./DesignationForm.css";

const DesignationForm = ({
  initialData = {},
  departments = [],
  onSubmit,
  onCancel,
  loading = false,
  fieldErrors = {},
}) => {
  const [availableRoles, setAvailableRoles] = useState(() => roleService.getRoles());

  // Listen for role updates
  useEffect(() => {
    const handleRolesUpdate = () => {
      setAvailableRoles(roleService.getRoles());
    };
    window.addEventListener("ignite:roles-updated", handleRolesUpdate);
    return () => {
      window.removeEventListener("ignite:roles-updated", handleRolesUpdate);
    };
  }, []);

  const roleOptions = useMemo(() => {
    const active = availableRoles.filter((r) => !r.deletedAt && r.status === "active");
    return active.map((role) => ({
      value: String(role.id),
      label: role.roleName,
    }));
  }, [availableRoles]);

  // Derive initial default role ID
  const getInitialDefaultRoleId = () => {
    const directRole =
      initialData.defaultRole ??
      initialData.default_role ??
      initialData.default_role_id ??
      initialData.role_id;

    if (directRole) {
      if (typeof directRole === "object") return String(directRole.id);
      return String(directRole);
    }

    // Try matching by roleName
    const roleName = initialData.default_role_name || initialData.defaultRoleName;
    if (roleName) {
      const match = availableRoles.find((r) => r.roleName.toLowerCase() === roleName.toLowerCase());
      if (match) return String(match.id);
    }

    return "";
  };

  const [formData, setFormData] = useState({
    designationCode:
      initialData.designationCode || initialData.designation_code || "",
    designationName: initialData.designationName || initialData.name || "",
    departmentId: initialData.departmentId ?? initialData.department ?? "",
    defaultRole: getInitialDefaultRoleId(),
    description: initialData.description || "",
    status: initialData.status || "active",
  });

  const [localErrors, setLocalErrors] = useState({});

  useEffect(() => {
    setFormData({
      designationCode:
        initialData.designationCode || initialData.designation_code || "",
      designationName: initialData.designationName || initialData.name || "",
      departmentId: initialData.departmentId ?? initialData.department ?? "",
      defaultRole: getInitialDefaultRoleId(),
      description: initialData.description || "",
      status: initialData.status || "active",
    });
    setLocalErrors({});
  }, [initialData, availableRoles]);

  const errors = {
    ...localErrors,
    ...fieldErrors,
  };

  const departmentOptions = departments
    .filter(
      (department) => String(department.status).toLowerCase() !== "inactive",
    )
    .map((department) => ({
      value: String(department.id),
      label:
        department.departmentName ||
        department.name ||
        department.department_name ||
        "Unnamed Department",
    }))
    .filter((option) => option.value && option.label !== "Unnamed Department");

  const handleChange = (field, value) => {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }));

    if (localErrors[field]) {
      setLocalErrors((previous) => ({
        ...previous,
        [field]: "",
      }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.designationCode.trim()) {
      newErrors.designationCode = "Designation code is required.";
    }

    if (!formData.designationName.trim()) {
      newErrors.designationName = "Designation name is required.";
    }

    if (!formData.departmentId) {
      newErrors.departmentId = "Department is required.";
    }

    setLocalErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    const selectedRoleObj = availableRoles.find(
      (r) => String(r.id) === String(formData.defaultRole)
    );

    onSubmit?.({
      designationCode: formData.designationCode.trim().toUpperCase(),
      designationName: formData.designationName.trim(),
      departmentId: formData.departmentId,
      defaultRole: formData.defaultRole,
      default_role: formData.defaultRole ? Number(formData.defaultRole) || formData.defaultRole : null,
      default_role_name: selectedRoleObj?.roleName || "",
      // Preserved fields for backend compatibility
      accessProfile: "employee",
      additionalPermissions: [],
      description: formData.description.trim(),
      status: formData.status,
    });
  };

  const hasDepartments = departmentOptions.length > 0;

  return (
    <form className="designation-form" onSubmit={handleSubmit}>
      <div className="designation-form__fields">
        {/* Designation Code */}
        <FormField
          label="Designation Code"
          htmlFor="designation-code"
          required
          error={errors.designationCode}
          hint="Enter a unique uppercase code for this designation."
        >
          <input
            id="designation-code"
            type="text"
            value={formData.designationCode}
            onChange={(event) =>
              handleChange("designationCode", event.target.value.toUpperCase())
            }
            placeholder="e.g. SE, HRM, MGR"
            maxLength={50}
            disabled={loading}
          />
        </FormField>

        {/* Designation Name */}
        <FormField
          label="Designation Name"
          htmlFor="designation-name"
          required
          error={errors.designationName}
        >
          <input
            id="designation-name"
            type="text"
            value={formData.designationName}
            onChange={(event) =>
              handleChange("designationName", event.target.value)
            }
            placeholder="e.g. Senior Manager"
            maxLength={100}
            disabled={loading}
          />
        </FormField>

        {/* Department */}
        <FormField
          label="Department"
          htmlFor="designation-department"
          required
          error={errors.departmentId}
          hint={
            !hasDepartments
              ? "Create an active department first before adding a designation."
              : "Select the department this designation belongs to."
          }
        >
          <Select
            id="designation-department"
            value={formData.departmentId ? String(formData.departmentId) : ""}
            onChange={(value) => handleChange("departmentId", value)}
            options={departmentOptions}
            placeholder={
              hasDepartments ? "Select department" : "No departments available"
            }
            disabled={loading || !hasDepartments}
          />
        </FormField>

        {/* Default Role */}
        <FormField
          label="Default Role"
          htmlFor="designation-default-role"
          error={errors.defaultRole}
          hint="Employees with this designation will automatically inherit this role unless overridden."
        >
          <Select
            id="designation-default-role"
            value={formData.defaultRole ? String(formData.defaultRole) : ""}
            onChange={(value) => handleChange("defaultRole", value)}
            options={roleOptions}
            placeholder={
              roleOptions.length > 0 ? "Select default role" : "No roles available"
            }
            disabled={loading || roleOptions.length === 0}
          />
        </FormField>

        {/* Description */}
        <FormField
          label="Description"
          htmlFor="designation-description"
          hint="Add a short description of this designation."
        >
          <textarea
            id="designation-description"
            value={formData.description}
            onChange={(event) =>
              handleChange("description", event.target.value)
            }
            placeholder="Enter designation description..."
            rows={3}
            maxLength={500}
            disabled={loading}
          />
        </FormField>

        {/* Status */}
        <FormField
          label="Status"
          hint="Inactive designations won't be available for new assignments."
        >
          <Toggle
            checked={formData.status === "active"}
            onChange={(checked) =>
              handleChange("status", checked ? "active" : "inactive")
            }
            label={formData.status === "active" ? "Active" : "Inactive"}
            disabled={loading}
          />
        </FormField>
      </div>

      {/* Form Actions */}
      <div className="designation-form__footer">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>

        <Button
          type="submit"
          variant="primary"
          disabled={loading || !hasDepartments}
        >
          {loading ? "Saving..." : "Save Designation"}
        </Button>
      </div>
    </form>
  );
};

export default DesignationForm;
