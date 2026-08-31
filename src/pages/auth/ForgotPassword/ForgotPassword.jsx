import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../../../assets/logo.png";
import "./ForgotPassword.css";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    const trimmedEmail = email.trim();

    // Frontend validation
    if (!trimmedEmail) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);

    try {
      /*
       * Backend password reset API will be connected here.
       *
       * Example later:
       *
       * await sendPasswordResetEmail(trimmedEmail);
       *
       * The backend should return a generic success response
       * regardless of whether the email exists.
       */

      console.log("Password reset requested for:", trimmedEmail);

      // Temporary delay to test loading state
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setEmail(trimmedEmail);
      setSubmitted(true);
    } catch (err) {
      setError("Unable to process your request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate("/login");
  };

  const handleTryAnotherEmail = () => {
    setSubmitted(false);
    setEmail("");
    setError("");
  };

  // ------------------------------------------
  // SUCCESS STATE
  // ------------------------------------------

  if (submitted) {
    return (
      <div className="forgot-password-container">
        {/* Background Elements */}
        <div className="background-elements">
          <div className="background-shape bg-shape-1"></div>
          <div className="background-shape bg-shape-2"></div>
        </div>

        {/* Success Card */}
        <div className="forgot-password-card success-card">
          {/* Logo */}
          <div className="card-header">
            <img src={logo} alt="IGNITE Logo" className="card-logo" />
          </div>

          {/* Success Icon */}
          <div className="success-icon-wrapper">
            <div className="success-icon">✓</div>
          </div>

          {/* Success Message */}
          <div className="success-content">
            <h1>Check your email</h1>

            <p>
              If an IGNITE account is associated with this email, we've sent
              instructions to reset your password.
            </p>

            <p className="email-display">{email}</p>

            {/* Security Information */}
            <div className="security-info">
              <div className="security-item">
                <span className="security-icon">🔒</span>

                <p>Link expires in 24 hours</p>
              </div>

              <div className="security-item">
                <span className="security-icon">✓</span>

                <p>Check your spam folder if you don't see it</p>
              </div>
            </div>

            <p className="help-text">
              Didn't receive the email? Check your spam folder or try again with
              another email address.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="success-actions">
            <button
              type="button"
              onClick={handleBackToLogin}
              className="primary-button"
            >
              Back to Login
            </button>

            <button
              type="button"
              onClick={handleTryAnotherEmail}
              className="secondary-button"
            >
              Try Another Email
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ------------------------------------------
  // FORGOT PASSWORD FORM
  // ------------------------------------------

  return (
    <div className="forgot-password-container">
      {/* Background Elements */}
      <div className="background-elements">
        <div className="background-shape bg-shape-1"></div>
        <div className="background-shape bg-shape-2"></div>
      </div>
      {/* Page-level Back Link */}
      <Link to="/login" className="back-home-link" title="Back to login">
        <span className="back-arrow">←</span>
        Back 
      </Link>
      {/* Forgot Password Card */}
      <div className="forgot-password-card">
        {/* Header */}
        <div className="card-header-with-back">

          <img src={logo} alt="IGNITE Logo" className="card-logo" />
        </div>

        {/* Welcome Section */}
        <div className="card-welcome">
          <h1>Forgot your password?</h1>

          <p>
            No worries! Enter your email address and we'll send you a link to
            reset your password.
          </p>
        </div>

        {/* Step Indicator */}
        <div className="step-indicator">
          <div className="step active">
            <span className="step-number">1</span>

            <span className="step-label">Enter Email</span>
          </div>

          <div className="step-line"></div>

          <div className="step">
            <span className="step-number">2</span>

            <span className="step-label">Verify Link</span>
          </div>

          <div className="step-line"></div>

          <div className="step">
            <span className="step-number">3</span>

            <span className="step-label">Reset Password</span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-message" role="alert">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="reset-form" noValidate>
          {/* Email Field */}
          <div className="form-group">
            <label htmlFor="email">Email address</label>

            <div className="input-wrapper">
              <span className="input-icon" aria-hidden="true">
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
                className="form-input"
              />
            </div>

            <p className="input-hint">
              Enter the email address associated with your IGNITE account.
            </p>
          </div>

          {/* Security Notice */}
          <div className="security-notice">
            <span className="notice-icon">🔒</span>

            <p>
              We'll send a secure password reset link to this email address.
            </p>
          </div>

          {/* Submit Button */}
          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? "Sending link..." : "Send Reset Link"}
          </button>
        </form>

        {/* Support Section */}
        <div className="support-section">
          <p>Need immediate help?</p>

          <a href="mailto:support@ignite.com" className="support-link">
            Contact our support team
          </a>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
