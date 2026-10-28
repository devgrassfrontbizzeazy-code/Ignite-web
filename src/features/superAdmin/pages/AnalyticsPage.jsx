/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import {
  Calendar,
  TrendingUp,
  MapPin,
  CheckCircle2,
  Clock,
  Layers,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import superAdminAPI from "../services/superAdminAPI";
import StatCard from "../components/StatCard";
import LoadingSkeleton from "../components/LoadingSkeleton";
import ErrorState from "../components/ErrorState";
import "./AnalyticsPage.css";

export default function AnalyticsPage() {
  const { setHeaderInfo } = useOutletContext() || {};

  const [growthData, setGrowthData] = useState(null);
  const [attendanceStats, setAttendanceStats] = useState(null);
  const [fieldSalesStats, setFieldSalesStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (setHeaderInfo) {
      setHeaderInfo({
        title: "Platform Analytics & Growth",
        breadcrumbs: ["Platform", "Analytics"],
      });
    }
  }, [setHeaderInfo]);

  const fetchAllAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [growthRes, attRes, fsRes] = await Promise.all([
        superAdminAPI.getGrowthStats().catch((err) => {
          console.warn("Growth stats failed:", err);
          return { data: null };
        }),
        superAdminAPI.getAttendanceStats().catch((err) => {
          console.warn("Attendance stats failed:", err);
          return { data: null };
        }),
        superAdminAPI.getFieldSalesStats().catch((err) => {
          console.warn("Field Sales stats failed:", err);
          return { data: null };
        }),
      ]);

      setGrowthData(growthRes?.data || null);
      setAttendanceStats(attRes?.data || null);
      setFieldSalesStats(fsRes?.data || null);
    } catch (err) {
      console.error("Analytics fetch error:", err);
      setError("Failed to load platform analytics.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllAnalytics();
  }, [fetchAllAnalytics]);

  if (loading) {
    return (
      <div className="super-analytics-page">
        <LoadingSkeleton type="cards" cards={4} />
        <div className="super-analytics-page__grid-2">
          <LoadingSkeleton type="chart" />
          <LoadingSkeleton type="chart" />
        </div>
      </div>
    );
  }

  if (error && !growthData && !attendanceStats && !fieldSalesStats) {
    return (
      <div className="super-analytics-page">
        <ErrorState
          title="Analytics Unavailable"
          message={error}
          onRetry={fetchAllAnalytics}
        />
      </div>
    );
  }

  // Combine monthly company growth and employee growth into unified series
  const monthsMap = new Map();
  if (growthData) {
    (growthData.company_growth || []).forEach((item) => {
      if (item.month) {
        monthsMap.set(item.month, {
          month: item.month,
          companies: item.count,
          employees: 0,
        });
      }
    });
    (growthData.employee_growth || []).forEach((item) => {
      if (item.month) {
        const existing = monthsMap.get(item.month) || {
          month: item.month,
          companies: 0,
          employees: 0,
        };
        existing.employees = item.count;
        monthsMap.set(item.month, existing);
      }
    });
  }
  const combinedGrowthData = Array.from(monthsMap.values()).sort((a, b) =>
    a.month.localeCompare(b.month)
  );

  // Attendance daily trends
  const attendanceDailyTrends = attendanceStats?.daily_trends || [];

  // Field sales lead status breakdown
  const fsLeadStatusData = Object.entries(
    fieldSalesStats?.lead_status_breakdown || {}
  ).map(([statusKey, count]) => ({
    status: statusKey.replace(/_/g, " "),
    count,
  }));

  return (
    <div className="super-analytics-page">
      {/* 1. Summary Highlights */}
      <section className="super-analytics-page__metrics-grid">
        <StatCard
          title="Attendance Total Punches"
          value={attendanceStats?.total_records ?? 0}
          subtext={`Today: ${(attendanceStats?.today_total ?? 0).toLocaleString()} punches`}
          icon={Clock}
          variant="teal"
        />
        <StatCard
          title="Field Sales Enabled"
          value={fieldSalesStats?.field_sales_enabled_companies ?? 0}
          subtext="Active company subscriptions"
          icon={MapPin}
          variant="emerald"
        />
        <StatCard
          title="Total Leads Ingested"
          value={fieldSalesStats?.total_leads ?? 0}
          subtext={`${fieldSalesStats?.total_visits ?? 0} visits completed`}
          icon={TrendingUp}
          variant="gold"
        />
        <StatCard
          title="Field Sales Workforce"
          value={fieldSalesStats?.total_field_sales_employees ?? 0}
          subtext={`${fieldSalesStats?.total_customers ?? 0} customer entities`}
          icon={Layers}
          variant="neutral"
        />
      </section>

      {/* 2. Platform 12-Month Growth Trends */}
      <section className="super-analytics-page__card">
        <div className="super-analytics-page__card-header">
          <div className="super-analytics-page__card-titles">
            <h2 className="super-analytics-page__card-title">
              12-Month Platform Ecosystem Growth
            </h2>
            <span className="super-analytics-page__card-subtitle">
              Comparative monthly onboarding volume of Organizations vs. Employees
            </span>
          </div>
          <TrendingUp size={18} className="super-analytics-page__card-icon" />
        </div>

        <div className="super-analytics-page__chart-wrap">
          {combinedGrowthData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart
                data={combinedGrowthData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="compGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0BA37F" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0BA37F" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="empGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0F3D3E" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0F3D3E" stopOpacity={0.0} />
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
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area
                  type="monotone"
                  dataKey="companies"
                  name="New Companies"
                  stroke="#0BA37F"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#compGradient)"
                />
                <Area
                  type="monotone"
                  dataKey="employees"
                  name="New Employees"
                  stroke="#0F3D3E"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#empGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="super-analytics-page__empty-chart">
              <p>No growth metrics available for the past 12 months.</p>
            </div>
          )}
        </div>
      </section>

      {/* 3. Operational Charts Grid */}
      <div className="super-analytics-page__grid-2">
        {/* Daily Attendance 14-Day Activity */}
        <section className="super-analytics-page__card">
          <div className="super-analytics-page__card-header">
            <div className="super-analytics-page__card-titles">
              <h2 className="super-analytics-page__card-title">
                14-Day Platform Attendance Trend
              </h2>
              <span className="super-analytics-page__card-subtitle">
                Total daily punch volume across all company organizations
              </span>
            </div>
            <Calendar size={18} className="super-analytics-page__card-icon" />
          </div>

          <div className="super-analytics-page__chart-wrap">
            {attendanceDailyTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={attendanceDailyTrends}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E6EAEE" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: "#5B6672" }}
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
                    itemStyle={{ color: "#0BA37F", fontWeight: 600 }}
                    labelStyle={{ color: "#5B6672", fontSize: 11, marginBottom: 4 }}
                    cursor={{ fill: "rgba(15, 61, 62, 0.04)" }}
                  />
                  <Bar
                    dataKey="records"
                    name="Punches"
                    fill="#0BA37F"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="super-analytics-page__empty-chart">
                <p>No daily attendance logs found for the last 14 days.</p>
              </div>
            )}
          </div>
        </section>

        {/* Field Sales Pipeline Status */}
        <section className="super-analytics-page__card">
          <div className="super-analytics-page__card-header">
            <div className="super-analytics-page__card-titles">
              <h2 className="super-analytics-page__card-title">
                Field Sales Pipeline Breakdown
              </h2>
              <span className="super-analytics-page__card-subtitle">
                Distribution of all leads across life cycle stages
              </span>
            </div>
            <CheckCircle2 size={18} className="super-analytics-page__card-icon" />
          </div>

          <div className="super-analytics-page__chart-wrap">
            {fsLeadStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={fsLeadStatusData}
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
                  <Bar
                    dataKey="count"
                    name="Leads"
                    fill="#D4AF37"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="super-analytics-page__empty-chart">
                <p>No lead pipeline data currently available.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
