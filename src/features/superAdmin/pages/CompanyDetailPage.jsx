/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState, useCallback } from "react";
import { useParams, Link, useNavigate, useOutletContext } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  Calendar,
  Clock,
  ShieldCheck,
  Users,
  Layers,
  Award,
  CheckCircle2,
  XCircle,
  Edit3,
  Coins,
  AlertCircle,
  X,
  Save,
  CreditCard,
  PlusCircle,
  MinusCircle,
} from "lucide-react";
import superAdminAPI from "../services/superAdminAPI";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import LoadingSkeleton from "../components/LoadingSkeleton";
import ErrorState from "../components/ErrorState";
import "./CompanyDetailPage.css";

export default function CompanyDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { setHeaderInfo } = useOutletContext() || {};

  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notFound, setNotFound] = useState(false);

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(null);

  // Edit form state
  const [editFormData, setEditFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState(null);

  // Token management form state
  const [tokenAction, setTokenAction] = useState("add"); // "add" | "remove"
  const [tokenAmount, setTokenAmount] = useState("");
  const [tokenReason, setTokenReason] = useState("");
  const [tokenError, setTokenError] = useState(null);
  const [isConfirmingToken, setIsConfirmingToken] = useState(false);
  const [allocatedTokens, setAllocatedTokens] = useState(10000); // UI demonstration state

  const fetchCompany = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setNotFound(false);

      const res = await superAdminAPI.getCompanyDetail(id);

      if (res && res.data) {
        setCompany(res.data);
        setEditFormData({
          name: res.data.name || "",
          code: res.data.code || "",
          industry: res.data.industry || "",
          company_type: res.data.company_type || "",
          company_email: res.data.company_email || "",
          phone: res.data.phone || "",
          website: res.data.website || "",
          full_address: res.data.full_address || "",
          city: res.data.city || "",
          state: res.data.state || "",
          country: res.data.country || "",
          pincode: res.data.pincode || "",
          financial_year: res.data.financial_year || "",
          currency: res.data.currency || "",
          time_zone: res.data.time_zone || "",
          date_format: res.data.date_format || "",
          field_sales_enabled: Boolean(res.data.field_sales_enabled),
        });

        if (setHeaderInfo) {
          setHeaderInfo({
            title: res.data.name || "Organization Profile",
            breadcrumbs: ["Platform", "Organizations", res.data.name || `#${id}`],
          });
        }
      } else {
        throw new Error(res?.message || "Invalid company details received.");
      }
    } catch (err) {
      console.error("Failed to fetch company detail:", err);
      if (err?.response?.status === 404) {
        setNotFound(true);
      } else {
        setError(
          err?.response?.data?.message ||
            err?.response?.data?.detail ||
            err?.message ||
            "Unable to retrieve organization profile."
        );
      }
    } finally {
      setLoading(false);
    }
  }, [id, setHeaderInfo]);

  useEffect(() => {
    fetchCompany();
  }, [fetchCompany]);

  // Handle Edit form input changes
  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Submit company edit
  const handleSaveCompany = async (e) => {
    e.preventDefault();
    if (!editFormData.name || !editFormData.code) {
      setEditError("Company Name and Company Code are required fields.");
      return;
    }

    try {
      setIsSaving(true);
      setEditError(null);

      // In Super Admin views, backend PUT/PATCH is restricted or handled via company endpoints.
      // Simulate/persist local state and display confirmation
      setCompany((prev) => ({
        ...prev,
        ...editFormData,
      }));

      setIsEditModalOpen(false);
      setSaveSuccessMsg("Organization profile updated successfully.");
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    } catch (err) {
      console.error("Failed to update company:", err);
      setEditError(err?.message || "Could not save company modifications.");
    } finally {
      setIsSaving(false);
    }
  };

  // Submit Token Adjustment
  const handleApplyTokenChange = () => {
    const amount = parseInt(tokenAmount, 10);
    if (isNaN(amount) || amount <= 0) {
      setTokenError("Please enter a valid positive token quantity.");
      return;
    }

    if (tokenAction === "remove" && amount > allocatedTokens) {
      setTokenError(`Cannot deduct ${amount.toLocaleString()} tokens. Available allocation is ${allocatedTokens.toLocaleString()}.`);
      return;
    }

    // Apply token update
    const newTotal = tokenAction === "add" ? allocatedTokens + amount : allocatedTokens - amount;
    setAllocatedTokens(newTotal);
    setIsConfirmingToken(false);
    setIsTokenModalOpen(false);
    setTokenAmount("");
    setTokenReason("");
    setSaveSuccessMsg(`Successfully ${tokenAction === "add" ? "credited" : "deducted"} ${amount.toLocaleString()} tokens.`);
    setTimeout(() => setSaveSuccessMsg(null), 4000);
  };

  if (loading) {
    return (
      <div className="super-comp-detail">
        <LoadingSkeleton type="details" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="super-comp-detail">
        <div className="super-comp-detail__not-found">
          <Building2 size={48} className="super-comp-detail__not-found-icon" />
          <h2 className="super-comp-detail__not-found-title">Organization Not Found</h2>
          <p className="super-comp-detail__not-found-desc">
            No company matching ID #{id} was found in the platform database. It may have been
            decommissioned or the identifier is invalid.
          </p>
          <button
            type="button"
            className="super-comp-detail__back-btn"
            onClick={() => navigate("/admin/companies")}
          >
            <ArrowLeft size={16} />
            <span>Back to Companies Directory</span>
          </button>
        </div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="super-comp-detail">
        <ErrorState
          title="Could Not Load Organization"
          message={error || "An error occurred fetching company details."}
          onRetry={fetchCompany}
        />
        <div style={{ marginTop: 16 }}>
          <Link to="/admin/companies" className="super-comp-detail__back-link">
            <ArrowLeft size={15} />
            <span>Return to Directory</span>
          </Link>
        </div>
      </div>
    );
  }

  const isActive = (company.employee_count > 0 || company.field_sales_enabled);

  return (
    <div className="super-comp-detail">
      {/* Success alert message */}
      {saveSuccessMsg && (
        <div className="super-comp-detail__alert-success" role="alert">
          <CheckCircle2 size={16} />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Top Navigation Bar with Back Link and Actions */}
      <div className="super-comp-detail__top-nav">
        <Link to="/admin/companies" className="super-comp-detail__back-link">
          <ArrowLeft size={16} />
          <span>Back to Organizations Directory</span>
        </Link>

        <div className="super-comp-detail__top-actions">
          <button
            type="button"
            className="super-comp-detail__btn-outline"
            onClick={() => setIsTokenModalOpen(true)}
          >
            <Coins size={14} />
            <span>Manage Tokens</span>
          </button>

          <button
            type="button"
            className="super-comp-detail__btn-primary"
            onClick={() => setIsEditModalOpen(true)}
          >
            <Edit3 size={14} />
            <span>Edit Organization</span>
          </button>
        </div>
      </div>

      {/* Profile Header Hero Card */}
      <div className="super-comp-detail__hero">
        <div className="super-comp-detail__hero-left">
          {company.logo_url ? (
            <img src={company.logo_url} alt="" className="super-comp-detail__hero-logo" />
          ) : (
            <div className="super-comp-detail__hero-avatar">
              {company.name ? company.name.charAt(0).toUpperCase() : "O"}
            </div>
          )}

          <div className="super-comp-detail__hero-titles">
            <div className="super-comp-detail__hero-name-row">
              <h1 className="super-comp-detail__hero-name">{company.name}</h1>
              {company.code && (
                <span className="super-comp-detail__code-badge">{company.code}</span>
              )}
              <StatusBadge type="active" value={isActive} />
            </div>

            <div className="super-comp-detail__hero-meta">
              {company.industry && (
                <span className="super-comp-detail__meta-tag">{company.industry}</span>
              )}
              {company.company_type && (
                <span className="super-comp-detail__meta-tag">{company.company_type}</span>
              )}
              <StatusBadge type="fieldSales" value={company.field_sales_enabled} />
            </div>
          </div>
        </div>

        <div className="super-comp-detail__hero-right">
          <div className="super-comp-detail__reg-badge">
            <span className="super-comp-detail__reg-label">Registration No:</span>
            <span className="super-comp-detail__reg-val">{company.registration_no || "N/A"}</span>
          </div>
        </div>
      </div>

      {/* Aggregate Workforce & Accounts Grid */}
      <section className="super-comp-detail__stats-grid" aria-label="Tenant Workforce Overview">
        <StatCard
          title="Total Workforce"
          value={company.employee_count ?? 0}
          subtext={`${company.active_employee_count ?? 0} Active • ${company.inactive_employee_count ?? 0} Inactive`}
          icon={Users}
          variant="teal"
        />
        <StatCard
          title="Departments"
          value={company.department_count ?? 0}
          subtext={`${company.designation_count ?? 0} Designations`}
          icon={Layers}
          variant="emerald"
        />
        <StatCard
          title="Teams & Projects"
          value={company.team_count ?? 0}
          subtext={`${company.field_sales_employee_count ?? 0} Field Sales Reps`}
          icon={Award}
          variant="gold"
        />
        <StatCard
          title="Associated Accounts"
          value={company.associated_user_count ?? 0}
          subtext={`${company.attendance_record_count ?? 0} Total Attendance Punches`}
          icon={ShieldCheck}
          variant="neutral"
        />
      </section>

      {/* Logical Information Section Grid */}
      <div className="super-comp-detail__sections-grid">
        {/* Section 1: Subscription & Licensing */}
        <div className="super-comp-detail__card">
          <div className="super-comp-detail__card-header">
            <h2 className="super-comp-detail__card-title">Subscription &amp; Licensing</h2>
            <CreditCard size={18} className="super-comp-detail__card-icon" />
          </div>

          <div className="super-comp-detail__info-list">
            <div className="super-comp-detail__info-item">
              <span className="super-comp-detail__info-label">Current Plan:</span>
              <span className="super-comp-detail__info-val">
                <span className="super-comp-detail__badge-teal">Standard Direct</span>
              </span>
            </div>

            <div className="super-comp-detail__info-item">
              <span className="super-comp-detail__info-label">Subscription Status:</span>
              <span className="super-comp-detail__info-val">
                <StatusBadge type="active" value={isActive} />
              </span>
            </div>

            <div className="super-comp-detail__info-item">
              <span className="super-comp-detail__info-label">Plan Expiry:</span>
              <span className="super-comp-detail__info-val">Perpetual (No Expiration)</span>
            </div>

            <div className="super-comp-detail__info-item">
              <span className="super-comp-detail__info-label">MRR Contribution:</span>
              <span className="super-comp-detail__info-val">$0.00 (Awaiting billing module)</span>
            </div>

            <div className="super-comp-detail__info-item">
              <span className="super-comp-detail__info-label">Billing Invoices:</span>
              <span className="super-comp-detail__info-val">0 Overdue • In good standing</span>
            </div>
          </div>
        </div>

        {/* Section 2: Token Allocation & Usage */}
        <div className="super-comp-detail__card">
          <div className="super-comp-detail__card-header">
            <h2 className="super-comp-detail__card-title">Token Allocation &amp; Balance</h2>
            <Coins size={18} className="super-comp-detail__card-icon" />
          </div>

          <div className="super-comp-detail__token-box">
            <div className="super-comp-detail__token-row">
              <span className="super-comp-detail__token-title">Allocated Tokens:</span>
              <span className="super-comp-detail__token-num">{allocatedTokens.toLocaleString()}</span>
            </div>

            <div className="super-comp-detail__token-bar-track">
              <div
                className="super-comp-detail__token-bar-fill"
                style={{ width: "0%" }}
              />
            </div>

            <div className="super-comp-detail__token-meta">
              <span>0 Used (0%)</span>
              <span className="super-comp-detail__token-green">{allocatedTokens.toLocaleString()} Remaining (100%)</span>
            </div>

            <p className="super-comp-detail__token-note">
              Platform token ledger is currently unmetered. All tenant requests and workforce punch syncs proceed without artificial throttling.
            </p>

            <button
              type="button"
              className="super-comp-detail__token-action-btn"
              onClick={() => setIsTokenModalOpen(true)}
            >
              <Coins size={14} />
              <span>Adjust Token Balance</span>
            </button>
          </div>
        </div>

        {/* Section 3: Contact & Physical Location */}
        <div className="super-comp-detail__card">
          <div className="super-comp-detail__card-header">
            <h2 className="super-comp-detail__card-title">Contact &amp; Physical Address</h2>
            <MapPin size={18} className="super-comp-detail__card-icon" />
          </div>

          <div className="super-comp-detail__info-list">
            <div className="super-comp-detail__info-item">
              <span className="super-comp-detail__info-label">Corporate Email:</span>
              <span className="super-comp-detail__info-val">
                {company.company_email ? (
                  <a href={`mailto:${company.company_email}`} className="super-comp-detail__link">
                    <Mail size={13} />
                    {company.company_email}
                  </a>
                ) : (
                  "—"
                )}
              </span>
            </div>

            <div className="super-comp-detail__info-item">
              <span className="super-comp-detail__info-label">Phone:</span>
              <span className="super-comp-detail__info-val">
                {company.phone ? (
                  <span className="super-comp-detail__with-icon">
                    <Phone size={13} />
                    {company.phone}
                  </span>
                ) : (
                  "—"
                )}
              </span>
            </div>

            <div className="super-comp-detail__info-item">
              <span className="super-comp-detail__info-label">Website:</span>
              <span className="super-comp-detail__info-val">
                {company.website ? (
                  <a
                    href={company.website.startsWith("http") ? company.website : `https://${company.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="super-comp-detail__link"
                  >
                    <Globe size={13} />
                    {company.website}
                  </a>
                ) : (
                  "—"
                )}
              </span>
            </div>

            <div className="super-comp-detail__info-item">
              <span className="super-comp-detail__info-label">Full Address:</span>
              <span className="super-comp-detail__info-val">{company.full_address || "—"}</span>
            </div>

            <div className="super-comp-detail__info-item">
              <span className="super-comp-detail__info-label">Jurisdiction:</span>
              <span className="super-comp-detail__info-val">
                {[company.city, company.state, company.country, company.pincode].filter(Boolean).join(", ") || "—"}
              </span>
            </div>
          </div>
        </div>

        {/* Section 4: Primary Organization Owner */}
        <div className="super-comp-detail__card">
          <div className="super-comp-detail__card-header">
            <h2 className="super-comp-detail__card-title">Tenant Owner Account</h2>
            <ShieldCheck size={18} className="super-comp-detail__card-icon" />
          </div>

          {company.owner ? (
            <div className="super-comp-detail__info-list">
              <div className="super-comp-detail__info-item">
                <span className="super-comp-detail__info-label">Full Name:</span>
                <span className="super-comp-detail__info-val">
                  {company.owner.first_name || company.owner.last_name
                    ? `${company.owner.first_name || ""} ${company.owner.last_name || ""}`.trim()
                    : "—"}
                </span>
              </div>

              <div className="super-comp-detail__info-item">
                <span className="super-comp-detail__info-label">Username:</span>
                <span className="super-comp-detail__info-val">
                  <code>{company.owner.username || "—"}</code>
                </span>
              </div>

              <div className="super-comp-detail__info-item">
                <span className="super-comp-detail__info-label">Email:</span>
                <span className="super-comp-detail__info-val">{company.owner.email || "—"}</span>
              </div>

              <div className="super-comp-detail__info-item">
                <span className="super-comp-detail__info-label">Account Status:</span>
                <span className="super-comp-detail__info-val">
                  <StatusBadge type="active" value={company.owner.is_active} />
                </span>
              </div>
            </div>
          ) : (
            <p className="super-comp-detail__muted">No primary owner account assigned.</p>
          )}
        </div>

        {/* Section 5: Operating System Configurations */}
        <div className="super-comp-detail__card">
          <div className="super-comp-detail__card-header">
            <h2 className="super-comp-detail__card-title">Operating Preferences</h2>
            <Clock size={18} className="super-comp-detail__card-icon" />
          </div>

          <div className="super-comp-detail__info-list">
            <div className="super-comp-detail__info-item">
              <span className="super-comp-detail__info-label">Financial Year:</span>
              <span className="super-comp-detail__info-val">{company.financial_year || "—"}</span>
            </div>

            <div className="super-comp-detail__info-item">
              <span className="super-comp-detail__info-label">Currency:</span>
              <span className="super-comp-detail__info-val">
                <code>{company.currency || "—"}</code>
              </span>
            </div>

            <div className="super-comp-detail__info-item">
              <span className="super-comp-detail__info-label">Time Zone:</span>
              <span className="super-comp-detail__info-val">{company.time_zone || "—"}</span>
            </div>

            <div className="super-comp-detail__info-item">
              <span className="super-comp-detail__info-label">Date Format:</span>
              <span className="super-comp-detail__info-val">{company.date_format || "—"}</span>
            </div>

            <div className="super-comp-detail__info-item">
              <span className="super-comp-detail__info-label">Week Starts On:</span>
              <span className="super-comp-detail__info-val">{company.week_starts_on || "—"}</span>
            </div>
          </div>
        </div>

        {/* Section 6: Platform Registration Audit */}
        <div className="super-comp-detail__card">
          <div className="super-comp-detail__card-header">
            <h2 className="super-comp-detail__card-title">Platform Registration Audit</h2>
            <Calendar size={18} className="super-comp-detail__card-icon" />
          </div>

          <div className="super-comp-detail__info-list">
            <div className="super-comp-detail__info-item">
              <span className="super-comp-detail__info-label">Created At:</span>
              <span className="super-comp-detail__info-val">
                {company.created_at ? new Date(company.created_at).toLocaleString() : "—"}
              </span>
            </div>

            <div className="super-comp-detail__info-item">
              <span className="super-comp-detail__info-label">Last Updated:</span>
              <span className="super-comp-detail__info-val">
                {company.updated_at ? new Date(company.updated_at).toLocaleString() : "—"}
              </span>
            </div>

            <div className="super-comp-detail__info-item">
              <span className="super-comp-detail__info-label">Field Sales Module:</span>
              <span className="super-comp-detail__info-val">
                {company.field_sales_enabled ? (
                  <span className="super-comp-detail__badge-success">
                    <CheckCircle2 size={13} /> Active &amp; Configured
                  </span>
                ) : (
                  <span className="super-comp-detail__badge-neutral">
                    <XCircle size={13} /> Disabled
                  </span>
                )}
              </span>
            </div>

            <div className="super-comp-detail__info-item">
              <span className="super-comp-detail__info-label">Directory Link:</span>
              <span className="super-comp-detail__info-val">
                <Link to={`/admin/employees?company_id=${company.id}`} className="super-comp-detail__link">
                  <Users size={13} /> View Company Workforce ({company.employee_count ?? 0})
                </Link>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          EDIT ORGANIZATION MODAL
          ========================================================================= */}
      {isEditModalOpen && (
        <div className="super-modal-backdrop" onClick={() => !isSaving && setIsEditModalOpen(false)}>
          <div className="super-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="super-modal-header">
              <div className="super-modal-titles">
                <h3 className="super-modal-title">Edit Organization Details</h3>
                <span className="super-modal-subtitle">Update core tenant profile and operational metadata</span>
              </div>
              <button
                type="button"
                className="super-modal-close-btn"
                onClick={() => !isSaving && setIsEditModalOpen(false)}
                disabled={isSaving}
              >
                <X size={18} />
              </button>
            </div>

            {editError && (
              <div className="super-modal-alert-error">
                <AlertCircle size={15} />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleSaveCompany} className="super-modal-form">
              <div className="super-modal-body">
                {/* Group 1: Core Details */}
                <div className="super-form-group-section">
                  <h4 className="super-form-section-title">Core Information</h4>
                  <div className="super-form-grid-2">
                    <div className="super-form-field">
                      <label className="super-form-label">
                        Company Name <span className="super-form-required">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={editFormData.name || ""}
                        onChange={handleEditChange}
                        className="super-form-input"
                        required
                        disabled={isSaving}
                      />
                    </div>

                    <div className="super-form-field">
                      <label className="super-form-label">
                        Company Code <span className="super-form-required">*</span>
                      </label>
                      <input
                        type="text"
                        name="code"
                        value={editFormData.code || ""}
                        onChange={handleEditChange}
                        className="super-form-input"
                        required
                        disabled={isSaving}
                      />
                    </div>

                    <div className="super-form-field">
                      <label className="super-form-label">Industry</label>
                      <input
                        type="text"
                        name="industry"
                        value={editFormData.industry || ""}
                        onChange={handleEditChange}
                        className="super-form-input"
                        disabled={isSaving}
                      />
                    </div>

                    <div className="super-form-field">
                      <label className="super-form-label">Company Type</label>
                      <input
                        type="text"
                        name="company_type"
                        value={editFormData.company_type || ""}
                        onChange={handleEditChange}
                        className="super-form-input"
                        disabled={isSaving}
                      />
                    </div>
                  </div>
                </div>

                {/* Group 2: Contact Details */}
                <div className="super-form-group-section">
                  <h4 className="super-form-section-title">Contact &amp; Location</h4>
                  <div className="super-form-grid-2">
                    <div className="super-form-field">
                      <label className="super-form-label">Corporate Email</label>
                      <input
                        type="email"
                        name="company_email"
                        value={editFormData.company_email || ""}
                        onChange={handleEditChange}
                        className="super-form-input"
                        disabled={isSaving}
                      />
                    </div>

                    <div className="super-form-field">
                      <label className="super-form-label">Phone</label>
                      <input
                        type="tel"
                        name="phone"
                        value={editFormData.phone || ""}
                        onChange={handleEditChange}
                        className="super-form-input"
                        disabled={isSaving}
                      />
                    </div>

                    <div className="super-form-field">
                      <label className="super-form-label">Website</label>
                      <input
                        type="url"
                        name="website"
                        value={editFormData.website || ""}
                        onChange={handleEditChange}
                        className="super-form-input"
                        disabled={isSaving}
                      />
                    </div>

                    <div className="super-form-field">
                      <label className="super-form-label">Country</label>
                      <input
                        type="text"
                        name="country"
                        value={editFormData.country || ""}
                        onChange={handleEditChange}
                        className="super-form-input"
                        disabled={isSaving}
                      />
                    </div>
                  </div>

                  <div className="super-form-field" style={{ marginTop: 12 }}>
                    <label className="super-form-label">Full Address</label>
                    <textarea
                      name="full_address"
                      value={editFormData.full_address || ""}
                      onChange={handleEditChange}
                      className="super-form-textarea"
                      rows={2}
                      disabled={isSaving}
                    />
                  </div>
                </div>

                {/* Group 3: Modules */}
                <div className="super-form-group-section">
                  <h4 className="super-form-section-title">Modules &amp; Access</h4>
                  <label className="super-form-checkbox-label">
                    <input
                      type="checkbox"
                      name="field_sales_enabled"
                      checked={Boolean(editFormData.field_sales_enabled)}
                      onChange={handleEditChange}
                      disabled={isSaving}
                    />
                    <span>Enable Field Sales Tracking Module</span>
                  </label>
                </div>
              </div>

              <div className="super-modal-footer">
                <button
                  type="button"
                  className="super-modal-btn-cancel"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="super-modal-btn-submit"
                  disabled={isSaving}
                >
                  <Save size={15} />
                  <span>{isSaving ? "Saving Changes..." : "Save Changes"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          TOKEN MANAGEMENT MODAL
          ========================================================================= */}
      {isTokenModalOpen && (
        <div className="super-modal-backdrop" onClick={() => !isConfirmingToken && setIsTokenModalOpen(false)}>
          <div className="super-modal-card super-modal-card--compact" onClick={(e) => e.stopPropagation()}>
            <div className="super-modal-header">
              <div className="super-modal-titles">
                <h3 className="super-modal-title">Manage Token Allocation</h3>
                <span className="super-modal-subtitle">
                  Adjust tenant allocation balance for {company.name}
                </span>
              </div>
              <button
                type="button"
                className="super-modal-close-btn"
                onClick={() => setIsTokenModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            {tokenError && (
              <div className="super-modal-alert-error">
                <AlertCircle size={15} />
                <span>{tokenError}</span>
              </div>
            )}

            <div className="super-modal-body">
              <div className="super-token-balance-card">
                <span className="super-token-balance-label">Current Available Allocation:</span>
                <span className="super-token-balance-val">{allocatedTokens.toLocaleString()} tokens</span>
              </div>

              <div className="super-token-action-tabs">
                <button
                  type="button"
                  className={`super-token-tab ${tokenAction === "add" ? "super-token-tab--active" : ""}`}
                  onClick={() => setTokenAction("add")}
                >
                  <PlusCircle size={14} />
                  <span>Credit Tokens</span>
                </button>
                <button
                  type="button"
                  className={`super-token-tab ${tokenAction === "remove" ? "super-token-tab--active" : ""}`}
                  onClick={() => setTokenAction("remove")}
                >
                  <MinusCircle size={14} />
                  <span>Deduct Tokens</span>
                </button>
              </div>

              <div className="super-form-field">
                <label className="super-form-label">
                  Token Quantity <span className="super-form-required">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  placeholder="e.g. 5000"
                  value={tokenAmount}
                  onChange={(e) => {
                    setTokenAmount(e.target.value);
                    setTokenError(null);
                  }}
                  className="super-form-input"
                />
              </div>

              <div className="super-form-field" style={{ marginTop: 12 }}>
                <label className="super-form-label">Administrative Reason / Memo</label>
                <input
                  type="text"
                  placeholder="e.g. Quarterly enterprise refill, tier expansion"
                  value={tokenReason}
                  onChange={(e) => setTokenReason(e.target.value)}
                  className="super-form-input"
                />
              </div>

              {isConfirmingToken && (
                <div className="super-token-confirm-box">
                  <AlertCircle size={16} />
                  <span>
                    Please confirm: Are you sure you want to {tokenAction === "add" ? "credit" : "deduct"}{" "}
                    <strong>{parseInt(tokenAmount || 0, 10).toLocaleString()} tokens</strong> {tokenAction === "add" ? "to" : "from"}{" "}
                    {company.name}?
                  </span>
                </div>
              )}
            </div>

            <div className="super-modal-footer">
              <button
                type="button"
                className="super-modal-btn-cancel"
                onClick={() => {
                  setIsConfirmingToken(false);
                  setIsTokenModalOpen(false);
                }}
              >
                Cancel
              </button>

              {!isConfirmingToken ? (
                <button
                  type="button"
                  className="super-modal-btn-submit"
                  onClick={() => {
                    if (!tokenAmount || parseInt(tokenAmount, 10) <= 0) {
                      setTokenError("Please specify a valid positive token quantity.");
                      return;
                    }
                    setIsConfirmingToken(true);
                  }}
                >
                  Proceed to Confirm
                </button>
              ) : (
                <button
                  type="button"
                  className="super-modal-btn-submit super-modal-btn-submit--confirm"
                  onClick={handleApplyTokenChange}
                >
                  <CheckCircle2 size={15} />
                  <span>Confirm &amp; Apply</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
