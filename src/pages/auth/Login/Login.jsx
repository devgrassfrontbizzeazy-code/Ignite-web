import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

import logo from "../../../assets/logo.png";
import "./Login.css";

import { loginUser } from "../../../services/api/authAPI";
import { getCompany } from "../../../services/api/companyAPI";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const location = useLocation();

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

      const response = await loginUser(
        trimmedEmail,
        password
      );

      console.log("Login response:", response);

      if (response.status !== "success") {
        throw new Error(
          response.message || "Login failed."
        );
      }

      const { user, tokens } = response;

      // ------------------------------------------
      // SAVE AUTH DATA
      // ------------------------------------------

      localStorage.setItem(
        "accessToken",
        tokens.access
      );

      localStorage.setItem(
        "refreshToken",
        tokens.refresh
      );

      localStorage.setItem(
        "user",
        JSON.stringify(user)
      );

      localStorage.setItem(
        "ignite_authenticated",
        "true"
      );

      // ------------------------------------------
      // CHECK COMPANY SETUP
      // ------------------------------------------

      try {
        const companyResponse = await getCompany();

        console.log(
          "Company details found:",
          companyResponse
        );

        /*
         * Company exists.
         *
         * User has already completed company setup,
         * so take them directly to the application.
         */

        const from = location.state?.from;

        navigate(
          from || "/dashboard",
          {
            replace: true,
          }
        );

      } catch (companyError) {

        const status =
          companyError?.response?.status;

        /*
         * 404 means the authenticated user does not
         * have a company record yet.
         *
         * Therefore they must complete company setup.
         */

        if (status === 404) {

          navigate(
            "/company-setup/company-details",
            {
              replace: true,
            }
          );

          return;
        }

        /*
         * Do NOT assume that every error means
         * company setup is incomplete.
         *
         * A 500 / network error is a backend problem.
         */

        console.error(
          "Company setup check failed:",
          companyError
        );

        throw new Error(
          "Unable to verify your company setup. Please try again."
        );
      }

    } catch (err) {

      console.error(
        "Login error:",
        err
      );

      setError(
        getErrorMessage(err)
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
      <Link
        to="/"
        className="back-home-link"
      >
        <span className="back-arrow">
          ←
        </span>

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

          <img
            src={logo}
            alt="IGNITE Logo"
            className="login-logo"
          />

        </div>

        {/* Welcome Text */}
        <div className="login-welcome">

          <h1>
            Welcome back
          </h1>

          <p>
            Sign in to access your IGNITE account
          </p>

        </div>

        {/* Error Message */}
        {error && (
          <div
            className="error-message"
            role="alert"
          >
            {error}
          </div>
        )}

        {/* Login Form */}
        <form
          onSubmit={handleSubmit}
          className="login-form"
          noValidate
        >

          {/* Email */}
          <div className="form-group">

            <label htmlFor="email">
              Email address
            </label>

            <div className="input-wrapper">

              <div
                className="input-icon"
                aria-hidden="true"
              >
                <Mail
                  size={18}
                  strokeWidth={2}
                />
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

            <label htmlFor="password">
              Password
            </label>

            <div className="input-wrapper">

              <div
                className="input-icon"
                aria-hidden="true"
              >
                <Lock
                  size={18}
                  strokeWidth={2}
                />
              </div>

              <input
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
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
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
                disabled={loading}
              >
                {showPassword ? (
                  <EyeOff
                    size={18}
                    strokeWidth={2}
                  />
                ) : (
                  <Eye
                    size={18}
                    strokeWidth={2}
                  />
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
                onChange={(e) =>
                  setRememberMe(e.target.checked)
                }
                disabled={loading}
                className="checkbox-input"
              />

              <label
                htmlFor="remember"
                className="checkbox-label"
              >
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
            {loading
              ? "Logging in..."
              : "Log in"}
          </button>

        </form>

      </div>

    </div>
  );
};

export default Login;

