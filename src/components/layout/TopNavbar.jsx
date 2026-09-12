import { useState } from "react";

import "./TopNavbar.css";
import { useLocation, useNavigate } from "react-router-dom";
/* ==========================================================================
   Icons
   ========================================================================== */

const iconProps = {
  width: 20,
  height: 20,
  viewBox: "0 0 20 20",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

const MenuIcon = () => (
  <svg {...iconProps}>
    <path d="M3 5.5h14M3 10h14M3 14.5h14" />
  </svg>
);

const SearchIcon = () => (
  <svg {...iconProps}>
    <circle cx="8.8" cy="8.8" r="5.3" />
    <path d="M16.5 16.5 13 13" />
  </svg>
);

const BellIcon = () => (
  <svg {...iconProps}>
    <path d="M5 8.5a5 5 0 0 1 10 0c0 3.2 1 4.3 1.6 5H3.4c.6-.7 1.6-1.8 1.6-5Z" />
    <path d="M8.3 16.5a1.8 1.8 0 0 0 3.4 0" />
  </svg>
);

const ChevronIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 6.5 8 10.5 12 6.5" />
  </svg>
);

const UserIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="10" cy="7" r="3" />
    <path d="M4.5 17c.8-3 2.6-4.5 5.5-4.5s4.7 1.5 5.5 4.5" />
  </svg>
);

const SettingsIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M10 7.2a2.8 2.8 0 1 0 0 5.6 2.8 2.8 0 0 0 0-5.6Z" />
    <path d="M16.2 11.1a6.5 6.5 0 0 0 0-2.2l1.3-1-.9-1.6-1.6.5a6.5 6.5 0 0 0-1.9-1.1L12.9 4h-1.8l-.2 1.7a6.5 6.5 0 0 0-1.9 1.1l-1.6-.5-.9 1.6 1.3 1a6.5 6.5 0 0 0 0 2.2l-1.3 1 .9 1.6 1.6-.5a6.5 6.5 0 0 0 1.9 1.1l.2 1.7h1.8l.2-1.7a6.5 6.5 0 0 0 1.9-1.1l1.6.5.9-1.6-1.3-1Z" />
  </svg>
);

const LogoutIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M8 4H4.5A1.5 1.5 0 0 0 3 5.5v9A1.5 1.5 0 0 0 4.5 16H8" />
    <path d="M11 6.5 14.5 10 11 13.5" />
    <path d="M7 10h7.5" />
  </svg>
);

/* ==========================================================================
   Helpers
   ========================================================================== */

function getInitials(name) {
  if (!name) return "U";

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function getStoredUser() {
  try {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      return null;
    }

    return JSON.parse(storedUser);
  } catch {
    return null;
  }
}

function getUserName(user) {
  if (!user) {
    return "User";
  }

  if (user.name) {
    return user.name;
  }

  if (user.full_name) {
    return user.full_name;
  }

  if (user.fullName) {
    return user.fullName;
  }

  const firstName = user.first_name || user.firstName || "";

  const lastName = user.last_name || user.lastName || "";

  const combinedName = `${firstName} ${lastName}`.trim();

  if (combinedName) {
    return combinedName;
  }

  if (user.email) {
    return user.email.split("@")[0];
  }

  return "User";
}

function getUserRole(user, fallbackRole) {
  if (!user) {
    return fallbackRole;
  }

  return (
    user.role_name ||
    user.roleName ||
    user.designation_name ||
    user.designationName ||
    user.role ||
    fallbackRole
  );
}

/* ==========================================================================
   TopNavbar
   ========================================================================== */

export default function TopNavbar({ userName, userRole, onMenuClick }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [profileOpen, setProfileOpen] = useState(false);

  const storedUser = getStoredUser();
  const pageConfig = {
    "/dashboard": {
      title: "Dashboard",
      breadcrumbs: ["Home", "Dashboard"],
    },
    "/employees": {
      title: "Employees",
      breadcrumbs: ["Home", "Employees"],
    },
    "/departments": {
      title: "Departments",
      breadcrumbs: ["Home", "Departments"],
    },
    "/designations": {
      title: "Designations",
      breadcrumbs: ["Home", "Designations"],
    },
    "/attendance": {
      title: "Attendance",
      breadcrumbs: ["Home", "Attendance"],
    },
    "/leave": {
      title: "Leave",
      breadcrumbs: ["Home", "Leave"],
    },
    "/holidays": {
      title: "Holidays",
      breadcrumbs: ["Home", "Holidays"],
    },
    "/organization-overview": {
      title: "Organization",
      breadcrumbs: ["Home", "Organization"],
    },
  };
  const currentPage = pageConfig[location.pathname] || {
    title: "",
    breadcrumbs: [],
  };

  const displayName = userName || getUserName(storedUser);

  const displayRole = userRole || getUserRole(storedUser, "Member");

  const handleProfileClick = () => {
    setProfileOpen(false);
    navigate("/profile");
  };

  const handleSettingsClick = () => {
    setProfileOpen(false);
    navigate("/settings");
  };

  const handleLogout = () => {
    setProfileOpen(false);

    localStorage.removeItem("accessToken");
    localStorage.removeItem("access_token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    localStorage.removeItem("ignite_authenticated");

    navigate("/login", { replace: true });
  };

  return (
    <header className="top-navbar">
      {/* Left */}
      <div className="top-navbar__heading">
        <button
          type="button"
          className="top-navbar__menu"
          aria-label="Toggle menu"
          onClick={onMenuClick}
        >
          <MenuIcon />
        </button>

        {(currentPage.title || currentPage.breadcrumbs.length > 0) && (
          <div className="top-navbar__titles">
            {currentPage.title && (
              <h1 className="top-navbar__title">{currentPage.title}</h1>
            )}

            {currentPage.breadcrumbs.length > 0 && (
              <p className="top-navbar__breadcrumb">
                {currentPage.breadcrumbs.join(" / ")}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Right */}
      <div className="top-navbar__actions">
        <button
          type="button"
          className="top-navbar__search"
          aria-label="Search"
        >
          <SearchIcon />

          <span className="top-navbar__search-label">Search</span>
        </button>

        <button
          type="button"
          className="top-navbar__notification"
          aria-label="Notifications"
        >
          <BellIcon />

          <span className="top-navbar__notification-dot" aria-hidden="true" />
        </button>

        {/* Profile */}
        <div className="top-navbar__profile-wrapper">
          <button
            type="button"
            className={`top-navbar__profile ${
              profileOpen ? "top-navbar__profile--open" : ""
            }`}
            aria-haspopup="true"
            aria-expanded={profileOpen}
            onClick={() => setProfileOpen((previous) => !previous)}
          >
            <span className="top-navbar__avatar">
              {getInitials(displayName)}
            </span>

            <span className="top-navbar__user-info">
              <span className="top-navbar__user-name">{displayName}</span>

              <span className="top-navbar__user-role">{displayRole}</span>
            </span>

            <span className="top-navbar__chevron">
              <ChevronIcon />
            </span>
          </button>

          {profileOpen && (
            <div className="top-navbar__dropdown" role="menu">
              <div className="top-navbar__dropdown-header">
                <span className="top-navbar__dropdown-avatar">
                  {getInitials(displayName)}
                </span>

                <div>
                  <strong>{displayName}</strong>

                  <span>{displayRole}</span>
                </div>
              </div>

              <div className="top-navbar__dropdown-divider" />

              <button
                type="button"
                className="top-navbar__dropdown-item"
                role="menuitem"
                onClick={handleProfileClick}
              >
                <UserIcon />
                <span>My Profile</span>
              </button>

              <button
                type="button"
                className="top-navbar__dropdown-item"
                role="menuitem"
                onClick={handleSettingsClick}
              >
                <SettingsIcon />
                <span>Settings</span>
              </button>

              <div className="top-navbar__dropdown-divider" />

              <button
                type="button"
                className="top-navbar__dropdown-item top-navbar__dropdown-item--danger"
                role="menuitem"
                onClick={handleLogout}
              >
                <LogoutIcon />
                <span>Log out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
