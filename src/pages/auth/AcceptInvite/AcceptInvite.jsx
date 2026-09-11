import React, { useState, useEffect, useRef, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  Building2,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import logo from "../../../assets/logo.png";
import "./AcceptInvite.css";
import "../CreateAccount/CreateAccount.css";

import {
  getInvitationDetails,
  sendInvitationOTP,
  verifyInvitationOTP,
  acceptInvitation,
} from "../../../services/api/employeeAPI";

const OTP_LENGTH = 6;

const PASSWORD_RULES = [
  {
    id: "length",
    label: "At least 8 characters",
    test: (pw) => pw.length >= 8,
  },
  {
    id: "upper",
    label: "One uppercase letter (A-Z)",
    test: (pw) => /[A-Z]/.test(pw),
  },
  {
    id: "lower",
    label: "One lowercase letter (a-z)",
    test: (pw) => /[a-z]/.test(pw),
  },
  {
    id: "number",
    label: "One number (0-9)",
    test: (pw) => /\d/.test(pw),
  },
  {
    id: "special",
    label: "One special character (!@#$...)",
    test: (pw) => /[^A-Za-z0-9]/.test(pw),
  },
];

const getPasswordStrength = (password) => {
  if (!password) return { score: 0, label: "" };
  const passedRules = PASSWORD_RULES.filter((rule) =>
    rule.test(password)
  ).length;

  if (passedRules <= 2) return { score: 1, label: "Weak" };
  if (passedRules <= 4) return { score: 2, label: "Medium" };
  return { score: 3, label: "Strong" };
};

const AcceptInvite = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = searchParams.get("token") || "";
  const queryEmail = searchParams.get("email") || "";

  // Page initialization states
  const [pageLoading, setPageLoading] = useState(true);
  const [inviteData, setInviteData] = useState(null);
  const [initError, setInitError] = useState("");

  // Workflow steps: "overview" | "otp" | "password" | "success"
  const [step, setStep] = useState("overview");

  // OTP step
  const [otpDigits, setOtpDigits] = useState(Array(OTP_LENGTH).fill(""));
  const [otpError, setOtpError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
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
    [password]
  );

  /*
   * Fetch invitation details on load
   */
  useEffect(() => {
    const fetchDetails = async () => {
      if (!token) {
        setInitError("Missing invitation token in link. Please use the full URL provided in your invitation email.");
        setPageLoading(false);
        return;
      }

      try {
        setPageLoading(true);
        setInitError("");
        const res = await getInvitationDetails(token);
        const data = res?.data || res;
        setInviteData(data);

        if (data.isAlreadyAccepted) {
          setInitError("ALREADY_ACCEPTED");
        }
      } catch (err) {
        console.error("Failed to fetch invitation details:", err);
        const msg =
          err.response?.data?.message ||
          "This invitation link is invalid or has expired. Please contact your organization administrator.";
        setInitError(msg);
      } finally {
        setPageLoading(false);
      }
    };

    fetchDetails();
  }, [token]);

  /*
   * Step 1: Employee clicks "Verify Email & Continue"
   */
  const handleStartVerification = async () => {
    setLoading(true);
    setError("");

    try {
      const email = inviteData?.email || queryEmail;
      await sendInvitationOTP(token, email);
      setStep("otp");
      startResendCooldown();
    } catch (err) {
      console.error("Send OTP failed:", err);
      setError(
        err.response?.data?.message ||
          "Failed to send verification code. Please check your network or try again."
      );
    } finally {
      setLoading(false);
    }
  };

  /*
   * Step 2: OTP timer and handlers
   */
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

  const handleResendCode = async () => {
    if (resendCooldown > 0 || loading) return;

    setOtpError("");
    setLoading(true);

    try {
      const email = inviteData?.email || queryEmail;
      await sendInvitationOTP(token, email);
      setOtpDigits(Array(OTP_LENGTH).fill(""));
      otpInputRefs.current[0]?.focus();
      startResendCooldown();
    } catch (err) {
      console.error("Resend OTP error:", err);
      setOtpError(
        err.response?.data?.message ||
          "Could not resend the verification code. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setOtpError("");

    const code = otpDigits.join("");
    if (code.length !== OTP_LENGTH) {
      setOtpError("Please enter the full 6-digit verification code.");
      return;
    }

    setLoading(true);
    try {
      const email = inviteData?.email || queryEmail;
      await verifyInvitationOTP(token, email, code);
      setStep("password");
    } catch (err) {
      console.error("Verify OTP error:", err);
      setOtpError(
        err.response?.data?.message ||
          "Invalid or expired verification code. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  /*
   * Step 3: Password validation & submission
   */
  const validatePasswordStep = () => {
    const errors = {};
    if (!password) {
      errors.password = "Please enter a password.";
    } else if (PASSWORD_RULES.some((rule) => !rule.test(password))) {
      errors.password = "Password does not meet the requirements.";
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

    const errs = validatePasswordStep();
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);

    try {
      const email = inviteData?.email || queryEmail;
      const res = await acceptInvitation({
        token,
        email,
        password,
        confirm_password: confirmPassword,
      });

      // Save tokens & user info if returned for immediate login
      if (res?.tokens?.access) {
        localStorage.setItem("accessToken", res.tokens.access);
        localStorage.setItem("access_token", res.tokens.access);
      }
      if (res?.tokens?.refresh) {
        localStorage.setItem("refreshToken", res.tokens.refresh);
      }
      if (res?.user) {
        localStorage.setItem("user", JSON.stringify(res.user));
        localStorage.setItem("ignite_authenticated", "true");
      }

      setStep("success");
    } catch (err) {
      console.error("Accept invitation error:", err);
      setError(
        err.response?.data?.message ||
          err.response?.data?.detail ||
          "Failed to accept invitation. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------
  // LOADING / ERROR RENDERS
  // ----------------------------------------------------

  if (pageLoading) {
    return (
      <div className="login-container">
        <div className="login-background-elements">
          <div className="background-shape bg-shape-1"></div>
          <div className="background-shape bg-shape-2"></div>
        </div>
        <div className="login-card accept-invite-card">
          <div className="invite-loading-container">
            <div className="invite-spinner" />
            <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#1e293b", margin: 0 }}>
              Loading Invitation
            </h2>
            <p style={{ fontSize: "14px", color: "#64748b", marginTop: "6px" }}>
              Verifying your invitation details with Ignite HRMS...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (initError === "ALREADY_ACCEPTED") {
    const hasActiveSession = Boolean(
      localStorage.getItem("accessToken") || localStorage.getItem("access_token")
    );

    return (
      <div className="login-container">
        <div className="login-background-elements">
          <div className="background-shape bg-shape-1"></div>
          <div className="background-shape bg-shape-2"></div>
        </div>
        <div className="login-card accept-invite-card">
          <div className="login-header">
            <img src={logo} alt="IGNITE Logo" className="login-logo" />
          </div>
          <div className="invite-success">
            <div className="invite-success-icon" style={{ background: "linear-gradient(135deg, #0BA37F 0%, #0F3D3E 100%)" }}>
              <CheckCircle2 size={30} strokeWidth={2.2} />
            </div>
            <h1>Account Active</h1>
            <p>
              Your invitation has been accepted and your employee account is active. {hasActiveSession ? "You can proceed directly to your workspace." : "Please sign in to access your employee dashboard."}
            </p>
            <button
              type="button"
              className="login-button"
              style={{ background: "linear-gradient(135deg, #0BA37F 0%, #0F3D3E 100%)" }}
              onClick={() => {
                if (hasActiveSession) {
                  navigate("/dashboard");
                } else {
                  navigate(`/login${queryEmail ? `?email=${encodeURIComponent(queryEmail)}` : ""}`);
                }
              }}
            >
              {hasActiveSession ? "Go to Dashboard" : "Sign In to Dashboard"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (initError) {
    return (
      <div className="login-container">
        <div className="login-background-elements">
          <div className="background-shape bg-shape-1"></div>
          <div className="background-shape bg-shape-2"></div>
        </div>
        <div className="login-card accept-invite-card">
          <div className="login-header">
            <img src={logo} alt="IGNITE Logo" className="login-logo" />
          </div>
          <div className="invite-error-box">
            <AlertCircle size={22} style={{ flexShrink: 0, marginTop: "2px" }} />
            <div>
              <strong style={{ display: "block", marginBottom: "4px" }}>
                Invalid or Expired Invitation
              </strong>
              {initError}
            </div>
          </div>
          <button
            type="button"
            className="login-button"
            onClick={() => navigate("/login")}
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  const employeeName =
    inviteData?.fullName ||
    `${inviteData?.firstName || ""} ${inviteData?.lastName || ""}`.trim() ||
    "Team Member";
  const companyName = inviteData?.companyName || "Organization";
  const email = inviteData?.email || queryEmail;

  return (
    <div className="login-container">
      {/* Background Shapes */}
      <div className="login-background-elements">
        <div className="background-shape bg-shape-1"></div>
        <div className="background-shape bg-shape-2"></div>
      </div>

      <div className="login-card accept-invite-card">
        {/* Brand Header */}
        <div className="login-header">
          <img src={logo} alt="IGNITE Logo" className="login-logo" />
        </div>

        {/* Stepper Indicator */}
        {step !== "success" && (
          <div className="invite-stepper">
            <div
              className={`invite-step-dot ${
                step === "overview"
                  ? "active"
                  : step === "otp" || step === "password"
                  ? "completed"
                  : ""
              }`}
            >
              <div className="invite-step-circle">
                {step === "otp" || step === "password" ? "✓" : "1"}
              </div>
              <span>Overview</span>
            </div>

            <div
              className={`invite-step-line ${
                step === "otp" || step === "password" ? "completed" : ""
              }`}
            />

            <div
              className={`invite-step-dot ${
                step === "otp"
                  ? "active"
                  : step === "password"
                  ? "completed"
                  : ""
              }`}
            >
              <div className="invite-step-circle">
                {step === "password" ? "✓" : "2"}
              </div>
              <span>Verify</span>
            </div>

            <div
              className={`invite-step-line ${
                step === "password" ? "completed" : ""
              }`}
            />

            <div
              className={`invite-step-dot ${
                step === "password" ? "active" : ""
              }`}
            >
              <div className="invite-step-circle">3</div>
              <span>Set Password</span>
            </div>
          </div>
        )}

        {/* Global Error Banner */}
        {error && (
          <div className="error-message" role="alert">
            {error}
          </div>
        )}

        {/* ---------------- STEP 1: OVERVIEW ---------------- */}
        {step === "overview" && (
          <>
            <div className="login-welcome">
              <div className="invite-company-badge">
                <Building2 size={15} />
                <span>{companyName}</span>
              </div>
              <h1>Welcome, {employeeName}!</h1>
              <p>
                You've been invited to join <strong>{companyName}</strong> on
                the Ignite HRMS Platform.
              </p>
            </div>

            {/* Employment Overview Box */}
            <div className="invite-overview-box">
              <div className="invite-overview-title">Your Assignment Details</div>
              <div className="invite-overview-grid">
                <div className="invite-overview-item">
                  <span className="label">Employee ID</span>
                  <span className="value">{inviteData?.employeeCode || "—"}</span>
                </div>
                <div className="invite-overview-item">
                  <span className="label">Official Email</span>
                  <span className="value">{email}</span>
                </div>
                <div className="invite-overview-item">
                  <span className="label">Department</span>
                  <span className="value">
                    {inviteData?.departmentName || "General"}
                  </span>
                </div>
                <div className="invite-overview-item">
                  <span className="label">Designation</span>
                  <span className="value">
                    {inviteData?.designationName || "Team Member"}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="login-button"
              onClick={handleStartVerification}
              disabled={loading}
            >
              {loading ? "Sending verification code..." : "Verify Email & Continue"}
              <ArrowRight size={18} style={{ marginLeft: "8px" }} />
            </button>

            <div className="invite-security-pill">
              <ShieldCheck size={18} />
              <span>
                Quick 2-step verification ensures only you can access your profile.
              </span>
            </div>
          </>
        )}

        {/* ---------------- STEP 2: OTP VERIFICATION ---------------- */}
        {step === "otp" && (
          <>
            <div className="login-welcome">
              <h1>Verify your identity</h1>
              <p>
                Enter the 6-digit verification code sent to{" "}
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
                <label htmlFor="otp-0">6-Digit Verification Code</label>
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
                      className={`otp-digit-input ${
                        otpError ? "form-input-error" : ""
                      }`}
                      aria-label={`Digit ${index + 1}`}
                      autoFocus={index === 0}
                    />
                  ))}
                </div>
              </div>

              <div className="resend-row">
                <span>Didn't receive the email?</span>
                <button
                  type="button"
                  className="resend-link"
                  onClick={handleResendCode}
                  disabled={resendCooldown > 0 || loading}
                >
                  {resendCooldown > 0
                    ? `Resend Code (${resendCooldown}s)`
                    : "Resend Code"}
                </button>
              </div>

              <button
                type="submit"
                className="login-button"
                disabled={loading}
              >
                {loading ? "Verifying code..." : "Verify Code & Proceed"}
              </button>
            </form>
          </>
        )}

        {/* ---------------- STEP 3: SET PASSWORD ---------------- */}
        {step === "password" && (
          <>
            <div className="login-welcome">
              <h1>Set your account password</h1>
              <p>Create a secure password to complete your account setup.</p>
            </div>

            <form
              onSubmit={handlePasswordSubmit}
              className="login-form"
              noValidate
            >
              {/* Password */}
              <div className="form-group">
                <label htmlFor="password">New Password</label>
                <div className="input-wrapper">
                  <div className="input-icon" aria-hidden="true">
                    <Lock size={18} strokeWidth={2} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    placeholder="Create a strong password"
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
                    className={`form-input ${
                      fieldErrors.password ? "form-input-error" : ""
                    }`}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword((p) => !p)}
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

                {fieldErrors.password && (
                  <span className="field-error">{fieldErrors.password}</span>
                )}

                {/* Password Strength Meter */}
                {password && (
                  <div className="password-strength">
                    <div className="strength-bar-track">
                      <div
                        className={`strength-bar-fill strength-${passwordStrength.score}`}
                      />
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
                <label htmlFor="confirmPassword">Confirm Password</label>
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
                    onClick={() => setShowConfirmPassword((p) => !p)}
                    aria-label={
                      showConfirmPassword
                        ? "Hide password"
                        : "Show password"
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

              <button
                type="submit"
                className="login-button"
                disabled={loading}
              >
                {loading
                  ? "Setting up account..."
                  : "Complete Setup & Join Organization"}
              </button>
            </form>
          </>
        )}

        {/* ---------------- STEP 4: SUCCESS ---------------- */}
        {step === "success" && (
          <div className="invite-success">
            <div className="invite-confetti-badge">🎉</div>
            <div className="invite-success-icon">
              <CheckCircle2 size={30} strokeWidth={2} />
            </div>
            <h1>Welcome to {companyName}!</h1>
            <p>
              Your account has been activated successfully. You can now access
              your organization workspace on Ignite.
            </p>
            <button
              type="button"
              className="login-button"
              onClick={() => navigate("/dashboard")}
            >
              Go to Workspace Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AcceptInvite;
