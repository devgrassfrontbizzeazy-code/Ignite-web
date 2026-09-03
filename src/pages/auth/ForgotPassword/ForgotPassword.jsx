import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../../../assets/logo.png";
import "./ForgotPassword.css";

import {
  sendForgotPasswordOtp,
  verifyForgotPasswordOtp,
} from "../../../services/api/authAPI";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");

  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);

  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  // ------------------------------------------
  // ERROR MESSAGE HELPER
  // ------------------------------------------

  const getErrorMessage = (err, fallback) => {
    const data = err.response?.data;

    if (!data) {
      return "Unable to connect to the server. Please try again.";
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

    return fallback;
  };

  // ------------------------------------------
  // SEND OTP
  // ------------------------------------------

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    const trimmedEmail = email.trim();

    // Frontend validation
    if (!trimmedEmail) {
      setError("Please enter your email address.");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    try {
      const response = await sendForgotPasswordOtp(trimmedEmail);

      console.log("Forgot password OTP sent:", response);

      setEmail(trimmedEmail);
      setOtp("");
      setSubmitted(true);
    } catch (err) {
      console.error("Send forgot password OTP failed:", err);

      setError(
        getErrorMessage(
          err,
          "Unable to send the verification code. Please try again."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------------
  // VERIFY OTP
  // ------------------------------------------

  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    setError("");

    const trimmedOtp = otp.trim();

    if (!trimmedOtp) {
      setError("Please enter the verification code.");
      return;
    }

    if (!/^\d{6}$/.test(trimmedOtp)) {
      setError("Please enter the 6-digit verification code.");
      return;
    }

    setOtpLoading(true);

    try {
      const response = await verifyForgotPasswordOtp(
        email,
        trimmedOtp
      );

      console.log("Forgot password OTP verified:", response);

      const resetToken = response?.reset_token;

      if (!resetToken) {
        setError(
          "Verification succeeded, but no reset token was received. Please try again."
        );
        return;
      }

      /*
       * Pass email and reset token through React Router state.
       *
       * We intentionally do NOT put reset_token in the URL.
       */
      navigate("/reset-password", {
        state: {
          email,
          resetToken,
        },
      });
    } catch (err) {
      console.error("Verify forgot password OTP failed:", err);

      setError(
        getErrorMessage(
          err,
          "Invalid or expired verification code. Please try again."
        )
      );
    } finally {
      setOtpLoading(false);
    }
  };

  // ------------------------------------------
  // RESEND OTP
  // ------------------------------------------

  const handleResendOtp = async () => {
    setError("");
    setOtp("");

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setError("Please enter your email address.");
      setSubmitted(false);
      return;
    }

    setLoading(true);

    try {
      const response = await sendForgotPasswordOtp(trimmedEmail);

      console.log("Forgot password OTP resent:", response);
    } catch (err) {
      console.error("Resend forgot password OTP failed:", err);

      setError(
        getErrorMessage(
          err,
          "Unable to resend the verification code. Please try again."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------------
  // BACK TO LOGIN
  // ------------------------------------------

  const handleBackToLogin = () => {
    navigate("/login");
  };

  // ------------------------------------------
  // CHANGE EMAIL
  // ------------------------------------------

  const handleTryAnotherEmail = () => {
    setSubmitted(false);
    setEmail("");
    setOtp("");
    setError("");
  };

  // ==========================================
  // OTP STATE
  // ==========================================

  if (submitted) {
    return (
      <div className="forgot-password-container">

        {/* Background Elements */}
        <div className="background-elements">
          <div className="background-shape bg-shape-1"></div>
          <div className="background-shape bg-shape-2"></div>
        </div>

        {/* Success / OTP Card */}
        <div className="forgot-password-card success-card">

          {/* Logo */}
          <div className="card-header">
            <img
              src={logo}
              alt="IGNITE Logo"
              className="card-logo"
            />
          </div>

          {/* Icon */}
          <div className="success-icon-wrapper">
            <div className="success-icon">
              ✉
            </div>
          </div>

          {/* Content */}
          <div className="success-content">

            <h1>
              Check your email
            </h1>

            <p>
              We've sent a 6-digit verification code to
            </p>

            <p className="email-display">
              {email}
            </p>

            {/* OTP Form */}
            <form
              onSubmit={handleVerifyOtp}
              className="reset-form"
              noValidate
            >

              {/* Error */}
              {error && (
                <div
                  className="error-message"
                  role="alert"
                >
                  {error}
                </div>
              )}

              {/* OTP */}
              <div className="form-group">

                <label htmlFor="otp">
                  Verification code
                </label>

                <div className="input-wrapper">

                  <span
                    className="input-icon"
                    aria-hidden="true"
                  >
                    🔐
                  </span>

                  <input
                    type="text"
                    id="otp"
                    name="otp"
                    placeholder="Enter 6-digit code"
                    value={otp}
                    onChange={(e) => {
                      const value = e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 6);

                      setOtp(value);
                      setError("");
                    }}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    disabled={otpLoading}
                    required
                    className="form-input"
                  />

                </div>

                <p className="input-hint">
                  Enter the 6-digit code sent to your email.
                </p>

              </div>

              {/* Security Information */}
              <div className="security-info">

                <div className="security-item">
                  <span className="security-icon">
                    🔒
                  </span>

                  <p>
                    Use the verification code to securely reset
                    your password.
                  </p>
                </div>

                <div className="security-item">
                  <span className="security-icon">
                    ✓
                  </span>

                  <p>
                    Check your spam folder if you don't see the email.
                  </p>
                </div>

              </div>

              {/* Verify */}
              <button
                type="submit"
                className="submit-button"
                disabled={
                  otpLoading ||
                  otp.length !== 6
                }
              >
                {otpLoading
                  ? "Verifying..."
                  : "Verify Code"}
              </button>

            </form>

            {/* Resend */}
            <p className="help-text">
              Didn't receive the code?
            </p>

            <button
              type="button"
              onClick={handleResendOtp}
              className="secondary-button"
              disabled={loading}
            >
              {loading
                ? "Resending..."
                : "Resend Code"}
            </button>

          </div>

          {/* Actions */}
          <div className="success-actions">

            <button
              type="button"
              onClick={handleTryAnotherEmail}
              className="secondary-button"
              disabled={loading || otpLoading}
            >
              Change Email
            </button>

            <button
              type="button"
              onClick={handleBackToLogin}
              className="primary-button"
              disabled={loading || otpLoading}
            >
              Back to Login
            </button>

          </div>

        </div>
      </div>
    );
  }

  // ==========================================
  // EMAIL FORM
  // ==========================================

  return (
    <div className="forgot-password-container">

      {/* Background Elements */}
      <div className="background-elements">
        <div className="background-shape bg-shape-1"></div>
        <div className="background-shape bg-shape-2"></div>
      </div>

      {/* Page-level Back Link */}
      <Link
        to="/login"
        className="back-home-link"
        title="Back to login"
      >
        <span className="back-arrow">
          ←
        </span>

        Back
      </Link>

      {/* Forgot Password Card */}
      <div className="forgot-password-card">

        {/* Header */}
        <div className="card-header-with-back">

          <img
            src={logo}
            alt="IGNITE Logo"
            className="card-logo"
          />

        </div>

        {/* Welcome Section */}
        <div className="card-welcome">

          <h1>
            Forgot your password?
          </h1>

          <p>
            No worries! Enter your email address and
            we'll send you a verification code to reset
            your password.
          </p>

        </div>

        {/* Step Indicator */}
        <div className="step-indicator">

          <div className="step active">

            <span className="step-number">
              1
            </span>

            <span className="step-label">
              Enter Email
            </span>

          </div>

          <div className="step-line"></div>

          <div className="step">

            <span className="step-number">
              2
            </span>

            <span className="step-label">
              Verify OTP
            </span>

          </div>

          <div className="step-line"></div>

          <div className="step">

            <span className="step-number">
              3
            </span>

            <span className="step-label">
              Reset Password
            </span>

          </div>

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

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="reset-form"
          noValidate
        >

          {/* Email Field */}
          <div className="form-group">

            <label htmlFor="email">
              Email address
            </label>

            <div className="input-wrapper">

              <span
                className="input-icon"
                aria-hidden="true"
              >
                ✉
              </span>

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
                required
                className="form-input"
              />

            </div>

            <p className="input-hint">
              Enter the email address associated with
              your IGNITE account.
            </p>

          </div>

          {/* Security Notice */}
          <div className="security-notice">

            <span className="notice-icon">
              🔒
            </span>

            <p>
              We'll send a secure 6-digit verification
              code to this email address.
            </p>

          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="submit-button"
            disabled={loading}
          >
            {loading
              ? "Sending code..."
              : "Send Verification Code"}
          </button>

        </form>

        {/* Support Section */}
        <div className="support-section">

          <p>
            Need immediate help?
          </p>

          <a
            href="mailto:support@ignite.com"
            className="support-link"
          >
            Contact our support team
          </a>

        </div>

      </div>
    </div>
  );
};

export default ForgotPassword;

