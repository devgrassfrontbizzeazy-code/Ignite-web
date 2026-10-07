import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  Briefcase,
  Calendar,
  Clock,
  Compass,
  Mail,
  MapPin,
  Navigation,
  Phone,
  Save,
  ShieldAlert,
  User,
  Users,
} from "lucide-react";

import Button from "../../../common/Button/Button";
import BackButton from "../../../common/BackButton/BackButton";
import DatePicker from "../../../common/DatePicker/DatePicker";
import TimePicker from "../../../common/TimePicker/TimePicker";
import IgniteLoader from "../../../common/IgniteLoader/IgniteLoader";
import {
  getFieldSalesEmployees,
  createFieldSalesLead,
  getFieldSalesLead,
  updateFieldSalesLead,
  getFieldSalesCurrentEmployee,
  checkFieldSalesLeadDuplicate,
} from "../../../../services/api/fieldSalesAPI";
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
  const [currentUserInfo, setCurrentUserInfo] = useState(null);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [loadingLead, setLoadingLead] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");

  // Location detection state
  const [isLocating, setIsLocating] = useState(false);

  // Duplicate Lead detection state (Case 13)
  const [duplicateInfo, setDuplicateInfo] = useState(null);
  const [allowDuplicate, setAllowDuplicate] = useState(false);
  const duplicateTimeoutRef = useRef(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...defaultFormData,
        ...initialData,
      });
    }
  }, [initialData]);

  // Fetch current logged-in employee session
  useEffect(() => {
    let isMounted = true;
    const fetchCurrentSession = async () => {
      try {
        const res = await getFieldSalesCurrentEmployee();
        if (res && isMounted) {
          setCurrentUserInfo(res);
          // If user is a Sales Person and creating a new lead, pre-assign to themselves by default (Case 2)
          if (!isEditMode && res.is_sales_person && res.employee?.id) {
            setFormData((prev) => {
              if (!prev.assigned_to) {
                return { ...prev, assigned_to: String(res.employee.id) };
              }
              return prev;
            });
          }
        }
      } catch (err) {
        console.error("Failed to load current employee info:", err);
      }
    };

    fetchCurrentSession();
    return () => {
      isMounted = false;
    };
  }, [isEditMode]);

  // Fetch lead data when in edit mode
  useEffect(() => {
    if (!id || initialData) return;

    let isMounted = true;
    const fetchLeadData = async () => {
      try {
        setLoadingLead(true);
        const res = await getFieldSalesLead(id);
        const lead = res?.data || res;
        if (lead && isMounted) {
          let firstName = lead.first_name || "";
          let lastName = lead.last_name || "";
          if (!firstName && lead.contact_name) {
            const parts = lead.contact_name.trim().split(" ");
            firstName = parts[0] || "";
            lastName = parts.slice(1).join(" ") || "";
          }

          setFormData({
            first_name: firstName,
            last_name: lastName,
            email: lead.email || "",
            phone: lead.phone || "",
            company_name: lead.company_name || "",
            address: lead.address || "",
            latitude: lead.latitude != null ? String(lead.latitude) : "",
            longitude: lead.longitude != null ? String(lead.longitude) : "",
            assigned_to: lead.assigned_to ? String(lead.assigned_to) : (lead.assigned_to_details?.id ? String(lead.assigned_to_details.id) : ""),
            priority: lead.priority || "High",
            visit_date: lead.visit_date || getToday(),
            visit_time: lead.visit_time || "11:00",
            visit_purpose: lead.visit_purpose || "Product Demo",
            instructions: lead.visit_instructions || lead.instructions || lead.notes || "",
            description: lead.description || lead.notes || "",
          });
        }
      } catch (err) {
        console.error("Failed to fetch lead for editing:", err);
        showNotification({
          type: "error",
          message: "Failed to load lead details for editing.",
        });
      } finally {
        if (isMounted) {
          setLoadingLead(false);
        }
      }
    };

    fetchLeadData();

    return () => {
      isMounted = false;
    };
  }, [id, initialData]);

  // Load all company field sales employees (Managers and Sales Persons)
  useEffect(() => {
    if (Array.isArray(propEmployees) && propEmployees.length > 0) {
      setEmployeesList(propEmployees);
      return;
    }

    let isMounted = true;
    const loadEmployees = async () => {
      try {
        setLoadingEmployees(true);
        const res = await getFieldSalesEmployees();
        if (res?.data && Array.isArray(res.data) && isMounted) {
          setEmployeesList(res.data);
        }
      } catch (err) {
        console.error("Failed to load field sales employees:", err);
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
  }, [propEmployees]);

  // Debounced duplicate detection (Case 13)
  const triggerDuplicateCheck = (phoneVal, emailVal, compVal) => {
    if (isEditMode) return;
    if (duplicateTimeoutRef.current) {
      clearTimeout(duplicateTimeoutRef.current);
    }

    duplicateTimeoutRef.current = setTimeout(async () => {
      if ((phoneVal && phoneVal.trim().length >= 5) || (emailVal && emailVal.includes("@")) || (compVal && compVal.trim().length >= 4)) {
        try {
          const res = await checkFieldSalesLeadDuplicate({
            phone: phoneVal.trim(),
            email: emailVal.trim(),
            company_name: compVal.trim(),
          });
          if (res?.is_duplicate) {
            setDuplicateInfo(res);
          } else {
            setDuplicateInfo(null);
          }
        } catch (err) {
          console.error("Duplicate check failed:", err);
        }
      } else {
        setDuplicateInfo(null);
      }
    }, 600);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => {
      const next = {
        ...prev,
        [name]: value,
      };

      if (name === "phone" || name === "email" || name === "company_name") {
        triggerDuplicateCheck(
          name === "phone" ? value : next.phone,
          name === "email" ? value : next.email,
          name === "company_name" ? value : next.company_name
        );
      }

      return next;
    });

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  // "Use My Current Location" Handler
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      showNotification({
        type: "error",
        message: "Geolocation is not supported by your browser.",
      });
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        setFormData((prev) => ({
          ...prev,
          latitude: String(lat.toFixed(6)),
          longitude: String(lng.toFixed(6)),
        }));

        setErrors((prev) => ({
          ...prev,
          latitude: "",
          longitude: "",
        }));

        // Reverse-geocoding via OpenStreetMap Nominatim
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
          );
          const data = await res.json();
          if (data && data.display_name) {
            setFormData((prev) => ({
              ...prev,
              address: prev.address ? prev.address : data.display_name,
            }));
            setErrors((prev) => ({ ...prev, address: "" }));
          }
        } catch {
          // Address can still be typed manually if reverse geocode fails
        }

        showNotification({
          type: "success",
          message: `Current location detected: ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        });
        setIsLocating(false);
      },
      (err) => {
        console.error("GPS location error:", err);
        let msg = "Could not retrieve your GPS location. Please ensure location access is enabled.";
        if (err.code === 1) {
          msg = "Location permission denied. Please allow location access in your browser settings.";
        }
        showNotification({
          type: "error",
          message: msg,
        });
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
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
        assigned_to: formData.assigned_to ? parseInt(formData.assigned_to, 10) : null,
        priority: formData.priority || "High",
        visit_date: formData.visit_date || getToday(),
        visit_time: formData.visit_time || "11:00",
        visit_purpose: formData.visit_purpose || "Product Demo",
        visit_instructions: formData.instructions || "",
        notes: formData.instructions || "",
        description: formData.description.trim() || formData.instructions || "",
        allow_duplicate: allowDuplicate,
      };

      if (isEditMode) {
        await updateFieldSalesLead(id, payload);
        showNotification({
          type: "success",
          message: `Lead for ${formData.first_name} ${formData.last_name} updated successfully!`,
        });
      } else {
        await createFieldSalesLead(payload);
        showNotification({
          type: "success",
          message: `Lead for ${formData.first_name} ${formData.last_name} created successfully!`,
        });
      }
      navigate("/field-sales/leads");
    } catch (err) {
      console.error("Failed to save lead:", err);
      const errMsg =
        err.response?.data?.message ||
        (typeof err.response?.data === "object"
          ? JSON.stringify(err.response.data)
          : "Failed to save lead. Please check the fields and try again.");
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

  const currentEmpId = currentUserInfo?.employee?.id;
  const currentEmpArea = currentUserInfo?.employee?.assigned_area;
  const isSalesPerson = currentUserInfo?.is_sales_person;

  // Check if lead address matches current employee assigned area (Case 14)
  const isOutsideArea = Boolean(
    isSalesPerson &&
    currentEmpArea &&
    formData.address &&
    !formData.address.toLowerCase().includes(currentEmpArea.toLowerCase().trim())
  );

  const getFieldClass = (fieldName) => {
    return errors[fieldName]
      ? "lead-form__field lead-form__field--error"
      : "lead-form__field";
  };

  if (loadingLead) {
    return (
      <div className="lead-form-page">
        <div className="lead-form-page__top">
          <BackButton
            label="Back to Leads"
            onClick={() => navigate("/field-sales/leads")}
          />
        </div>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "300px" }}>
          <IgniteLoader message="Loading lead details..." />
        </div>
      </div>
    );
  }

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
          <User size={24} />
        </div>

        <div>
          <h1>{isEditMode ? "Edit Lead" : "Add Lead"}</h1>
          <p>
            {isEditMode
              ? "Update client details, contact information, and assignment."
              : "Create a new sales lead, assign field visit schedule, or request colleague assignment."}
          </p>
        </div>
      </div>

      {/* ERROR ALERT */}
      {error && (
        <div className="lead-form-page__alert" role="alert">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <form className="lead-form" onSubmit={handleSubmit} noValidate>
        {/* ================================================================
            SECTION 1 — CONTACT & COMPANY DETAILS
        ================================================================= */}
        <section className="lead-form__section lead-form__section--teal">
          <div className="lead-form__section-heading">
            <div className="lead-form__section-icon lead-form__section-icon--teal">
              <User size={18} />
            </div>

            <div>
              <h2>Client & Company Details</h2>
              <p>Primary contact person and commercial details.</p>
            </div>
          </div>

          <div className="lead-form__grid">
            <div className={getFieldClass("first_name")}>
              <label htmlFor="first_name">
                First Name <span>*</span>
              </label>

              <div className="lead-form__input-wrap">
                <User size={16} />
                <input
                  id="first_name"
                  name="first_name"
                  type="text"
                  value={formData.first_name}
                  onChange={handleChange}
                  placeholder="e.g. Rahul"
                />
              </div>

              {errors.first_name && <small>{errors.first_name}</small>}
            </div>

            <div className={getFieldClass("last_name")}>
              <label htmlFor="last_name">
                Last Name <span>*</span>
              </label>

              <div className="lead-form__input-wrap">
                <User size={16} />
                <input
                  id="last_name"
                  name="last_name"
                  type="text"
                  value={formData.last_name}
                  onChange={handleChange}
                  placeholder="e.g. Sharma"
                />
              </div>

              {errors.last_name && <small>{errors.last_name}</small>}
            </div>

            <div className={getFieldClass("email")}>
              <label htmlFor="email">Email Address</label>

              <div className="lead-form__input-wrap">
                <Mail size={16} />
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="rahul@company.com"
                />
              </div>

              {errors.email && <small>{errors.email}</small>}
            </div>

            <div className={getFieldClass("phone")}>
              <label htmlFor="phone">
                Phone Number <span>*</span>
              </label>

              <div className="lead-form__input-wrap">
                <Phone size={16} />
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+91 98765 43210"
                />
              </div>

              {errors.phone && <small>{errors.phone}</small>}
            </div>

            <div
              className={`${getFieldClass("company_name")} lead-form__field--full`}
            >
              <label htmlFor="company_name">
                Company / Business Name <span>*</span>
              </label>

              <div className="lead-form__input-wrap">
                <Briefcase size={16} />
                <input
                  id="company_name"
                  name="company_name"
                  type="text"
                  value={formData.company_name}
                  onChange={handleChange}
                  placeholder="Enter business or firm name"
                />
              </div>

              {errors.company_name && <small>{errors.company_name}</small>}
            </div>
          </div>

          {/* DUPLICATE WARNING ALERT (Case 13) */}
          {duplicateInfo && duplicateInfo.is_duplicate && (
            <div className="lead-form__duplicate-warning" role="alert">
              <ShieldAlert size={20} />
              <div className="lead-form__duplicate-content">
                <strong>Potential Duplicate Lead Detected</strong>
                <p>
                  A lead with matching phone, email, or company already exists:{" "}
                  {duplicateInfo.duplicates
                    .map((d) => `${d.title} [${d.lead_code}] (${d.status})`)
                    .join(", ")}
                </p>
                <label className="lead-form__duplicate-confirm">
                  <input
                    type="checkbox"
                    checked={allowDuplicate}
                    onChange={(e) => setAllowDuplicate(e.target.checked)}
                  />
                  <span>Confirm creation of duplicate lead anyway</span>
                </label>
              </div>
            </div>
          )}
        </section>

        {/* ================================================================
            SECTION 2 — LEAD LOCATION & "USE CURRENT LOCATION"
        ================================================================= */}
        <section className="lead-form__section lead-form__section--purple">
          <div className="lead-form__section-heading lead-form__section-heading--split">
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div className="lead-form__section-icon lead-form__section-icon--purple">
                <MapPin size={18} />
              </div>

              <div>
                <h2>Lead Location</h2>
                <p>
                  Location used to validate field visit check-in within allowed GPS radius.
                </p>
              </div>
            </div>

            {/* Corner Option: Use My Current Location */}
            <button
              type="button"
              className="lead-form__locate-btn"
              onClick={handleUseCurrentLocation}
              disabled={isLocating}
              title="Auto-fill device GPS coordinates and address"
            >
              <Navigation size={15} className={isLocating ? "lead-form__spin" : ""} />
              <span>{isLocating ? "Acquiring GPS..." : "Use My Current Location"}</span>
            </button>
          </div>

          {/* Territory Badge (Case 14) */}
          {currentEmpArea && (
            <div style={{ marginBottom: "14px" }}>
              <span className="lead-form__territory-badge">
                <Compass size={13} /> Your Assigned Territory: {currentEmpArea}
              </span>
            </div>
          )}

          <div className="lead-form__grid">
            <div
              className={`${getFieldClass("address")} lead-form__field--full`}
            >
              <label htmlFor="address">
                Address <span>*</span>
              </label>

              <div className="lead-form__input-wrap lead-form__input-wrap--textarea">
                <MapPin size={16} />
                <textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Enter complete client office address"
                  rows={3}
                />
              </div>

              {errors.address && <small>{errors.address}</small>}

              {isOutsideArea && (
                <span className="lead-form__field-hint lead-form__field-hint--warn">
                  ⚠️ This address appears outside your primary assigned territory ({currentEmpArea}). The lead will be submitted with an outside territory flag for Manager visibility.
                </span>
              )}
            </div>

            <div className={getFieldClass("latitude")}>
              <label htmlFor="latitude">
                Latitude <span>*</span>
              </label>

              <div className="lead-form__input-wrap">
                <MapPin size={16} />
                <input
                  id="latitude"
                  name="latitude"
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={handleChange}
                  placeholder="e.g. 28.459500"
                />
              </div>

              {errors.latitude && <small>{errors.latitude}</small>}
            </div>

            <div className={getFieldClass("longitude")}>
              <label htmlFor="longitude">
                Longitude <span>*</span>
              </label>

              <div className="lead-form__input-wrap">
                <MapPin size={16} />
                <input
                  id="longitude"
                  name="longitude"
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={handleChange}
                  placeholder="e.g. 77.026600"
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
              <Calendar size={18} />
            </div>

            <div>
              <h2>Assignment & Visit Schedule</h2>
              <p>Assign sales person or submit unassigned / for manager approval.</p>
            </div>
          </div>

          <div className="lead-form__grid">
            <div className={getFieldClass("assigned_to")}>
              <label htmlFor="assigned_to">
                Assignee / Sales Person
              </label>

              <div className="lead-form__input-wrap">
                <Users size={16} />

                <select
                  id="assigned_to"
                  name="assigned_to"
                  value={formData.assigned_to}
                  onChange={handleChange}
                >
                  <option value="">
                    -- Leave Unassigned (Manager will assign) --
                  </option>

                  {employeesList.map((employee) => {
                    const employeeId = employee.id ?? employee.user_id;
                    const employeeName =
                      employee.full_name ||
                      employee.name ||
                      `${employee.first_name || ""} ${employee.last_name || ""}`.trim();

                    const isMe = currentEmpId && String(employeeId) === String(currentEmpId);
                    const isManager = employee.role === "Manager";

                    let labelSuffix = "";
                    if (isMe) {
                      labelSuffix = " (Myself - Direct Assignment)";
                    } else if (isManager) {
                      labelSuffix = " [Manager]";
                    } else if (isSalesPerson) {
                      labelSuffix = " (Colleague - Pending Manager Approval)";
                    }

                    return (
                      <option key={employeeId} value={employeeId}>
                        {employeeName} {labelSuffix}
                      </option>
                    );
                  })}
                </select>
              </div>

              {errors.assigned_to && <small>{errors.assigned_to}</small>}

              <span className="lead-form__field-hint">
                {!formData.assigned_to
                  ? "Lead will be saved as Unassigned. Manager can assign it to any sales representative."
                  : isSalesPerson && String(formData.assigned_to) === String(currentEmpId)
                    ? "Case 2: Lead will be assigned to you directly and scheduled into your visit calendar."
                    : isSalesPerson && employeesList.find((e) => String(e.id) === String(formData.assigned_to))?.role === "Manager"
                      ? "Case 5: Lead will be assigned to Manager/Supervisor for guidance or delegation."
                      : isSalesPerson
                        ? "Case 4: Assignment request will be submitted for Manager approval before final assignment."
                        : "Case 1: Lead will be assigned to the selected sales representative."}
              </span>
            </div>

            <div className={getFieldClass("priority")}>
              <label htmlFor="priority">Priority</label>

              <div className="lead-form__input-wrap">
                <Briefcase size={16} />
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                >
                  <option value="High">High Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="Low">Low Priority</option>
                </select>
              </div>
            </div>

            <div className={getFieldClass("visit_date")}>
              <label htmlFor="visit_date">
                Visit Date <span>*</span>
              </label>

              <DatePicker
                value={formData.visit_date}
                onChange={(dateStr) => {
                  setFormData((prev) => ({ ...prev, visit_date: dateStr }));
                  setErrors((prev) => ({ ...prev, visit_date: "" }));
                }}
                placeholder="Select visit date"
              />
            </div>

            <div className={getFieldClass("visit_time")}>
              <label htmlFor="visit_time">
                Visit Time <span>*</span>
              </label>

              <TimePicker
                value={formData.visit_time}
                onChange={(timeStr) => {
                  setFormData((prev) => ({ ...prev, visit_time: timeStr }));
                  setErrors((prev) => ({ ...prev, visit_time: "" }));
                }}
                placeholder="Select visit time"
              />
            </div>

            <div
              className={`${getFieldClass("visit_purpose")} lead-form__field--full`}
            >
              <label htmlFor="visit_purpose">Visit Purpose</label>

              <div className="lead-form__input-wrap">
                <Briefcase size={16} />
                <input
                  id="visit_purpose"
                  name="visit_purpose"
                  type="text"
                  value={formData.visit_purpose}
                  onChange={handleChange}
                  placeholder="e.g. Product Demo & Pricing Discussion"
                />
              </div>
            </div>

            <div
              className={`${getFieldClass("instructions")} lead-form__field--full`}
            >
              <label htmlFor="instructions">Visit Instructions & Notes</label>

              <div className="lead-form__input-wrap lead-form__input-wrap--textarea">
                <Briefcase size={16} />
                <textarea
                  id="instructions"
                  name="instructions"
                  value={formData.instructions}
                  onChange={handleChange}
                  placeholder="Specific client instructions, products of interest, or negotiation pointers"
                  rows={2}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================
            FORM ACTIONS
        ================================================================= */}
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
            <Save size={16} />
            {submitting
              ? isEditMode
                ? "Updating..."
                : "Saving..."
              : isEditMode
                ? "Update Lead"
                : "Create Lead"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default LeadForm;
