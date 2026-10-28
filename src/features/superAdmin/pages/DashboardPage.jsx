import { useEffect, useState } from "react";
import { useOutletContext, Link } from "react-router-dom";
import {
  Building2,
  Users,
  UserCheck,
  TrendingUp,
  MapPin,
  Calendar,
  Activity,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import superAdminAPI from "../services/superAdminAPI";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import LoadingSkeleton from "../components/LoadingSkeleton";
import ErrorState from "../components/ErrorState";
import "./DashboardPage.css";

export default function DashboardPage() {
  const { setHeaderInfo } = useOutletContext() || {};
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (setHeaderInfo) {
      setHeaderInfo({
        title: "Platform Overview",
        breadcrumbs: ["Platform", "Dashboard"],
      });
    }
  }, [setHeaderInfo]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await superAdminAPI.getDashboard();
      if (res && res.data) {
        setData(res.data);
      } else {
        throw new Error(res?.message || "Invalid dashboard payload received.");
      }
    } catch (err) {
      console.error("Super Admin Dashboard fetch failed:", err);
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.detail ||
          err?.message ||
          "Unable to load platform dashboard data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="super-dashboard">
        <LoadingSkeleton type="cards" cards={4} />
        <div className="super-dashboard__grid-2">
          <LoadingSkeleton type="chart" />
          <LoadingSkeleton type="chart" />
        </div>
        <LoadingSkeleton type="table" rows={5} cols={5} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="super-dashboard">
        <ErrorState
          title="Failed to Load Dashboard"
          message={error || "Could not retrieve platform metrics."}
          onRetry={fetchDashboardData}
        />
      </div>
    );
  }

  const {
    companies = {},
    employees = {},
    users = {},
    recent_companies = [],
    company_growth_trend = [],
    attendance_overview = {},
    field_sales_overview = {},
    platform_activity = {},
  } = data;

  // Format status breakdown data for bar chart
  const employeeStatusData = Object.entries(employees.status_breakdown || {}).map(
    ([statusKey, count]) => ({
      status: statusKey.replace(/_/g, " "),
      count,
    })
  );

  return (
    <div className="super-dashboard">
      {/* 1. Core Summary Metrics */}
      <section className="super-dashboard__metrics-grid">
        <StatCard
          title="Total Organizations"
          value={companies.total ?? 0}
          subtext={`${companies.field_sales_enabled ?? 0} with Field Sales enabled`}
          icon={Building2}
          variant="teal"
          badge="Global"
        />
        <StatCard
          title="Platform Employees"
          value={employees.total ?? 0}
          subtext={`${employees.active ?? 0} Active • ${employees.inactive ?? 0} Inactive`}
          icon={Users}
          variant="emerald"
        />
        <StatCard
          title="Registered Accounts"
          value={users.total ?? 0}
          subtext={`${users.active ?? 0} Active • ${users.superusers ?? 0} Superuser${
            users.superusers === 1 ? "" : "s"
          }`}
          icon={UserCheck}
          variant="gold"
        />
        <StatCard
          title="Field Sales Usage"
          value={field_sales_overview.total_leads ?? 0}
          subtext={`${field_sales_overview.total_visits ?? 0} visits • ${field_sales_overview.total_employees ?? 0} reps`}
          icon={MapPin}
          variant="neutral"
        />
      </section>

      {/* 2. Charts Section */}
      <div className="super-dashboard__grid-2">
        {/* Company Registration Growth */}
        <section className="super-dashboard__card">
          <div className="super-dashboard__card-header">
            <div className="super-dashboard__card-titles">
              <h2 className="super-dashboard__card-title">Organization Registrations</h2>
              <span className="super-dashboard__card-subtitle">
                Monthly trend of new companies joining the platform
              </span>
            </div>
            <TrendingUp size={18} className="super-dashboard__card-icon" />
          </div>

          <div className="super-dashboard__chart-wrap">
            {company_growth_trend && company_growth_trend.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart
                  data={company_growth_trend}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0BA37F" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#0BA37F" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E6EAEE" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: "#5B6672" }}
                    axisLine={{ stroke: "#E6EAEE" }}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: "#5B6672" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1A1F24",
                      borderRadius: 8,
                      border: "none",
                      color: "#FFFFFF",
                      fontSize: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    name="Companies"
                    stroke="#0BA37F"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#growthGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="super-dashboard__chart-empty">
                <p>No monthly registration data recorded yet.</p>
              </div>
            )}
          </div>
        </section>

        {/* Workforce Status Distribution */}
        <section className="super-dashboard__card">
          <div className="super-dashboard__card-header">
            <div className="super-dashboard__card-titles">
              <h2 className="super-dashboard__card-title">Workforce Status Distribution</h2>
              <span className="super-dashboard__card-subtitle">
                Current employee employment classifications across all tenants
              </span>
            </div>
            <Users size={18} className="super-dashboard__card-icon" />
          </div>

          <div className="super-dashboard__chart-wrap">
            {employeeStatusData && employeeStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={employeeStatusData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E6EAEE" vertical={false} />
                  <XAxis
                    dataKey="status"
                    tick={{ fontSize: 11, fill: "#5B6672" }}
                    axisLine={{ stroke: "#E6EAEE" }}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: "#5B6672" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1A1F24",
                      borderRadius: 8,
                      border: "none",
                      color: "#FFFFFF",
                      fontSize: 12,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar
                    dataKey="count"
                    name="Employees"
                    fill="#0F3D3E"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="super-dashboard__chart-empty">
                <p>No employee records present.</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* 3. Operational Highlights: Attendance Overview */}
      <section className="super-dashboard__operational-grid">
        <div className="super-dashboard__card">
          <div className="super-dashboard__card-header">
            <div className="super-dashboard__card-titles">
              <h2 className="super-dashboard__card-title">Platform Attendance Snapshot</h2>
              <span className="super-dashboard__card-subtitle">
                Today ({attendance_overview.today_date || "Current date"}) records across all companies
              </span>
            </div>
            <Calendar size={18} className="super-dashboard__card-icon" />
          </div>

          <div className="super-dashboard__attendance-stats">
            <div className="super-dashboard__attendance-stat-item">
              <span className="super-dashboard__attendance-stat-value">
                {(attendance_overview.today_records ?? 0).toLocaleString()}
              </span>
              <span className="super-dashboard__attendance-stat-label">Punches Recorded Today</span>
            </div>
            <div className="super-dashboard__attendance-stat-item">
              <span className="super-dashboard__attendance-stat-value">
                {(attendance_overview.total_records ?? 0).toLocaleString()}
              </span>
              <span className="super-dashboard__attendance-stat-label">Historical Attendance Total</span>
            </div>
          </div>
        </div>

        <div className="super-dashboard__card">
          <div className="super-dashboard__card-header">
            <div className="super-dashboard__card-titles">
              <h2 className="super-dashboard__card-title">Field Sales Platform Aggregate</h2>
              <span className="super-dashboard__card-subtitle">
                Sales ecosystem adoption across companies
              </span>
            </div>
            <MapPin size={18} className="super-dashboard__card-icon" />
          </div>

          <div className="super-dashboard__fs-grid">
            <div className="super-dashboard__fs-stat">
              <span className="super-dashboard__fs-value">
                {field_sales_overview.total_customers ?? 0}
              </span>
              <span className="super-dashboard__fs-label">Customers</span>
            </div>
            <div className="super-dashboard__fs-stat">
              <span className="super-dashboard__fs-value">
                {field_sales_overview.total_leads ?? 0}
              </span>
              <span className="super-dashboard__fs-label">Leads</span>
            </div>
            <div className="super-dashboard__fs-stat">
              <span className="super-dashboard__fs-value">
                {field_sales_overview.total_visits ?? 0}
              </span>
              <span className="super-dashboard__fs-label">Visits</span>
            </div>
            <div className="super-dashboard__fs-stat">
              <span className="super-dashboard__fs-value">
                {field_sales_overview.total_employees ?? 0}
              </span>
              <span className="super-dashboard__fs-label">Sales Reps</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Recently Registered Companies */}
      <section className="super-dashboard__card">
        <div className="super-dashboard__card-header">
          <div className="super-dashboard__card-titles">
            <h2 className="super-dashboard__card-title">Recently Registered Organizations</h2>
            <span className="super-dashboard__card-subtitle">
              Newest company tenants created on the platform
            </span>
          </div>
          <Link to="/admin/companies" className="super-dashboard__view-all-link">
            <span>View All Companies</span>
            <ArrowRight size={15} />
          </Link>
        </div>

        {recent_companies && recent_companies.length > 0 ? (
          <div className="super-dashboard__table-wrapper">
            <table className="super-dashboard__table">
              <thead>
                <tr>
                  <th>Organization</th>
                  <th>Code</th>
                  <th>Industry</th>
                  <th>Employees</th>
                  <th>Field Sales</th>
                  <th>Owner</th>
                  <th>Registered</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recent_companies.map((comp) => (
                  <tr key={comp.id}>
                    <td>
                      <div className="super-dashboard__comp-cell">
                        {comp.logo_url ? (
                          <img
                            src={comp.logo_url}
                            alt=""
                            className="super-dashboard__comp-logo"
                          />
                        ) : (
                          <div className="super-dashboard__comp-avatar">
                            {comp.name ? comp.name.charAt(0).toUpperCase() : "C"}
                          </div>
                        )}
                        <span className="super-dashboard__comp-name">{comp.name}</span>
                      </div>
                    </td>
                    <td>
                      <span className="super-dashboard__code-pill">{comp.code || "—"}</span>
                    </td>
                    <td>{comp.industry || "—"}</td>
                    <td>
                      <strong>{(comp.employee_count ?? 0).toLocaleString()}</strong>
                    </td>
                    <td>
                      <StatusBadge type="fieldSales" value={comp.field_sales_enabled} />
                    </td>
                    <td>
                      <span className="super-dashboard__owner-name">
                        {comp.owner?.username || comp.owner?.email || "—"}
                      </span>
                    </td>
                    <td className="super-dashboard__date-cell">
                      {comp.created_at
                        ? new Date(comp.created_at).toLocaleDateString()
                        : "—"}
                    </td>
                    <td>
                      <Link
                        to={`/admin/companies/${comp.id}`}
                        className="super-dashboard__row-action"
                      >
                        Inspect
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="super-dashboard__empty-block">
            <Building2 size={32} />
            <p>No recent organizations recorded in the database.</p>
          </div>
        )}
      </section>

      {/* 5. Honest Platform Audit Log Section */}
      <section className="super-dashboard__card">
        <div className="super-dashboard__card-header">
          <div className="super-dashboard__card-titles">
            <h2 className="super-dashboard__card-title">Platform Activity Stream</h2>
            <span className="super-dashboard__card-subtitle">
              Centralized platform-wide event audit log
            </span>
          </div>
          <Activity size={18} className="super-dashboard__card-icon" />
        </div>

        {platform_activity.is_available &&
        platform_activity.events &&
        platform_activity.events.length > 0 ? (
          <div className="super-dashboard__events-list">
            {platform_activity.events.map((evt, idx) => (
              <div key={idx} className="super-dashboard__event-item">
                <span className="super-dashboard__event-desc">{evt.description}</span>
                <span className="super-dashboard__event-time">{evt.timestamp}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="super-dashboard__honest-empty">
            <div className="super-dashboard__honest-icon">
              <ShieldAlert size={24} />
            </div>
            <div className="super-dashboard__honest-content">
              <h3 className="super-dashboard__honest-title">
                Platform Audit Log Unavailable
              </h3>
              <p className="super-dashboard__honest-desc">
                {platform_activity.message ||
                  "No centralized platform audit log model exists in the database schema. Domain-level audit trails exist within their respective tenant modules (such as payroll runs and field sales leads)."}
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
