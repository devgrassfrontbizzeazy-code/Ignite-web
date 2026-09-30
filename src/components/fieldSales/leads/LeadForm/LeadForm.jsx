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
  FiCalendar,
  FiClock,
} from "react-icons/fi";

import Button from "../../../common/Button/Button";
import BackButton from "../../../common/BackButton/BackButton";
import { getFieldSalesEmployees, createFieldSalesLead } from "../../../../services/api/fieldSalesAPI";
import { useNotification } from "../../../../context/NotificationContext";

import "./LeadForm.css";

const getToday = () => {
  const d = new Date();
  return d.toISOString().split("T")[0];
};

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
  priority: "High",
  visit_date: getToday(),
  visit_time: "11:00",
  visit_purpose: "Product Demo",
  instructions: "Client ko HRMS demo dena hai aur pricing discuss karni hai.",
  description: "",
};


const LeadForm = ({
  initialData = null,
  employees: propEmployees,
  submitting: propSubmitting = false,
  error: propError = "",
  onSubmit,
}) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { showNotification } = useNotification();

  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState(defaultFormData);
  const [errors, setErrors] = useState({});
  const [employeesList, setEmployeesList] = useState(() =>
    Array.isArray(propEmployees) ? propEmployees : []
  );
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...defaultFormData,
        ...initialData,
      });
    }
  }, [initialData]);

  useEffect(() => {
    if (Array.isArray(propEmployees) && propEmployees.length > 0) {
      setEmployeesList(propEmployees);
      return;
    }

    let isMounted = true;
    const loadEmployees = async () => {
      try {
        setLoadingEmployees(true);
        // Only fetch and show employees with role Sales Person
        const res = await getFieldSalesEmployees({ role: "Sales Person" });
        if (res?.data && Array.isArray(res.data) && isMounted) {
          setEmployeesList(res.data);
        }
      } catch (err) {
        console.error("Failed to load field sales employees for assignment:", err);
      } finally {
        if (isMounted) {
          setLoadingEmployees(false);
        }
      }
    };

    loadEmployees();

    return () => {
      isMounted = false;
    };
  }, []);

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

    try {
      setIsSubmitting(true);
      setApiError("");
      const payload = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        company_name: formData.company_name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        assigned_to: parseInt(formData.assigned_to, 10),
        priority: formData.priority || "High",
        visit_date: formData.visit_date || getToday(),
        visit_time: formData.visit_time || "11:00",
        visit_purpose: formData.visit_purpose || "Product Demo",
        visit_instructions: formData.instructions || "",
        notes: formData.instructions || "",
        description: formData.description.trim() || formData.instructions || "",
      };


      await createFieldSalesLead(payload);
      showNotification({
        type: "success",
        message: `Lead for ${formData.first_name} ${formData.last_name} created successfully!`,
      });
      navigate("/field-sales/leads");
    } catch (err) {
      console.error("Failed to create lead:", err);
      const errMsg =
        err.response?.data?.message ||
        (typeof err.response?.data === "object"
          ? JSON.stringify(err.response.data)
          : "Failed to create lead. Please check the fields and try again.");
      setApiError(errMsg);
      showNotification({
        type: "error",
        message: errMsg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate("/field-sales/leads");
  };

  const submitting = propSubmitting || isSubmitting;
  const error = propError || apiError;
  // Filter employees so only Sales Person role employees are selectable
  const employees = employeesList.filter((emp) => {
    const role = (emp.role || "").toLowerCase().replace(/\s+/g, "");
    return !emp.role || role === "salesperson" || role === "sales_person";
  });

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
            SECTION 3 — ASSIGNMENT & VISIT SCHEDULE
        ================================================================= */}
        <section className="lead-form__section lead-form__section--amber">
          <div className="lead-form__section-heading">
            <div className="lead-form__section-icon lead-form__section-icon--amber">
              <FiCalendar />
            </div>

            <div>
              <h2>Assignment & Visit Schedule</h2>
              <p>Assign sales person and set visit date, time, and instructions.</p>
            </div>
          </div>

          <div className="lead-form__grid">
            <div className={getFieldClass("assigned_to")}>
              <label htmlFor="assigned_to">
                Assigned To (Sales Person) <span>*</span>
              </label>

              <div className="lead-form__input-wrap">
                <FiUsers />

                <select
                  id="assigned_to"
                  name="assigned_to"
                  value={formData.assigned_to}
                  onChange={handleChange}
                >
                  <option value="">Select sales person</option>

                  {employees.map((employee) => {
                    const employeeId = employee.id ?? employee.user_id;

                    const employeeName =
                      employee.full_name ||
                      employee.name ||
                      `${employee.first_name || ""} ${employee.last_name || ""
                        }`.trim();

                    return (
                      <option key={employeeId} value={employeeId}>
                        {employeeName || "Sales Person"}
                      </option>
                    );
                  })}
                </select>
              </div>

              {errors.assigned_to && <small>{errors.assigned_to}</small>}
            </div>

            <div className={getFieldClass("priority")}>
              <label htmlFor="priority">
                Priority
              </label>

              <div className="lead-form__input-wrap">
                <FiBriefcase />
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                >
                  <option value="High">🔴 High Priority</option>
                  <option value="Medium">🟡 Medium Priority</option>
                  <option value="Low">🟢 Low Priority</option>
                </select>
              </div>
            </div>

            <div className={getFieldClass("visit_date")}>
              <label htmlFor="visit_date">
                Visit Date <span>*</span>
              </label>

              <div className="lead-form__input-wrap">
                <FiCalendar />
                <input
                  id="visit_date"
                  name="visit_date"
                  type="date"
                  value={formData.visit_date}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className={getFieldClass("visit_time")}>
              <label htmlFor="visit_time">
                Visit Time <span>*</span>
              </label>

              <div className="lead-form__input-wrap">
                <FiClock />
                <input
                  id="visit_time"
                  name="visit_time"
                  type="time"
                  value={formData.visit_time}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className={`${getFieldClass("visit_purpose")} lead-form__field--full`}>
              <label htmlFor="visit_purpose">
                Purpose / Agenda
              </label>

              <div className="lead-form__input-wrap">
                <FiBriefcase />
                <input
                  id="visit_purpose"
                  name="visit_purpose"
                  type="text"
                  value={formData.visit_purpose}
                  onChange={handleChange}
                  placeholder="e.g. Product Demo, Pricing Negotiation, Follow-up"
                />
              </div>
            </div>

            <div
              className={`${getFieldClass(
                "instructions",
              )} lead-form__field--full`}
            >
              <label htmlFor="instructions">Manager Instructions for Sales Person</label>

              <textarea
                id="instructions"
                name="instructions"
                value={formData.instructions}
                onChange={handleChange}
                placeholder="e.g. Client ko HRMS demo dena hai aur pricing discuss karni hai."
                rows={3}
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
