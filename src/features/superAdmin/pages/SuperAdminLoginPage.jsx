import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import logo from "../../../assets/logo.png";
import superAdminAPI from "../services/superAdminAPI";
import {
  setSuperAdminAuthSession,
  getSuperAdminAccessToken,
} from "../../../services/api/axios";
import "./SuperAdminLoginPage.css";

export default function SuperAdminLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingExisting, setCheckingExisting] = useState(true);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  // Destination route after login
  const destination = location.state?.from || "/admin";

  // Check if already authenticated as a platform super admin
  useEffect(() => {
    let isMounted = true;
    const checkCurrentSession = async () => {
      const token = getSuperAdminAccessToken();
      if (!token) {
        if (isMounted) setCheckingExisting(false);
        return;
      }

      try {
        const response = await superAdminAPI.getMe();
        const userData = response?.data;
        if (userData?.is_superuser && userData?.is_active) {
          navigate(destination, { replace: true });
          return;
        }
      } catch {
        // Token invalid, expired, or non-superuser; stay on login page
      } finally {
        if (isMounted) setCheckingExisting(false);
      }
    };

    checkCurrentSession();
    return () => {
      isMounted = false;
    };
  }, [navigate, destination]);

  const validate = () => {
    const errs = {};
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      errs.email = "Super Admin email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errs.email = "Please enter a valid email address.";
    }

    if (!password) {
      errs.password = "Password is required.";
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      // 1. Submit credentials to dedicated /api/super-admin/login/
      const response = await superAdminAPI.login({
        email: email.trim(),
        password,
      });

      const responseData = response?.data || response;
      const tokens = responseData?.tokens;
      const user = responseData?.user;

      if (!tokens?.access) {
        throw new Error("Invalid authentication response received from server.");
      }

      // 2. Securely store isolated Super Admin session
      setSuperAdminAuthSession({
        access: tokens.access,
        refresh: tokens.refresh,
        user,
      });

      // 3. Immediately verify session against /api/super-admin/me/ before redirecting
      const verified = await superAdminAPI.getMe();
      const verifiedUser = verified?.data;

      if (!verifiedUser?.is_superuser) {
        superAdminAPI.logout();
        setError("Access restricted. This account does not possess Django superuser privileges.");
        setLoading(false);
        return;
      }

      // 4. Redirect to Super Admin Console
      navigate(destination, { replace: true });
    } catch (err) {
      const backendMessage =
        err?.response?.data?.message ||
        err?.response?.data?.detail ||
        (Array.isArray(err?.response?.data?.non_field_errors)
          ? err.response.data.non_field_errors[0]
          : null) ||
        err?.message ||
        "Authentication failed. Please check your credentials.";

      setError(backendMessage);
    } finally {
      setLoading(false);
    }
  };

  if (checkingExisting) {
    return (
      <div className="sa-login-container sa-login-container--loading">
        <div className="sa-login-spinner-card">
          <Loader2 className="sa-login-spinner" size={32} />
          <p>Verifying administrative privileges...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sa-login-container">
      <div className="sa-login-card">
        {/* Logo and Brand Header */}
        <div className="sa-login-header">
          <img src={logo} alt="Ignite" className="sa-login-logo" />
          <div className="sa-login-pill">
            <ShieldCheck size={13} />
            <span>Platform Super Admin</span>
          </div>
          <h1 className="sa-login-title">Sign in to Admin Console</h1>
          <p className="sa-login-subtitle">
            Restricted to authorized system administrators and infrastructure operators.
          </p>
        </div>

        {/* Global Error Alert */}
        {error && (
          <div className="sa-login-alert" role="alert">
            <AlertCircle className="sa-login-alert-icon" size={18} />
            <div className="sa-login-alert-body">
              <span className="sa-login-alert-title">Authentication Failed</span>
              <span className="sa-login-alert-text">{error}</span>
            </div>
          </div>
        )}

        {/* Login Form */}
        <form className="sa-login-form" onSubmit={handleSubmit} noValidate>
          {/* Email Field */}
          <div className="sa-form-group">
            <label className="sa-form-label" htmlFor="sa-email">
              Administrator Email
            </label>
            <div
              className={`sa-input-wrapper ${
                fieldErrors.email ? "sa-input-wrapper--error" : ""
              }`}
            >
              <Mail className="sa-input-icon" size={18} />
              <input
                id="sa-email"
                type="email"
                autoComplete="email"
                className="sa-input"
                placeholder="superadmin@ignite.platform"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) {
                    setFieldErrors((prev) => ({ ...prev, email: null }));
                  }
                }}
                disabled={loading}
                autoFocus
              />
            </div>
            {fieldErrors.email && (
              <span className="sa-field-error">{fieldErrors.email}</span>
            )}
          </div>

          {/* Password Field */}
          <div className="sa-form-group">
            <div className="sa-label-row">
              <label className="sa-form-label" htmlFor="sa-password">
                Password
              </label>
            </div>
            <div
              className={`sa-input-wrapper ${
                fieldErrors.password ? "sa-input-wrapper--error" : ""
              }`}
            >
              <Lock className="sa-input-icon" size={18} />
              <input
                id="sa-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                className="sa-input"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) {
                    setFieldErrors((prev) => ({ ...prev, password: null }));
                  }
                }}
                disabled={loading}
              />
              <button
                type="button"
                className="sa-password-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {fieldErrors.password && (
              <span className="sa-field-error">{fieldErrors.password}</span>
            )}
          </div>

          {/* Security Notice */}
          <div className="sa-security-notice">
            <span>
              All console access events are monitored and recorded with client IP and tamper-evident audit trails.
            </span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="sa-submit-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="sa-submit-spinner" size={18} />
                Authenticating...
              </>
            ) : (
              <>
                Authenticate Console
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Tenant Login Link */}
        <div className="sa-login-footer">
          <span className="sa-footer-text">
            Not a platform administrator?
          </span>
          <Link to="/login" className="sa-footer-link">
            Return to Organization Workspace →
          </Link>
        </div>
      </div>
    </div>
  );
}
