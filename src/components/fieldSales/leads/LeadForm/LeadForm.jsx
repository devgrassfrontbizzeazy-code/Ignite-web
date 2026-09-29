import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FiAlertCircle,
  FiBriefcase,
  FiMapPin,
  FiMail,
  FiPhone,
  FiSave,
  FiUser,
  FiUsers,
} from "react-icons/fi";

import Button from "../../../common/Button/Button";
import BackButton from "../../../common/BackButton/BackButton";

import "./LeadForm.css";

const defaultFormData = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  company_name: "",
  address: "",
  latitude: "",
  longitude: "",
  assigned_to: "",
  description: "",
};

const LeadForm = ({
  initialData = null,
  employees = [],
  submitting = false,
  error = "",
  onSubmit,
}) => {
  const navigate = useNavigate();
  const { id } = useParams();

  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState(defaultFormData);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...defaultFormData,
        ...initialData,
      });
    }
  }, [initialData]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = "First name is required.";
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = "Last name is required.";
    }

    if (!formData.company_name.trim()) {
      newErrors.company_name = "Company name is required.";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required.";
    }

    if (!formData.address.trim()) {
      newErrors.address = "Address is required.";
    }

    if (!formData.latitude) {
      newErrors.latitude = "Latitude is required.";
    }

    if (!formData.longitude) {
      newErrors.longitude = "Longitude is required.";
    }

    if (!formData.assigned_to) {
      newErrors.assigned_to = "Please assign an employee.";
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Enter a valid email address.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    if (onSubmit) {
      await onSubmit(formData);
      return;
    }

    console.log(isEditMode ? "Update Lead:" : "Create Lead:", formData);

    navigate("/field-sales/leads");
  };

  const handleCancel = () => {
    navigate("/field-sales/leads");
  };

  const getFieldClass = (fieldName) => {
    return errors[fieldName]
      ? "lead-form__field lead-form__field--error"
      : "lead-form__field";
  };

  return (
    <div className="lead-form-page">
      <div className="lead-form-page__top">
        <BackButton
          label="Back to Leads"
          onClick={() => navigate("/field-sales/leads")}
        />
      </div>
      {/* PAGE HEADER */}
      <div className="lead-form-page__heading">
        <div className="lead-form-page__icon">
          <FiUser />
        </div>

        <div>
          <h1>{isEditMode ? "Edit Lead" : "Add Lead"}</h1>
          <p>
            {isEditMode
              ? "Update lead information, assignment and location details."
              : "Create a new lead and assign it to a field sales employee."}
          </p>
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="lead-form-page__alert">
          <FiAlertCircle />
          <span>{error}</span>
        </div>
      )}

      <form className="lead-form" onSubmit={handleSubmit}>
        {/* ================================================================
            SECTION 1 — LEAD INFORMATION
        ================================================================= */}
        <section className="lead-form__section">
          <div className="lead-form__section-heading">
            <div className="lead-form__section-icon lead-form__section-icon--teal">
              <FiUser />
            </div>

            <div>
              <h2>Lead Information</h2>
              <p>Basic information about the lead and company.</p>
            </div>
          </div>

          <div className="lead-form__grid">
            <div className={getFieldClass("first_name")}>
              <label htmlFor="first_name">
                First Name <span>*</span>
              </label>

              <div className="lead-form__input-wrap">
                <FiUser />
                <input
                  id="first_name"
                  name="first_name"
                  type="text"
                  value={formData.first_name}
                  onChange={handleChange}
                  placeholder="Enter first name"
                />
              </div>

              {errors.first_name && <small>{errors.first_name}</small>}
            </div>

            <div className={getFieldClass("last_name")}>
              <label htmlFor="last_name">
                Last Name <span>*</span>
              </label>

              <div className="lead-form__input-wrap">
                <FiUser />
                <input
                  id="last_name"
                  name="last_name"
                  type="text"
                  value={formData.last_name}
                  onChange={handleChange}
                  placeholder="Enter last name"
                />
              </div>

              {errors.last_name && <small>{errors.last_name}</small>}
            </div>

            <div className={getFieldClass("email")}>
              <label htmlFor="email">Email</label>

              <div className="lead-form__input-wrap">
                <FiMail />
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter email address"
                />
              </div>

              {errors.email && <small>{errors.email}</small>}
            </div>

            <div className={getFieldClass("phone")}>
              <label htmlFor="phone">
                Phone Number <span>*</span>
              </label>

              <div className="lead-form__input-wrap">
                <FiPhone />
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                />
              </div>

              {errors.phone && <small>{errors.phone}</small>}
            </div>

            <div
              className={`${getFieldClass(
                "company_name",
              )} lead-form__field--full`}
            >
              <label htmlFor="company_name">
                Company Name <span>*</span>
              </label>

              <div className="lead-form__input-wrap">
                <FiBriefcase />
                <input
                  id="company_name"
                  name="company_name"
                  type="text"
                  value={formData.company_name}
                  onChange={handleChange}
                  placeholder="Enter company name"
                />
              </div>

              {errors.company_name && <small>{errors.company_name}</small>}
            </div>
          </div>
        </section>

        {/* ================================================================
            SECTION 2 — LEAD LOCATION
        ================================================================= */}
        <section className="lead-form__section lead-form__section--purple">
          <div className="lead-form__section-heading">
            <div className="lead-form__section-icon lead-form__section-icon--purple">
              <FiMapPin />
            </div>

            <div>
              <h2>Lead Location</h2>
              <p>
                Location used to validate field visit check-in within 100
                meters.
              </p>
            </div>
          </div>

          <div className="lead-form__grid">
            <div
              className={`${getFieldClass("address")} lead-form__field--full`}
            >
              <label htmlFor="address">
                Address <span>*</span>
              </label>

              <div className="lead-form__input-wrap lead-form__input-wrap--textarea">
                <FiMapPin />
                <textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Enter complete lead address"
                  rows={3}
                />
              </div>

              {errors.address && <small>{errors.address}</small>}
            </div>

            <div className={getFieldClass("latitude")}>
              <label htmlFor="latitude">
                Latitude <span>*</span>
              </label>

              <div className="lead-form__input-wrap">
                <FiMapPin />
                <input
                  id="latitude"
                  name="latitude"
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={handleChange}
                  placeholder="e.g. 28.4595"
                />
              </div>

              {errors.latitude && <small>{errors.latitude}</small>}
            </div>

            <div className={getFieldClass("longitude")}>
              <label htmlFor="longitude">
                Longitude <span>*</span>
              </label>

              <div className="lead-form__input-wrap">
                <FiMapPin />
                <input
                  id="longitude"
                  name="longitude"
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={handleChange}
                  placeholder="e.g. 77.0266"
                />
              </div>

              {errors.longitude && <small>{errors.longitude}</small>}
            </div>
          </div>
        </section>

        {/* ================================================================
            SECTION 3 — ASSIGNMENT & DETAILS
        ================================================================= */}
        <section className="lead-form__section lead-form__section--amber">
          <div className="lead-form__section-heading">
            <div className="lead-form__section-icon lead-form__section-icon--amber">
              <FiUsers />
            </div>

            <div>
              <h2>Assignment & Details</h2>
              <p>Assign the lead and add any useful information.</p>
            </div>
          </div>

          <div className="lead-form__grid">
            <div className={getFieldClass("assigned_to")}>
              <label htmlFor="assigned_to">
                Assigned To <span>*</span>
              </label>

              <div className="lead-form__input-wrap">
                <FiUsers />

                <select
                  id="assigned_to"
                  name="assigned_to"
                  value={formData.assigned_to}
                  onChange={handleChange}
                >
                  <option value="">Select employee</option>

                  {employees.map((employee) => {
                    const employeeId = employee.id ?? employee.user_id;

                    const employeeName =
                      employee.full_name ||
                      employee.name ||
                      `${employee.first_name || ""} ${
                        employee.last_name || ""
                      }`.trim();

                    return (
                      <option key={employeeId} value={employeeId}>
                        {employeeName || "Employee"}
                      </option>
                    );
                  })}
                </select>
              </div>

              {errors.assigned_to && <small>{errors.assigned_to}</small>}
            </div>

            <div
              className={`${getFieldClass(
                "description",
              )} lead-form__field--full`}
            >
              <label htmlFor="description">Description</label>

              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Add notes or additional information about this lead..."
                rows={4}
              />
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <div className="lead-form__footer">
          <Button
            type="button"
            variant="secondary"
            onClick={handleCancel}
            disabled={submitting}
          >
            Cancel
          </Button>

          <Button type="submit" variant="primary" disabled={submitting}>
            <FiSave />
            {submitting
              ? "Saving..."
              : isEditMode
                ? "Save Changes"
                : "Add Lead"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default LeadForm;
