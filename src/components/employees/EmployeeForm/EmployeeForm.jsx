import { useEffect, useMemo, useState } from "react";
import {
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

  employment_type: "FULL_TIME",
  employment_status: "ACTIVE",

  work_location: "",
  address: "",

  emergency_contact_name: "",
  emergency_contact_phone: "",

  date_of_exit: "",
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

    name:
      department.name ??
      department.departmentName ??
      department.department_name ??
      "",

    isActive:
      department.is_active ??
      String(department.status ?? "").toLowerCase() === "active",
  };
};

const normalizeDesignation = (designation) => {
  if (!designation) {
    return null;
  }

  return {
    id:
      designation.id ??
      designation.designation_id ??
      designation.pk,

    name:
      designation.name ??
      designation.designation_name ??
      designation.title ??
      "",

    departmentId:
      typeof designation.department === "object"
        ? designation.department?.id
        : (
            designation.department ??
            designation.department_id ??
            ""
          ),

    isActive:
      designation.is_active ??
      String(designation.status ?? "").toLowerCase() ===
        "active",
  };
};

const EmployeeForm = ({
  mode = "create",
  initialData = null,
  onSubmit,
  onCancel,
}) => {
  const [form, setForm] = useState(initialForm);

  const [errors, setErrors] = useState({});

  const [photoPreview, setPhotoPreview] = useState("");

  const [departments, setDepartments] = useState([]);

  const [designations, setDesignations] = useState([]);

  const [organizationLoading, setOrganizationLoading] =
    useState(true);

  const [organizationError, setOrganizationError] =
    useState("");

  /*
   * Load real departments and designations
   * from backend.
   */
  useEffect(() => {
    const loadOrganizationData = async () => {
      try {
        setOrganizationLoading(true);
        setOrganizationError("");

        const [
          departmentResponse,
          designationResponse,
        ] = await Promise.all([
          getDepartments(),
          getDesignations(),
        ]);

        const departmentList = extractList(
          departmentResponse
        );

        const designationList = extractList(
          designationResponse
        );

        const normalizedDepartments =
          departmentList
            .map(normalizeDepartment)
            .filter(
              (department) =>
                department &&
                department.id &&
                department.isActive
            );

        const normalizedDesignations =
          designationList
            .map(normalizeDesignation)
            .filter(
              (designation) =>
                designation &&
                designation.id &&
                designation.isActive
            );

        setDepartments(normalizedDepartments);
        setDesignations(normalizedDesignations);
      } catch (error) {
        console.error(
          "Failed to load organization data:",
          error
        );

        setOrganizationError(
          "Unable to load departments and designations."
        );
      } finally {
        setOrganizationLoading(false);
      }
    };

    loadOrganizationData();
  }, []);

  /*
   * Populate edit form.
   */
  useEffect(() => {
    if (mode === "edit" && initialData) {
      setForm({
        ...initialForm,
        ...initialData,
      });

      setPhotoPreview(
        initialData.profile_photo || ""
      );
    }
  }, [mode, initialData]);

  /*
   * Only show designations belonging
   * to the selected department.
   */
  const filteredDesignations = useMemo(() => {
    if (!form.department_id) {
      return [];
    }

    return designations.filter(
      (designation) =>
        String(designation.departmentId) ===
        String(form.department_id)
    );
  }, [
    designations,
    form.department_id,
  ]);

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

  /*
   * Department selection.
   *
   * Selecting a department automatically
   * clears the previous designation because
   * it may no longer belong to that department.
   */
  const handleDepartmentChange = (event) => {
    const value = event.target.value;

    const selectedDepartment =
      departments.find(
        (department) =>
          String(department.id) ===
          String(value)
      );

    setForm((previous) => ({
      ...previous,

      department_id: value,

      department_name:
        selectedDepartment?.name || "",

      designation_id: "",
      designation_name: "",
    }));

    setErrors((previous) => ({
      ...previous,
      department_id: "",
      designation_id: "",
    }));
  };

  /*
   * Designation selection.
   */
  const handleDesignationChange = (event) => {
    const value = event.target.value;

    const selectedDesignation =
      filteredDesignations.find(
        (designation) =>
          String(designation.id) ===
          String(value)
      );

    setForm((previous) => ({
      ...previous,

      designation_id: value,

      designation_name:
        selectedDesignation?.name || "",
    }));

    setErrors((previous) => ({
      ...previous,
      designation_id: "",
    }));
  };

  const handleManagerChange = (event) => {
    const value = event.target.value;

    /*
     * Temporary manager mapping.
     *
     * This can later be replaced with
     * Employee API data when reporting
     * managers are connected to backend.
     */
    const managers = {
      "emp-003": "Amit Kumar",
      "emp-004": "Neha Singh",
    };

    setForm((previous) => ({
      ...previous,
      reporting_manager_id: value,
      reporting_manager_name:
        managers[value] || "",
    }));
  };

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();

    reader.onloadend = () => {
      const result = reader.result;

      setPhotoPreview(result);

      setForm((previous) => ({
        ...previous,
        profile_photo: result,
      }));
    };

    reader.readAsDataURL(file);
  };

  const validate = () => {
    const newErrors = {};

    if (!form.employee_code.trim()) {
      newErrors.employee_code =
        "Employee code is required.";
    }

    if (!form.first_name.trim()) {
      newErrors.first_name =
        "First name is required.";
    }

    if (!form.last_name.trim()) {
      newErrors.last_name =
        "Last name is required.";
    }

    if (!form.email.trim()) {
      newErrors.email = "Email is required.";
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        form.email.trim()
      )
    ) {
      newErrors.email =
        "Enter a valid email address.";
    }

    if (!form.date_of_joining) {
      newErrors.date_of_joining =
        "Date of joining is required.";
    }

    if (!form.department_id) {
      newErrors.department_id =
        "Department is required.";
    }

    if (!form.designation_id) {
      newErrors.designation_id =
        "Designation is required.";
    }

    if (!form.employment_type) {
      newErrors.employment_type =
        "Employment type is required.";
    }

    if (!form.employment_status) {
      newErrors.employment_status =
        "Employment status is required.";
    }

    if (
      form.phone &&
      !/^\d{10}$/.test(
        form.phone.trim()
      )
    ) {
      newErrors.phone =
        "Phone number must contain 10 digits.";
    }

    if (
      form.emergency_contact_phone &&
      !/^\d{10}$/.test(
        form.emergency_contact_phone.trim()
      )
    ) {
      newErrors.emergency_contact_phone =
        "Phone number must contain 10 digits.";
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

    const cleanedData = {
      ...form,

      employee_code:
        form.employee_code.trim(),

      first_name:
        form.first_name.trim(),

      middle_name:
        form.middle_name.trim(),

      last_name:
        form.last_name.trim(),

      email:
        form.email.trim(),

      phone:
        form.phone.trim(),

      address:
        form.address.trim(),

      work_location:
        form.work_location.trim(),

      emergency_contact_name:
        form.emergency_contact_name.trim(),

      emergency_contact_phone:
        form.emergency_contact_phone.trim(),
    };

    onSubmit(cleanedData);
  };

  const renderError = (field) => {
    if (!errors[field]) {
      return null;
    }

    return (
      <span className="employee-form__error">
        {errors[field]}
      </span>
    );
  };

  return (
    <form
      className="employee-form"
      onSubmit={handleSubmit}
    >
      {/* PERSONAL INFORMATION */}

      <section className="employee-form__section">
        <div className="employee-form__section-heading">
          <div className="employee-form__section-icon employee-form__section-icon--teal">
            <FiUser />
          </div>

          <div>
            <h2>Personal Information</h2>

            <p>
              Basic information about the employee.
            </p>
          </div>
        </div>

        <div className="employee-form__photo-row">
          <div className="employee-form__photo">
            {photoPreview ? (
              <img
                src={photoPreview}
                alt="Employee"
              />
            ) : (
              <FiUser />
            )}
          </div>

          <div>
            <label
              className="employee-form__upload"
              htmlFor="profile_photo"
            >
              Upload Photo
            </label>

            <input
              id="profile_photo"
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="employee-form__file-input"
            />

            <p className="employee-form__upload-hint">
              JPG, PNG or WEBP
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
              placeholder="EMP-006"
            />

            {renderError(
              "employee_code"
            )}
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
            />

            {renderError("first_name")}
          </div>

          <div className="employee-form__field">
            <label>Middle Name</label>

            <input
              name="middle_name"
              value={form.middle_name}
              onChange={handleChange}
              placeholder="Enter middle name"
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
              />
            </div>

            {renderError("email")}
          </div>

          <div className="employee-form__field">
            <label>Phone</label>

            <div className="employee-form__input-icon">
              <FiPhone />

              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="10 digit mobile number"
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
              <option value="">
                Select Gender
              </option>

              <option value="MALE">
                Male
              </option>

              <option value="FEMALE">
                Female
              </option>

              <option value="OTHER">
                Other
              </option>
            </select>
          </div>

          <div className="employee-form__field employee-form__field--full">
            <label>Address</label>

            <textarea
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="Enter complete address"
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

            <p>
              Organization and employment details.
            </p>
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
                value={
                  form.date_of_joining
                }
                onChange={handleChange}
              />
            </div>

            {renderError(
              "date_of_joining"
            )}
          </div>

          {/* REAL DEPARTMENT API */}

          <div className="employee-form__field">
            <label>
              Department <span>*</span>
            </label>

            <select
              value={form.department_id}
              onChange={
                handleDepartmentChange
              }
              disabled={
                organizationLoading
              }
            >
              <option value="">
                {organizationLoading
                  ? "Loading departments..."
                  : "Select Department"}
              </option>

              {departments.map(
                (department) => (
                  <option
                    key={department.id}
                    value={department.id}
                  >
                    {department.name}
                  </option>
                )
              )}
            </select>

            {renderError(
              "department_id"
            )}
          </div>

          {/* RELATED DESIGNATIONS ONLY */}

          <div className="employee-form__field">
            <label>
              Designation <span>*</span>
            </label>

            <select
              value={form.designation_id}
              onChange={
                handleDesignationChange
              }
              disabled={
                organizationLoading ||
                !form.department_id
              }
            >
              <option value="">
                {organizationLoading
                  ? "Loading designations..."
                  : !form.department_id
                    ? "Select department first"
                    : filteredDesignations.length ===
                        0
                      ? "No designations available"
                      : "Select Designation"}
              </option>

              {filteredDesignations.map(
                (designation) => (
                  <option
                    key={designation.id}
                    value={designation.id}
                  >
                    {designation.name}
                  </option>
                )
              )}
            </select>

            {renderError(
              "designation_id"
            )}
          </div>

          <div className="employee-form__field">
            <label>
              Reporting Manager
            </label>

            <div className="employee-form__input-icon">
              <FiUsers />

              <select
                value={
                  form.reporting_manager_id
                }
                onChange={
                  handleManagerChange
                }
              >
                <option value="">
                  No Reporting Manager
                </option>

                <option value="emp-003">
                  Amit Kumar
                </option>

                <option value="emp-004">
                  Neha Singh
                </option>
              </select>
            </div>
          </div>

          <div className="employee-form__field">
            <label>
              Employment Type <span>*</span>
            </label>

            <select
              name="employment_type"
              value={
                form.employment_type
              }
              onChange={handleChange}
            >
              <option value="FULL_TIME">
                Full Time
              </option>

              <option value="PART_TIME">
                Part Time
              </option>

              <option value="CONTRACT">
                Contract
              </option>

              <option value="INTERN">
                Intern
              </option>
            </select>

            {renderError(
              "employment_type"
            )}
          </div>

          <div className="employee-form__field">
            <label>
              Employment Status <span>*</span>
            </label>

            <select
              name="employment_status"
              value={
                form.employment_status
              }
              onChange={handleChange}
            >
              <option value="ACTIVE">
                Active
              </option>

              <option value="INACTIVE">
                Inactive
              </option>

              <option value="TERMINATED">
                Terminated
              </option>

              <option value="RESIGNED">
                Resigned
              </option>
            </select>

            {renderError(
              "employment_status"
            )}
          </div>

          <div className="employee-form__field">
            <label>Work Location</label>

            <div className="employee-form__input-icon">
              <FiMapPin />

              <input
                name="work_location"
                value={
                  form.work_location
                }
                onChange={handleChange}
                placeholder="Gurugram"
              />
            </div>
          </div>
        </div>

        {organizationError && (
          <p className="employee-form__error">
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

            <p>
              Contact information for emergency
              situations.
            </p>
          </div>
        </div>

        <div className="employee-form__grid">
          <div className="employee-form__field">
            <label>
              Contact Name
            </label>

            <input
              name="emergency_contact_name"
              value={
                form.emergency_contact_name
              }
              onChange={handleChange}
              placeholder="Emergency contact name"
            />
          </div>

          <div className="employee-form__field">
            <label>
              Contact Phone
            </label>

            <div className="employee-form__input-icon">
              <FiPhone />

              <input
                name="emergency_contact_phone"
                value={
                  form.emergency_contact_phone
                }
                onChange={handleChange}
                placeholder="10 digit mobile number"
                maxLength={10}
              />
            </div>

            {renderError(
              "emergency_contact_phone"
            )}
          </div>
        </div>
      </section>

      {/* FOOTER */}

      <div className="employee-form__footer">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
        >
          Cancel
        </Button>

        <Button
          type="submit"
          variant="primary"
        >
          <FiSave />

          {mode === "edit"
            ? "Save Changes"
            : "Add Employee"}
        </Button>
      </div>
    </form>
  );
};

export default EmployeeForm;