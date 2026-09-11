import { useEffect, useMemo, useState } from "react";
import {
  FiAlertCircle,
  FiBriefcase,
  FiCalendar,
  FiMail,
  FiMapPin,
  FiPhone,
  FiSave,
  FiUser,
  FiUsers,
} from "react-icons/fi";

import Button from "../../common/Button/Button";
import { getDepartments } from "../../../services/api/departmentAPI";
import { getDesignations } from "../../../services/api/designationAPI";
import { getEmployeeManagers, getEmployeeOptions } from "../../../services/api/employeeAPI";

import "./EmployeeForm.css";

const initialForm = {
  employee_code: "",
  first_name: "",
  middle_name: "",
  last_name: "",
  email: "",
  phone: "",
  profile_photo: "",
  date_of_birth: "",
  gender: "",
  date_of_joining: "",

  department_id: "",
  department_name: "",

  designation_id: "",
  designation_name: "",

  reporting_manager_id: "",
  reporting_manager_name: "",

  employment_type: "Full Time",
  employment_status: "Active",

  work_location: "",
  address: "",

  emergency_contact_name: "",
  emergency_contact_phone: "",

  date_of_exit: "",
};

const extractList = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.results)) return response.results;
  if (Array.isArray(response?.data)) return response.data;
  return [];
};

const normalizeDepartment = (department) => {
  if (!department) return null;
  return {
    id: department.id ?? department.department_id ?? department.pk,
    name:
      department.name ??
      department.departmentName ??
      department.department_name ??
      "",
    isActive:
      department.is_active !== undefined
        ? department.is_active
        : String(department.status ?? "").toLowerCase() === "active",
  };
};

const normalizeDesignation = (designation) => {
  if (!designation) return null;
  return {
    id: designation.id ?? designation.designation_id ?? designation.pk,
    name:
      designation.name ??
      designation.designation_name ??
      designation.title ??
      "",
    departmentId:
      typeof designation.department === "object"
        ? designation.department?.id
        : designation.department ?? designation.department_id ?? "",
    isActive:
      designation.is_active !== undefined
        ? designation.is_active
        : String(designation.status ?? "").toLowerCase() === "active",
  };
};

const EmployeeForm = ({
  mode = "create",
  initialData = null,
  onSubmit,
  onCancel,
  submitting = false,
  serverErrors = {},
}) => {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (serverErrors && Object.keys(serverErrors).length > 0) {
      setErrors((previous) => ({
        ...previous,
        ...serverErrors,
      }));
    }
  }, [serverErrors]);
  const [photoPreview, setPhotoPreview] = useState("");
  const [photoFile, setPhotoFile] = useState(null);

  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [managers, setManagers] = useState([]);

  const [organizationLoading, setOrganizationLoading] = useState(true);
  const [organizationError, setOrganizationError] = useState("");

  /*
   * Load live departments, designations, and managers from backend.
   */
  useEffect(() => {
    const loadOrganizationData = async () => {
      try {
        setOrganizationLoading(true);
        setOrganizationError("");

        const [departmentResponse, designationResponse, managersResponse] =
          await Promise.allSettled([
            getDepartments(),
            getDesignations(),
            getEmployeeManagers(),
          ]);

        const deptList =
          departmentResponse.status === "fulfilled"
            ? extractList(departmentResponse.value)
            : [];
        const desigList =
          designationResponse.status === "fulfilled"
            ? extractList(designationResponse.value)
            : [];
        const mgrList =
          managersResponse.status === "fulfilled"
            ? extractList(managersResponse.value)
            : [];

        const normalizedDepartments = deptList
          .map(normalizeDepartment)
          .filter((d) => d && d.id);

        const normalizedDesignations = desigList
          .map(normalizeDesignation)
          .filter((des) => des && des.id);

        setDepartments(normalizedDepartments);
        setDesignations(normalizedDesignations);
        setManagers(
          mgrList.map((m) => ({
            id: m.id,
            name: m.full_name || m.fullName || `${m.first_name || ''} ${m.last_name || ''}`.trim() || m.name,
            code: m.employee_code || m.employeeCode || "",
          }))
        );
      } catch (error) {
        console.error("Failed to load organization data:", error);
        setOrganizationError("Unable to load organization dropdown options.");
      } finally {
        setOrganizationLoading(false);
      }
    };

    loadOrganizationData();
  }, []);

  /*
   * Populate edit form if provided.
   */
  useEffect(() => {
    if (mode === "edit" && initialData) {
      setForm({
        ...initialForm,
        ...initialData,
        department_id:
          initialData.department_id ||
          (typeof initialData.department === "object"
            ? initialData.department?.id
            : initialData.department) ||
          "",
        designation_id:
          initialData.designation_id ||
          (typeof initialData.designation === "object"
            ? initialData.designation?.id
            : initialData.designation) ||
          "",
        reporting_manager_id:
          initialData.reporting_manager_id ||
          (typeof initialData.reporting_manager === "object"
            ? initialData.reporting_manager?.id
            : initialData.reporting_manager) ||
          "",
      });

      setPhotoPreview(
        initialData.profile_photo_url ||
          initialData.photoUrl ||
          initialData.profile_photo ||
          ""
      );
    }
  }, [mode, initialData]);

  /*
   * Filter designations by selected department if department has mapped designations.
   */
  const filteredDesignations = useMemo(() => {
    if (!form.department_id) {
      return designations;
    }
    const filtered = designations.filter(
      (designation) =>
        !designation.departmentId ||
        String(designation.departmentId) === String(form.department_id)
    );
    return filtered.length > 0 ? filtered : designations;
  }, [designations, form.department_id]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
    setErrors((previous) => ({
      ...previous,
      [name]: "",
    }));
  };

  const handleDepartmentChange = (event) => {
    const value = event.target.value;
    const selectedDepartment = departments.find(
      (department) => String(department.id) === String(value)
    );

    setForm((previous) => ({
      ...previous,
      department_id: value,
      department_name: selectedDepartment?.name || "",
      designation_id: "",
      designation_name: "",
    }));

    setErrors((previous) => ({
      ...previous,
      department_id: "",
      designation_id: "",
    }));
  };

  const handleDesignationChange = (event) => {
    const value = event.target.value;
    const selectedDesignation = filteredDesignations.find(
      (designation) => String(designation.id) === String(value)
    );

    setForm((previous) => ({
      ...previous,
      designation_id: value,
      designation_name: selectedDesignation?.name || "",
    }));

    setErrors((previous) => ({
      ...previous,
      designation_id: "",
    }));
  };

  const handleManagerChange = (event) => {
    const value = event.target.value;
    const selectedManager = managers.find(
      (m) => String(m.id) === String(value)
    );

    setForm((previous) => ({
      ...previous,
      reporting_manager_id: value,
      reporting_manager_name: selectedManager?.name || "",
    }));
  };

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setPhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const validate = () => {
    const newErrors = {};

    if (!form.employee_code.trim()) {
      newErrors.employee_code = "Employee code is required.";
    }

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

    if (!form.date_of_joining) {
      newErrors.date_of_joining = "Date of joining is required.";
    }

    if (!form.department_id) {
      newErrors.department_id = "Department is required.";
    }

    if (!form.designation_id) {
      newErrors.designation_id = "Designation is required.";
    }

    if (!form.employment_type) {
      newErrors.employment_type = "Employment type is required.";
    }

    if (!form.employment_status) {
      newErrors.employment_status = "Employment status is required.";
    }

    if (form.phone && !/^\d{10}$/.test(form.phone.trim())) {
      newErrors.phone = "Phone number must contain 10 digits.";
    }

    if (
      form.emergency_contact_phone &&
      !/^\d{10}$/.test(form.emergency_contact_phone.trim())
    ) {
      newErrors.emergency_contact_phone = "Phone number must contain 10 digits.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    const payload = {
      employee_code: form.employee_code.trim(),
      first_name: form.first_name.trim(),
      middle_name: form.middle_name ? form.middle_name.trim() : "",
      last_name: form.last_name.trim(),
      email: form.email.trim(),
      phone: form.phone ? form.phone.trim() : "",
      gender: form.gender || "",
      date_of_birth: form.date_of_birth || null,
      date_of_joining: form.date_of_joining,
      department: form.department_id ? Number(form.department_id) : null,
      designation: form.designation_id ? Number(form.designation_id) : null,
      reporting_manager: form.reporting_manager_id
        ? Number(form.reporting_manager_id)
        : null,
      employment_type: form.employment_type || "Full Time",
      employment_status: form.employment_status || "Active",
      work_location: form.work_location ? form.work_location.trim() : "",
      address: form.address ? form.address.trim() : "",
      emergency_contact_name: form.emergency_contact_name
        ? form.emergency_contact_name.trim()
        : "",
      emergency_contact_phone: form.emergency_contact_phone
        ? form.emergency_contact_phone.trim()
        : "",
    };

    if (photoFile) {
      payload.photo = photoFile;
    }

    onSubmit(payload);
  };

  const renderError = (field) => {
    if (!errors[field]) return null;
    return (
      <span className="employee-form__error">
        <FiAlertCircle style={{ fontSize: "12px", flexShrink: 0 }} />
        {errors[field]}
      </span>
    );
  };

  return (
    <form className="employee-form" onSubmit={handleSubmit} noValidate>
      {/* PERSONAL INFORMATION */}
      <section className="employee-form__section">
        <div className="employee-form__section-heading">
          <div className="employee-form__section-icon employee-form__section-icon--teal">
            <FiUser />
          </div>
          <div>
            <h2>Personal Information</h2>
            <p>Basic personal and contact details for the employee.</p>
          </div>
        </div>

        <div className="employee-form__photo-row">
          <div className="employee-form__photo">
            {photoPreview ? (
              <img src={photoPreview} alt="Employee Preview" />
            ) : (
              <FiUser />
            )}
          </div>

          <div>
            <label className="employee-form__upload" htmlFor="profile_photo">
              {photoPreview ? "Change Photo" : "Upload Photo"}
            </label>

            <input
              id="profile_photo"
              type="file"
              accept="image/png, image/jpeg, image/jpg, image/webp"
              onChange={handlePhotoChange}
              className="employee-form__file-input"
            />

            <p className="employee-form__upload-hint">
              JPG, PNG or WEBP (Max 5MB)
            </p>
          </div>
        </div>

        <div className="employee-form__grid">
          <div className="employee-form__field">
            <label>
              Employee Code <span>*</span>
            </label>
            <input
              name="employee_code"
              value={form.employee_code}
              onChange={handleChange}
              placeholder="e.g. EMP-001"
              required
            />
            {renderError("employee_code")}
          </div>

          <div className="employee-form__field">
            <label>
              First Name <span>*</span>
            </label>
            <input
              name="first_name"
              value={form.first_name}
              onChange={handleChange}
              placeholder="Enter first name"
              required
            />
            {renderError("first_name")}
          </div>

          <div className="employee-form__field">
            <label>Middle Name</label>
            <input
              name="middle_name"
              value={form.middle_name}
              onChange={handleChange}
              placeholder="Enter middle name (optional)"
            />
          </div>

          <div className="employee-form__field">
            <label>
              Last Name <span>*</span>
            </label>
            <input
              name="last_name"
              value={form.last_name}
              onChange={handleChange}
              placeholder="Enter last name"
              required
            />
            {renderError("last_name")}
          </div>

          <div className="employee-form__field">
            <label>
              Email <span>*</span>
            </label>
            <div className="employee-form__input-icon">
              <FiMail />
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="employee@company.com"
                required
              />
            </div>
            {renderError("email")}
          </div>

          <div className="employee-form__field">
            <label>Phone Number</label>
            <div className="employee-form__input-icon">
              <FiPhone />
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="10-digit mobile number"
                maxLength={10}
              />
            </div>
            {renderError("phone")}
          </div>

          <div className="employee-form__field">
            <label>Date of Birth</label>
            <div className="employee-form__input-icon">
              <FiCalendar />
              <input
                name="date_of_birth"
                type="date"
                value={form.date_of_birth}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="employee-form__field">
            <label>Gender</label>
            <select
              name="gender"
              value={form.gender}
              onChange={handleChange}
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          </div>

          <div className="employee-form__field employee-form__field--full">
            <label>Address</label>
            <textarea
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="Enter residential or permanent address"
              rows={3}
            />
          </div>
        </div>
      </section>

      {/* EMPLOYMENT INFORMATION */}
      <section className="employee-form__section">
        <div className="employee-form__section-heading">
          <div className="employee-form__section-icon employee-form__section-icon--purple">
            <FiBriefcase />
          </div>
          <div>
            <h2>Employment Information</h2>
            <p>Department, designation, hierarchy and work arrangements.</p>
          </div>
        </div>

        <div className="employee-form__grid">
          <div className="employee-form__field">
            <label>
              Date of Joining <span>*</span>
            </label>
            <div className="employee-form__input-icon">
              <FiCalendar />
              <input
                name="date_of_joining"
                type="date"
                value={form.date_of_joining}
                onChange={handleChange}
                required
              />
            </div>
            {renderError("date_of_joining")}
          </div>

          <div className="employee-form__field">
            <label>
              Department <span>*</span>
            </label>
            <select
              value={form.department_id}
              onChange={handleDepartmentChange}
              disabled={organizationLoading}
              required
            >
              <option value="">
                {organizationLoading
                  ? "Loading departments..."
                  : "Select Department"}
              </option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
            {renderError("department_id")}
          </div>

          <div className="employee-form__field">
            <label>
              Designation <span>*</span>
            </label>
            <select
              value={form.designation_id}
              onChange={handleDesignationChange}
              disabled={organizationLoading}
              required
            >
              <option value="">
                {organizationLoading
                  ? "Loading designations..."
                  : "Select Designation"}
              </option>
              {filteredDesignations.map((designation) => (
                <option key={designation.id} value={designation.id}>
                  {designation.name}
                </option>
              ))}
            </select>
            {renderError("designation_id")}
          </div>

          <div className="employee-form__field">
            <label>Reporting Manager</label>
            <div className="employee-form__input-icon">
              <FiUsers />
              <select
                value={form.reporting_manager_id}
                onChange={handleManagerChange}
              >
                <option value="">No Reporting Manager</option>
                {managers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} {m.code ? `(${m.code})` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="employee-form__field">
            <label>
              Employment Type <span>*</span>
            </label>
            <select
              name="employment_type"
              value={form.employment_type}
              onChange={handleChange}
              required
            >
              <option value="Full Time">Full Time</option>
              <option value="Part Time">Part Time</option>
              <option value="Contract">Contract</option>
              <option value="Intern">Intern</option>
              <option value="Freelance">Freelance</option>
            </select>
            {renderError("employment_type")}
          </div>

          <div className="employee-form__field">
            <label>
              Employment Status <span>*</span>
            </label>
            <select
              name="employment_status"
              value={form.employment_status}
              onChange={handleChange}
              required
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="On Leave">On Leave</option>
              <option value="Terminated">Terminated</option>
              <option value="Probation">Probation</option>
            </select>
            {renderError("employment_status")}
          </div>

          <div className="employee-form__field">
            <label>Work Location</label>
            <div className="employee-form__input-icon">
              <FiMapPin />
              <input
                name="work_location"
                value={form.work_location}
                onChange={handleChange}
                placeholder="e.g. Remote / Headquarters / City"
              />
            </div>
          </div>
        </div>

        {organizationError && (
          <p className="employee-form__error" style={{ marginTop: "12px" }}>
            {organizationError}
          </p>
        )}
      </section>

      {/* EMERGENCY CONTACT */}
      <section className="employee-form__section">
        <div className="employee-form__section-heading">
          <div className="employee-form__section-icon employee-form__section-icon--amber">
            <FiPhone />
          </div>
          <div>
            <h2>Emergency Contact</h2>
            <p>Designated contact person for emergency situations.</p>
          </div>
        </div>

        <div className="employee-form__grid">
          <div className="employee-form__field">
            <label>Contact Person Name</label>
            <input
              name="emergency_contact_name"
              value={form.emergency_contact_name}
              onChange={handleChange}
              placeholder="Emergency contact full name"
            />
          </div>

          <div className="employee-form__field">
            <label>Contact Phone Number</label>
            <div className="employee-form__input-icon">
              <FiPhone />
              <input
                name="emergency_contact_phone"
                value={form.emergency_contact_phone}
                onChange={handleChange}
                placeholder="10-digit mobile number"
                maxLength={10}
              />
            </div>
            {renderError("emergency_contact_phone")}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <div className="employee-form__footer">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
        </Button>

        <Button type="submit" variant="primary" disabled={submitting}>
          <FiSave />
          {submitting
            ? mode === "edit"
              ? "Saving changes..."
              : "Adding employee..."
            : mode === "edit"
            ? "Save Changes"
            : "Add Employee & Send Invite"}
        </Button>
      </div>
    </form>
  );
};

export default EmployeeForm;