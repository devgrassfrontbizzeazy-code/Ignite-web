import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Play,
  Calendar,
  RefreshCw,
  Eye,
  Trophy,
  CheckCircle2,
  Clock3,
  AlertCircle,
} from "lucide-react";

import Button from "../../components/common/Button/Button";
import Modal from "../../components/common/Modal/Modal";
import Drawer from "../../components/common/Drawer/Drawer";
import IgniteLoader from "../../components/common/IgniteLoader/IgniteLoader";

import DashboardWidget from "../../components/dashboard/DashboardWidget/DashboardWidget";
import SummaryWidget from "../../components/dashboard/widgets/generic/SummaryWidget/SummaryWidget";
import ChartWidget from "../../components/dashboard/widgets/generic/ChartWidget/ChartWidget";

import ApplyLeaveModal from "../../components/leave/ApplyLeaveModal/ApplyLeaveModal";
import leaveApplicationAPI from "../../services/api/leaveApplicationAPI";

import LocationPermissionModal from "../../components/fieldSales/common/LocationPermissionModal/LocationPermissionModal";
import ActiveVisit from "../../components/fieldSales/dashboard/widgets/ActiveVisit/ActiveVisit";
import AttendanceWidget from "../../components/fieldSales/dashboard/widgets/AttendanceWidget/AttendanceWidget";
import AssignedLeads from "../../components/fieldSales/dashboard/widgets/AssignedLeads/AssignedLeads";
import FollowUps from "../../components/fieldSales/dashboard/widgets/FollowUps/FollowUps";
import HolidayWidget from "../../components/fieldSales/dashboard/widgets/HolidayWidget/HolidayWidget";
import LeaveWidget from "../../components/fieldSales/dashboard/widgets/LeaveWidget/LeaveWidget";
import QuickActions from "../../components/fieldSales/dashboard/widgets/QuickActions/QuickActions";
import SalesSummaryCards from "../../components/fieldSales/dashboard/widgets/SalesSummaryCards/SalesSummaryCards";
import ScheduledVisits from "../../components/fieldSales/dashboard/widgets/ScheduledVisits/ScheduledVisits";
import VisitDetails from "../../components/fieldSales/visits/visitDetails/VisitDetails";
import VisitCheckIn from "../../components/fieldSales/visits/visitCheckIn/VisitCheckIn";
import VisitCheckOut from "../../components/fieldSales/visits/visitCheckOut/VisitCheckOut";
import FollowUpOutcomeModal from "../../components/fieldSales/leads/FollowUpOutcomeModal/FollowUpOutcomeModal";
import LeadTimelineDrawer from "../../components/fieldSales/leads/LeadTimelineDrawer/LeadTimelineDrawer";

import useDashboardData from "../../components/dashboard/hooks/useDashboardData";

import {
  getSalesDashboardSummary,
  getFieldSalesVisits,
  getFieldSalesFollowUps,
  getFieldSalesLeads,
  getFieldSalesEmployees,
  getTeamLiveLocations,
  checkInFieldSalesVisit,
  submitFieldSalesVisitReport,
  logFollowUpOutcome,
  pingFieldSalesLocation,
  toggleFieldSalesLocation,
} from "../../services/api/fieldSalesAPI";

import {
  getCurrentUser,
  isFieldSalesManager,
  canViewAttendance,
  canViewLeaves,
  canViewHolidays,
} from "../../utils/permissionUtils";
import { useNotification } from "../../context/NotificationContext";
import "./SalesDashboard.css";

/* Helper for date formatting */
const getFormattedDate = () => {
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
};

const normalizeStatus = (statusStr) => {
  if (!statusStr) return "Scheduled";
  const s = String(statusStr).trim();
  if (s.toLowerCase() === "checked_in" || s.toLowerCase() === "in_progress") return "In Progress";
  if (s.toLowerCase() === "checked_out" || s.toLowerCase() === "completed") return "Completed";
  return s.charAt(0).toUpperCase() + s.slice(1);
};

const SalesDashboard = () => {
  const user = useMemo(() => getCurrentUser(), []);
  const isManager = useMemo(() => isFieldSalesManager(user), [user]);
  const notificationContext = useNotification();
  const notify = notificationContext?.notify || {};
  const showNotification = notificationContext?.showNotification;

  // HRMS Dashboard Data (Attendance, Leaves, Holidays, Quick Actions)
  const hrmsData = useDashboardData();

  // Permission Checks for HRMS Widgets
  const hasAttendancePermission = useMemo(() => canViewAttendance(user), [user]);
  const hasLeavePermission = useMemo(() => canViewLeaves(user), [user]);
  const hasHolidayPermission = useMemo(() => canViewHolidays(user), [user]);

  // Working Hours Chart Data for Attendance Graph
  const attendanceChartData = useMemo(() => {
    const history = hrmsData?.attendanceHistory;
    const attendanceData = Array.isArray(history?.data)
      ? history.data
      : Array.isArray(history)
      ? history
      : [];

    return attendanceData
      .filter((item) => item?.status !== "Holiday")
      .map((item) => ({
        date: item?.attendanceDate || item?.date || "--",
        hours: Number(
          (Number(item?.workingSeconds || item?.working_seconds || 0) / 3600).toFixed(2)
        ),
      }));
  }, [hrmsData?.attendanceHistory]);

  // Leave Modal State
  const [showApplyLeave, setShowApplyLeave] = useState(false);
  const [submittingLeave, setSubmittingLeave] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Core Data Collections
  const [data, setData] = useState({
    stats: {},
    today_visits: [],
    today_followups: [],
    leads: [],
    employees: [],
    liveLocations: [],
  });

  // GPS Tracking State for Field Duty
  const [isFieldDutyActive, setIsFieldDutyActive] = useState(true);
  const [currentUserLocation, setCurrentUserLocation] = useState({
    latitude: 28.4595,
    longitude: 77.0266,
    accuracy: 8,
  });
  const [gpsStatus, setGpsStatus] = useState("loading");

  // Modals & Drawers state
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [visitDetailsOpen, setVisitDetailsOpen] = useState(false);
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [submittingAction, setSubmittingAction] = useState(false);

  const [selectedFollowUp, setSelectedFollowUp] = useState(null);
  const [followUpModalOpen, setFollowUpModalOpen] = useState(false);

  const [selectedLeadId, setSelectedLeadId] = useState(null);
  const [timelineDrawerOpen, setTimelineDrawerOpen] = useState(false);

  // Leave Apply Handler
  const handleApplyLeave = async (leaveData) => {
    try {
      setSubmittingLeave(true);
      await leaveApplicationAPI.applyLeave(leaveData);
      if (notify?.success) {
        notify.success("Leave application submitted successfully.");
      } else if (showNotification) {
        showNotification({ type: "success", message: "Leave application submitted successfully." });
      }
      setShowApplyLeave(false);
      await hrmsData.refreshLeaveData();
    } catch (err) {
      console.error("Failed to submit leave:", err);
      const msg = err?.response?.data?.detail || err?.response?.data?.message || "Failed to submit leave application.";
      if (notify?.error) {
        notify.error(msg);
      } else if (showNotification) {
        showNotification({ type: "error", message: msg });
      }
    } finally {
      setSubmittingLeave(false);
    }
  };

  // Main Dashboard Data Fetching
  const fetchDashboardData = useCallback(async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
        setError(null);
      }

      const [summaryRes, visitsRes, followUpsRes, leadsRes, employeesRes, teamLiveRes] =
        await Promise.allSettled([
          getSalesDashboardSummary(),
          getFieldSalesVisits(),
          getFieldSalesFollowUps(),
          getFieldSalesLeads(),
          isManager ? getFieldSalesEmployees() : Promise.resolve(null),
          isManager ? getTeamLiveLocations() : Promise.resolve(null),
        ]);

      const summaryData = summaryRes.status === "fulfilled" ? summaryRes.value : {};
      const visitsData =
        visitsRes.status === "fulfilled"
          ? visitsRes.value?.data || visitsRes.value?.results || visitsRes.value || []
          : [];
      const followUpsData =
        followUpsRes.status === "fulfilled"
          ? followUpsRes.value?.data || followUpsRes.value?.results || followUpsRes.value || []
          : [];
      const leadsData =
        leadsRes.status === "fulfilled"
          ? leadsRes.value?.data || leadsRes.value?.results || leadsRes.value || []
          : [];
      const employeesData =
        employeesRes.status === "fulfilled" && employeesRes.value
          ? employeesRes.value?.data || employeesRes.value?.results || employeesRes.value || []
          : [];
      const liveLocsData =
        teamLiveRes.status === "fulfilled" && teamLiveRes.value
          ? teamLiveRes.value?.data || teamLiveRes.value?.results || teamLiveRes.value || []
          : [];

      const rawVisits = summaryData.today_visits || visitsData;
      const todayVisits = Array.isArray(rawVisits) ? rawVisits : [];

      const rawFollowUps = summaryData.today_followups || followUpsData;
      const todayFollowups = Array.isArray(rawFollowUps) ? rawFollowUps : [];

      const stats = summaryData.stats || {};

      setData({
        stats: {
          today_visits_count: stats.today_visits_count ?? todayVisits.length,
          active_visits_count:
            stats.active_visits_count ??
            todayVisits.filter((v) => ["In Progress", "Checked In", "CHECKED_IN", "IN_PROGRESS"].includes(v.status)).length,
          completed_today_count:
            stats.completed_today_count ??
            todayVisits.filter((v) => ["Completed", "Checked Out", "CHECKED_OUT", "COMPLETED"].includes(v.status)).length,
          pending_followups_count: stats.pending_followups_count ?? todayFollowups.length,
          converted_leads_count:
            stats.converted_leads_count ??
            leadsData.filter((l) => ["Won", "Converted", "CONVERTED", "WON"].includes(l.status)).length,
          active_field_employees:
            stats.active_field_employees ??
            (Array.isArray(liveLocsData) ? liveLocsData.filter((l) => l.is_active_tracking).length : 0),
        },
        today_visits: todayVisits,
        today_followups: todayFollowups,
        leads: Array.isArray(leadsData) ? leadsData : [],
        employees: Array.isArray(employeesData) ? employeesData : [],
        liveLocations: Array.isArray(liveLocsData) ? liveLocsData : [],
      });
    } catch (err) {
      console.error("Failed to load Field Sales Dashboard data:", err);
      if (!silent) {
        setError("Failed to load dashboard data. Please check your connection and retry.");
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [isManager]);

  useEffect(() => {
    fetchDashboardData(false);

    const interval = setInterval(() => {
      fetchDashboardData(true);
    }, 15000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  // Browser Geolocation Setup
  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsStatus("unavailable");
      return;
    }
    setGpsStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy),
        };
        setCurrentUserLocation(coords);
        setGpsStatus("success");
        if (!isManager) {
          pingFieldSalesLocation(coords).catch(() => {});
        }
      },
      (err) => {
        console.warn("GPS access warning:", err);
        setGpsStatus(err.code === err.PERMISSION_DENIED ? "denied" : "unavailable");
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }, [isManager]);

  useEffect(() => {
    requestLocation();
    if (!navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const coords = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy),
        };
        setCurrentUserLocation(coords);
        setGpsStatus("success");
      },
      () => {},
      { enableHighAccuracy: true, timeout: 15000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [requestLocation]);

  // Periodic Location Ping (Every 15s) when field duty active
  useEffect(() => {
    if (isManager || !isFieldDutyActive || gpsStatus !== "success") return;
    const interval = setInterval(() => {
      pingFieldSalesLocation(currentUserLocation).catch(() => {});
    }, 15000);
    return () => clearInterval(interval);
  }, [isManager, isFieldDutyActive, gpsStatus, currentUserLocation]);

  const toggleFieldDuty = () => {
    const nextState = !isFieldDutyActive;
    setIsFieldDutyActive(nextState);
    toggleFieldSalesLocation(nextState).catch(() => {});
    if (showNotification) {
      showNotification({
        type: nextState ? "success" : "info",
        message: nextState
          ? "Field Duty active. Live GPS tracking enabled."
          : "Field Duty paused. Location tracking stopped.",
      });
    }
  };

  // Actions: Visit Check-In
  const handleCheckIn = async (overrideData = {}) => {
    if (!selectedVisit) return;
    try {
      setSubmittingAction(true);
      await checkInFieldSalesVisit(selectedVisit.id, {
        latitude: currentUserLocation.latitude,
        longitude: currentUserLocation.longitude,
        accuracy: currentUserLocation.accuracy,
        distance_meters: selectedVisit.distance || 0,
        is_location_overridden: Boolean(overrideData?.is_location_overridden),
        override_reason: overrideData?.override_reason || "",
        override_notes: overrideData?.override_notes || "",
      });
      if (showNotification) {
        showNotification({
          type: "success",
          message: `Checked in successfully at ${selectedVisit.company_name || selectedVisit.lead_title || selectedVisit.customer_name || "Client"}.`,
        });
      }
      setCheckInOpen(false);
      fetchDashboardData(true);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.detail || "Check-in failed.";
      if (showNotification) showNotification({ type: "error", message: msg });
    } finally {
      setSubmittingAction(false);
    }
  };

  // Actions: Submit Visit Report
  const handleVisitReportSubmit = async (reportData) => {
    if (!selectedVisit) return;
    try {
      setSubmittingAction(true);
      await submitFieldSalesVisitReport(selectedVisit.id, reportData);
      if (showNotification) {
        showNotification({
          type: "success",
          message: "Visit report submitted successfully.",
        });
      }
      setReportOpen(false);
      setVisitDetailsOpen(false);
      fetchDashboardData(true);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.detail || "Failed to submit report.";
      if (showNotification) showNotification({ type: "error", message: msg });
    } finally {
      setSubmittingAction(false);
    }
  };

  // Actions: Log Follow-up Outcome
  const handleFollowUpOutcomeSubmit = async (outcomeData) => {
    if (!selectedFollowUp) return;
    try {
      setSubmittingAction(true);
      await logFollowUpOutcome(selectedFollowUp.id, outcomeData);
      if (showNotification) {
        showNotification({
          type: "success",
          message: `Follow-up outcome logged (${outcomeData.outcome}).`,
        });
      }
      setFollowUpModalOpen(false);
      fetchDashboardData(true);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.detail || "Failed to log outcome.";
      if (showNotification) showNotification({ type: "error", message: msg });
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleOpenNavigation = (v) => {
    const lat = v.latitude || v.lead_latitude;
    const lng = v.longitude || v.lead_longitude;
    if (lat && lng) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, "_blank");
    } else if (v.location || v.address || v.lead_address) {
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          v.location || v.address || v.lead_address
        )}`,
        "_blank"
      );
    }
  };

  const handleScheduledVisitDetails = (visit) => {
    setSelectedVisit({
      ...visit,
      id: String(visit.id),
      companyName: visit.company_name || visit.lead_title,
      leadName: visit.lead_name || visit.customer_name,
      employeeName: visit.assigned_to_name || visit.employee_name || "Sales Rep",
      scheduledDate: visit.visit_date,
      scheduledTime: visit.visit_time,
      location: visit.location || visit.lead_address,
      purpose: visit.purpose || visit.visit_purpose || "Product Demo",
      visitStatus: visit.status,
      priority: visit.priority,
      instructions: visit.instructions,
      contactPhone: visit.contact_phone,
      leadLatitude: visit.latitude,
      leadLongitude: visit.longitude,
      checkInTime: visit.check_in_time,
      checkOutTime: visit.check_out_time,
      clientResponse: visit.client_response,
      feedback: visit.feedback,
      outcome: visit.outcome,
      photos: visit.photos || [],
    });
    setVisitDetailsOpen(true);
  };

  const handleScheduledVisitStart = (visit) => {
    setSelectedVisit({
      ...visit,
      id: String(visit.id),
      companyName: visit.company_name || visit.lead_title,
      location: visit.location,
      leadLatitude: visit.latitude,
      leadLongitude: visit.longitude,
    });
    setCheckInOpen(true);
  };

  const handleScheduledVisitReport = (visit) => {
    setSelectedVisit({
      ...visit,
      id: String(visit.id),
      companyName: visit.company_name || visit.lead_title,
      leadName: visit.lead_name || visit.customer_name,
    });
    setReportOpen(true);
  };

  if (loading && hrmsData.loading) {
    return <IgniteLoader message="Loading Field Sales Workspace..." />;
  }

  if (error) {
    return (
      <div className="dashboard-page">
        <div className="field-sales-error-card">
          <AlertCircle size={32} color="#ef4444" />
          <h3>Unable to load Field Sales Dashboard</h3>
          <p>{error}</p>
          <Button variant="primary" onClick={() => fetchDashboardData(false)}>
            <RefreshCw size={14} /> Retry
          </Button>
        </div>
      </div>
    );
  }

  const visits = data.today_visits || [];
  const followups = data.today_followups || [];
  const leads = data.leads || [];
  const employees = data.employees || [];
  const liveLocations = data.liveLocations || [];

  // Active visit for sales person (if any)
  const currentActiveVisit = visits.find((v) =>
    ["In Progress", "Checked In", "CHECKED_IN", "IN_PROGRESS"].includes(v.status)
  );

  const firstName =
    user?.first_name ||
    user?.firstName ||
    user?.full_name?.split(" ")[0] ||
    user?.name?.split(" ")[0] ||
    "Team Member";

  // Leave balance computation for Leave Summary Widget
  const leaveBalanceList = Array.isArray(hrmsData?.leaveBalance) ? hrmsData.leaveBalance : [];
  const leaveTotal = leaveBalanceList.reduce((sum, l) => sum + Number(l?.total_entitlement || 0), 0);
  const leaveRemaining = leaveBalanceList.reduce((sum, l) => sum + Number(l?.remaining_balance || 0), 0);
  const leaveUsed = Math.max(leaveTotal - leaveRemaining, 0);

  // Holidays list for Upcoming Holidays Widget
  const upcomingHolidaysList = Array.isArray(hrmsData?.holidays) ? hrmsData.holidays : [];

  return (
    <div className="dashboard-page field-sales-dashboard-page">
      {/* Location Permission Alert */}
      {!isManager && (gpsStatus === "denied" || gpsStatus === "unavailable") && (
        <LocationPermissionModal
          open={true}
          isDenied={gpsStatus === "denied"}
          onRequestPermission={requestLocation}
        />
      )}

      {/* ========================================================================= */}
      {/* HRMS REUSED BRANDED HEADER BANNER (CLEAN & UNCLUTTERED)                  */}
      {/* ========================================================================= */}
      <header className="dashboard-header field-sales-header">
        <div className="dashboard-header__content">
          <div className="field-sales-header-title-row">
            <div>
              <h1 className="dashboard-header__title">
                {getGreeting()}, {firstName}!
              </h1>
              <p className="dashboard-header__subtitle">
                {isManager
                  ? `Team sales overview & live tracking for ${getFormattedDate()}`
                  : `Your sales workspace & schedule for ${getFormattedDate()}`}
              </p>
            </div>

            {/* Field Duty toggle for Sales Reps */}
            {!isManager && (
              <div className="field-sales-duty-wrapper">
                <button
                  type="button"
                  className={`sales-duty-btn ${isFieldDutyActive ? "active" : ""}`}
                  onClick={toggleFieldDuty}
                >
                  <span className="sales-duty-dot" />
                  {isFieldDutyActive ? "Field Duty Active" : "Start Field Duty"}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* DASHBOARD ROLE-BASED GRID LAYOUT                                          */}
      {/* ========================================================================= */}
      <main className="dashboard-grid">
        {/* ----------------------------------------------------------------------- */}
        {/* 1. FIELD MANAGER DASHBOARD                                              */}
        {/* ----------------------------------------------------------------------- */}
        {isManager ? (
          <>
            {/* MANAGER KPI SUMMARY CARDS */}
            <div className="dashboard-grid__item" style={{ gridColumn: "span 2" }}>
              <SummaryWidget
                title="Today's Visits"
                value={data.stats.today_visits_count}
                subtitle="Scheduled for team"
                icon={Calendar}
              />
            </div>

            <div className="dashboard-grid__item" style={{ gridColumn: "span 2" }}>
              <SummaryWidget
                title="Active Visits"
                value={data.stats.active_visits_count}
                subtitle="Visits in progress"
                icon={Play}
              />
            </div>

            <div className="dashboard-grid__item" style={{ gridColumn: "span 2" }}>
              <SummaryWidget
                title="Completed Visits"
                value={data.stats.completed_today_count}
                subtitle="Checked out today"
                icon={CheckCircle2}
              />
            </div>

            <div className="dashboard-grid__item" style={{ gridColumn: "span 3" }}>
              <SummaryWidget
                title="Pending Follow-ups"
                value={data.stats.pending_followups_count}
                subtitle="Requires action"
                icon={Clock3}
              />
            </div>

            <div className="dashboard-grid__item" style={{ gridColumn: "span 3" }}>
              <SummaryWidget
                title="Deals Won"
                value={data.stats.converted_leads_count}
                subtitle="Converted leads"
                icon={Trophy}
              />
            </div>

            {/* COMMON HRMS WIDGETS INTEGRATION */}
            {hasAttendancePermission && <AttendanceWidget hrmsData={hrmsData} />}

            {hasAttendancePermission && (
              <div className="dashboard-grid__item" style={{ gridColumn: "span 8" }}>
                <ChartWidget
                  title="Working Hours"
                  description="Daily working hours for the selected period."
                  data={attendanceChartData}
                  type="line"
                  xKey="date"
                  dataKey="hours"
                  color="#0BA37F"
                  valueFormatter={(value) => `${Number(value).toFixed(1)}h`}
                  emptyMessage="No working hours data available."
                  loading={hrmsData.loading}
                />
              </div>
            )}

            {hasLeavePermission && (
              <LeaveWidget
                loading={hrmsData.loading}
                total={leaveTotal}
                used={leaveUsed}
                remaining={leaveRemaining}
              />
            )}

            <QuickActions onApplyLeave={() => setShowApplyLeave(true)} />

            {hasHolidayPermission && (
              <HolidayWidget holidays={upcomingHolidaysList} loading={hrmsData.loading} />
            )}

            {/* TEAM ACTIVITY SECTION */}
            <div className="dashboard-grid__item" style={{ gridColumn: "span 4" }}>
              <DashboardWidget
                title="Team Field Activity"
                action="View Map"
                onAction={() => (window.location.href = "/field-sales/visits")}
              >
                <div className="team-activity-summary-box">
                  <div className="activity-stat-row">
                    <div className="activity-stat-tile activity-stat-tile--green">
                      <span>Punched In</span>
                      <strong>{liveLocations.filter((l) => l.is_active_tracking).length}</strong>
                    </div>
                    <div className="activity-stat-tile activity-stat-tile--amber">
                      <span>On Visit</span>
                      <strong>
                        {visits.filter((v) =>
                          ["In Progress", "Checked In", "CHECKED_IN", "IN_PROGRESS"].includes(v.status)
                        ).length}
                      </strong>
                    </div>
                    <div className="activity-stat-tile activity-stat-tile--gray">
                      <span>Off Duty</span>
                      <strong>
                        {Math.max(
                          (employees.length > 0 ? employees.length : liveLocations.length) -
                            liveLocations.filter((l) => l.is_active_tracking).length,
                          0
                        )}
                      </strong>
                    </div>
                  </div>

                  {liveLocations.length === 0 && employees.length === 0 ? (
                    <div className="field-sales-empty-sm">No sales team activity recorded.</div>
                  ) : (
                    <div className="team-members-mini-list">
                      {(liveLocations.length > 0 ? liveLocations : employees).slice(0, 5).map((emp) => {
                        const isTracking = Boolean(emp.is_active_tracking);
                        const empName = emp.name || emp.employee_name || emp.full_name || emp.email;
                        return (
                          <div key={emp.id || emp.email} className="team-member-item">
                            <div className="team-member-info">
                              <span className={`status-dot ${isTracking ? "status-dot--active" : ""}`} />
                              <span className="member-name">{empName}</span>
                            </div>
                            <span className={`member-tag ${isTracking ? "member-tag--live" : "member-tag--off"}`}>
                              {isTracking ? "Active" : "Off Duty"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </DashboardWidget>
            </div>

            {/* SALES PIPELINE & VISIT PERFORMANCE */}
            <div className="dashboard-grid__item" style={{ gridColumn: "span 8" }}>
              <DashboardWidget
                title="Sales Pipeline & Performance"
                action="Manage Leads"
                onAction={() => (window.location.href = "/field-sales/leads")}
              >
                <div className="pipeline-performance-grid">
                  <div className="pipeline-stat-card">
                    <span className="pipeline-label">Total Leads</span>
                    <strong className="pipeline-val">{leads.length}</strong>
                    <span className="pipeline-sub">Active pipeline</span>
                  </div>

                  <div className="pipeline-stat-card">
                    <span className="pipeline-label">In Negotiation</span>
                    <strong className="pipeline-val pipeline-val--gold">
                      {leads.filter((l) => ["Negotiation", "NEGOTIATION"].includes(l.status)).length}
                    </strong>
                    <span className="pipeline-sub">Closing soon</span>
                  </div>

                  <div className="pipeline-stat-card">
                    <span className="pipeline-label">Demo Required</span>
                    <strong className="pipeline-val pipeline-val--teal">
                      {leads.filter((l) => ["Demo Required", "DEMO_REQUIRED"].includes(l.status)).length}
                    </strong>
                    <span className="pipeline-sub">Product demos</span>
                  </div>

                  <div className="pipeline-stat-card">
                    <span className="pipeline-label">Win Rate</span>
                    <strong className="pipeline-val pipeline-val--emerald">
                      {leads.length > 0
                        ? `${Math.round((data.stats.converted_leads_count / leads.length) * 100)}%`
                        : "0%"}
                    </strong>
                    <span className="pipeline-sub">Conversion rate</span>
                  </div>
                </div>
              </DashboardWidget>
            </div>

            {/* TODAY'S TEAM VISITS TABLE */}
            <div className="dashboard-grid__item" style={{ gridColumn: "span 7" }}>
              <DashboardWidget
                title={`Today's Team Visits (${visits.length})`}
                action="All Visits"
                onAction={() => (window.location.href = "/field-sales/visits")}
              >
                {visits.length === 0 ? (
                  <div className="field-sales-empty-box">
                    <CheckCircle2 size={24} color="#0ba37f" />
                    <p>No team visits scheduled for today.</p>
                  </div>
                ) : (
                  <div className="field-sales-table-wrapper" style={{ maxHeight: "340px", overflowY: "auto" }}>
                    <table className="field-sales-table">
                      <thead>
                        <tr>
                          <th>Employee</th>
                          <th>Client / Lead</th>
                          <th>Time</th>
                          <th>Status</th>
                          <th style={{ textAlign: "right" }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visits.map((v) => {
                          const statusLabel = normalizeStatus(v.status);
                          const isDone = statusLabel === "Completed";
                          const isInProg = statusLabel === "In Progress";
                          return (
                            <tr key={v.id}>
                              <td>
                                <strong className="cell-title">
                                  {v.assigned_to_name || v.employee_name || "Sales Rep"}
                                </strong>
                              </td>
                              <td>
                                <span className="cell-title">{v.company_name || v.lead_title || v.lead_name || "Client"}</span>
                                <small className="cell-sub">{v.location || v.lead_address || "Location"}</small>
                              </td>
                              <td>
                                <span className="cell-time">{v.visit_time || "11:00 AM"}</span>
                              </td>
                              <td>
                                <span
                                  className={`status-chip ${
                                    isDone
                                      ? "status-chip--success"
                                      : isInProg
                                      ? "status-chip--warning"
                                      : "status-chip--info"
                                  }`}
                                >
                                  {statusLabel}
                                </span>
                              </td>
                              <td style={{ textAlign: "right" }}>
                                <button
                                  type="button"
                                  className="btn-action-icon"
                                  onClick={() => {
                                    setSelectedVisit({
                                      ...v,
                                      id: String(v.id),
                                      companyName: v.company_name || v.lead_title,
                                      leadName: v.lead_name || v.customer_name,
                                      employeeName: v.assigned_to_name || v.employee_name || "Sales Rep",
                                      scheduledDate: v.visit_date,
                                      scheduledTime: v.visit_time,
                                      location: v.location || v.lead_address,
                                      purpose: v.purpose || v.visit_purpose || "Product Demo",
                                      visitStatus: v.status,
                                      priority: v.priority,
                                      instructions: v.instructions,
                                      contactPhone: v.contact_phone,
                                      leadLatitude: v.latitude,
                                      leadLongitude: v.longitude,
                                      checkInTime: v.check_in_time,
                                      checkOutTime: v.check_out_time,
                                      clientResponse: v.client_response,
                                      feedback: v.feedback,
                                      outcome: v.outcome,
                                      photos: v.photos || [],
                                    });
                                    setVisitDetailsOpen(true);
                                  }}
                                >
                                  <Eye size={13} /> View
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </DashboardWidget>
            </div>

            {/* FOLLOW-UPS REQUIRING ATTENTION */}
            <div className="dashboard-grid__item" style={{ gridColumn: "span 5" }}>
              <DashboardWidget
                title={`Follow-ups Requiring Attention (${followups.length})`}
                action="View All"
                onAction={() => (window.location.href = "/field-sales/leads")}
              >
                {followups.length === 0 ? (
                  <div className="field-sales-empty-box">
                    <CheckCircle2 size={24} color="#0ba37f" />
                    <p>No urgent follow-ups pending.</p>
                  </div>
                ) : (
                  <div className="field-sales-compact-list" style={{ maxHeight: "340px", overflowY: "auto" }}>
                    {followups.map((fu) => {
                      const isOverdue =
                        fu.is_overdue || (fu.due_date && new Date(fu.due_date) < new Date());
                      return (
                        <div key={fu.id} className="followup-item-card">
                          <div className="followup-item-header">
                            <span className="followup-type-tag">
                              {fu.follow_up_type === "Call"
                                ? "Phone Call"
                                : fu.follow_up_type === "WhatsApp"
                                ? "WhatsApp"
                                : "Demo"}
                            </span>
                            {isOverdue && <span className="overdue-chip">Overdue</span>}
                          </div>

                          <strong className="followup-client-title">
                            {fu.lead_company_name || fu.lead_title || "Client"}
                          </strong>

                          <p className="followup-reason-text">{fu.reason || "Discussion follow-up"}</p>

                          <div className="followup-footer-row">
                            <span className="due-text">
                              Due: {fu.due_date} {fu.due_time ? `• ${fu.due_time}` : ""}
                            </span>
                            <button
                              type="button"
                              className="btn-log-outcome"
                              onClick={() => {
                                setSelectedFollowUp(fu);
                                setFollowUpModalOpen(true);
                              }}
                            >
                              Log Outcome
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </DashboardWidget>
            </div>
          </>
        ) : (
          /* ----------------------------------------------------------------------- */
          /* 2. REFINED SALES MEMBER DASHBOARD (CLEAN, COMPACT & PERMISSION WIDGETS) */
          /* ----------------------------------------------------------------------- */
          <>
            <ActiveVisit
              activeVisit={currentActiveVisit}
              onReportClick={(activeVisit) => {
                setSelectedVisit({
                  ...activeVisit,
                  id: String(activeVisit.id),
                  companyName: activeVisit.company_name || activeVisit.lead_title,
                  leadName: activeVisit.lead_name || activeVisit.customer_name,
                });
                setReportOpen(true);
              }}
            />

            <SalesSummaryCards
              todayVisitsCount={visits.length}
              activeVisitsCount={currentActiveVisit ? 1 : 0}
              completedTodayCount={visits.filter((visit) => normalizeStatus(visit.status) === "Completed").length}
              pendingFollowupsCount={followups.length}
            />

            {/* HRMS PERMISSION-BASED WIDGETS INTEGRATION */}
            {hasAttendancePermission && <AttendanceWidget hrmsData={hrmsData} />}

            {hasLeavePermission && (
              <LeaveWidget
                loading={hrmsData.loading}
                total={leaveTotal}
                used={leaveUsed}
                remaining={leaveRemaining}
              />
            )}

            <QuickActions onApplyLeave={() => setShowApplyLeave(true)} />

            {hasHolidayPermission && (
              <HolidayWidget holidays={upcomingHolidaysList} loading={hrmsData.loading} />
            )}

            <ScheduledVisits
              visits={visits}
              onViewDetails={handleScheduledVisitDetails}
              onStartVisit={handleScheduledVisitStart}
              onReportClick={handleScheduledVisitReport}
              onNavigate={handleOpenNavigation}
            />

            <FollowUps
              followups={followups}
              onLogOutcome={(followup) => {
                setSelectedFollowUp(followup);
                setFollowUpModalOpen(true);
              }}
            />

            <AssignedLeads
              leads={leads}
              onViewTimeline={(leadId) => {
                setSelectedLeadId(leadId);
                setTimelineDrawerOpen(true);
              }}
            />
          </>
        )}
      </main>

      {/* ========================================================================= */}
      {/* MODALS & DRAWERS                                                          */}
      {/* ========================================================================= */}

      {/* LEAVE APPLY MODAL */}
      {showApplyLeave && (
        <ApplyLeaveModal
          options={hrmsData.leaveBalance}
          submitting={submittingLeave}
          onClose={() => !submittingLeave && setShowApplyLeave(false)}
          onSubmit={handleApplyLeave}
        />
      )}

      {/* 1. VISIT DETAILS DRAWER */}
      <Drawer open={visitDetailsOpen} onClose={() => setVisitDetailsOpen(false)} title="Visit Details">
        {selectedVisit && (
          <VisitDetails
            visit={selectedVisit}
            isSales={!isManager}
            onStartVisit={(v) => {
              setVisitDetailsOpen(false);
              setSelectedVisit(v);
              if (v.visitStatus === "CHECKED_IN" || v.visitStatus === "IN_PROGRESS") {
                setReportOpen(true);
              } else {
                setCheckInOpen(true);
              }
            }}
            onNavigate={handleOpenNavigation}
          />
        )}
      </Drawer>

      {/* 2. VISIT GPS CHECK-IN MODAL */}
      <Modal open={checkInOpen} onClose={() => setCheckInOpen(false)} title="Start Field Visit">
        {selectedVisit && (
          <VisitCheckIn visit={selectedVisit} loading={submittingAction} onCheckIn={handleCheckIn} />
        )}
      </Modal>

      {/* 3. VISIT REPORT & CHECK-OUT MODAL */}
      <Modal open={reportOpen} onClose={() => setReportOpen(false)} title="Submit Visit Report">
        {selectedVisit && (
          <VisitCheckOut
            visit={selectedVisit}
            submitting={submittingAction}
            onComplete={handleVisitReportSubmit}
            onCancel={() => setReportOpen(false)}
          />
        )}
      </Modal>

      {/* 4. FOLLOW-UP OUTCOME LOGGER MODAL */}
      <Modal open={followUpModalOpen} onClose={() => setFollowUpModalOpen(false)} title="Log Follow-up Outcome">
        {selectedFollowUp && (
          <FollowUpOutcomeModal
            followup={selectedFollowUp}
            submitting={submittingAction}
            onLogOutcome={handleFollowUpOutcomeSubmit}
            onCancel={() => setFollowUpModalOpen(false)}
          />
        )}
      </Modal>

      {/* 5. 360° LEAD TIMELINE DRAWER */}
      <Drawer open={timelineDrawerOpen} onClose={() => setTimelineDrawerOpen(false)} title="Lead 360° History">
        {selectedLeadId && (
          <LeadTimelineDrawer leadId={selectedLeadId} onClose={() => setTimelineDrawerOpen(false)} />
        )}
      </Drawer>
    </div>
  );
};

export default SalesDashboard;
