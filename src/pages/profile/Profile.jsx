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

    const canEditProfile = useMemo(() => {
        return canUpdateEmployees(currentUser);
    }, [currentUser]);
    const handleEditProfile = async () => {
        try {
            setEditLoading(true);
            setEditError("");

            const response = await getEmployee(employee.id);
            const employeeData = response?.data || response;

            setEditEmployee({
                ...employeeData,
                emergencyContact: {
                    name: employeeData.emergencyContact?.name || "",
                    phone: employeeData.emergencyContact?.phone || "",
                },
            });

            setIsEditOpen(true);
        } catch (err) {
            console.error("Failed to load employee for editing:", err);

            setEditError(
                err?.response?.data?.message ||
                err?.message ||
                "Unable to open edit profile."
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
    const handleEmergencyContactChange = (field, value) => {
        setEditEmployee((prev) => ({
            ...prev,
            emergencyContact: {
                ...prev.emergencyContact,
                [field]: value,
            },
        }));
    };
    const handleSaveProfile = async () => {
        if (!editEmployee) return;

        try {
            setSaveLoading(true);
            setEditError("");

            const payload = {
                firstName: editEmployee.firstName || "",
                middleName: editEmployee.middleName || "",
                lastName: editEmployee.lastName || "",
                gender: editEmployee.gender || "",
                dateOfBirth: editEmployee.dateOfBirth || null,
                phone: editEmployee.phone || "",
                address: editEmployee.address || "",
                emergencyContact: {
                    name: editEmployee.emergencyContact?.name || "",
                    phone: editEmployee.emergencyContact?.phone || "",
                },
            };

            const response = await patchEmployee(employee.id, payload);

            const updatedEmployee = response?.data || response;

            setEmployee(updatedEmployee);
            setEditEmployee(updatedEmployee);
            setIsEditOpen(false);
        } catch (err) {
            console.error("Failed to update profile:", err);

            setEditError(
                err?.response?.data?.message ||
                err?.message ||
                "Unable to update your profile."
            );
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

                // 1. Get currently authenticated account
                const userResponse = await getCurrentUser();
                const user = userResponse?.user || userResponse;

                if (!user?.email) {
                    throw new Error("Unable to identify the logged-in user.");
                }

                if (!isMounted) return;

                setCurrentUser(user);

                // 2. Get employee records
                const employeeResponse = await getEmployees();

                const employees = Array.isArray(employeeResponse)
                    ? employeeResponse
                    : Array.isArray(employeeResponse?.data)
                        ? employeeResponse.data
                        : Array.isArray(employeeResponse?.results)
                            ? employeeResponse.results
                            : [];

                // 3. Match logged-in account with employee using email
                const matchedEmployee = employees.find(
                    (item) =>
                        item?.email?.toLowerCase() === user.email.toLowerCase()
                );

                if (!matchedEmployee) {
                    throw new Error(
                        "Your employee profile could not be found."
                    );
                }

                if (!isMounted) return;

                setEmployee(matchedEmployee);
            } catch (err) {
                console.error("Failed to load profile:", err);

                if (isMounted) {
                    setError(
                        err?.message ||
                        "Unable to load your profile. Please try again."
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
        employee?.photoUrl ||
        employee?.photo_url ||
        employee?.profilePhoto?.url ||
        employee?.profile_photo?.url ||
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

                {/* Profile Header */}
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
                                    {displayValue(employee.employeeCode)}
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
                    {/* Personal Information */}
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
                                value={formatDate(employee.dateOfBirth)}
                            />
                        </div>
                    </Card>

                    {/* Contact Information */}
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

                    {/* Employment Information */}
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
                                value={employee.employeeCode}
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
                                value={formatDate(employee.dateOfJoining)}
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
                                    employee.shift?.timingDisplay ||
                                    employee.shift?.name
                                }
                            />
                        </div>
                    </Card>

                    {/* Account & Access */}
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

                        <div className="profile-permissions">
                            <div className="profile-permissions-header">
                                <div>
                                    <h3>Effective Permissions</h3>
                                    <p>
                                        Permissions currently available to your account.
                                    </p>
                                </div>

                                <span className="profile-permission-count">
                                    {permissions.includes("*")
                                        ? "Full Access"
                                        : `${permissions.length} permissions`}
                                </span>
                            </div>

                            <div className="profile-permission-list">
                                {permissions.length > 0 ? (
                                    permissions.includes("*") ? (
                                        <span className="profile-permission-tag">
                                            Full system access
                                        </span>
                                    ) : (
                                        permissions.map((permission) => (
                                            <span
                                                className="profile-permission-tag"
                                                key={permission}
                                            >
                                                {permission}
                                            </span>
                                        ))
                                    )
                                ) : (
                                    <span className="profile-empty">
                                        No permissions assigned.
                                    </span>
                                )}
                            </div>
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
                        }
                    }}
                    title="Edit Profile"
                >
                    <div className="profile-edit-form">
                        {editError && (
                            <div className="profile-edit-error">
                                {editError}
                            </div>
                        )}

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