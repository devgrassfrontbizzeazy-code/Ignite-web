import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  MapPin,
  Settings2,
  Mail,
  Phone,
  Globe,
  Pencil,
  RefreshCw,
  Users,
  BriefcaseBusiness,
  Layers3,
  CheckCircle2,
  Circle,
  ArrowRight,
  ShieldCheck, Clock3,
} from "lucide-react";

import { getCompany } from "../../services/api/companyAPI";
import { getDepartments } from "../../services/api/departmentAPI";
import { getDesignations } from "../../services/api/designationAPI";
import { getEmployees } from "../../services/api/employeeAPI";
import { getRoles } from "../../services/api/roleAPI";
import { getWorkSchedule } from "../../services/api/workScheduleAPI";
import leavePolicyApi from "../../services/api/leavePolicyAPI";
import holidayAPI from "../../services/api/holidayAPI";
import { calculateOrganizationSetupProgress } from "../../utils/setupProgressUtils";
import roleService from "../../services/roleService";

import "./OrganizationOverview.css";
import IgniteLoader from "../../components/common/IgniteLoader/IgniteLoader";

const extractList = (response) => {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.results)) {
    return response.results;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  return [];
};

const normalizeCompany = (raw) => {
  const c = raw?.company || raw?.data || raw?.result || raw || {};

  return {
    name: c.name || c.company_name || c.companyName || "—",

    code: c.code || c.company_code || c.companyCode || "—",

    industry: c.industry || "—",

    companyType: c.company_type || c.companyType || "—",

    email: c.company_email || c.companyEmail || c.email || "—",

    phone: c.phone || c.phone_number || c.phoneNumber || "—",

    website: c.website || "—",

    registrationNumber:
      c.registration_no || c.registrationNumber || c.registration_number || "—",

    logo: c.logo || c.logo_url || c.company_logo || c.companyLogo || "",

    fullAddress: c.full_address || c.fullAddress || c.address || "",

    city: c.city || c.addressCity || "",

    state: c.state || c.addressState || "",

    country: c.country || c.addressCountry || "",

    pincode:
      c.pincode || c.postal_code || c.postalCode || c.addressPostalCode || "",

    mapLocation: c.map_location || c.mapLocation || "",

    latitude: c.latitude ?? c.lat ?? "",

    longitude: c.longitude ?? c.lng ?? "",

    financialYear: c.financial_year || c.financialYear || "—",

    currency: c.currency || "—",

    timezone: c.time_zone || c.timezone || "—",

    dateFormat: c.date_format || c.dateFormat || "—",

    weekStartsOn: c.week_starts_on || c.weekStartsOn || "—",

    hasShifts: Boolean(c.has_shifts ?? c.hasShifts),

    hasAttendancePolicies: Boolean(
      c.has_attendance_policies ?? c.hasAttendancePolicies,
    ),

    hasLeavePolicies: Boolean(c.has_leave_policies ?? c.hasLeavePolicies),

    hasHolidays: Boolean(c.has_holidays ?? c.hasHolidays),

    hasPayroll: Boolean(c.has_payroll ?? c.hasPayroll),
  };
};

const formatWebsite = (website) => {
  if (!website || website === "—") {
    return null;
  }

  if (website.startsWith("http://") || website.startsWith("https://")) {
    return website;
  }

  return `https://${website}`;
};

function InfoItem({ icon: Icon, label, value }) {
  return (
    <div className="organization-overview__info-item">
      <div className="organization-overview__info-icon">
        <Icon size={17} strokeWidth={1.8} />
      </div>

      <div className="organization-overview__info-content">
        <span>{label}</span>
        <strong>{value || "—"}</strong>
      </div>
    </div>
  );
}

function SectionHeader({ icon: Icon, eyebrow, title, action, onAction }) {
  return (
    <div className="organization-overview__section-header">
      <div className="organization-overview__section-heading">
        <div className="organization-overview__section-icon">
          <Icon size={18} strokeWidth={1.8} />
        </div>

        <div>
          <span className="organization-overview__eyebrow">{eyebrow}</span>

          <h2>{title}</h2>
        </div>
      </div>

      {action && (
        <button
          type="button"
          className="organization-overview__text-button"
          onClick={onAction}
        >
          <Pencil size={15} />
          {action}
        </button>
      )}
    </div>
  );
}

function StructureStat({ icon: Icon, label, value, description, onClick }) {
  return (
    <button
      type="button"
      className="organization-overview__structure-item"
      onClick={onClick}
    >
      <div className="organization-overview__structure-icon">
        <Icon size={19} strokeWidth={1.8} />
      </div>

      <div className="organization-overview__structure-content">
        <span>{label}</span>

        <strong>{value}</strong>

        <small>{description}</small>
      </div>

      <ArrowRight
        className="organization-overview__structure-arrow"
        size={18}
      />
    </button>
  );
}
function ConfigurationItem({
  icon: Icon,
  label,
  description,
  status,
  action,
  onClick,
}) {
  return (
    <button
      type="button"
      className="organization-overview__configuration-item"
      onClick={onClick}
    >
      <div className="organization-overview__configuration-icon">
        <Icon size={19} strokeWidth={1.8} />
      </div>

      <div className="organization-overview__configuration-content">
        <div className="organization-overview__configuration-title">
          <strong>{label}</strong>

          <span
            className={`organization-overview__configuration-status ${
              status === "Configured" ? "is-configured" : "is-pending"
            }`}
          >
            {status}
          </span>
        </div>

        <span>{description}</span>
      </div>

      <ArrowRight
        className="organization-overview__configuration-arrow"
        size={18}
      />
    </button>
  );
}
function SetupRow({ complete, label, description, action, onAction }) {
  return (
    <div className="organization-overview__setup-row">
      <div
        className={`organization-overview__setup-status ${
          complete ? "is-complete" : ""
        }`}
      >
        {complete ? <CheckCircle2 size={19} /> : <Circle size={19} />}
      </div>

      <div className="organization-overview__setup-content">
        <strong>{label}</strong>

        <span>{description}</span>
      </div>

      <span
        className={`organization-overview__setup-badge ${
          complete ? "is-complete" : "is-pending"
        }`}
      >
        {complete ? "Configured" : "Pending"}
      </span>

      <button
        type="button"
        className="organization-overview__setup-action"
        onClick={onAction}
      >
        {action}

        <ArrowRight size={14} />
      </button>
    </div>
  );
}

export default function OrganizationOverview() {
  const navigate = useNavigate();

  const [company, setCompany] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [roles, setRoles] = useState([]);
  const [workSchedule, setWorkSchedule] = useState(null);
  const [leavePolicies, setLeavePolicies] = useState([]);
  const [holidays, setHolidays] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadOverview = async (isRefresh = false) => {
    try {
      setError("");

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [
        companyResponse,
        departmentResponse,
        designationResponse,
        employeeResponse,
        roleResponse,
        workScheduleResponse,
        leavePolicyResponse,
        holidayResponse,
      ] = await Promise.allSettled([
        getCompany(),
        getDepartments(),
        getDesignations(),
        getEmployees(),
        getRoles(),
        getWorkSchedule(),
        leavePolicyApi.getPolicies(),
        holidayAPI.getHolidays(),
      ]);

      if (companyResponse.status === "fulfilled") {
        setCompany(normalizeCompany(companyResponse.value?.data));
      } else {
        throw new Error("Unable to load company information.");
      }

      if (departmentResponse.status === "fulfilled") {
        setDepartments(extractList(departmentResponse.value));
      }

      if (designationResponse.status === "fulfilled") {
        setDesignations(extractList(designationResponse.value));
      }

      if (employeeResponse.status === "fulfilled") {
        setEmployees(extractList(employeeResponse.value));
      }

      if (roleResponse.status === "fulfilled") {
        setRoles(extractList(roleResponse.value));
      } else {
        setRoles(roleService.getRoles());
      }

      if (workScheduleResponse.status === "fulfilled") {
        setWorkSchedule(workScheduleResponse.value?.data || workScheduleResponse.value);
      }

      if (leavePolicyResponse.status === "fulfilled") {
        setLeavePolicies(extractList(leavePolicyResponse.value));
      }

      if (holidayResponse.status === "fulfilled") {
        setHolidays(extractList(holidayResponse.value));
      }
    } catch (err) {
      console.error("Organization overview error:", err);

      setError(err?.message || "Unable to load organization information.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  const handleRefresh = () => {
    loadOverview(true);
  };

  const setupProgressData = calculateOrganizationSetupProgress({
    company,
    departments,
    designations,
    roles,
    workSchedule,
    leavePolicies,
    holidays,
  });

  if (loading) {
    return <IgniteLoader text="Loading organization overview..." />;
  }

  if (error && !company) {
    return (
      <div className="organization-overview">
        <div className="organization-overview__error">
          <div className="organization-overview__error-icon">
            <Building2 size={22} />
          </div>

          <div>
            <h2>Unable to load organization</h2>

            <p>{error}</p>
          </div>

          <button
            type="button"
            onClick={() => loadOverview()}
            className="organization-overview__primary-button"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!company) {
    return null;
  }

  const websiteUrl = formatWebsite(company.website);

  const locationParts = [company.city, company.state, company.country].filter(
    Boolean,
  );

  return (
    <div className="organization-overview">
      {/* PAGE HEADER */}

      <header className="organization-overview__header">
        <div>
          <span className="organization-overview__page-eyebrow">
            ORGANIZATION
          </span>

          <h1>Organization Overview</h1>

          <p>
            Manage and review your company's core information and configuration.
          </p>
        </div>

        <button
          type="button"
          className="organization-overview__refresh-button"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw
            size={16}
            className={refreshing ? "organization-overview__refresh-spin" : ""}
          />

          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </header>

      {/* COMPANY HERO */}

      <section className="organization-overview__company-hero">
        <div className="organization-overview__company-main">
          <div className="organization-overview__company-logo">
            {company.logo ? (
              <img
                src={company.logo}
                alt={`${company.name} logo`}
                onError={(event) => {
                  console.error(
                    "ORGANIZATION OVERVIEW LOGO LOAD FAILED:",
                    company.logo,
                  );
                  event.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <Building2 size={34} />
            )}
          </div>

          <div className="organization-overview__company-identity">
            <span className="organization-overview__company-label">
              COMPANY PROFILE
            </span>

            <h2>{company.name}</h2>

            <div className="organization-overview__company-meta">
              <span>{company.industry}</span>

              <span className="organization-overview__meta-dot" />

              <span>{company.companyType}</span>

              <span className="organization-overview__meta-dot" />

              <span>Code: {company.code}</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          className="organization-overview__primary-button"
          onClick={() => navigate("/company/edit")}
        >
          <Pencil size={16} />
          Edit Company Details
        </button>
      </section>

      {/* COMPANY CONTACT */}

      <section className="organization-overview__contact-strip">
        <InfoItem icon={Mail} label="Company Email" value={company.email} />

        <InfoItem icon={Phone} label="Phone" value={company.phone} />

        <InfoItem
          icon={Globe}
          label="Website"
          value={
            websiteUrl ? (
              <a href={websiteUrl} target="_blank" rel="noreferrer">
                {company.website}
              </a>
            ) : (
              "—"
            )
          }
        />

        <InfoItem
          icon={ShieldCheck}
          label="Registration Number"
          value={company.registrationNumber}
        />
      </section>

      {/* ADDRESS + BUSINESS SETTINGS */}

      <div className="organization-overview__two-column">
        {/* ADDRESS */}

        <section className="organization-overview__panel">
          <SectionHeader
            icon={MapPin}
            eyebrow="LOCATION"
            title="Company Address"
            action="Edit"
            onAction={() => navigate("/company/address/edit")}
          />

          <div className="organization-overview__panel-body">
            <div className="organization-overview__address">
              <strong>{company.fullAddress || "Address not added"}</strong>

              {locationParts.length > 0 && (
                <span>{locationParts.join(", ")}</span>
              )}

              {company.pincode && (
                <span>PIN / Postal Code: {company.pincode}</span>
              )}

              {company.mapLocation && (
                <span className="organization-overview__map-location">
                  {company.mapLocation}
                </span>
              )}
            </div>

            {(company.latitude || company.longitude) && (
              <div className="organization-overview__coordinates">
                <span>Coordinates</span>

                <strong>
                  {company.latitude}, {company.longitude}
                </strong>
              </div>
            )}
          </div>
        </section>

        {/* BUSINESS SETTINGS */}

        <section className="organization-overview__panel">
          <SectionHeader
            icon={Settings2}
            eyebrow="CONFIGURATION"
            title="Business Settings"
            action="Edit"
            onAction={() => navigate("/company/business-settings/edit")}
          />

          <div className="organization-overview__settings-body">
            <div className="organization-overview__settings-grid">
              <div>
                <span>Financial Year</span>
                <strong>{company.financialYear}</strong>
              </div>

              <div>
                <span>Currency</span>
                <strong>{company.currency}</strong>
              </div>

              <div>
                <span>Timezone</span>
                <strong>{company.timezone}</strong>
              </div>

              <div>
                <span>Date Format</span>
                <strong>{company.dateFormat}</strong>
              </div>

              <div>
                <span>Week Starts On</span>
                <strong>{company.weekStartsOn}</strong>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ORGANIZATION STRUCTURE */}

      <section className="organization-overview__structure">
        <div className="organization-overview__section-title">
          <div>
            <span className="organization-overview__page-eyebrow">
              ORGANIZATION
            </span>

            <h2>Organization Structure</h2>
          </div>

          <p>Current size of your organization setup.</p>
        </div>

        {/* IMPORTANT: ONLY ONE GRID */}

        <div className="organization-overview__structure-grid">
          <StructureStat
            icon={Layers3}
            label="Departments"
            value={departments.length}
            description="Active organization units"
            onClick={() => navigate("/departments")}
          />

          <StructureStat
            icon={BriefcaseBusiness}
            label="Designations"
            value={designations.length}
            description="Defined employee positions"
            onClick={() => navigate("/designations")}
          />

          <StructureStat
            icon={Users}
            label="Employees"
            value={employees.length}
            description="People in the organization"
            onClick={() => navigate("/employees")}
          />
        </div>
      </section>
      {/* WORK SCHEDULE */}

      <section className="organization-overview__work-schedule">
        <div className="organization-overview__work-schedule-icon">
          <Clock3 size={21} strokeWidth={1.8} />
        </div>

        <div className="organization-overview__work-schedule-content">
          <span className="organization-overview__page-eyebrow">
            WORK SCHEDULE
          </span>

          <h2>Work Schedule</h2>

          <p>
            Configure working days, default shifts, break timings and recurring
            schedules for your organization.
          </p>
        </div>

        <button
          type="button"
          className="organization-overview__work-schedule-button"
          onClick={() => navigate("/work-schedule")}
        >
          Configure
          <ArrowRight size={15} />
        </button>
      </section>

      {/* SETUP STATUS */}

      {/* SETUP STATUS */}

      <section className="organization-overview__setup">
        <div className="organization-overview__setup-header">
          <div>
            <span className="organization-overview__page-eyebrow">
              CONFIGURATION
            </span>

            <h2>Organization Setup Status</h2>

            <p>
              Review the configuration areas that have been completed and those
              still pending.
            </p>
          </div>

          <div className="organization-overview__progress-summary">
            <strong>{setupProgressData.percentage}%</strong>

            <span>
              {setupProgressData.completed} of {setupProgressData.total} completed
            </span>
          </div>
        </div>

        <div className="organization-overview__progress-track">
          <div
            className="organization-overview__progress-fill"
            style={{
              width: `${setupProgressData.percentage}%`,
            }}
          />
        </div>

        <div className="organization-overview__setup-list">
          {setupProgressData.items.map((item) => (
            <SetupRow
              key={item.key || item.label}
              complete={item.complete}
              label={item.label}
              description={item.description}
              action={item.action}
              onAction={() => navigate(item.path)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
