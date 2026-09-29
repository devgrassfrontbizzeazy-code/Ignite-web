import { useState, useEffect } from "react";
import FormField from "../../../common/FormField/FormField";
import Select from "../../../common/Select/Select";
import DatePicker from "../../../common/DatePicker/DatePicker";
import Button from "../../../common/Button/Button";
import "./FieldSalesEmployeeForm.css";

const GENDER_OPTIONS = [
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
  { value: "Other", label: "Other" },
  { value: "Prefer not to say", label: "Prefer not to say" },
];

const FIELD_SALES_ROLES = [
  { value: "Manager", label: "Manager" },
  { value: "Sales Person", label: "Sales Person" },
];

const initialFormState = {
  first_name: "",
  middle_name: "",
  last_name: "",
  date_of_birth: "",
  date_of_joining: new Date().toISOString().split("T")[0],
  gender: "",
  email: "",
  phone: "",
  address: "",
  reporting_manager_id: "",
  role: "Sales Person",
};

export default function FieldSalesEmployeeForm({
  mode = "create",
  initialData = null,
  managers = [],
  onSubmit,
  onCancel,
  submitting = false,
  serverErrors = {},
}) {
  const [form, setForm] = useState(initialFormState);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (mode === "edit" && initialData) {
      setForm({
        first_name: initialData.first_name || initialData.firstName || "",
        middle_name: initialData.middle_name || initialData.middleName || "",
        last_name: initialData.last_name || initialData.lastName || "",
        date_of_birth: initialData.date_of_birth || initialData.dateOfBirth || "",
        date_of_joining: initialData.date_of_joining || initialData.dateOfJoining || new Date().toISOString().split("T")[0],
        gender: initialData.gender || "",
        email: initialData.email || "",
        phone: initialData.phone || "",
        address: initialData.address || "",
        reporting_manager_id:
          initialData.reporting_manager_id ||
          (typeof initialData.reporting_manager === "object"
            ? initialData.reporting_manager?.id
            : initialData.reporting_manager) ||
          "",
        role:
          initialData.field_sales_role ||
          initialData.role ||
          initialData.designation_name ||
          "Sales Person",
      });
    } else {
      setForm(initialFormState);
    }
  }, [mode, initialData]);

  useEffect(() => {
    if (serverErrors && Object.keys(serverErrors).length > 0) {
      setErrors((prev) => ({ ...prev, ...serverErrors }));
    }
  }, [serverErrors]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSelectChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!form.first_name.trim()) {
      newErrors.first_name = "First name is required.";
    }

    if (!form.last_name.trim()) {
      newErrors.last_name = "Last name is required.";
    }

    if (!form.email.trim()) {
      newErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      newErrors.email = "Enter a valid email address.";
    }

    if (form.phone && !/^\d{10}$/.test(form.phone.trim())) {
      newErrors.phone = "Phone number must contain 10 digits.";
    }

    if (!form.role) {
      newErrors.role = "Role is required.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      first_name: form.first_name.trim(),
      middle_name: form.middle_name ? form.middle_name.trim() : "",
      last_name: form.last_name.trim(),
      date_of_birth: form.date_of_birth || null,
      gender: form.gender || "",
      email: form.email.trim(),
      phone: form.phone ? form.phone.trim() : "",
      address: form.address ? form.address.trim() : "",
      reporting_manager: form.reporting_manager_id
        ? Number(form.reporting_manager_id)
        : null,
      reporting_manager_id: form.reporting_manager_id
        ? Number(form.reporting_manager_id)
        : null,
      role: form.role,
      field_sales_role: form.role,
      ...(initialData?.employee_code ? { employee_code: initialData.employee_code } : {}),
      date_of_joining:
        form.date_of_joining || initialData?.date_of_joining || new Date().toISOString().split("T")[0],
      employment_type: initialData?.employment_type || "Full Time",
      employment_status: initialData?.employment_status || "Active",
    };

    onSubmit(payload);
  };

  const managerOptions = [
    { value: "", label: "No Reporting Manager" },
    ...managers.map((m) => ({
      value: String(m.id),
      label: m.full_name || m.name || `${m.first_name || ""} ${m.last_name || ""}`.trim() || `Manager #${m.id}`,
    })),
  ];

  return (
    <form className="fs-employee-form" onSubmit={handleSubmit} noValidate>
      <div className="fs-employee-form__grid">
        {/* 1. First Name */}
        <FormField label="First Name" required error={errors.first_name}>
          <input
            type="text"
            name="first_name"
            value={form.first_name}
            onChange={handleChange}
            placeholder="Enter first name"
            className="fs-employee-form__input"
            required
          />
        </FormField>

        {/* 2. Middle Name */}
        <FormField label="Middle Name" error={errors.middle_name}>
          <input
            type="text"
            name="middle_name"
            value={form.middle_name}
            onChange={handleChange}
            placeholder="Enter middle name (optional)"
            className="fs-employee-form__input"
          />
        </FormField>

        {/* 3. Last Name */}
        <FormField label="Last Name" required error={errors.last_name}>
          <input
            type="text"
            name="last_name"
            value={form.last_name}
            onChange={handleChange}
            placeholder="Enter last name"
            className="fs-employee-form__input"
            required
          />
        </FormField>

        {/* 4. Date of Birth */}
        <FormField label="Date of Birth" error={errors.date_of_birth}>
          <DatePicker
            value={form.date_of_birth}
            onChange={(val) => handleSelectChange("date_of_birth", val)}
            placeholder="Select date of birth"
          />
        </FormField>

        {/* 5. Gender */}
        <FormField label="Gender" error={errors.gender}>
          <Select
            value={form.gender}
            onChange={(val) => handleSelectChange("gender", val)}
            options={GENDER_OPTIONS}
            placeholder="Select gender"
          />
        </FormField>

        {/* 6. Email */}
        <FormField label="Email" required error={errors.email}>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="employee@company.com"
            className="fs-employee-form__input"
            required
          />
        </FormField>

        {/* 7. Phone Number */}
        <FormField label="Phone Number" error={errors.phone}>
          <input
            type="tel"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="10-digit mobile number"
            maxLength={10}
            className="fs-employee-form__input"
          />
        </FormField>

        {/* 8. Date of Joining */}
        <FormField label="Date of Joining" error={errors.date_of_joining}>
          <DatePicker
            value={form.date_of_joining}
            onChange={(val) => handleSelectChange("date_of_joining", val)}
            placeholder="Select date of joining"
          />
        </FormField>

        {/* 9. Address */}
        <FormField label="Address" error={errors.address} className="fs-employee-form__field--full">
          <textarea
            name="address"
            value={form.address}
            onChange={handleChange}
            placeholder="Enter address"
            rows={3}
            className="fs-employee-form__textarea"
          />
        </FormField>

        {/* 10. Reporting Manager */}
        <FormField label="Reporting Manager" error={errors.reporting_manager_id}>
          <Select
            value={String(form.reporting_manager_id)}
            onChange={(val) => handleSelectChange("reporting_manager_id", val)}
            options={managerOptions}
            placeholder="Select Field Sales Manager"
          />
        </FormField>

        {/* 11. Role */}
        <FormField label="Role" required error={errors.role}>
          <Select
            value={form.role}
            onChange={(val) => handleSelectChange("role", val)}
            options={FIELD_SALES_ROLES}
            placeholder="Select role"
          />
        </FormField>
      </div>

      <div className="fs-employee-form__footer">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={submitting}>
          {submitting
            ? mode === "edit"
              ? "Saving..."
              : "Creating..."
            : mode === "edit"
            ? "Save Changes"
            : "Add Employee"}
        </Button>
      </div>
    </form>
  );
}
