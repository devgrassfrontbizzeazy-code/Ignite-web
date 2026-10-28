import { useEffect, useState, useCallback } from "react";
import { useParams, Link, useNavigate, useOutletContext } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  Users,
  MapPin,
  Globe,
  Mail,
  Phone,
  Calendar,
  Layers,
  Award,
  Clock,
  ShieldCheck,
  CheckCircle2,
  XCircle,
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

  const fetchCompany = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setNotFound(false);

      const res = await superAdminAPI.getCompanyDetail(id);
      if (res && res.data) {
        setCompany(res.data);
        if (setHeaderInfo) {
          setHeaderInfo({
            title: res.data.name || "Organization Profile",
            breadcrumbs: ["Platform", "Companies", res.data.name || `#${id}`],
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

  return (
    <div className="super-comp-detail">
      {/* Top Navigation Bar */}
      <div className="super-comp-detail__top-nav">
        <Link to="/admin/companies" className="super-comp-detail__back-link">
          <ArrowLeft size={16} />
          <span>Back to Organizations Directory</span>
        </Link>
      </div>

      {/* Profile Header Hero */}
      <div className="super-comp-detail__hero">
        <div className="super-comp-detail__hero-left">
          {company.logo_url ? (
            <img src={company.logo_url} alt="" className="super-comp-detail__hero-logo" />
          ) : (
            <div className="super-comp-detail__hero-avatar">
              {company.name ? company.name.charAt(0).toUpperCase() : "C"}
            </div>
          )}

          <div className="super-comp-detail__hero-titles">
            <div className="super-comp-detail__hero-name-row">
              <h1 className="super-comp-detail__hero-name">{company.name}</h1>
              {company.code && (
                <span className="super-comp-detail__code-badge">{company.code}</span>
              )}
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

      {/* Aggregate Counts Grid */}
      <section className="super-comp-detail__stats-grid">
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
          subtext={`${company.attendance_record_count ?? 0} Total Punches`}
          icon={ShieldCheck}
          variant="neutral"
        />
      </section>

      {/* Detailed Info Cards Grid */}
      <div className="super-comp-detail__sections-grid">
        {/* Contact & Physical Address */}
        <div className="super-comp-detail__card">
          <div className="super-comp-detail__card-header">
            <h2 className="super-comp-detail__card-title">Contact & Physical Location</h2>
            <MapPin size={18} className="super-comp-detail__card-icon" />
          </div>

          <div className="super-comp-detail__info-list">
            <div className="super-comp-detail__info-item">
              <span className="super-comp-detail__info-label">Corporate Email:</span>
              <span className="super-comp-detail__info-val">
                {company.company_email ? (
                  <a
                    href={`mailto:${company.company_email}`}
                    className="super-comp-detail__link"
                  >
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
                    href={
                      company.website.startsWith("http")
                        ? company.website
                        : `https://${company.website}`
                    }
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
              <span className="super-comp-detail__info-val">
                {company.full_address || "—"}
              </span>
            </div>

            <div className="super-comp-detail__info-item">
              <span className="super-comp-detail__info-label">Jurisdiction:</span>
              <span className="super-comp-detail__info-val">
                {[company.city, company.state, company.country, company.pincode]
                  .filter(Boolean)
                  .join(", ") || "—"}
              </span>
            </div>
          </div>
        </div>

        {/* Primary Organization Owner */}
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
                <span className="super-comp-detail__info-val">
                  {company.owner.email || "—"}
                </span>
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

        {/* Operating Configuration */}
        <div className="super-comp-detail__card">
          <div className="super-comp-detail__card-header">
            <h2 className="super-comp-detail__card-title">System Configurations</h2>
            <Clock size={18} className="super-comp-detail__card-icon" />
          </div>

          <div className="super-comp-detail__info-list">
            <div className="super-comp-detail__info-item">
              <span className="super-comp-detail__info-label">Financial Year:</span>
              <span className="super-comp-detail__info-val">
                {company.financial_year || "—"}
              </span>
            </div>

            <div className="super-comp-detail__info-item">
              <span className="super-comp-detail__info-label">Currency:</span>
              <span className="super-comp-detail__info-val">
                <code>{company.currency || "—"}</code>
              </span>
            </div>

            <div className="super-comp-detail__info-item">
              <span className="super-comp-detail__info-label">Time Zone:</span>
              <span className="super-comp-detail__info-val">
                {company.time_zone || "—"}
              </span>
            </div>

            <div className="super-comp-detail__info-item">
              <span className="super-comp-detail__info-label">Date Format:</span>
              <span className="super-comp-detail__info-val">
                {company.date_format || "—"}
              </span>
            </div>

            <div className="super-comp-detail__info-item">
              <span className="super-comp-detail__info-label">Week Starts On:</span>
              <span className="super-comp-detail__info-val">
                {company.week_starts_on || "—"}
              </span>
            </div>
          </div>
        </div>

        {/* Platform Metadata */}
        <div className="super-comp-detail__card">
          <div className="super-comp-detail__card-header">
            <h2 className="super-comp-detail__card-title">Platform Registration Audit</h2>
            <Calendar size={18} className="super-comp-detail__card-icon" />
          </div>

          <div className="super-comp-detail__info-list">
            <div className="super-comp-detail__info-item">
              <span className="super-comp-detail__info-label">Created At:</span>
              <span className="super-comp-detail__info-val">
                {company.created_at
                  ? new Date(company.created_at).toLocaleString()
                  : "—"}
              </span>
            </div>

            <div className="super-comp-detail__info-item">
              <span className="super-comp-detail__info-label">Last Updated:</span>
              <span className="super-comp-detail__info-val">
                {company.updated_at
                  ? new Date(company.updated_at).toLocaleString()
                  : "—"}
              </span>
            </div>

            <div className="super-comp-detail__info-item">
              <span className="super-comp-detail__info-label">Field Sales Module:</span>
              <span className="super-comp-detail__info-val">
                {company.field_sales_enabled ? (
                  <span className="super-comp-detail__badge-success">
                    <CheckCircle2 size={13} /> Active & Configured
                  </span>
                ) : (
                  <span className="super-comp-detail__badge-neutral">
                    <XCircle size={13} /> Disabled
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
