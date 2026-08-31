import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import logo from '../../assets/logo.png';
import './ResetPassword.css';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordMatch, setPasswordMatch] = useState(true);

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setError('Invalid reset link. Please request a new password reset.');
    }
  }, [token]);

  // Calculate password strength
  useEffect(() => {
    let strength = 0;
    if (password.length >= 8) strength += 20;
    if (password.length >= 12) strength += 20;
    if (/[a-z]/.test(password)) strength += 15;
    if (/[A-Z]/.test(password)) strength += 15;
    if (/[0-9]/.test(password)) strength += 15;
    if (/[!@#$%^&*]/.test(password)) strength += 15;

    setPasswordStrength(strength);
  }, [password]);

  // Check password match
  useEffect(() => {
    if (confirmPassword) {
      setPasswordMatch(password === confirmPassword);
    }
  }, [password, confirmPassword]);

  const getPasswordStrengthLabel = () => {
    if (passwordStrength < 20) return 'Very Weak';
    if (passwordStrength < 40) return 'Weak';
    if (passwordStrength < 60) return 'Fair';
    if (passwordStrength < 80) return 'Good';
    return 'Strong';
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 20) return '#e74c3c';
    if (passwordStrength < 40) return '#e67e22';
    if (passwordStrength < 60) return '#f5a623';
    if (passwordStrength < 80) return '#27ae60';
    return '#27ae60';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      setLoading(false);
      return;
    }

    if (!passwordMatch) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    if (passwordStrength < 40) {
      setError('Password is too weak. Please use a stronger password.');
      setLoading(false);
      return;
    }

    try {
      // Add your password reset API call here
      // Example: await resetPassword(token, password);
      console.log('Password reset with token:', token);
      setSuccess(true);

      // Redirect after 3 seconds
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError('Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="reset-password-container">
        <div className="background-elements">
          <div className="background-shape bg-shape-1"></div>
          <div className="background-shape bg-shape-2"></div>
        </div>

        <div className="reset-password-card error-card">
          <div className="card-header">
            <img src={logo} alt="IGNITE Logo" className="card-logo" />
          </div>

          <div className="error-icon-wrapper">
            <div className="error-icon">⚠</div>
          </div>

          <div className="error-content">
            <h1>Invalid Reset Link</h1>
            <p>The reset link is invalid or has expired. Please request a new one.</p>

            <div className="error-actions">
              <Link to="/forgot-password" className="primary-button">
                Request New Reset Link
              </Link>
              <Link to="/login" className="secondary-button">
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="reset-password-container">
        <div className="background-elements">
          <div className="background-shape bg-shape-1"></div>
          <div className="background-shape bg-shape-2"></div>
        </div>

        <div className="reset-password-card success-card">
          <div className="card-header">
            <img src={logo} alt="IGNITE Logo" className="card-logo" />
          </div>

          <div className="success-icon-wrapper">
            <div className="success-icon">✓</div>
          </div>

          <div className="success-content">
            <h1>Password reset successful!</h1>
            <p>Your password has been successfully updated.</p>
            <p className="success-message">You can now log in with your new password.</p>

            <div className="security-tips">
              <h3>Security Tips:</h3>
              <ul>
                <li>Use a unique password you haven't used before</li>
                <li>Store your password securely</li>
                <li>Enable two-factor authentication for extra security</li>
              </ul>
            </div>
          </div>

          <div className="success-actions">
            <Link to="/login" className="primary-button">
              Go to Login
            </Link>
          </div>

          <p className="redirecting-text">Redirecting to login page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="reset-password-container">
      <div className="background-elements">
        <div className="background-shape bg-shape-1"></div>
        <div className="background-shape bg-shape-2"></div>
      </div>

      <div className="reset-password-card">
        {/* Header */}
        <div className="card-header-with-back">
          <Link to="/login" className="back-button" title="Back to login">
            ← Back
          </Link>
          <img src={logo} alt="IGNITE Logo" className="card-logo" />
        </div>

        {/* Welcome Section */}
        <div className="card-welcome">
          <h1>Create a new password</h1>
          <p>Enter a strong password to secure your IGNITE account.</p>
        </div>

        {/* Step Indicator */}
        <div className="step-indicator-minimal">
          <div className="step-item active">
            <span className="step-dot">✓</span>
            <span className="step-text">Email verified</span>
          </div>
          <div className="step-item active">
            <span className="step-dot">2</span>
            <span className="step-text">Reset password</span>
          </div>
        </div>

        {/* Error Message */}
        {error && <div className="error-message">{error}</div>}

        {/* Form */}
        <form onSubmit={handleSubmit} className="reset-form">
          {/* New Password Field */}
          <div className="form-group">
            <label htmlFor="password">New password</label>
            <div className="input-wrapper">
              <span className="input-icon">🔒</span>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="form-input"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Toggle password visibility"
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>

            {/* Password Strength Indicator */}
            {password && (
              <div className="password-strength-wrapper">
                <div className="strength-bar">
                  <div
                    className="strength-fill"
                    style={{
                      width: `${Math.min(passwordStrength, 100)}%`,
                      backgroundColor: getPasswordStrengthColor(),
                    }}
                  ></div>
                </div>
                <p className="strength-label">
                  Strength:
                  <span style={{ color: getPasswordStrengthColor() }}>
                    {' '}{getPasswordStrengthLabel()}
                  </span>
                </p>
              </div>
            )}

            {/* Password Requirements */}
            <div className="password-requirements">
              <p className="requirements-title">Password must contain:</p>
              <div className="requirement-item">
                <span className={password.length >= 8 ? 'check-icon' : 'check-icon-empty'}>
                  {password.length >= 8 ? '✓' : '○'}
                </span>
                <span>At least 8 characters</span>
              </div>
              <div className="requirement-item">
                <span className={/[A-Z]/.test(password) ? 'check-icon' : 'check-icon-empty'}>
                  {/[A-Z]/.test(password) ? '✓' : '○'}
                </span>
                <span>Uppercase letter (A-Z)</span>
              </div>
              <div className="requirement-item">
                <span className={/[a-z]/.test(password) ? 'check-icon' : 'check-icon-empty'}>
                  {/[a-z]/.test(password) ? '✓' : '○'}
                </span>
                <span>Lowercase letter (a-z)</span>
              </div>
              <div className="requirement-item">
                <span className={/[0-9]/.test(password) ? 'check-icon' : 'check-icon-empty'}>
                  {/[0-9]/.test(password) ? '✓' : '○'}
                </span>
                <span>Number (0-9)</span>
              </div>
              <div className="requirement-item">
                <span className={/[!@#$%^&*]/.test(password) ? 'check-icon' : 'check-icon-empty'}>
                  {/[!@#$%^&*]/.test(password) ? '✓' : '○'}
                </span>
                <span>Special character (!@#$%^&*)</span>
              </div>
            </div>
          </div>

          {/* Confirm Password Field */}
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm password</label>
            <div className="input-wrapper">
              <span className="input-icon">🔒</span>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className={`form-input ${confirmPassword && !passwordMatch ? 'error' : ''}`}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label="Toggle confirm password visibility"
              >
                {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {confirmPassword && !passwordMatch && (
              <p className="error-text">Passwords do not match</p>
            )}
            {confirmPassword && passwordMatch && (
              <p className="success-text">✓ Passwords match</p>
            )}
          </div>

          {/* Security Notice */}
          <div className="security-notice">
            <span className="notice-icon">🔐</span>
            <p>Your password will be encrypted and never shared. Keep it safe and unique.</p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="submit-button"
            disabled={loading || !passwordMatch || passwordStrength < 40}
          >
            {loading ? 'Resetting password...' : 'Reset Password'}
          </button>
        </form>

        {/* Support Section */}
        <div className="support-section">
          <p>Having trouble?</p>
          <a href="mailto:support@ignite.com" className="support-link">
            Contact our support team
          </a>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;