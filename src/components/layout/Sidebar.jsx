
import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import '../../styles/global.css';
import darkLogo from '../../assets/dark_logo-removebg.png';

/* ==========================================================================
   Icons
   ========================================================================== */

const iconProps = {
  width: 20,
  height: 20,
  viewBox: '0 0 20 20',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

const DashboardIcon = () => (
  <svg {...iconProps}>
    <rect x="2.5" y="2.5" width="6.5" height="6.5" rx="1.5" />
    <rect x="11" y="2.5" width="6.5" height="6.5" rx="1.5" />
    <rect x="2.5" y="11" width="6.5" height="6.5" rx="1.5" />
    <rect x="11" y="11" width="6.5" height="6.5" rx="1.5" />
  </svg>
);

const OrganizationIcon = () => (
  <svg {...iconProps}>
    <path d="M3 17V6.5L10 3l7 3.5V17" />
    <path d="M7 17v-5h6v5" />
    <path d="M3 17h14" />
  </svg>
);

const DepartmentsIcon = () => (
  <svg {...iconProps}>
    <rect x="2.5" y="3" width="15" height="4.5" rx="1.2" />
    <rect x="2.5" y="12.5" width="6.5" height="4.5" rx="1.2" />
    <rect x="11" y="12.5" width="6.5" height="4.5" rx="1.2" />
    <path d="M10 7.5v3M10 10.5H5.75v2M10 10.5h4.25v2" />
  </svg>
);

const DesignationsIcon = () => (
  <svg {...iconProps}>
    <path d="M10 2.5 12.2 7l5 .7-3.6 3.4.9 4.9L10 13.6l-4.5 2.4.9-4.9L2.8 7.7l5-.7L10 2.5Z" />
  </svg>
);

const RolesIcon = () => (
  <svg {...iconProps}>
    <path d="M10 2.5 16 5v4.5c0 4-2.6 6.7-6 8-3.4-1.3-6-4-6-8V5l6-2.5Z" />
    <path d="M7.5 10 9.2 11.7 12.7 8.2" />
  </svg>
);

const EmployeesIcon = () => (
  <svg {...iconProps}>
    <circle cx="7" cy="6.5" r="2.8" />
    <path d="M2 17c0-3 2.2-5 5-5s5 2 5 5" />
    <circle cx="14.5" cy="7" r="2.1" />
    <path d="M13 12.2c2.4.2 4 2 4 4.8" />
  </svg>
);

const AttendanceIcon = () => (
  <svg {...iconProps}>
    <circle cx="10" cy="10.5" r="7" />
    <path d="M10 6.8v3.9l2.6 1.6" />
    <path d="M7.2 2.7h5.6" />
  </svg>
);

const LeavesIcon = () => (
  <svg {...iconProps}>
    <path d="M4 10c0-4.5 2.6-7 6-7-1 3 0 5 2.5 6.2C11.5 12 9.5 15.5 5 17c-1.2-1.8-1-4.6-1-7Z" />
    <path d="M5 17c1-3 2.8-5 5.5-6.2" />
  </svg>
);

const HolidaysIcon = () => (
  <svg {...iconProps}>
    <rect x="2.5" y="4" width="15" height="12.5" rx="1.5" />
    <path d="M2.5 8h15" />
    <path d="M6.2 2.5v3M13.8 2.5v3" />
    <path d="M6.5 12h2.2M11.3 12h2.2M6.5 14.3h2.2" />
  </svg>
);

const SettingsIcon = () => (
  <svg {...iconProps}>
    <circle cx="10" cy="10" r="2.6" />
    <path d="M10 3v2M10 15v2M17 10h-2M5 10H3M14.8 5.2l-1.4 1.4M6.6 13.4l-1.4 1.4M14.8 14.8l-1.4-1.4M6.6 6.6 5.2 5.2" />
  </svg>
);

const ChevronIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M6 3.5 10.5 8 6 12.5" />
  </svg>
);

/* ==========================================================================
   Navigation
   ========================================================================== */

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/dashboard', icon: DashboardIcon },
  { label: 'Organization Setup', path: '/organization-setup', icon: OrganizationIcon },
  { label: 'Departments', path: '/departments', icon: DepartmentsIcon },
  { label: 'Designations', path: '/designations', icon: DesignationsIcon },
  { label: 'Roles & Permissions', path: '/roles-permissions', icon: RolesIcon },
  { label: 'Employees', path: '/employees', icon: EmployeesIcon },
  { label: 'Attendance', path: '/attendance', icon: AttendanceIcon },
  { label: 'Leaves', path: '/leaves', icon: LeavesIcon },
  { label: 'Holidays', path: '/holidays', icon: HolidaysIcon },
  { label: 'Settings', path: '/settings', icon: SettingsIcon },
];

function getInitials(name) {
  if (!name) return '';

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

/* ==========================================================================
   Sidebar
   ========================================================================== */

export default function Sidebar({
  userName = 'Guest User',
  userRole = 'Member',
  companyName = 'Your Company',
  defaultCollapsed = false,
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  return (
    <aside
      className={`sidebar${collapsed ? ' sidebar--collapsed' : ''}`}
      aria-label="Primary navigation"
    >
      {/* Header */}
      <div className="sidebar__header">
        <div className="sidebar__brand">
          <img
            src={darkLogo}
            alt="Ignite"
            className="sidebar__logo"
          />
        </div>

        <button
          type="button"
          className="sidebar__toggle"
          onClick={() => setCollapsed((prev) => !prev)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!collapsed}
        >
          <ChevronIcon />
        </button>
      </div>

      {/* Navigation */}
      <nav className="sidebar__nav">
        {NAV_ITEMS.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `sidebar__nav-item${isActive ? ' is-active' : ''}`
            }
            title={collapsed ? label : undefined}
          >
            <span className="sidebar__nav-icon">
              <Icon />
            </span>

            <span className="sidebar__nav-label">
              {label}
            </span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar__footer">
        <div className="sidebar__profile">
          <span className="sidebar__avatar">
            {getInitials(userName)}
          </span>

          <div className="sidebar__profile-info">
            <p className="sidebar__profile-name">
              {userName}
            </p>

            <p className="sidebar__profile-role">
              {userRole}
            </p>
          </div>
        </div>

        <p className="sidebar__company">
          {companyName}
        </p>
      </div>
    </aside>
  );
}

