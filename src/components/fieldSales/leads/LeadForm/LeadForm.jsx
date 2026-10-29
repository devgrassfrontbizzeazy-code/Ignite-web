import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  Briefcase,
  Calendar,
  Check,
  ChevronDown,
  Clock,
  Compass,
  Globe,
  Mail,
  MapPin,
  Navigation,
  Phone,
  Save,
  Search,
  ShieldAlert,
  User,
  Users,
  X,
} from "lucide-react";
import {
  INDIAN_STATES,
  STATE_CITIES,
  getSectorsForCity,
  searchGooglePlaces,
  getGooglePlaceDetails,
  reverseGeocodeGoogle,
  forwardGeocodeGoogle,
} from "../../../../utils/locationData";

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
  pingFieldSalesLocation,
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
  house_number: "",
  street: "",
  sector: "",
  city: "Gurugram",
  state: "Haryana",
  country: "India",
  pincode: "",
  address: "",
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

  // Location detection state & Google Places
  const [isLocating, setIsLocating] = useState(false);
  const [addressSearch, setAddressSearch] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);
  const [showSectorPicker, setShowSectorPicker] = useState(false);
  const [sectorFilter, setSectorFilter] = useState("");

  const googleApiKey =
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
    "AIzaSyDzLPU1X8UqB7F_3jyZmGg-9o1VnWEWBv8";

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
            house_number: lead.house_number || "",
            street: lead.street || "",
            sector: lead.sector || "",
            city: lead.city || "Gurugram",
            state: lead.state || "Haryana",
            country: lead.country || "India",
            pincode: lead.pincode || "",
            address: lead.address || "",
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

  const getFullAddress = (data = formData) => {
    const parts = [
      data.house_number?.trim(),
      data.street?.trim(),
      data.sector?.trim(),
      data.city?.trim(),
      data.state?.trim(),
      data.country?.trim() && data.pincode?.trim()
        ? `${data.country.trim()} - ${data.pincode.trim()}`
        : data.country?.trim() || data.pincode?.trim(),
    ].filter(Boolean);
    return parts.join(", ");
  };

  const availableSectors = getSectorsForCity(formData.city);
  const filteredSectors = sectorFilter.trim()
    ? availableSectors.filter((s) =>
        s.toLowerCase().includes(sectorFilter.trim().toLowerCase())
      )
    : availableSectors;

  const availableCities = STATE_CITIES[formData.state] || [
    "Gurugram",
    "Faridabad",
    "Noida",
    "Greater Noida",
    "Delhi",
    "Chandigarh",
  ];

  // "Use My Current Location" Handler (Google Reverse Geocoding)
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      showNotification({
        type: "error",
        message: "Geolocation is not supported by your browser. Please enter location manually.",
      });
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const accuracy = Math.round(position.coords.accuracy || 10);

        try {
          const geo = await reverseGeocodeGoogle(lat, lng, googleApiKey);
          if (geo) {
            setFormData((prev) => ({
              ...prev,
              house_number: geo.houseNumber || prev.house_number,
              street: geo.street || prev.street,
              sector: geo.sector || prev.sector,
              city: geo.city || prev.city,
              state: geo.state || prev.state,
              country: geo.country || prev.country,
              pincode: geo.pincode || prev.pincode,
              address: geo.formattedAddress || prev.address,
            }));
            setAddressSearch(geo.formattedAddress || "");
            setErrors((prev) => ({
              ...prev,
              city: "",
              state: "",
              sector: "",
              pincode: "",
              address: "",
            }));
          }
        } catch (err) {
          console.error("Reverse geocode error:", err);
        }

        if (currentUserInfo?.is_sales_person) {
          pingFieldSalesLocation({ latitude: lat, longitude: lng, accuracy }).catch(() => {});
        }

        showNotification({
          type: "success",
          message: `Location detected via Google Maps (±${accuracy}m)`,
        });
        setIsLocating(false);
      },
      (err) => {
        console.error("GPS location error:", err);
        showNotification({
          type: "error",
          message: "Could not retrieve GPS location. Please enter address manually.",
        });
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  // Google Places Search
  const handleAddressSearchChange = async (e) => {
    const val = e.target.value;
    setAddressSearch(val);
    if (!val || val.trim().length < 2) {
      setSearchSuggestions([]);
      return;
    }
    setIsSearchingPlaces(true);
    const results = await searchGooglePlaces(val, googleApiKey);
    setSearchSuggestions(results);
    setIsSearchingPlaces(false);
  };

  const handleSelectPlace = async (item) => {
    setAddressSearch(item.fullText || item.primaryText);
    setSearchSuggestions([]);
    const details = await getGooglePlaceDetails(item.placeId, googleApiKey);
    if (details) {
      setFormData((prev) => ({
        ...prev,
        house_number: details.houseNumber || prev.house_number,
        street: details.street || prev.street,
        sector: details.sector || prev.sector,
        city: details.city || prev.city,
        state: details.state || prev.state,
        country: details.country || prev.country,
        pincode: details.pincode || prev.pincode,
        address: details.formattedAddress || prev.address,
      }));
      setErrors((prev) => ({
        ...prev,
        city: "",
        state: "",
        sector: "",
        pincode: "",
        address: "",
      }));
    }
  };

  const autoDetectPincode = async (sectorName, cityName, stateName) => {
    if (formData.pincode && formData.pincode.trim().length === 6) return;
    const targetSector = sectorName || formData.sector;
    const targetCity = cityName || formData.city;
    const targetState = stateName || formData.state;
    if (!targetSector && !targetCity) return;

    try {
      const query = [targetSector, targetCity, targetState, "India"]
        .filter(Boolean)
        .join(", ");
      const geo = await forwardGeocodeGoogle(query, googleApiKey);
      if (geo?.pincode) {
        setFormData((prev) => {
          if (prev.pincode && prev.pincode.trim().length === 6) return prev;
          return {
            ...prev,
            pincode: geo.pincode,
          };
        });
        setErrors((prev) => ({ ...prev, pincode: "" }));
      }
    } catch (e) {
      console.warn("Auto detect pincode error:", e);
    }
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

    if (!formData.city.trim()) {
      newErrors.city = "City is required.";
    }

    if (!formData.state.trim()) {
      newErrors.state = "State is required.";
    }

    if (!formData.sector.trim()) {
      newErrors.sector = "Sector / Area is required.";
    }

    if (!formData.pincode.trim()) {
      newErrors.pincode = "Pincode is required.";
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

      const formatTimeTo24Hour = (timeStr) => {
        if (!timeStr) return "11:00";
        const str = String(timeStr).trim();
        const match = str.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
        if (!match) return str;
        let [_, hours, minutes, modifier] = match;
        let h = parseInt(hours, 10);
        if (modifier) {
          const mod = modifier.toUpperCase();
          if (mod === "PM" && h < 12) h += 12;
          if (mod === "AM" && h === 12) h = 0;
        }
        return `${String(h).padStart(2, "0")}:${minutes}`;
      };

      const fullAddress = getFullAddress(formData) || formData.address.trim();

      const payload = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        company_name: formData.company_name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),

        address: fullAddress,
        house_number: formData.house_number?.trim() || "",
        street: formData.street?.trim() || "",
        sector: formData.sector?.trim() || "",
        city: formData.city?.trim() || "",
        state: formData.state?.trim() || "",
        country: formData.country?.trim() || "India",
        pincode: formData.pincode?.trim() || "",

        assigned_to: formData.assigned_to ? parseInt(formData.assigned_to, 10) : null,
        priority: formData.priority || "High",
        visit_date: formData.visit_date || getToday(),
        visit_time: formatTimeTo24Hour(formData.visit_time),
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
            SECTION 2 — LEAD LOCATION & GOOGLE MAPS ADDRESS
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
                  Enter client address and territory details.
                </p>
              </div>
            </div>

            {/* Corner Option: Use My Current Location */}
            <button
              type="button"
              className="lead-form__locate-btn"
              onClick={handleUseCurrentLocation}
              disabled={isLocating}
              title="Auto-fill address via device location"
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
            {/* Google Places Search Box */}
            <div className="lead-form__search-wrap">
              <label htmlFor="address_search">
                Search Address with Google Maps
              </label>
              <div className="lead-form__search-input-wrap">
                <Search size={16} />
                <input
                  id="address_search"
                  type="text"
                  value={addressSearch}
                  onChange={handleAddressSearchChange}
                  placeholder="Type building, landmark or area (Google Maps Autocomplete)..."
                />
                {addressSearch && (
                  <button
                    type="button"
                    className="lead-form__search-clear"
                    onClick={() => {
                      setAddressSearch("");
                      setSearchSuggestions([]);
                    }}
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              {/* Suggestions */}
              {searchSuggestions.length > 0 && (
                <div className="lead-form__search-suggestions">
                  {searchSuggestions.map((item, idx) => (
                    <div
                      key={item.placeId || idx}
                      className="lead-form__search-item"
                      onClick={() => handleSelectPlace(item)}
                    >
                      <MapPin size={16} />
                      <div>
                        <div className="lead-form__search-primary">{item.primaryText}</div>
                        {item.secondaryText && (
                          <div className="lead-form__search-secondary">
                            {item.secondaryText}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Country */}
            <div className={getFieldClass("country")}>
              <label htmlFor="country">
                Country <span>*</span>
              </label>
              <div className="lead-form__input-wrap">
                <Globe size={16} />
                <input
                  id="country"
                  name="country"
                  type="text"
                  value={formData.country}
                  onChange={handleChange}
                  placeholder="India"
                />
              </div>
              {errors.country && <small>{errors.country}</small>}
            </div>

            {/* State */}
            <div className={getFieldClass("state")}>
              <label htmlFor="state">
                State <span>*</span>
              </label>
              <div className="lead-form__input-wrap">
                <Compass size={16} />
                <select
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={(e) => {
                    const st = e.target.value;
                    const cities = STATE_CITIES[st] || [];
                    setFormData((prev) => ({
                      ...prev,
                      state: st,
                      city: cities[0] || prev.city,
                    }));
                  }}
                >
                  {INDIAN_STATES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
              {errors.state && <small>{errors.state}</small>}
            </div>

            {/* City */}
            <div className={getFieldClass("city")}>
              <label htmlFor="city">
                City <span>*</span>
              </label>
              <div className="lead-form__input-wrap">
                <MapPin size={16} />
                <input
                  id="city"
                  name="city"
                  type="text"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="e.g. Gurugram, Noida, Delhi"
                  list="city-suggestions"
                />
                <datalist id="city-suggestions">
                  {availableCities.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
              {errors.city && <small>{errors.city}</small>}
            </div>

            {/* Sector / Area / Locality */}
            <div className={getFieldClass("sector")}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <label htmlFor="sector" style={{ margin: 0 }}>
                  Sector / Area / Locality <span>*</span>
                </label>
                {availableSectors.length > 0 && (
                  <button
                    type="button"
                    className="lead-form__toggle-btn"
                    onClick={() => setShowSectorPicker(!showSectorPicker)}
                  >
                    {showSectorPicker
                      ? "Hide Sectors"
                      : `View ${availableSectors.length} Sectors in ${formData.city}`}
                  </button>
                )}
              </div>
              <div className="lead-form__input-wrap">
                <MapPin size={16} />
                <input
                  id="sector"
                  name="sector"
                  type="text"
                  value={formData.sector}
                  onChange={handleChange}
                  onBlur={() => autoDetectPincode()}
                  placeholder="e.g. Sector 57, DLF Cyber City, Sector 24"
                />
              </div>
              {errors.sector && <small>{errors.sector}</small>}
            </div>

            {/* Sectors Browser Box for selected City */}
            {showSectorPicker && availableSectors.length > 0 && (
              <div className="lead-form__sectors-box">
                <div className="lead-form__sectors-filter-wrap">
                  <Search size={14} />
                  <input
                    type="text"
                    value={sectorFilter}
                    onChange={(e) => setSectorFilter(e.target.value)}
                    placeholder={`Filter sectors in ${formData.city}...`}
                  />
                  {sectorFilter && (
                    <button
                      type="button"
                      className="lead-form__search-clear"
                      onClick={() => setSectorFilter("")}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <div className="lead-form__sectors-chips">
                  {filteredSectors.map((sec) => {
                    const isSelected =
                      formData.sector.toLowerCase() === sec.toLowerCase();
                    return (
                      <button
                        key={sec}
                        type="button"
                        className={`lead-form__sector-chip ${
                          isSelected ? "lead-form__sector-chip--active" : ""
                        }`}
                        onClick={() => {
                          setFormData((prev) => ({ ...prev, sector: sec }));
                          setShowSectorPicker(false);
                          setErrors((prev) => ({ ...prev, sector: "" }));
                          autoDetectPincode(sec, formData.city, formData.state);
                        }}
                      >
                        {sec}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Street / Road / Landmark (Optional) */}
            <div className={getFieldClass("street")}>
              <label htmlFor="street">Street / Road / Landmark (Optional)</label>
              <div className="lead-form__input-wrap">
                <MapPin size={16} />
                <input
                  id="street"
                  name="street"
                  type="text"
                  value={formData.street}
                  onChange={handleChange}
                  placeholder="e.g. Golf Course Road"
                />
              </div>
            </div>

            {/* House / Flat / Building No (Optional) */}
            <div className={getFieldClass("house_number")}>
              <label htmlFor="house_number">House / Flat / Building No (Optional)</label>
              <div className="lead-form__input-wrap">
                <MapPin size={16} />
                <input
                  id="house_number"
                  name="house_number"
                  type="text"
                  value={formData.house_number}
                  onChange={handleChange}
                  placeholder="e.g. Plot 42, 3rd Floor"
                />
              </div>
            </div>

            {/* Pincode */}
            <div className={getFieldClass("pincode")}>
              <label htmlFor="pincode">
                Pincode / Postal Code <span>*</span>
              </label>
              <div className="lead-form__input-wrap">
                <MapPin size={16} />
                <input
                  id="pincode"
                  name="pincode"
                  type="text"
                  maxLength={6}
                  value={formData.pincode}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                    setFormData((prev) => ({ ...prev, pincode: val }));
                    setErrors((prev) => ({ ...prev, pincode: "" }));
                  }}
                  placeholder="e.g. 122001"
                />
              </div>
              {errors.pincode && <small>{errors.pincode}</small>}
            </div>

            {/* Formatted Address Preview */}
            {getFullAddress() && (
              <div className="lead-form__address-preview">
                <div className="lead-form__address-preview-header">
                  <span className="lead-form__address-preview-title">
                    Formatted Lead Address:
                  </span>
                  <span className="lead-form__address-preview-badge">
                    <Check size={13} /> Google Maps Ready
                  </span>
                </div>
                <p className="lead-form__address-preview-text">{getFullAddress()}</p>
              </div>
            )}

            {isOutsideArea && (
              <div style={{ gridColumn: "1 / -1" }}>
                <span className="lead-form__field-hint lead-form__field-hint--warn">
                  ⚠️ This address appears outside your primary assigned territory ({currentEmpArea}). The lead will be submitted with an outside territory flag for Manager visibility.
                </span>
              </div>
            )}
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
