import { NavLink, Link } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  Users,
  UserCheck,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  ArrowUpRight,
} from "lucide-react";
import "./SuperAdminSidebar.css";

const NAV_ITEMS = [
  {
    to: "/admin",
    end: true,
    label: "Dashboard",
    icon: LayoutDashboard,
    badge: null,
  },
  {
    to: "/admin/companies",
    end: false,
    label: "Companies",
    icon: Building2,
    badge: null,
  },
  {
    to: "/admin/employees",
    end: false,
    label: "Employees",
    icon: Users,
    badge: null,
  },
  {
    to: "/admin/users",
    end: false,
    label: "User Accounts",
    icon: UserCheck,
    badge: null,
  },
  {
    to: "/admin/analytics",
    end: false,
    label: "Platform Analytics",
    icon: BarChart3,
    badge: null,
  },
];

export default function SuperAdminSidebar({ collapsed, onToggleCollapse, isMobileOpen, onCloseMobile }) {
  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="super-sidebar-backdrop"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`super-sidebar ${collapsed ? "super-sidebar--collapsed" : ""} ${
          isMobileOpen ? "super-sidebar--mobile-open" : ""
        }`}
        aria-label="Platform Super Admin Navigation"
      >
        {/* Brand Header */}
        <div className="super-sidebar__brand">
          <Link to="/admin" className="super-sidebar__logo-link">
            <div className="super-sidebar__logo-mark">
              <ShieldCheck size={22} className="super-sidebar__logo-icon" />
            </div>
            {!collapsed && (
              <div className="super-sidebar__brand-text">
                <span className="super-sidebar__app-name">Ignite</span>
                <span className="super-sidebar__pill">Super Admin</span>
              </div>
            )}
          </Link>

          {/* Desktop collapse toggle */}
          <button
            type="button"
            className="super-sidebar__collapse-btn"
            onClick={onToggleCollapse}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Navigation list */}
        <nav className="super-sidebar__nav">
          <div className="super-sidebar__section-label">
            {!collapsed ? "Platform Navigation" : "•••"}
          </div>

          <ul className="super-sidebar__menu">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.to} className="super-sidebar__item">
                  <NavLink
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      `super-sidebar__link ${isActive ? "super-sidebar__link--active" : ""}`
                    }
                    onClick={onCloseMobile}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon size={19} className="super-sidebar__link-icon" />
                    {!collapsed && (
                      <span className="super-sidebar__link-label">{item.label}</span>
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Sidebar Footer */}
        <div className="super-sidebar__footer">
          <Link
            to="/dashboard"
            className="super-sidebar__workspace-btn"
            title="Return to regular tenant workspace"
          >
            <ArrowUpRight size={16} />
            {!collapsed && <span>Tenant Workspace</span>}
          </Link>

          {!collapsed && (
            <div className="super-sidebar__system-status">
              <span className="super-sidebar__status-dot" />
              <span className="super-sidebar__status-text">Platform Live</span>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
