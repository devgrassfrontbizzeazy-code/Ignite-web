import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../../assets/logo.png';
import './ForgotPassword.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Add your password reset API call here
      // Example: await sendPasswordResetEmail(email);
      console.log('Password reset email sent to:', email);
      setSubmitted(true);

      // Optionally redirect after 5 seconds
      // setTimeout(() => navigate('/login'), 5000);
    } catch (err) {
      setError('Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  if (submitted) {
    return (
      <div className="forgot-password-container">
        <div className="background-elements">
          <div className="background-shape bg-shape-1"></div>
          <div className="background-shape bg-shape-2"></div>
        </div>

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
            <p>We've sent a password reset link to:</p>
            <p className="email-display">{email}</p>
            
            <div className="security-info">
              <div className="security-item">
                <span className="security-icon">🔒</span>
                <p>Link expires in 24 hours</p>
              </div>
              <div className="security-item">
                <span className="security-icon">✓</span>
                <p>Check spam folder if not found</p>
              </div>
            </div>

            <p className="help-text">
              Didn't receive the email? Try checking your spam folder or contact support.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="success-actions">
            <button onClick={handleBackToLogin} className="primary-button">
              Back to Login
            </button>
            <button 
              onClick={() => setSubmitted(false)} 
              className="secondary-button"
            >
              Try Another Email
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="forgot-password-container">
      <div className="background-elements">
        <div className="background-shape bg-shape-1"></div>
        <div className="background-shape bg-shape-2"></div>
      </div>

      <div className="forgot-password-card">
        {/* Header with Back Button */}
        <div className="card-header-with-back">
          <Link to="/login" className="back-button" title="Back to login">
            ← Back
          </Link>
          <img src={logo} alt="IGNITE Logo" className="card-logo" />
        </div>

        {/* Welcome Section */}
        <div className="card-welcome">
          <h1>Forgot your password?</h1>
          <p>No worries! Enter your email address and we'll send you a link to reset it.</p>
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
        {error && <div className="error-message">{error}</div>}

        {/* Form */}
        <form onSubmit={handleSubmit} className="reset-form">
          <div className="form-group">
            <label htmlFor="email">Email address</label>
            <div className="input-wrapper">
              <span className="input-icon">✉</span>
              <input
                type="email"
                id="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="form-input"
              />
            </div>
            <p className="input-hint">
              Enter the email address associated with your IGNITE account
            </p>
          </div>

          {/* Security Notice */}
          <div className="security-notice">
            <span className="notice-icon">🔒</span>
            <p>Your email is safe with us. We'll never share it with anyone.</p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="submit-button"
            disabled={loading}
          >
            {loading ? 'Sending link...' : 'Send Reset Link'}
          </button>
        </form>


        {/* Support Link */}
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