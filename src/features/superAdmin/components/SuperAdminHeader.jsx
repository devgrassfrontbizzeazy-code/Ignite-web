import { Menu, Shield, LogOut, ExternalLink } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { clearSuperAdminAuthSession } from "../../../services/api/axios";
import "./SuperAdminHeader.css";

export default function SuperAdminHeader({
  title = "Platform Overview",
  breadcrumbs = ["Super Admin", "Dashboard"],
  superAdminUser,
  onOpenMobileSidebar,
}) {
  const navigate = useNavigate();

  const handleLogout = () => {
    clearSuperAdminAuthSession();
    navigate("/admin/login", { replace: true });
  };

  const displayName =
    superAdminUser?.first_name || superAdminUser?.last_name
      ? `${superAdminUser.first_name || ""} ${superAdminUser.last_name || ""}`.trim()
      : superAdminUser?.username || "Platform Admin";

  const userEmail = superAdminUser?.email || "admin@ignite.platform";

  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "SA";

  return (
    <header className="super-header" role="banner">
      <div className="super-header__left">
        {/* Mobile toggle */}
        <button
          type="button"
          className="super-header__mobile-toggle"
          onClick={onOpenMobileSidebar}
          aria-label="Open navigation menu"
        >
          <Menu size={22} />
        </button>

        {/* Breadcrumbs & Title */}
        <div className="super-header__title-block">
          <nav aria-label="Breadcrumbs" className="super-header__breadcrumbs">
            <ol className="super-header__breadcrumbs-list">
              {breadcrumbs.map((crumb, idx) => (
                <li key={idx} className="super-header__breadcrumb-item">
                  <span>{crumb}</span>
                  {idx < breadcrumbs.length - 1 && (
                    <span className="super-header__breadcrumb-separator">/</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
          <h1 className="super-header__heading">{title}</h1>
        </div>
      </div>

      <div className="super-header__right">
        {/* Super Admin verified badge */}
        <div className="super-header__role-pill" title="Verified Django Platform Superuser">
          <Shield size={14} className="super-header__role-icon" />
          <span>Platform Super Admin</span>
        </div>

        {/* Tenant workspace switch */}
        <Link
          to="/dashboard"
          className="super-header__action-btn"
          title="Open regular tenant workspace"
        >
          <ExternalLink size={15} />
          <span className="super-header__action-btn-text">Workspace</span>
        </Link>

        {/* User profile dropdown / preview */}
        <div className="super-header__user-info">
          <div className="super-header__avatar" aria-hidden="true">
            {initials}
          </div>
          <div className="super-header__user-meta">
            <span className="super-header__user-name">{displayName}</span>
            <span className="super-header__user-email">{userEmail}</span>
          </div>
        </div>

        {/* Logout */}
        <button
          type="button"
          className="super-header__logout-btn"
          onClick={handleLogout}
          title="Sign out of Ignite"
          aria-label="Sign out"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}
