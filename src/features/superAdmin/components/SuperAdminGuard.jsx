import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { ShieldAlert, AlertTriangle, RefreshCw, ArrowLeft, LogOut } from "lucide-react";
import useSuperAdminAuth from "../hooks/useSuperAdminAuth";
import "./SuperAdminGuard.css";

export default function SuperAdminGuard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { authStatus, superAdminUser, errorMessage, verifyAccess } = useSuperAdminAuth();

  // 1. Unauthorized -> Redirect to Super Admin login with return path
  if (authStatus === "unauthorized") {
    return (
      <Navigate
        to="/admin/login"
        replace
        state={{
          from: location.pathname,
        }}
      />
    );
  }

  // 2. Loading state during backend verification
  if (authStatus === "loading") {
    return (
      <div className="super-guard-state super-guard-state--loading">
        <div className="super-guard-card">
          <div className="super-guard-spinner-wrap">
            <div className="super-guard-spinner" />
          </div>
          <h2 className="super-guard-title">Verifying Platform Privileges</h2>
          <p className="super-guard-desc">
            Validating platform superuser credentials directly with the server...
          </p>
        </div>
      </div>
    );
  }

  // 3. Forbidden (Authenticated, but ordinary employee or company admin)
  if (authStatus === "forbidden") {
    const handleLoginAsSuperAdmin = () => {
      navigate("/admin/login", {
        replace: true,
        state: { from: location.pathname },
      });
    };

    return (
      <div className="super-guard-state super-guard-state--forbidden">
        <div className="super-guard-card">
          <div className="super-guard-icon-badge super-guard-icon-badge--danger">
            <ShieldAlert size={36} />
          </div>
          <span className="super-guard-badge">Platform Security</span>
          <h2 className="super-guard-title">Platform Super Admin Privileges Required</h2>
          <p className="super-guard-desc">
            Access to the Ignite Platform Super Admin Panel is restricted to global platform superusers.
            Ordinary company administrators, managers, and employee accounts cannot access platform-wide data.
          </p>

          {errorMessage && (
            <div className="super-guard-alert-box">
              <span className="super-guard-alert-text">{errorMessage}</span>
            </div>
          )}

          <div className="super-guard-actions">
            <button
              type="button"
              className="super-guard-btn super-guard-btn--primary"
              onClick={() => navigate("/dashboard", { replace: true })}
            >
              <ArrowLeft size={16} />
              Return to Organization Workspace
            </button>
            <button
              type="button"
              className="super-guard-btn super-guard-btn--secondary"
              onClick={handleLoginAsSuperAdmin}
            >
              <LogOut size={16} />
              Sign in as Super Admin
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. Network or Server Error
  if (authStatus === "error") {
    return (
      <div className="super-guard-state super-guard-state--error">
        <div className="super-guard-card">
          <div className="super-guard-icon-badge super-guard-icon-badge--warning">
            <AlertTriangle size={36} />
          </div>
          <h2 className="super-guard-title">Verification Unavailable</h2>
          <p className="super-guard-desc">
            {errorMessage ||
              "Could not establish a connection to verify platform credentials. Please verify backend availability."}
          </p>

          <div className="super-guard-actions">
            <button
              type="button"
              className="super-guard-btn super-guard-btn--primary"
              onClick={verifyAccess}
            >
              <RefreshCw size={16} />
              Retry Verification
            </button>
            <button
              type="button"
              className="super-guard-btn super-guard-btn--secondary"
              onClick={() => navigate("/dashboard")}
            >
              <ArrowLeft size={16} />
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 5. Authorized Platform Super Admin
  return <Outlet context={{ superAdminUser }} />;
}
