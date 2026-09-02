import { useState } from 'react';
import './TopNavbar.css';

/* ==========================================================================
   Icons
   Inline SVGs matching the Sidebar's stroke-based icon style (20x20,
   currentColor) so no icon library is introduced.
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
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 6.5 8 10.5 12 6.5" />
  </svg>
);

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
   TopNavbar
   Reusable top bar for the authenticated app shell. Renders a page
   title/breadcrumb on the left and search/notification/profile controls
   on the right. Search, notifications, and the profile menu are UI-only
   at this stage — no data or auth wiring.
   ========================================================================== */

export default function TopNavbar({
  title = 'Dashboard',
  breadcrumbs = ['Home', 'Dashboard'],
  userName = 'Guest User',
  userRole = 'Member',
  onMenuClick,
}) {
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <header className="top-navbar">
      <div className="top-navbar__heading">
        <button
          type="button"
          className="top-navbar__menu"
          aria-label="Toggle menu"
          onClick={onMenuClick}
        >
          <MenuIcon />
        </button>

        <div className="top-navbar__titles">
          <h1 className="top-navbar__title">{title}</h1>
          {breadcrumbs?.length > 0 && (
            <p className="top-navbar__breadcrumb">
              {breadcrumbs.join(' / ')}
            </p>
          )}
        </div>
      </div>

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

        <div className="top-navbar__profile-wrapper">
          <button
            type="button"
            className="top-navbar__profile"
            aria-haspopup="true"
            aria-expanded={profileOpen}
            onClick={() => setProfileOpen((prev) => !prev)}
          >
            <span className="top-navbar__avatar">{getInitials(userName)}</span>
            <span className="top-navbar__user-info">
              <span className="top-navbar__user-name">{userName}</span>
              <span className="top-navbar__user-role">{userRole}</span>
            </span>
            <span className="top-navbar__chevron">
              <ChevronIcon />
            </span>
          </button>

          {profileOpen && (
            <div className="top-navbar__dropdown" role="menu">
              <button type="button" className="top-navbar__dropdown-item" role="menuitem">
                Profile
              </button>
              <button type="button" className="top-navbar__dropdown-item" role="menuitem">
                Settings
              </button>
              <button type="button" className="top-navbar__dropdown-item" role="menuitem">
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}