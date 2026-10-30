import { useEffect, useMemo, useState } from "react";
import {
  Mail,
  Phone,
  MapPin,
  CalendarDays,
  Building2,
  BriefcaseBusiness,
  UserRound,
  Clock3,
  ShieldCheck,
  UsersRound,
  Camera,
  X,
} from "lucide-react";

import Modal from "../../components/common/Modal/Modal";
import PageHeader from "../../components/common/PageHeader/PageHeader";
import Card from "../../components/common/Card/Card";
import Button from "../../components/common/Button/Button";

import { getCurrentUser } from "../../services/api/authAPI";
import { canUpdateEmployees } from "../../utils/permissionUtils";
import {
  getEmployees,
  getEmployee,
  getCurrentEmployee,
  patchEmployee,
} from "../../services/api/employeeAPI";

import "./Profile.css";

const getInitials = (name = "") => {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (!parts.length) return "U";

  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
};

const formatDate = (value) => {
  if (!value) return "Not provided";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const displayValue = (value) => {
  if (value === null || value === undefined || value === "") {
    return "Not provided";
  }

  return value;
};

const InfoItem = ({ icon: Icon, label, value }) => (
  <div className="profile-info-item">
    <div className="profile-info-icon">
      <Icon size={17} strokeWidth={1.8} />
    </div>

    <div className="profile-info-content">
      <span className="profile-info-label">{label}</span>
      <span className="profile-info-value">{displayValue(value)}</span>
    </div>
  </div>
);

const SectionTitle = ({ icon: Icon, title, description }) => (
  <div className="profile-section-header">
    <div className="profile-section-icon">
      <Icon size={18} strokeWidth={1.8} />
    </div>

    <div>
      <h2>{title}</h2>
      {description && <p>{description}</p>}
    </div>
  </div>
);

const Profile = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [employee, setEmployee] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editEmployee, setEditEmployee] = useState(null);

  const [editLoading, setEditLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [editError, setEditError] = useState("");

  const [profilePhotoFile, setProfilePhotoFile] = useState(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState(null);

  const canEditProfile = useMemo(() => {
    return canUpdateEmployees(currentUser);
  }, [currentUser]);

  const fullName = useMemo(() => {
    if (employee?.fullName) return employee.fullName;

    const name = [
      employee?.firstName,
      employee?.middleName,
      employee?.lastName,
    ]
      .filter(Boolean)
      .join(" ");

    return name || currentUser?.full_name || currentUser?.email || "User";
  }, [employee, currentUser]);

  const profilePhoto =
    employee?.profile_photo_url ||
    employee?.profilePhotoUrl ||
    employee?.photoUrl ||
    employee?.photo_url ||
    null;

  const initials = getInitials(fullName);

  const permissions =
    employee?.effectivePermissions ||
    employee?.effective_permissions ||
    employee?.permissions ||
    [];

  const roleName =
    currentUser?.role ||
    employee?.overrideRoleName ||
    employee?.override_role_name ||
    "Employee";

  const handleEditProfile = async () => {
    try {
      setEditLoading(true);
      setEditError("");

      let employeeData = null;

      if (employee?.isFieldSalesEmployee) {
        try {
          const { getFieldSalesEmployee } = await import("../../services/api/fieldSalesAPI");
          const res = await getFieldSalesEmployee(employee.id);
          employeeData = res?.data || res;
        } catch {
          employeeData = employee;
        }
      } else {
        const response = await getEmployee(employee.id);
        employeeData = response?.data || response;
      }

      setEditEmployee({
        ...employeeData,
        firstName: employeeData?.firstName || employeeData?.first_name || "",
        middleName: employeeData?.middleName || employeeData?.middle_name || "",
        lastName: employeeData?.lastName || employeeData?.last_name || "",
        gender: employeeData?.gender || "",
        dateOfBirth: employeeData?.dateOfBirth || employeeData?.date_of_birth || null,
        phone: employeeData?.phone || "",
        address: employeeData?.address || "",
        emergencyContact: {
          name:
            employeeData?.emergencyContact?.name ||
            employeeData?.emergency_contact_name ||
            "",
          phone:
            employeeData?.emergencyContact?.phone ||
            employeeData?.emergency_contact_phone ||
            "",
        },
      });

      const existingPhoto =
        employeeData?.profile_photo_url ||
        employeeData?.profilePhotoUrl ||
        employeeData?.photoUrl ||
        employeeData?.photo_url ||
        null;

      setProfilePhotoFile(null);
      setProfilePhotoPreview(existingPhoto);

      setIsEditOpen(true);
    } catch (err) {
      console.error("Failed to load employee for editing:", err);

      setEditError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to open edit profile.",
      );
    } finally {
      setEditLoading(false);
    }
  };

  const handleEditChange = (field, value) => {
    setEditEmployee((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleProfilePhotoChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setEditError("Please select a valid image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setEditError("Profile picture must be smaller than 5 MB.");
      return;
    }

    setEditError("");

    setProfilePhotoFile(file);

    const previewUrl = URL.createObjectURL(file);
    setProfilePhotoPreview(previewUrl);

    // Allow selecting the same file again.
    event.target.value = "";
  };

  const handleRemoveSelectedPhoto = () => {
    setProfilePhotoFile(null);
    setProfilePhotoPreview(profilePhoto || null);
  };

  const handleSaveProfile = async () => {
    if (!editEmployee) return;

    try {
      setSaveLoading(true);
      setEditError("");

      const firstName = (editEmployee.firstName || editEmployee.first_name || "").trim();
      const lastName = (editEmployee.lastName || editEmployee.last_name || "").trim();

      if (!firstName) {
        setEditError("First Name is required.");
        setSaveLoading(false);
        return;
      }

      if (!lastName) {
        setEditError("Last Name is required.");
        setSaveLoading(false);
        return;
      }

      // Phone validation & normalization
      const rawPhone = (editEmployee.phone || "").trim();
      let formattedPhone = "";
      if (rawPhone) {
        let digits = rawPhone.replace(/[\s\-\(\)\.]/g, "");
        if (digits.startsWith("+91")) digits = digits.slice(3);
        else if (digits.startsWith("91") && digits.length === 12) digits = digits.slice(2);
        else if (digits.startsWith("0") && digits.length === 11) digits = digits.slice(1);

        if (!/^\d{10}$/.test(digits)) {
          setEditError("Phone: Phone number must contain 10 digits.");
          setSaveLoading(false);
          return;
        }
        formattedPhone = digits;
      }

      // Date of Birth validation & formatting
      const rawDob = (editEmployee.dateOfBirth || editEmployee.date_of_birth || "").toString().trim();
      let cleanDob = null;
      if (rawDob) {
        const parsedDate = new Date(rawDob);
        if (isNaN(parsedDate.getTime())) {
          setEditError("Date of Birth: Please enter a valid Date of Birth.");
          setSaveLoading(false);
          return;
        }
        if (parsedDate > new Date()) {
          setEditError("Date of Birth: Date of Birth cannot be in the future.");
          setSaveLoading(false);
          return;
        }
        cleanDob = rawDob;
      }

      const ecName = (editEmployee.emergency_contact_name || editEmployee.emergencyContact?.name || "").trim();
      let ecPhone = (editEmployee.emergency_contact_phone || editEmployee.emergencyContact?.phone || "").toString().trim();
      if (ecPhone) {
        let ecDigits = ecPhone.replace(/[\s\-\(\)\.]/g, "");
        if (ecDigits.startsWith("+91")) ecDigits = ecDigits.slice(3);
        else if (ecDigits.startsWith("91") && ecDigits.length === 12) ecDigits = ecDigits.slice(2);
        else if (ecDigits.startsWith("0") && ecDigits.length === 11) ecDigits = ecDigits.slice(1);
        if (/^\d{10}$/.test(ecDigits)) {
          ecPhone = ecDigits;
        }
      }

      let updatedEmployee = null;

      if (employee?.isFieldSalesEmployee) {
        const { updateFieldSalesEmployee } = await import("../../services/api/fieldSalesAPI");
        const payload = {
          first_name: firstName,
          middle_name: (editEmployee.middleName || editEmployee.middle_name || "").trim(),
          last_name: lastName,
          gender: editEmployee.gender || "",
          date_of_birth: cleanDob,
          phone: formattedPhone,
          address: (editEmployee.address || "").trim(),
        };

        if (profilePhotoFile) {
          payload.profile_photo = profilePhotoFile;
        }

        const res = await updateFieldSalesEmployee(employee.id, payload);
        const data = res?.data || res;
        updatedEmployee = {
          ...employee,
          ...data,
          firstName: data.first_name || firstName,
          middleName: data.middle_name || editEmployee.middleName,
          lastName: data.last_name || lastName,
          fullName: data.full_name || (firstName + " " + lastName).trim(),
          phone: formattedPhone || data.phone || editEmployee.phone,
          address: data.address || editEmployee.address,
          gender: data.gender || editEmployee.gender,
          dateOfBirth: data.date_of_birth || cleanDob,
          date_of_birth: data.date_of_birth || cleanDob,
          profile_photo_url: data.profile_photo_url || data.profilePhotoUrl || profilePhotoPreview || employee.profile_photo_url,
          profilePhotoUrl: data.profile_photo_url || data.profilePhotoUrl || profilePhotoPreview || employee.profile_photo_url,
        };
      } else {
        const payload = {
          first_name: firstName,
          middle_name: (editEmployee.middleName || editEmployee.middle_name || "").trim(),
          last_name: lastName,
          gender: editEmployee.gender || "",
          date_of_birth: cleanDob,
          phone: formattedPhone,
          address: (editEmployee.address || "").trim(),
          emergency_contact_name: ecName,
          emergency_contact_phone: ecPhone,

          // Legacy camelCase fallbacks
          firstName,
          middleName: (editEmployee.middleName || editEmployee.middle_name || "").trim(),
          lastName,
          dateOfBirth: cleanDob,
        };

        if (profilePhotoFile) {
          payload.photo = profilePhotoFile;
          payload.profile_photo = profilePhotoFile;
        }

        const response = await patchEmployee(employee.id, payload);
        const data = response?.data || response;
        updatedEmployee = {
          ...employee,
          ...data,
          firstName: data.first_name || data.firstName || firstName,
          middleName: data.middle_name || data.middleName || editEmployee.middleName,
          lastName: data.last_name || data.lastName || lastName,
          fullName: data.full_name || data.fullName || (firstName + " " + lastName).trim(),
          phone: formattedPhone || data.phone || editEmployee.phone,
          address: data.address || editEmployee.address,
          gender: data.gender || editEmployee.gender,
          dateOfBirth: data.date_of_birth || data.dateOfBirth || cleanDob,
          date_of_birth: data.date_of_birth || cleanDob,
          emergency_contact_name: ecName,
          emergency_contact_phone: ecPhone,
          emergencyContact: {
            name: ecName,
            phone: ecPhone,
          },
          profile_photo_url: data.profile_photo_url || data.profilePhotoUrl || data.photo || profilePhotoPreview || employee.profile_photo_url,
          profilePhotoUrl: data.profile_photo_url || data.profilePhotoUrl || data.photo || profilePhotoPreview || employee.profile_photo_url,
        };
      }

      setEmployee(updatedEmployee);

      setProfilePhotoFile(null);

      const updatedPhoto =
        updatedEmployee?.profile_photo_url ||
        updatedEmployee?.profilePhotoUrl ||
        updatedEmployee?.photoUrl ||
        null;

      setProfilePhotoPreview(updatedPhoto);

      // Sync updated user profile across components/sidebar
      try {
        const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
        const mergedUser = {
          ...storedUser,
          profile_photo_url: updatedPhoto,
          photo_url: updatedPhoto,
          full_name: updatedEmployee?.fullName || updatedEmployee?.full_name || storedUser.full_name,
        };
        localStorage.setItem("user", JSON.stringify(mergedUser));
        window.dispatchEvent(new CustomEvent("ignite:user-updated", { detail: { user: mergedUser } }));
      } catch (syncErr) {
        console.warn("Could not sync user to localStorage:", syncErr);
      }

      setIsEditOpen(false);
    } catch (err) {
      console.error("Failed to update profile:", err);

      const backendError = err?.response?.data;
      let message = "Unable to update your profile.";

      const rawErrors =
        backendError?.errors ||
        (typeof backendError === "object" && !backendError?.message && !backendError?.detail
          ? backendError
          : null);

      if (rawErrors && typeof rawErrors === "object") {
        const errorList = Object.entries(rawErrors).map(([field, val]) => {
          const errorMsg = Array.isArray(val)
            ? val[0]
            : typeof val === "object"
            ? Object.values(val)[0]
            : String(val);
          const fieldLabel = field
            .replace(/_/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase());
          return fieldLabel + ": " + errorMsg;
        });
        if (errorList.length > 0) {
          message = errorList.join(" | ");
        }
      } else if (backendError?.message && backendError.message !== "Validation failed.") {
        message = backendError.message;
      } else if (backendError?.detail) {
        message = backendError.detail;
      } else if (err?.message) {
        message = err.message;
      }

      setEditError(message);
    } finally {
      setSaveLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      try {
        setLoading(true);
        setError("");

        const userResponse = await getCurrentUser();
        const user = userResponse?.user || userResponse;

        if (!user?.email) {
          throw new Error("Unable to identify the logged-in user.");
        }

        if (!isMounted) return;

        setCurrentUser(user);

        let matchedEmployee = null;

        // 1. First priority: Fetch full employee profile directly from /api/employees/me/
        try {
          const empRes = await getCurrentEmployee();
          const empData = empRes?.data || empRes;
          if (empData && (empData.employeeCode || empData.employee_code || empData.email)) {
            matchedEmployee = {
              ...empData,
              employeeCode: empData.employeeCode || empData.employee_code,
              employee_code: empData.employee_code || empData.employeeCode,
              profile_photo_url:
                empData.profile_photo_url ||
                empData.profilePhotoUrl ||
                empData.photoUrl ||
                empData.photo_url ||
                user.profile_photo_url ||
                user.photo_url,
            };
          }
        } catch (meErr) {
          console.warn("Direct /employees/me/ lookup error:", meErr);
        }

        // 2. Second priority: If user has employee_id and not yet matched, fetch by employee ID
        if (!matchedEmployee && user?.employee_id) {
          try {
            const empRes = await getEmployee(user.employee_id);
            const empData = empRes?.data || empRes;
            if (empData && (empData.employeeCode || empData.employee_code || empData.email)) {
              matchedEmployee = {
                ...empData,
                employeeCode: empData.employeeCode || empData.employee_code,
                employee_code: empData.employee_code || empData.employeeCode,
                profile_photo_url:
                  empData.profile_photo_url ||
                  empData.profilePhotoUrl ||
                  empData.photoUrl ||
                  empData.photo_url ||
                  user.profile_photo_url ||
                  user.photo_url,
              };
            }
          } catch (idErr) {
            console.warn("getEmployee by ID error:", idErr);
          }
        }

        // 3. Third priority: If user is in Field Sales, check Field Sales employees
        if (!matchedEmployee && (user?.is_field_sales || user?.department === "Field Sales")) {
          try {
            const { getFieldSalesEmployees } = await import("../../services/api/fieldSalesAPI");
            const fsRes = await getFieldSalesEmployees();
            const fsEmployees = Array.isArray(fsRes)
              ? fsRes
              : Array.isArray(fsRes?.data)
                ? fsRes.data
                : [];
            const fsMatched = fsEmployees.find(
              (item) => item?.email?.toLowerCase() === user.email.toLowerCase()
            );
            if (fsMatched) {
              matchedEmployee = {
                id: fsMatched.id,
                employeeCode: fsMatched.employee_code || fsMatched.employeeCode,
                employee_code: fsMatched.employee_code || fsMatched.employeeCode,
                firstName: fsMatched.first_name || fsMatched.firstName,
                middleName: fsMatched.middle_name || fsMatched.middleName,
                lastName: fsMatched.last_name || fsMatched.lastName,
                fullName: fsMatched.full_name || fsMatched.fullName || `${fsMatched.first_name || ""} ${fsMatched.last_name || ""}`.trim(),
                email: fsMatched.email,
                phone: fsMatched.phone,
                gender: fsMatched.gender,
                dateOfBirth: fsMatched.date_of_birth || fsMatched.dateOfBirth,
                dateOfJoining: fsMatched.date_of_joining || fsMatched.dateOfJoining,
                address: fsMatched.address,
                employmentType: fsMatched.employment_type || fsMatched.employmentType || "Full Time",
                employmentStatus: fsMatched.employment_status || fsMatched.employmentStatus || (fsMatched.is_active ? "Active" : "Inactive"),
                invitationStatus: fsMatched.invitation_status || "ACCEPTED",
                workLocation: fsMatched.work_location || "Field",
                department: { name: "Field Sales" },
                designation: {
                  name: fsMatched.role,
                  accessProfile: fsMatched.role === "Manager" ? "Manager" : "Sales Person",
                },
                reportingManager: fsMatched.reporting_manager_details || fsMatched.reporting_manager,
                profile_photo_url: fsMatched.profile_photo_url || fsMatched.photo_url || user.profile_photo_url || user.photo_url,
                effectivePermissions: user.permissions || [],
                isFieldSalesEmployee: true,
              };
            }
          } catch (fsErr) {
            console.warn("Field Sales employee lookup error:", fsErr);
          }
        }

        // 4. Fourth priority: HRMS employee directory lookup
        if (!matchedEmployee) {
          try {
            const employeeResponse = await getEmployees();
            const employees = Array.isArray(employeeResponse)
              ? employeeResponse
              : Array.isArray(employeeResponse?.data)
                ? employeeResponse.data
                : Array.isArray(employeeResponse?.results)
                  ? employeeResponse.results
                  : [];

            const hrmsMatched = employees.find(
              (item) =>
                item?.email?.toLowerCase() === user.email.toLowerCase(),
            );
            if (hrmsMatched) {
              matchedEmployee = {
                ...hrmsMatched,
                employeeCode: hrmsMatched.employeeCode || hrmsMatched.employee_code,
                employee_code: hrmsMatched.employee_code || hrmsMatched.employeeCode,
                profile_photo_url: hrmsMatched.profile_photo_url || hrmsMatched.profilePhotoUrl || user.profile_photo_url || user.photo_url,
              };
            }
          } catch (empErr) {
            console.warn("HRMS getEmployees failed or restricted:", empErr);
          }
        }

        // 5. Fallback: Populate from authenticated user info
        if (!matchedEmployee) {
          const userEmployeeCode =
            user.employee_code ||
            user.employeeCode ||
            "Not assigned";
          matchedEmployee = {
            id: user.employee_id || user.id,
            employeeCode: userEmployeeCode,
            employee_code: userEmployeeCode,
            firstName: user.first_name || user.username || "",
            lastName: user.last_name || "",
            fullName: user.full_name || user.username || "User",
            email: user.email,
            phone: user.phone || "",
            gender: user.gender || "",
            dateOfBirth: user.date_of_birth || user.dateOfBirth || null,
            dateOfJoining: user.date_of_joining || user.dateOfJoining || null,
            address: user.address || "",
            shift: user.shift || null,
            employmentType: user.employment_type || user.employmentType || "Full Time",
            employmentStatus: user.employment_status || user.employmentStatus || "Active",
            invitationStatus: "ACCEPTED",
            workLocation: user.work_location || user.workLocation || "Office",
            department: { name: user.department || "General" },
            designation: { name: user.designation || user.role || "Employee", accessProfile: user.role || "Employee" },
            reportingManager: null,
            profile_photo_url: user.profile_photo_url || user.photo_url || null,
            effectivePermissions: user.permissions || [],
          };
        }

        if (!isMounted) return;

        setEmployee(matchedEmployee);
      } catch (err) {
        console.error("Failed to load profile:", err);

        if (isMounted) {
          setError(
            err?.message ||
              "Unable to load your profile. Please try again.",
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="profile-page">
        <PageHeader
          title="Profile"
          subtitle="Manage your personal and employment information"
        />

        <div className="profile-loading">
          <div className="profile-loader" />
          <span>Loading profile...</span>
        </div>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="profile-page">
        <PageHeader
          title="Profile"
          subtitle="Manage your personal and employment information"
        />

        <Card>
          <div className="profile-error">
            <div className="profile-error-icon">
              <UserRound size={22} />
            </div>

            <div>
              <h3>Unable to load profile</h3>
              <p>{error || "Employee profile not found."}</p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <>
      <main className="profile-page">
        <header className="profile-page__header">
          <div>
            <span className="profile-page__eyebrow">PROFILE</span>

            <h1>My Profile</h1>

            <p>
              View and manage your personal and employment information.
            </p>
          </div>
        </header>

        <Card className="profile-hero-card">
          <div className="profile-hero">
            <div className="profile-avatar">
              {profilePhoto ? (
                <img src={profilePhoto} alt={fullName} />
              ) : (
                <span>{initials}</span>
              )}
            </div>

            <div className="profile-hero-content">
              <div className="profile-name-row">
                <h1>{fullName}</h1>

                <span className="profile-status-badge">
                  <span className="profile-status-dot" />
                  {displayValue(employee.employmentStatus)}
                </span>
              </div>

              <p className="profile-designation">
                {displayValue(employee.designation?.name)}
              </p>

              <div className="profile-meta">
                <span>
                  <Building2 size={15} />
                  {displayValue(employee.department?.name)}
                </span>

                <span>
                  <BriefcaseBusiness size={15} />
                  {displayValue(employee.employeeCode || employee.employee_code)}
                </span>

                <span>
                  <Mail size={15} />
                  {displayValue(employee.email)}
                </span>
              </div>
            </div>

            <div className="profile-hero-action">
              <Button
                variant="outline"
                type="button"
                onClick={handleEditProfile}
                disabled={editLoading}
              >
                {editLoading ? "Loading..." : "Edit Profile"}
              </Button>
            </div>
          </div>
        </Card>

        <div className="profile-content">
          <Card>
            <SectionTitle
              icon={UserRound}
              title="Personal Information"
              description="Your basic personal details"
            />

            <div className="profile-info-grid">
              <InfoItem
                icon={UserRound}
                label="First Name"
                value={employee.firstName}
              />

              <InfoItem
                icon={UserRound}
                label="Middle Name"
                value={employee.middleName}
              />

              <InfoItem
                icon={UserRound}
                label="Last Name"
                value={employee.lastName}
              />

              <InfoItem
                icon={UserRound}
                label="Gender"
                value={employee.gender}
              />

              <InfoItem
                icon={CalendarDays}
                label="Date of Birth"
                value={formatDate(employee.dateOfBirth || employee.date_of_birth)}
              />
            </div>
          </Card>

          <Card>
            <SectionTitle
              icon={Phone}
              title="Contact Information"
              description="Your registered contact details"
            />

            <div className="profile-info-grid">
              <InfoItem
                icon={Mail}
                label="Official Email"
                value={employee.email}
              />

              <InfoItem
                icon={Phone}
                label="Phone"
                value={employee.phone}
              />

              <InfoItem
                icon={MapPin}
                label="Address"
                value={employee.address}
              />
            </div>
          </Card>

          <Card>
            <SectionTitle
              icon={BriefcaseBusiness}
              title="Employment Information"
              description="Your employment and organizational details"
            />

            <div className="profile-info-grid">
              <InfoItem
                icon={BriefcaseBusiness}
                label="Employee ID"
                value={employee.employeeCode || employee.employee_code}
              />

              <InfoItem
                icon={Building2}
                label="Department"
                value={employee.department?.name}
              />

              <InfoItem
                icon={BriefcaseBusiness}
                label="Designation"
                value={employee.designation?.name}
              />

              <InfoItem
                icon={BriefcaseBusiness}
                label="Employment Type"
                value={employee.employmentType}
              />

              <InfoItem
                icon={CalendarDays}
                label="Date of Joining"
                value={formatDate(employee.dateOfJoining || employee.date_of_joining)}
              />

              <InfoItem
                icon={UsersRound}
                label="Reporting Manager"
                value={
                  employee.reportingManager?.fullName ||
                  employee.reporting_manager?.full_name
                }
              />

              <InfoItem
                icon={MapPin}
                label="Work Location"
                value={employee.workLocation}
              />

              <InfoItem
                icon={Clock3}
                label="Shift"
                value={
                  employee.shift?.timingDisplay
                    ? `${employee.shift?.name || "Shift"} (${employee.shift.timingDisplay})`
                    : (employee.shift?.name || employee.shift_timing || employee.shift_name || (typeof employee.shift === "string" ? employee.shift : null))
                }
              />
            </div>
          </Card>

          <Card>
            <SectionTitle
              icon={ShieldCheck}
              title="Account & Access"
              description="Your account status and access profile"
            />

            <div className="profile-info-grid">
              <InfoItem
                icon={ShieldCheck}
                label="Account Role"
                value={roleName}
              />

              <InfoItem
                icon={ShieldCheck}
                label="Account Status"
                value={
                  employee.invitationStatus === "ACCEPTED"
                    ? "Active"
                    : employee.invitationStatus
                }
              />

              <InfoItem
                icon={ShieldCheck}
                label="Access Profile"
                value={
                  employee.designation?.accessProfile ||
                  employee.designation?.access_profile ||
                  "Employee"
                }
              />
            </div>
          </Card>
        </div>
      </main>

      {isEditOpen && editEmployee && (
        <Modal
          open={isEditOpen}
          onClose={() => {
            if (!saveLoading) {
              setIsEditOpen(false);
              setEditError("");
              setProfilePhotoFile(null);
              setProfilePhotoPreview(null);
            }
          }}
          title="Edit Profile"
        >
          <div className="profile-edit-form">
            {/* PROFILE PHOTO */}
            <div className="profile-edit-photo">
              <div className="profile-edit-photo-preview">
                {profilePhotoPreview ? (
                  <img
                    src={profilePhotoPreview}
                    alt={fullName}
                  />
                ) : (
                  <span>{initials}</span>
                )}
              </div>

              <div className="profile-edit-photo-info">
                <div>
                  <h3>Profile Picture</h3>
                  <p>
                    Update your profile photo. This will be visible
                    across your account.
                  </p>
                </div>

                <div className="profile-edit-photo-controls">
                  <label
                    htmlFor="profile-photo-input"
                    className="profile-photo-change-button"
                  >
                    <Camera size={15} />
                    {profilePhotoPreview ? "Change Photo" : "Upload Photo"}
                  </label>

                  <input
                    id="profile-photo-input"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleProfilePhotoChange}
                    disabled={saveLoading}
                  />

                  {profilePhotoFile && (
                    <button
                      type="button"
                      className="profile-photo-remove-button"
                      onClick={handleRemoveSelectedPhoto}
                      disabled={saveLoading}
                    >
                      <X size={15} />
                      Cancel Change
                    </button>
                  )}
                </div>

                <span className="profile-photo-hint">
                  JPG, PNG or WebP · Maximum 5 MB
                </span>
              </div>
            </div>

            {editError && (
              <div className="profile-edit-error">
                {editError}
              </div>
            )}

            {/* FORM */}
            <div className="profile-edit-grid">
              <div className="profile-edit-field">
                <label>First Name</label>
                <input
                  type="text"
                  value={editEmployee.firstName || ""}
                  onChange={(e) =>
                    handleEditChange("firstName", e.target.value)
                  }
                />
              </div>

              <div className="profile-edit-field">
                <label>Middle Name</label>
                <input
                  type="text"
                  value={editEmployee.middleName || ""}
                  onChange={(e) =>
                    handleEditChange("middleName", e.target.value)
                  }
                />
              </div>

              <div className="profile-edit-field">
                <label>Last Name</label>
                <input
                  type="text"
                  value={editEmployee.lastName || ""}
                  onChange={(e) =>
                    handleEditChange("lastName", e.target.value)
                  }
                />
              </div>

              <div className="profile-edit-field">
                <label>Gender</label>
                <select
                  value={editEmployee.gender || ""}
                  onChange={(e) =>
                    handleEditChange("gender", e.target.value)
                  }
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="profile-edit-field">
                <label>Date of Birth</label>
                <input
                  type="date"
                  value={editEmployee.dateOfBirth || ""}
                  onChange={(e) =>
                    handleEditChange("dateOfBirth", e.target.value)
                  }
                />
              </div>

              <div className="profile-edit-field">
                <label>Phone</label>
                <input
                  type="tel"
                  value={editEmployee.phone || ""}
                  onChange={(e) =>
                    handleEditChange("phone", e.target.value)
                  }
                />
              </div>

              <div className="profile-edit-field profile-edit-field--full">
                <label>Address</label>
                <textarea
                  rows={3}
                  value={editEmployee.address || ""}
                  onChange={(e) =>
                    handleEditChange("address", e.target.value)
                  }
                />
              </div>
            </div>

            <div className="profile-edit-actions">
              <Button
                variant="outline"
                type="button"
                disabled={saveLoading}
                onClick={() => setIsEditOpen(false)}
              >
                Cancel
              </Button>

              <Button
                variant="primary"
                type="button"
                disabled={saveLoading}
                onClick={handleSaveProfile}
              >
                {saveLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

export default Profile;