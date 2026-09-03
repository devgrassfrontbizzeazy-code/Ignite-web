import React, { useState, useRef, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import logo from "../../../assets/logo.png";
import "./CreateAccount.css";

import {
  sendSignupOtp,
  verifySignupOtp,
  completeSignup,
} from "../../../services/api/authAPI";
/*
 * Public Create Account page.
 *
 * Flow:
 *   email -> otp -> password -> success
 *
 * Reached from the marketing site's "Get Started" button, e.g. `/signup`.
 * No invitation token, no company context — the person creating the
 * account is the company owner/admin who will set up their org next.
 *
 * All OTP + account-creation logic below is mocked on the frontend so the
 * full flow can be exercised end to end. Each mock function is isolated
 * and commented with the real API call it should be replaced with once
 * the backend is ready — swap the function body, leave the surrounding
 * state/handlers as-is.
 */

const OTP_LENGTH = 6;

const PASSWORD_RULES = [
  {
    id: "length",
    label: "At least 8 characters",
    test: (pw) => pw.length >= 8,
  },
  {
    id: "upper",
    label: "One uppercase letter",
    test: (pw) => /[A-Z]/.test(pw),
  },
  {
    id: "lower",
    label: "One lowercase letter",
    test: (pw) => /[a-z]/.test(pw),
  },
  { id: "number", label: "One number", test: (pw) => /\d/.test(pw) },
  {
    id: "special",
    label: "One special character",
    test: (pw) => /[^A-Za-z0-9]/.test(pw),
  },
];

const getPasswordStrength = (password) => {
  if (!password) return { score: 0, label: "" };

  const passedRules = PASSWORD_RULES.filter((rule) =>
    rule.test(password),
  ).length;

  if (passedRules <= 2) return { score: 1, label: "Weak" };
  if (passedRules <= 4) return { score: 2, label: "Medium" };
  return { score: 3, label: "Strong" };
};

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const CreateAccount = () => {
  const navigate = useNavigate();

  // Step state: "email" | "otp" | "password" | "success"
  const [step, setStep] = useState("email");

  // Email step
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");

  // OTP step
  // OTP step
  const [otpDigits, setOtpDigits] = useState(Array(OTP_LENGTH).fill(""));
  const [otpError, setOtpError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [verificationToken, setVerificationToken] = useState("");
  const otpInputRefs = useRef([]);

  // Password step
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const passwordStrength = useMemo(
    () => getPasswordStrength(password),
    [password],
  );

  /* ------------------------------------------------------------------ */
  /* Mock backend calls — replace bodies with real API calls later.     */
  /* ------------------------------------------------------------------ */

  

  /* ------------------------------------------------------------------ */
  /* Email step                                                         */
  /* ------------------------------------------------------------------ */

 const handleEmailSubmit = async (e) => {
  e.preventDefault();
  setEmailError("");

  const trimmedEmail = email.trim();

  if (!trimmedEmail) {
    setEmailError("Please enter your email address.");
    return;
  }

  if (!isValidEmail(trimmedEmail)) {
    setEmailError("Please enter a valid email address.");
    return;
  }

  setLoading(true);

  try {
    const response = await sendSignupOtp(trimmedEmail);

    console.log("Send OTP response:", response);

    if (response.status === "success") {
      setEmail(trimmedEmail);
      setOtpDigits(Array(OTP_LENGTH).fill(""));
      setOtpError("");
      setStep("otp");
      startResendCooldown();
    } else {
      setEmailError(
        response.message || "We couldn't send a verification code."
      );
    }
  } catch (err) {
    console.error("Send OTP error:", err);

    setEmailError(
      err.response?.data?.message ||
        "We couldn't send a verification code. Please try again."
    );
  } finally {
    setLoading(false);
  }
};

  /* ------------------------------------------------------------------ */
  /* OTP step                                                           */
  /* ------------------------------------------------------------------ */

  const startResendCooldown = () => {
    setResendCooldown(30);
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleOtpChange = (index, value) => {
    const digit = value.replace(/\D/g, "").slice(-1);

    setOtpDigits((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });

    setOtpError("");

    if (digit && index < OTP_LENGTH - 1) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);
    if (!pasted) return;

    e.preventDefault();
    const next = Array(OTP_LENGTH).fill("");
    pasted.split("").forEach((char, idx) => {
      next[idx] = char;
    });
    setOtpDigits(next);
    setOtpError("");

    const lastFilledIndex = Math.min(pasted.length, OTP_LENGTH) - 1;
    otpInputRefs.current[lastFilledIndex]?.focus();
  };

  const handleOtpSubmit = async (e) => {
  e.preventDefault();
  setOtpError("");

  const code = otpDigits.join("");

  if (code.length !== OTP_LENGTH) {
    setOtpError("Please enter the full 6-digit code.");
    return;
  }

  setLoading(true);

  try {
    const response = await verifySignupOtp(email, code);

    console.log("Verify OTP response:", response);

    if (response.status === "success") {
      setVerificationToken(response.verification_token);
      setStep("password");
    } else {
      setOtpError(
        response.message || "Invalid verification code."
      );
    }
  } catch (err) {
    console.error("Verify OTP error:", err);

    setOtpError(
      err.response?.data?.message ||
        "Invalid verification code. Please try again."
    );
  } finally {
    setLoading(false);
  }
};
  const handleResendCode = async () => {
  if (resendCooldown > 0 || loading) return;

  setOtpError("");
  setLoading(true);

  try {
    const response = await sendSignupOtp(email);

    console.log("Resend OTP response:", response);

    if (response.status === "success") {
      setOtpDigits(Array(OTP_LENGTH).fill(""));
      otpInputRefs.current[0]?.focus();
      startResendCooldown();
    } else {
      setOtpError(
        response.message || "We couldn't resend the code."
      );
    }
  } catch (err) {
    console.error("Resend OTP error:", err);

    setOtpError(
      err.response?.data?.message ||
        "We couldn't resend the code. Please try again."
    );
  } finally {
    setLoading(false);
  }
};

  /* ------------------------------------------------------------------ */
  /* Password step                                                      */
  /* ------------------------------------------------------------------ */

  const validatePasswordStep = () => {
    const errors = {};

    if (!password) {
      errors.password = "Please create a password.";
    } else if (PASSWORD_RULES.some((rule) => !rule.test(password))) {
      errors.password = "Password does not meet the requirements below.";
    }

    if (!confirmPassword) {
      errors.confirmPassword = "Please confirm your password.";
    } else if (password && confirmPassword !== password) {
      errors.confirmPassword = "Passwords do not match.";
    }

    return errors;
  };

  const handlePasswordSubmit = async (e) => {
  e.preventDefault();
  setError("");

  const errors = validatePasswordStep();
  setFieldErrors(errors);

  if (Object.keys(errors).length > 0) {
    return;
  }

  if (!verificationToken) {
    setError(
      "Your verification session has expired. Please verify your email again."
    );
    return;
  }

  setLoading(true);

  try {
    const response = await completeSignup(
      email,
      verificationToken,
      password,
      confirmPassword
    );

    console.log("Complete signup response:", response);

    if (response.status === "success") {
      setStep("success");
    } else {
      setError(
        response.message || "We couldn't create your account."
      );
    }
  } catch (err) {
    console.error("Complete signup error:", err);

    setError(
      err.response?.data?.message ||
        "We couldn't create your account. Please try again."
    );
  } finally {
    setLoading(false);
  }
};

  const togglePasswordVisibility = () => setShowPassword((prev) => !prev);
  const toggleConfirmPasswordVisibility = () =>
    setShowConfirmPassword((prev) => !prev);

  const handleGoToLogin = () => {
    navigate("/login");
  };

  /* ------------------------------------------------------------------ */
  /* Render                                                             */
  /* ------------------------------------------------------------------ */

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

      {/* Create Account Card */}
      <div className="login-card signup-card">
        {/* Logo */}
        <div className="login-header">
          <img src={logo} alt="IGNITE Logo" className="login-logo" />
        </div>

        {/* ---------------- Email Step ---------------- */}
        {step === "email" && (
          <>
            <div className="login-welcome">
              <h1>Create your Ignite account</h1>
              <p>
                Get started by creating your account and setting up your
                organization.
              </p>
            </div>

            {emailError && (
              <div className="error-message" role="alert">
                {emailError}
              </div>
            )}

            <form
              onSubmit={handleEmailSubmit}
              className="login-form"
              noValidate
            >
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
                      setEmailError("");
                    }}
                    autoComplete="email"
                    disabled={loading}
                    className={`form-input ${emailError ? "form-input-error" : ""}`}
                  />
                </div>
              </div>

              <button type="submit" className="login-button" disabled={loading}>
                {loading ? "Sending code..." : "Send verification code"}
              </button>
            </form>

            <div className="signup-prompt">
              Already have an account?
              <Link to="/login" className="signup-link">
                Log in
              </Link>
            </div>
          </>
        )}

        {/* ---------------- OTP Step ---------------- */}
        {step === "otp" && (
          <>
            <div className="login-welcome">
              <h1>Verify your email</h1>
              <p>
                We've sent a verification code to{" "}
                <strong className="signup-email">{email}</strong>.
              </p>
            </div>

            {otpError && (
              <div className="error-message" role="alert">
                {otpError}
              </div>
            )}

            <form onSubmit={handleOtpSubmit} className="login-form" noValidate>
              <div className="form-group">
                <label htmlFor="otp-0">Verification code</label>

                <div className="otp-input-group" onPaste={handleOtpPaste}>
                  {otpDigits.map((digit, index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      ref={(el) => (otpInputRefs.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      disabled={loading}
                      className={`otp-digit-input ${otpError ? "form-input-error" : ""}`}
                      aria-label={`Digit ${index + 1} of ${OTP_LENGTH}`}
                    />
                  ))}
                </div>
              </div>

              <div className="resend-row">
                <span>Didn't receive the code?</span>
                <button
                  type="button"
                  className="resend-link"
                  onClick={handleResendCode}
                  disabled={resendCooldown > 0 || loading}
                >
                  {resendCooldown > 0
                    ? `Resend code (${resendCooldown}s)`
                    : "Resend code"}
                </button>
              </div>

              <button type="submit" className="login-button" disabled={loading}>
                {loading ? "Verifying..." : "Verify email"}
              </button>
            </form>
          </>
        )}

        {/* ---------------- Password Step ---------------- */}
        {step === "password" && (
          <>
            <div className="login-welcome">
              <h1>Create your password</h1>
              <p>Secure your Ignite account with a strong password.</p>
            </div>

            {error && (
              <div className="error-message" role="alert">
                {error}
              </div>
            )}

            <form
              onSubmit={handlePasswordSubmit}
              className="login-form"
              noValidate
            >
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
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setFieldErrors((prev) => ({
                        ...prev,
                        password: undefined,
                      }));
                    }}
                    autoComplete="new-password"
                    disabled={loading}
                    className={`form-input ${fieldErrors.password ? "form-input-error" : ""}`}
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
                {fieldErrors.password && (
                  <span className="field-error">{fieldErrors.password}</span>
                )}

                {/* Password Strength Meter */}
                {password && (
                  <div className="password-strength">
                    <div className="strength-bar-track">
                      <div
                        className={`strength-bar-fill strength-${passwordStrength.score}`}
                      ></div>
                    </div>
                    <span
                      className={`strength-label strength-label-${passwordStrength.score}`}
                    >
                      {passwordStrength.label}
                    </span>
                  </div>
                )}

                {/* Password Requirements */}
                <ul className="password-requirements">
                  {PASSWORD_RULES.map((rule) => {
                    const passed = rule.test(password);
                    return (
                      <li
                        key={rule.id}
                        className={
                          passed ? "requirement-met" : "requirement-unmet"
                        }
                      >
                        <span className="requirement-icon" aria-hidden="true">
                          {passed ? "✓" : "○"}
                        </span>
                        {rule.label}
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Confirm Password */}
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm password</label>

                <div className="input-wrapper">
                  <div className="input-icon" aria-hidden="true">
                    <Lock size={18} strokeWidth={2} />
                  </div>

                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    name="confirmPassword"
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setFieldErrors((prev) => ({
                        ...prev,
                        confirmPassword: undefined,
                      }));
                    }}
                    autoComplete="new-password"
                    disabled={loading}
                    className={`form-input ${
                      fieldErrors.confirmPassword ? "form-input-error" : ""
                    }`}
                  />

                  <button
                    type="button"
                    className="password-toggle"
                    onClick={toggleConfirmPasswordVisibility}
                    aria-label={
                      showConfirmPassword ? "Hide password" : "Show password"
                    }
                    disabled={loading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} strokeWidth={2} />
                    ) : (
                      <Eye size={18} strokeWidth={2} />
                    )}
                  </button>
                </div>
                {fieldErrors.confirmPassword && (
                  <span className="field-error">
                    {fieldErrors.confirmPassword}
                  </span>
                )}
              </div>

              <button type="submit" className="login-button" disabled={loading}>
                {loading ? "Creating account..." : "Create account"}
              </button>
            </form>
          </>
        )}

        {/* ---------------- Success Step ---------------- */}
        {step === "success" && (
          <div className="invite-success">
            <div className="invite-success-icon" aria-hidden="true">
              <CheckCircle2 size={30} strokeWidth={2} />
            </div>
            <h1>Account created!</h1>
            <p>
              Your Ignite account is ready. Log in to start setting up your
              organization.
            </p>
            <button
              type="button"
              className="login-button"
              onClick={handleGoToLogin}
            >
              Go to login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateAccount;
