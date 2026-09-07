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
    designationName:
      initialData.designationName ||
      initialData.name ||
      "",

    departmentId:
      initialData.departmentId ??
      initialData.department ??
      "",

    description:
      initialData.description || "",

    status:
      initialData.status || "active",
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    setFormData({
      designationName:
        initialData.designationName ||
        initialData.name ||
        "",

      departmentId:
        initialData.departmentId ??
        initialData.department ??
        "",

      description:
        initialData.description || "",

      status:
        initialData.status || "active",
    });

    setErrors({});
  }, [initialData]);

  const departmentOptions = departments
  .filter(
    (department) =>
      String(department.status).toLowerCase() !==
      "inactive"
  )
  .map((department) => ({
    value: String(department.id),
    label:
      department.departmentName ||
      department.name ||
      department.department_name ||
      "Unnamed Department",
  }))
  .filter(
    (option) =>
      option.value &&
      option.label !== "Unnamed Department"
  );

  const handleChange = (
    field,
    value
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

    if (
      !formData.designationName.trim()
    ) {
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

    onSubmit?.({
      designationName:
        formData.designationName.trim(),

      departmentId:
        formData.departmentId,

      description:
        formData.description.trim(),

      status:
        formData.status,
    });
  };

  const hasDepartments =
    departmentOptions.length > 0;

  return (
    <form
      className="designation-form"
      onSubmit={handleSubmit}
    >
      <div className="designation-form__fields">
        <FormField
          label="Designation Name"
          htmlFor="designation-name"
          required
          error={
            errors.designationName
          }
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
                event.target.value
              )
            }
            placeholder="e.g. Software Engineer"
            maxLength={100}
            disabled={loading}
          />
        </FormField>

        <FormField
          label="Department"
          htmlFor="designation-department"
          required
          error={
            errors.departmentId
          }
          hint={
            !hasDepartments
              ? "Create an active department first before adding a designation."
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
                value
              )
            }
            options={
              departmentOptions
            }
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
                event.target.value
              )
            }
            placeholder="Enter designation description..."
            rows={4}
            maxLength={500}
            disabled={loading}
          />
        </FormField>

        <FormField
          label="Status"
          hint="Inactive designations won't be available for new assignments."
        >
          <Toggle
            checked={
              formData.status ===
              "active"
            }
            onChange={(checked) =>
              handleChange(
                "status",
                checked
                  ? "active"
                  : "inactive"
              )
            }
            label={
              formData.status ===
              "active"
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
            loading ||
            !hasDepartments
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