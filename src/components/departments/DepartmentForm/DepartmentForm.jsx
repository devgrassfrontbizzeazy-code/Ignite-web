
import { useState } from "react";

import FormField from "../../common/FormField/FormField";
import Toggle from "../../common/Toggle/Toggle";
import Button from "../../common/Button/Button";

import "./DepartmentForm.css";

const DepartmentForm = ({
  initialData = {},
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const [formData, setFormData] = useState({
    departmentCode: initialData.departmentCode || "",
    departmentName: initialData.departmentName || "",
    description: initialData.description || "",
    status: initialData.status || "active",
  });

  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
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

    if (!formData.departmentCode.trim()) {
      newErrors.departmentCode =
        "Department code is required.";
    }

    if (!formData.departmentName.trim()) {
      newErrors.departmentName =
        "Department name is required.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    onSubmit?.(formData);
  };

  return (
    <form className="department-form" onSubmit={handleSubmit}>
      <div className="department-form__fields">
        <FormField
          label="Department Code"
          htmlFor="department-code"
          required
          error={errors.departmentCode}
          hint="Enter a unique code for this department."
        >
          <input
            id="department-code"
            type="text"
            value={formData.departmentCode}
            onChange={(e) =>
              handleChange(
                "departmentCode",
                e.target.value.toUpperCase()
              )
            }
            placeholder="e.g. HR"
            disabled={loading}
            maxLength={50}
          />
        </FormField>

        <FormField
          label="Department Name"
          htmlFor="department-name"
          required
          error={errors.departmentName}
        >
          <input
            id="department-name"
            type="text"
            value={formData.departmentName}
            onChange={(e) =>
              handleChange(
                "departmentName",
                e.target.value
              )
            }
            placeholder="e.g. Human Resources"
            disabled={loading}
          />
        </FormField>

        <FormField
          label="Description"
          htmlFor="department-description"
          hint="Add a short description of this department."
        >
          <textarea
            id="department-description"
            value={formData.description}
            onChange={(e) =>
              handleChange(
                "description",
                e.target.value
              )
            }
            placeholder="Enter department description..."
            rows={4}
            disabled={loading}
          />
        </FormField>

        <FormField
          label="Status"
          hint="Inactive departments won't be available for new assignments."
        >
          <Toggle
            checked={formData.status === "active"}
            onChange={(checked) =>
              handleChange(
                "status",
                checked ? "active" : "inactive"
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

      <div className="department-form__footer">
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
          disabled={loading}
        >
          {loading ? "Saving..." : "Save Department"}
        </Button>
      </div>
    </form>
  );
};

export default DepartmentForm;

