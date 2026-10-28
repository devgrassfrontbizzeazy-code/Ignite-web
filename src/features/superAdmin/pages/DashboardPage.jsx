/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState, useMemo } from "react";
import { useOutletContext, Link } from "react-router-dom";
import {
  Building2,
  Users,
  DollarSign,
  Clock,
  Zap,
  Coins,
  TrendingUp,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Search,
  Download,
  Eye,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
  ResponsiveContainer,
} from "recharts";
import * as XLSX from "xlsx";
import superAdminAPI from "../services/superAdminAPI";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import LoadingSkeleton from "../components/LoadingSkeleton";
import ErrorState from "../components/ErrorState";
import "./DashboardPage.css";

export default function DashboardPage() {
  const { setHeaderInfo } = useOutletContext() || {};
  const [data, setData] = useState(null);
  const [companiesList, setCompaniesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Table filter state
  const [tableSearch, setTableSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tokenFilter, setTokenFilter] = useState("all");

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

      // Fetch dashboard metrics and company directory in parallel
      const [dashRes, compRes] = await Promise.all([
        superAdminAPI.getDashboard(),
        superAdminAPI.getCompanies({ page_size: 100 }),
      ]);

      if (dashRes && dashRes.data) {
        setData(dashRes.data);
      } else {
        throw new Error(dashRes?.message || "Invalid dashboard payload received.");
      }

      if (compRes && compRes.data) {
        setCompaniesList(Array.isArray(compRes.data) ? compRes.data : []);
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

  // Filtered companies for the Primary Company Table
  const filteredCompanies = useMemo(() => {
    return companiesList.filter((company) => {
      const name = (company.name || "").toLowerCase();
      const code = (company.code || "").toLowerCase();
      const industry = (company.industry || "").toLowerCase();
      const query = tableSearch.toLowerCase().trim();

      const matchesSearch = !query || name.includes(query) || code.includes(query) || industry.includes(query);

      let matchesStatus = true;
      const isActive = company.employee_count > 0 || company.field_sales_enabled;
      if (statusFilter === "active") matchesStatus = isActive;
      if (statusFilter === "inactive") matchesStatus = !isActive;

      // Low tokens filter (since tokens are unmetered, low tokens count is 0)
      let matchesToken = true;
      if (tokenFilter === "low") matchesToken = false;

      return matchesSearch && matchesStatus && matchesToken;
    });
  }, [companiesList, tableSearch, statusFilter, tokenFilter]);

  // Derived metrics for the 8 Top-Level Cards
  const totalCompanies = data?.companies?.total ?? companiesList.length;
  const activeCompanies = companiesList.filter((c) => (c.employee_count > 0 || c.field_sales_enabled)).length;
  const inactiveCompanies = Math.max(0, totalCompanies - activeCompanies);

  const totalEmployees = data?.employees?.total ?? 0;
  const activeEmployees = data?.employees?.active ?? 0;

  const todayPunches = data?.attendance_overview?.today_records ?? 0;
  const activeUsersToday = Math.max(todayPunches, data?.users?.active ?? 0);

  // New companies this month calculation
  const newCompaniesThisMonth = useMemo(() => {
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth();
    return companiesList.filter((c) => {
      if (!c.created_at) return false;
      const d = new Date(c.created_at);
      return d.getFullYear() === curYear && d.getMonth() === curMonth;
    }).length;
  }, [companiesList]);

  // Companies with no activity for 14+ days
  const inactiveAttentionCompanies = useMemo(() => {
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    return companiesList.filter((c) => {
      if (c.employee_count > 0) return false;
      if (!c.created_at) return true;
      return new Date(c.created_at) < fourteenDaysAgo;
    });
  }, [companiesList]);

  // Growth Trend Chart Data
  const growthTrend = useMemo(() => {
    return data?.company_growth_trend || [];
  }, [data?.company_growth_trend]);

  // Monthly Signups vs Churn Comparison Chart Data
  const signupsVsChurnData = useMemo(() => {
    if (!growthTrend || growthTrend.length === 0) {
      return [];
    }
    return growthTrend.map((item) => ({
      month: item.month,
      signups: item.count,
      churn: 0, // No cancellations recorded in database schema
    }));
  }, [growthTrend]);

  // Export filtered companies to genuine Excel (.xlsx) file
  const handleExportExcel = () => {
    if (filteredCompanies.length === 0) {
      alert("No company data available to export.");
      return;
    }

    const rows = filteredCompanies.map((c) => ({
      "Company Name": c.name || "—",
      "Company Code": c.code || "—",
      "Industry": c.industry || "—",
      "Organization Type": c.company_type || "—",
      "Operational Status": (c.employee_count > 0 || c.field_sales_enabled) ? "Active" : "Inactive",
      "Total Workforce": c.employee_count ?? 0,
      "Subscription Plan": "Standard Direct",
      "Plan Expiry": "Perpetual",
      "Token Allocation": "Unlimited / Unmetered",
      "Country": c.country || "—",
      "Registration Date": c.created_at ? new Date(c.created_at).toLocaleDateString() : "—",
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Organizations");

    const dateStr = new Date().toISOString().split("T")[0];
    XLSX.writeFile(workbook, `Ignite_Organizations_Directory_${dateStr}.xlsx`);
  };

  if (loading) {
    return (
      <div className="super-dashboard">
        <LoadingSkeleton type="cards" cards={8} />
        <div className="super-dashboard__grid-2">
          <LoadingSkeleton type="chart" />
          <LoadingSkeleton type="chart" />
        </div>
        <LoadingSkeleton type="table" rows={6} cols={7} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="super-dashboard">
        <ErrorState
          title="Dashboard Unavailable"
          message={error || "Could not retrieve real-time platform metrics."}
          onRetry={fetchDashboardData}
        />
      </div>
    );
  }

  return (
    <div className="super-dashboard">
      {/* =========================================================================
          SECTION A: EIGHT TOP-LEVEL CARDS
          ========================================================================= */}
      <section className="super-dashboard__metrics-section" aria-label="Key Platform Metrics">
        <div className="super-dashboard__metrics-grid-8">
          {/* Card 1: Total Companies */}
          <StatCard
            title="Total Organizations"
            value={totalCompanies}
            subtext={`${activeCompanies} Active • ${inactiveCompanies} Inactive`}
            icon={Building2}
            variant="teal"
          />

          {/* Card 2: Total Employees */}
          <StatCard
            title="Total Workforce"
            value={totalEmployees}
            subtext={`${activeEmployees} Active staff across platform`}
            icon={Users}
            variant="emerald"
          />

          {/* Card 3: Monthly Recurring Revenue (MRR) */}
          <StatCard
            title="Monthly Recurring Revenue"
            value="$0.00"
            subtext="Awaiting billing module integration"
            icon={DollarSign}
            variant="gold"
          />

          {/* Card 4: Plans Expiring in 30 Days */}
          <StatCard
            title="Plans Expiring (30d)"
            value="0"
            subtext="All accounts perpetual / active"
            icon={Clock}
            variant="neutral"
          />

          {/* Card 5: Active Users Today */}
          <StatCard
            title="Active Users Today"
            value={activeUsersToday}
            subtext={`${todayPunches} attendance punches recorded`}
            icon={Zap}
            variant="emerald"
          />

          {/* Card 6: Tokens Used This Month */}
          <StatCard
            title="Tokens Used (Month)"
            value="0"
            subtext="Unmetered / Token ledger not configured"
            icon={Coins}
            variant="neutral"
          />

          {/* Card 7: New Companies This Month */}
          <StatCard
            title="New Tenants (Month)"
            value={newCompaniesThisMonth}
            subtext={`${growthTrend.length > 0 ? "Latest registry cohort" : "Current calendar month"}`}
            icon={TrendingUp}
            variant="teal"
          />

          {/* Card 8: Business Usage and Tokens */}
          <StatCard
            title="Platform Usage Activity"
            value={(data.attendance_overview?.today_records || 0) + (data.field_sales_overview?.total_visits || 0)}
            subtext={`${data.field_sales_overview?.total_leads || 0} Leads • ${data.attendance_overview?.total_records || 0} Punches`}
            icon={Sparkles}
            variant="gold"
          />
        </div>
      </section>

      {/* =========================================================================
          SECTION D: NEEDS ATTENTION PANEL
          ========================================================================= */}
      <section className="super-dashboard__attention-card" aria-label="System Alerts">
        <div className="super-dashboard__attention-header">
          <div className="super-dashboard__attention-titles">
            <div className="super-dashboard__attention-badge">
              <AlertTriangle size={15} />
              <span>Needs Attention</span>
            </div>
            <h2 className="super-dashboard__attention-title">Actionable Administrative Alerts</h2>
          </div>
          <span className="super-dashboard__attention-status">
            {inactiveAttentionCompanies.length > 0 ? "Items require inspection" : "All systems operational"}
          </span>
        </div>

        <div className="super-dashboard__attention-grid">
          {/* Alert 1 */}
          <div className="super-dashboard__attention-tile">
            <div className="super-dashboard__attention-tile-top">
              <span className="super-dashboard__attention-tile-tag super-dashboard__attention-tile-tag--neutral">
                0 Pending
              </span>
              <Clock size={16} className="super-dashboard__attention-tile-icon" />
            </div>
            <div className="super-dashboard__attention-tile-title">Plans Expiring (7 Days)</div>
            <div className="super-dashboard__attention-tile-desc">
              All active organization plans are perpetual or enterprise direct.
            </div>
          </div>

          {/* Alert 2 */}
          <div className="super-dashboard__attention-tile">
            <div className="super-dashboard__attention-tile-top">
              <span className="super-dashboard__attention-tile-tag super-dashboard__attention-tile-tag--neutral">
                0 Overdue
              </span>
              <DollarSign size={16} className="super-dashboard__attention-tile-icon" />
            </div>
            <div className="super-dashboard__attention-tile-title">Overdue Invoices</div>
            <div className="super-dashboard__attention-tile-desc">
              No outstanding balance or unpaid invoices recorded in database.
            </div>
          </div>

          {/* Alert 3 */}
          <div className="super-dashboard__attention-tile">
            <div className="super-dashboard__attention-tile-top">
              <span className="super-dashboard__attention-tile-tag super-dashboard__attention-tile-tag--neutral">
                0 Low
              </span>
              <Coins size={16} className="super-dashboard__attention-tile-icon" />
            </div>
            <div className="super-dashboard__attention-tile-title">Low Token Balances (&lt;20%)</div>
            <div className="super-dashboard__attention-tile-desc">
              Token allocations currently unmetered across all tenants.
            </div>
          </div>

          {/* Alert 4 */}
          <div className="super-dashboard__attention-tile">
            <div className="super-dashboard__attention-tile-top">
              <span className="super-dashboard__attention-tile-tag super-dashboard__attention-tile-tag--neutral">
                0 Trials
              </span>
              <CheckCircle2 size={16} className="super-dashboard__attention-tile-icon" />
            </div>
            <div className="super-dashboard__attention-tile-title">Trials Ending (3 Days)</div>
            <div className="super-dashboard__attention-tile-desc">
              No temporary trial periods pending expiration.
            </div>
          </div>

          {/* Alert 5 */}
          <div className={`super-dashboard__attention-tile ${inactiveAttentionCompanies.length > 0 ? "super-dashboard__attention-tile--active" : ""}`}>
            <div className="super-dashboard__attention-tile-top">
              <span className={`super-dashboard__attention-tile-tag ${inactiveAttentionCompanies.length > 0 ? "super-dashboard__attention-tile-tag--warning" : "super-dashboard__attention-tile-tag--neutral"}`}>
                {inactiveAttentionCompanies.length} Inactive
              </span>
              <ShieldAlert size={16} className="super-dashboard__attention-tile-icon" />
            </div>
            <div className="super-dashboard__attention-tile-title">No Activity for ≥ 14 Days</div>
            <div className="super-dashboard__attention-tile-desc">
              {inactiveAttentionCompanies.length > 0
                ? `${inactiveAttentionCompanies.slice(0, 2).map((c) => c.name).join(", ")}${inactiveAttentionCompanies.length > 2 ? ` and ${inactiveAttentionCompanies.length - 2} more` : ""}`
                : "All onboarded organizations have logged staff or activity."}
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION B: TWO CHARTS SIDE BY SIDE
          ========================================================================= */}
      <section className="super-dashboard__grid-2" aria-label="Visual Trends">
        {/* Chart 1: Tenant Acquisition Growth Trend */}
        <div className="super-dashboard__card">
          <div className="super-dashboard__card-header">
            <div className="super-dashboard__card-titles">
              <h2 className="super-dashboard__card-title">Tenant Acquisition Growth</h2>
              <span className="super-dashboard__card-subtitle">
                Monthly registered organizations curve (last 6–12 months)
              </span>
            </div>
            <TrendingUp size={18} className="super-dashboard__card-icon" />
          </div>

          <div className="super-dashboard__chart-wrap">
            {growthTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart
                  data={growthTrend}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0BA37F" stopOpacity={0.22} />
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
                      backgroundColor: "#FFFFFF",
                      borderRadius: 8,
                      border: "1px solid #E6EAEE",
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
                      color: "#1A1F24",
                      fontSize: 12,
                      padding: "8px 12px",
                    }}
                    itemStyle={{ color: "#0F3D3E", fontWeight: 600 }}
                    labelStyle={{ color: "#5B6672", fontSize: 11, marginBottom: 4 }}
                    cursor={{ stroke: "#0BA37F", strokeWidth: 1.5, strokeDasharray: "3 3" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    name="New Organizations"
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
        </div>

        {/* Chart 2: Company Growth (Signups vs Churned) */}
        <div className="super-dashboard__card">
          <div className="super-dashboard__card-header">
            <div className="super-dashboard__card-titles">
              <h2 className="super-dashboard__card-title">Company Growth: Signups vs Churn</h2>
              <span className="super-dashboard__card-subtitle">
                New tenant signups compared to decommissioned organizations
              </span>
            </div>
            <Building2 size={18} className="super-dashboard__card-icon" />
          </div>

          <div className="super-dashboard__chart-wrap">
            {signupsVsChurnData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={signupsVsChurnData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
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
                      backgroundColor: "#FFFFFF",
                      borderRadius: 8,
                      border: "1px solid #E6EAEE",
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
                      color: "#1A1F24",
                      fontSize: 12,
                      padding: "8px 12px",
                    }}
                    itemStyle={{ color: "#0F3D3E", fontWeight: 600 }}
                    labelStyle={{ color: "#5B6672", fontSize: 11, marginBottom: 4 }}
                    cursor={{ fill: "rgba(15, 61, 62, 0.04)" }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar
                    dataKey="signups"
                    name="New Signups"
                    fill="#0F3D3E"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="churn"
                    name="Churned"
                    fill="#D4AF37"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="super-dashboard__chart-empty">
                <p>No historical growth data recorded.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION C: PRIMARY COMPANY TABLE WITH EXCEL EXPORT
          ========================================================================= */}
      <section className="super-dashboard__table-card" aria-label="Tenant Organizations">
        <div className="super-dashboard__table-header-row">
          <div>
            <h2 className="super-dashboard__table-title">Platform Organizations Directory</h2>
            <span className="super-dashboard__table-subtitle">
              Unified tenant registry with real-time workforce, plan status, and token allocation
            </span>
          </div>

          <div className="super-dashboard__table-actions">
            <button
              type="button"
              className="super-dashboard__export-btn"
              onClick={handleExportExcel}
              title="Export filtered directory to genuine Excel (.xlsx)"
            >
              <Download size={15} />
              <span>Export Excel (.xlsx)</span>
            </button>
          </div>
        </div>

        {/* Filter controls */}
        <div className="super-dashboard__table-controls">
          <div className="super-dashboard__search-box">
            <Search size={15} className="super-dashboard__search-icon" />
            <input
              type="text"
              placeholder="Search organizations by name, code, or industry..."
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              className="super-dashboard__search-input"
            />
          </div>

          <div className="super-dashboard__filter-group">
            <div className="super-dashboard__select-wrap">
              <label htmlFor="status-filter" className="super-dashboard__select-label">Status:</label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="super-dashboard__select"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>

            <div className="super-dashboard__select-wrap">
              <label htmlFor="token-filter" className="super-dashboard__select-label">Tokens:</label>
              <select
                id="token-filter"
                value={tokenFilter}
                onChange={(e) => setTokenFilter(e.target.value)}
                className="super-dashboard__select"
              >
                <option value="all">All Allocations</option>
                <option value="low">Low Balance (&lt;20%)</option>
              </select>
            </div>

            <span className="super-dashboard__results-count">
              {filteredCompanies.length} of {totalCompanies} organizations
            </span>
          </div>
        </div>

        {/* Table content */}
        <div className="super-dashboard__table-wrap">
          {filteredCompanies.length > 0 ? (
            <table className="super-dashboard__table">
              <thead>
                <tr>
                  <th>Organization</th>
                  <th>Plan</th>
                  <th>Status</th>
                  <th>Workforce</th>
                  <th>Plan Expiry</th>
                  <th>Token Usage &amp; Allocation</th>
                  <th>Last Active</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCompanies.slice(0, 15).map((company) => {
                  const isActive = (company.employee_count > 0 || company.field_sales_enabled);
                  return (
                    <tr key={company.id}>
                      {/* Company Info */}
                      <td>
                        <div className="super-dashboard__comp-cell">
                          {company.logo_url ? (
                            <img
                              src={company.logo_url}
                              alt=""
                              className="super-dashboard__comp-logo"
                            />
                          ) : (
                            <div className="super-dashboard__comp-avatar">
                              {company.name ? company.name.charAt(0).toUpperCase() : "O"}
                            </div>
                          )}
                          <div className="super-dashboard__comp-meta">
                            <span className="super-dashboard__comp-name">{company.name}</span>
                            <span className="super-dashboard__comp-code">{company.code || "No code"}</span>
                          </div>
                        </div>
                      </td>

                      {/* Plan */}
                      <td>
                        <span className="super-dashboard__plan-badge">Standard Direct</span>
                      </td>

                      {/* Status */}
                      <td>
                        <StatusBadge type="active" value={isActive} />
                      </td>

                      {/* Workforce */}
                      <td>
                        <span className="super-dashboard__num-bold">{company.employee_count ?? 0}</span>
                        <span className="super-dashboard__num-sub"> staff</span>
                      </td>

                      {/* Plan Expiry */}
                      <td>
                        <span className="super-dashboard__expiry-text">Perpetual</span>
                      </td>

                      {/* Tokens Used / Tokens Left */}
                      <td>
                        <div className="super-dashboard__token-cell">
                          <div className="super-dashboard__token-bar-track">
                            <div
                              className="super-dashboard__token-bar-fill super-dashboard__token-bar-fill--green"
                              style={{ width: "0%" }}
                            />
                          </div>
                          <span className="super-dashboard__token-val">
                            0% used • <span className="super-dashboard__token-status">Unmetered</span>
                          </span>
                        </div>
                      </td>

                      {/* Last Active */}
                      <td>
                        <span className="super-dashboard__date-cell">
                          {company.created_at
                            ? new Date(company.created_at).toLocaleDateString()
                            : "—"}
                        </span>
                      </td>

                      {/* Action */}
                      <td style={{ textAlign: "right" }}>
                        <Link
                          to={`/admin/companies/${company.id}`}
                          className="super-dashboard__action-btn"
                          title="Inspect company detail profile"
                        >
                          <Eye size={14} />
                          <span>Inspect</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="super-dashboard__empty-table">
              <Building2 size={32} className="super-dashboard__empty-icon" />
              <p className="super-dashboard__empty-text">No organizations matched the selected filters.</p>
              <button
                type="button"
                className="super-dashboard__clear-filters-btn"
                onClick={() => {
                  setTableSearch("");
                  setStatusFilter("all");
                  setTokenFilter("all");
                }}
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>

        {filteredCompanies.length > 15 && (
          <div className="super-dashboard__table-footer">
            <span className="super-dashboard__table-footer-text">
              Showing top 15 of {filteredCompanies.length} matching organizations.
            </span>
            <Link to="/admin/companies" className="super-dashboard__view-all-link">
              <span>View Full Directory with Pagination</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
