import { NavLink, Link } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  Users,
  UserCheck,
  BarChart3,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import darkLogo from "../../../assets/dark_logo-removebg.png";
import favicon from "../../../assets/Favicon.png";
import "./SuperAdminSidebar.css";

const NAV_GROUPS = [
  {
    title: "Overview",
    items: [
      {
        to: "/admin",
        end: true,
        label: "Dashboard",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: "Tenants & Workforce",
    items: [
      {
        to: "/admin/companies",
        end: false,
        label: "Organizations",
        icon: Building2,
      },
      {
        to: "/admin/employees",
        end: false,
        label: "Employees",
        icon: Users,
      },
      {
        to: "/admin/users",
        end: false,
        label: "User Accounts",
        icon: UserCheck,
      },
    ],
  },
  {
    title: "System Insights",
    items: [
      {
        to: "/admin/analytics",
        end: false,
        label: "Platform Analytics",
        icon: BarChart3,
      },
    ],
  },
];

export default function SuperAdminSidebar({
  collapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
}) {
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
        className={`super-sidebar ${collapsed ? "super-sidebar--collapsed" : ""} ${isMobileOpen ? "super-sidebar--mobile-open" : ""
          }`}
        aria-label="Platform Super Admin Navigation"
      >
        {/* Brand Header */}
        <div className="super-sidebar__brand">
          <Link to="/admin" className="super-sidebar__logo-link">
            {collapsed ? (
              <img
                src={favicon}
                alt="Ignite"
                className="super-sidebar__logo-favicon"
              />
            ) : (
              <img
                src={darkLogo}
                alt="Ignite HRMS"
                className="super-sidebar__logo-img"
              />
            )}
          </Link>

          {/* Desktop collapse toggle beside the logo on the right */}
          <button
            type="button"
            className="super-sidebar__collapse-btn"
            onClick={onToggleCollapse}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          </button>
        </div>

        {/* Navigation list */}
        <nav className="super-sidebar__nav">
          {NAV_GROUPS.map((group) => (
            <div key={group.title} className="super-sidebar__group">
              <div className="super-sidebar__group-title">
                {!collapsed ? group.title : "•••"}
              </div>

              <ul className="super-sidebar__menu">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.to} className="super-sidebar__item">
                      <NavLink
                        to={item.to}
                        end={item.end}
                        className={({ isActive }) =>
                          `super-sidebar__link ${isActive ? "super-sidebar__link--active" : ""
                          }`
                        }
                        onClick={onCloseMobile}
                        title={collapsed ? item.label : undefined}
                      >
                        <Icon size={19} className="super-sidebar__link-icon" />
                        {!collapsed && (
                          <span className="super-sidebar__link-label">
                            {item.label}
                          </span>
                        )}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="super-sidebar__footer">
          <div className="super-sidebar__status-bar" title="Platform Infrastructure Live">
            {!collapsed && (
              <span className="super-sidebar__status-text">Ignite Infrastructure Live</span>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
