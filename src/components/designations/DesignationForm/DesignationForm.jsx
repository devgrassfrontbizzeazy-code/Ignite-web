
import { useEffect, useState } from "react";

import FormField from "../../common/FormField/FormField";
import Select from "../../common/Select/Select";
import Toggle from "../../common/Toggle/Toggle";
import Button from "../../common/Button/Button";

import "./DesignationForm.css";

const DesignationForm = ({
  initialData = {},
  departments = [],
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const [formData, setFormData] = useState({
    designationCode:
      initialData.designationCode || "",
    designationName:
      initialData.designationName || "",
    departmentId:
      initialData.departmentId ??
      initialData.department?.id ??
      "",
    description:
      initialData.description || "",
    status:
      initialData.status || "active",
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    setFormData({
      designationCode:
        initialData.designationCode || "",
      designationName:
        initialData.designationName || "",
      departmentId:
        initialData.departmentId ??
        initialData.department?.id ??
        "",
      description:
        initialData.description || "",
      status:
        initialData.status || "active",
    });

    setErrors({});
  }, [initialData]);

  const departmentOptions =
    departments.map((department) => ({
      label:
        department.departmentName ||
        department.name ||
        "Unnamed Department",
      value: department.id,
    }));

  const handleChange = (
    field,
    value,
  ) => {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((previous) => ({
        ...previous,
        [field]: "",
      }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.designationCode.trim()) {
      newErrors.designationCode =
        "Designation code is required.";
    }

    if (!formData.designationName.trim()) {
      newErrors.designationName =
        "Designation name is required.";
    }

    if (!formData.departmentId) {
      newErrors.departmentId =
        "Department is required.";
    }

    setErrors(newErrors);

    return (
      Object.keys(newErrors).length === 0
    );
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    const selectedDepartment =
      departments.find(
        (department) =>
          String(department.id) ===
          String(formData.departmentId),
      );

    onSubmit?.({
      ...formData,

      designationCode:
        formData.designationCode.toUpperCase(),

      designationName:
        formData.designationName.trim(),

      departmentId:
        formData.departmentId,

      departmentName:
        selectedDepartment?.departmentName ||
        selectedDepartment?.name ||
        "",
    });
  };

  const hasDepartments =
    departments.length > 0;

  return (
    <form
      className="designation-form"
      onSubmit={handleSubmit}
    >
      <div className="designation-form__fields">
        <FormField
          label="Designation Code"
          htmlFor="designation-code"
          required
          error={errors.designationCode}
          hint="Enter a unique code for this designation."
        >
          <input
            id="designation-code"
            type="text"
            value={
              formData.designationCode
            }
            onChange={(event) =>
              handleChange(
                "designationCode",
                event.target.value.toUpperCase(),
              )
            }
            placeholder="e.g. SE"
            maxLength={50}
            disabled={loading}
          />
        </FormField>

        <FormField
          label="Designation Name"
          htmlFor="designation-name"
          required
          error={errors.designationName}
        >
          <input
            id="designation-name"
            type="text"
            value={
              formData.designationName
            }
            onChange={(event) =>
              handleChange(
                "designationName",
                event.target.value,
              )
            }
            placeholder="e.g. Software Engineer"
            disabled={loading}
          />
        </FormField>

        <FormField
          label="Department"
          htmlFor="designation-department"
          required
          error={errors.departmentId}
          hint={
            !hasDepartments
              ? "Create a department first before adding a designation."
              : "Select the department this designation belongs to."
          }
        >
          <Select
            id="designation-department"
            value={
              formData.departmentId
            }
            onChange={(value) =>
              handleChange(
                "departmentId",
                value,
              )
            }
            options={departmentOptions}
            placeholder={
              hasDepartments
                ? "Select department"
                : "No departments available"
            }
            disabled={
              loading ||
              !hasDepartments
            }
          />
        </FormField>

        <FormField
          label="Description"
          htmlFor="designation-description"
          hint="Add a short description of this designation."
        >
          <textarea
            id="designation-description"
            value={
              formData.description
            }
            onChange={(event) =>
              handleChange(
                "description",
                event.target.value,
              )
            }
            placeholder="Enter designation description..."
            rows={4}
            disabled={loading}
          />
        </FormField>

        <FormField
          label="Status"
          hint="Inactive designations won't be available for new assignments."
        >
          <Toggle
            checked={
              formData.status === "active"
            }
            onChange={(checked) =>
              handleChange(
                "status",
                checked
                  ? "active"
                  : "inactive",
              )
            }
            label={
              formData.status === "active"
                ? "Active"
                : "Inactive"
            }
            disabled={loading}
          />
        </FormField>
      </div>

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
          disabled={
            loading || !hasDepartments
          }
        >
          {loading
            ? "Saving..."
            : "Save Designation"}
        </Button>
      </div>
    </form>
  );
};

export default DesignationForm;

