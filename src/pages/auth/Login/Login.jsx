import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import logo from "../../../assets/logo.png";
import "./Login.css";

import { loginUser } from "../../../services/api/authAPI";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const location = useLocation();

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
      // Call Django login API
      const response = await loginUser(trimmedEmail, password);

      console.log("Login response:", response);

      // Make sure login was successful
      if (response.status !== "success") {
        throw new Error(response.message || "Login failed.");
      }

      const { user, tokens } = response;

      // Save authentication data
      localStorage.setItem("accessToken", tokens.access);
      localStorage.setItem("refreshToken", tokens.refresh);
      localStorage.setItem("user", JSON.stringify(user));

      // Keep this temporarily because your current ProtectedRoute
      // and other parts of the frontend may still use it.
      localStorage.setItem("ignite_authenticated", "true");

      /*
       * TEMPORARY SETUP CHECK
       *
       * Later this will come from a backend API such as:
       * GET /company/setup/status/
       *
       * For now we use localStorage.
       */
      const companySetupComplete =
        localStorage.getItem("companySetupComplete") === "true";

      if (!companySetupComplete) {
        navigate("/company-setup/company-details", { replace: true });
      } else {
        // If user was originally trying to access a protected page,
        // send them there. Otherwise go to dashboard.
        const from = location.state?.from;

        navigate(from || "/dashboard", { replace: true });
      }
    } catch (err) {
      console.error("Login error:", err);

      const backendMessage =
        err?.response?.data?.message ||
        err?.response?.data?.detail ||
        err?.message;

      setError(
        backendMessage || "Invalid email or password. Please try again."
      );
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
      <Link to="/" className="back-home-link">
        <span className="back-arrow">←</span>
        Back
      </Link>

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
            <label htmlFor="email">Email address</label>

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
                aria-label={
                  showPassword ? "Hide password" : "Show password"
                }
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

            <Link
              to="/forgot-password"
              className="forgot-password-link"
            >
              Forgot password?
            </Link>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;