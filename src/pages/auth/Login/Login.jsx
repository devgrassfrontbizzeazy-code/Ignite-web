import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import BackButton from "../../../components/common/BackButton/BackButton";
import logo from "../../../assets/logo.png";
import "./Login.css";

import api from "../../../services/api/axios";
import { loginUser } from "../../../services/api/authAPI";
import { getCompany } from "../../../services/api/companyAPI";

const Login = () => {
  const location = useLocation();
  const [email, setEmail] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("email") || "";
  });
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    // Non-blocking pre-warm ping to wake up cloud backend (Render) while user types credentials
    api.get("/health/").catch(() => {});
  }, []);

  const getErrorMessage = (err) => {
    const data = err?.response?.data;

    if (!data) {
      return err?.message || "Unable to connect to the server.";
    }

    if (typeof data.detail === "string") {
      return data.detail;
    }

    if (typeof data.message === "string") {
      return data.message;
    }

    if (typeof data === "object") {
      const firstError = Object.values(data)
        .flat()
        .find((value) => typeof value === "string");

      if (firstError) {
        return firstError;
      }
    }

    return "Unable to complete login. Please try again.";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setError("Please enter your email address.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      // ------------------------------------------
      // LOGIN
      // ------------------------------------------

      const response = await loginUser(trimmedEmail, password);

      if (response.status !== "success") {
        throw new Error(response.message || "Login failed.");
      }

      const { user, tokens } = response;

      // ------------------------------------------
      // SAVE AUTH DATA
      // ------------------------------------------

      localStorage.setItem("accessToken", tokens.access);

      localStorage.setItem("refreshToken", tokens.refresh);

      localStorage.setItem("user", JSON.stringify(user));

      localStorage.setItem("ignite_authenticated", "true");

      // ------------------------------------------
      // CHECK ROLE & COMPANY SETUP
      // ------------------------------------------

      const role = String(user?.role || "").toUpperCase();
      const isOwnerOrAdmin =
        role === "OWNER" ||
        role === "ADMIN" ||
        role === "ADMINISTRATOR";

      // Field Sales employees go directly to Field Sales
      if (user?.is_field_sales === true) {
        navigate("/field-sales", {
          replace: true,
        });
        return;
      }

      const hasCompany = Boolean(user?.company_id || user?.companyId || user?.company);
      const from = location.state?.from;

      // Non-owners (employees, managers, members) or users with an established company navigate directly
      if (!isOwnerOrAdmin || hasCompany) {
        navigate(from || "/dashboard", {
          replace: true,
        });
        return;
      }

      // If user is owner/admin without a company, check or navigate to company setup
      try {
        const companyResponse = await getCompany();
        navigate(from || "/dashboard", {
          replace: true,
        });
      } catch (companyError) {
        const status = companyError?.response?.status;
        if (status === 404) {
          navigate("/company-setup/company-details", {
            replace: true,
          });
          return;
        }

        navigate(from || "/dashboard", {
          replace: true,
        });
      }
    } catch (err) {
      console.error("Login error:", err);

      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <div className="login-container">
      {/* Back to Home */}
      <div className="login-back-button">
        <BackButton label="Back" onClick={() => navigate("/")} />
      </div>

      {/* Background Elements */}
      <div className="login-background-elements">
        <div className="background-shape bg-shape-1"></div>

        <div className="background-shape bg-shape-2"></div>
      </div>

      {/* Login Card */}
      <div className="login-card">
        {/* Logo */}
        <div className="login-header">
          <img src={logo} alt="IGNITE Logo" className="login-logo" />
        </div>

        {/* Welcome Text */}
        <div className="login-welcome">
          <h1>Welcome back</h1>

          <p>Sign in to access your IGNITE account</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-message" role="alert">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="login-form" noValidate>
          {/* Email */}
          <div className="form-group">
            <label htmlFor="email">Email Address</label>

            <div className="input-wrapper">
              <div className="input-icon" aria-hidden="true">
                <Mail size={18} strokeWidth={2} />
              </div>

              <input
                type="email"
                id="email"
                name="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                autoComplete="email"
                disabled={loading}
                className="form-input"
              />
            </div>
          </div>

          {/* Password */}
          <div className="form-group">
            <label htmlFor="password">Password</label>

            <div className="input-wrapper">
              <div className="input-icon" aria-hidden="true">
                <Lock size={18} strokeWidth={2} />
              </div>

              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                autoComplete="current-password"
                disabled={loading}
                className="form-input"
              />

              <button
                type="button"
                className="password-toggle"
                onClick={togglePasswordVisibility}
                aria-label={showPassword ? "Hide password" : "Show password"}
                disabled={loading}
              >
                {showPassword ? (
                  <EyeOff size={18} strokeWidth={2} />
                ) : (
                  <Eye size={18} strokeWidth={2} />
                )}
              </button>
            </div>
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="form-footer">
            <div className="remember-me">
              <input
                type="checkbox"
                id="remember"
                name="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={loading}
                className="checkbox-input"
              />

              <label htmlFor="remember" className="checkbox-label">
                Remember me
              </label>
            </div>

            <Link to="/forgot-password" className="forgot-password-link">
              Forgot password?
            </Link>
          </div>

          {/* Login Button */}
          <button type="submit" className="login-button" disabled={loading}>
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
