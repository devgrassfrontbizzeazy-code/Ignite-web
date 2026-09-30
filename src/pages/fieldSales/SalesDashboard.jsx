import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Compass,
  Phone,
  MessageSquare,
  Play,
  CheckCircle,
  Calendar,
  Clock,
  MapPin,
  User,
  Shield,
  AlertTriangle,
  RefreshCw,
  Eye,
  TrendingUp,
  Layers,
} from "lucide-react";
import Button from "../../components/common/Button/Button";
import Card from "../../components/common/Card/Card";
import Modal from "../../components/common/Modal/Modal";
import Drawer from "../../components/common/Drawer/Drawer";
import IgniteLoader from "../../components/common/IgniteLoader/IgniteLoader";
import LocationPermissionModal from "../../components/fieldSales/common/LocationPermissionModal/LocationPermissionModal";
import VisitDetails from "../../components/fieldSales/visits/visitDetails/VisitDetails";
import VisitCheckIn from "../../components/fieldSales/visits/visitCheckIn/VisitCheckIn";
import VisitCheckOut from "../../components/fieldSales/visits/visitCheckOut/VisitCheckOut";
import FollowUpOutcomeModal from "../../components/fieldSales/leads/FollowUpOutcomeModal/FollowUpOutcomeModal";
import LeadTimelineDrawer from "../../components/fieldSales/leads/LeadTimelineDrawer/LeadTimelineDrawer";

import {
  getSalesDashboardSummary,
  checkInFieldSalesVisit,
  submitFieldSalesVisitReport,
  logFollowUpOutcome,
  pingFieldSalesLocation,
  toggleFieldSalesLocation,
} from "../../services/api/fieldSalesAPI";
import { getCurrentUser } from "../../utils/permissionUtils";
import { useNotification } from "../../context/NotificationContext";
import "./SalesDashboard.css";

const SalesDashboard = () => {
  const user = useMemo(() => getCurrentUser(), []);
  const { showNotification } = useNotification();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    stats: {},
    today_visits: [],
    today_followups: [],
  });

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

  // Fetch Dashboard Summary
  const fetchDashboard = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await getSalesDashboardSummary();
      if (res?.data || res?.stats) {
        setData({
          stats: res.stats || {},
          today_visits: res.today_visits || [],
          today_followups: res.today_followups || [],
        });
      }
    } catch (err) {
      console.error("Failed to load sales dashboard summary:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard(false);
    // Auto-refresh summary every 10 seconds for real-time manager updates
    const interval = setInterval(() => {
      fetchDashboard(true);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // GPS Location Watcher
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
        pingFieldSalesLocation(coords).catch(() => {});
      },
      (err) => {
        console.warn("GPS error:", err);
        setGpsStatus(err.code === err.PERMISSION_DENIED ? "denied" : "unavailable");
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }, []);

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

  // Periodic Heartbeat Ping (Every 12s) when field duty active
  useEffect(() => {
    if (!isFieldDutyActive || gpsStatus !== "success") return;
    const interval = setInterval(() => {
      pingFieldSalesLocation(currentUserLocation).catch(() => {});
    }, 12000);
    return () => clearInterval(interval);
  }, [isFieldDutyActive, gpsStatus, currentUserLocation]);

  const toggleFieldDuty = () => {
    const nextState = !isFieldDutyActive;
    setIsFieldDutyActive(nextState);
    toggleFieldSalesLocation(nextState).catch(() => {});
    showNotification({
      type: nextState ? "success" : "info",
      message: nextState ? "Field Duty Started. Live GPS tracking is Active." : "Field Duty Paused. Location tracking stopped.",
    });
  };

  // Check In Handler
  const handleCheckIn = async (overrideData = {}) => {
    if (!selectedVisit) return;
    try {
      setSubmittingAction(true);
      await checkInFieldSalesVisit(selectedVisit.id, {
        latitude: currentUserLocation.latitude,
        longitude: currentUserLocation.longitude,
        accuracy: currentUserLocation.accuracy,
        distance_meters: selectedVisit.distance,
        is_location_overridden: Boolean(overrideData?.is_location_overridden),
        override_reason: overrideData?.override_reason || "",
        override_notes: overrideData?.override_notes || "",
      });
      showNotification({
        type: "success",
        message: `Checked in successfully at ${selectedVisit.company_name || selectedVisit.customer_name}!`,
      });
      setCheckInOpen(false);
      fetchDashboard(true);
    } catch (err) {
      showNotification({
        type: "error",
        message: err.response?.data?.message || "Check-in failed.",
      });
    } finally {
      setSubmittingAction(false);
    }
  };

  // Submit Visit Report Handler
  const handleVisitReportSubmit = async (reportData) => {
    if (!selectedVisit) return;
    try {
      setSubmittingAction(true);
      await submitFieldSalesVisitReport(selectedVisit.id, reportData);
      showNotification({
        type: "success",
        message: "Visit report submitted & next action recorded successfully!",
      });
      setReportOpen(false);
      setVisitDetailsOpen(false);
      fetchDashboard();
    } catch (err) {
      showNotification({
        type: "error",
        message: err.response?.data?.message || "Failed to submit report.",
      });
    } finally {
      setSubmittingAction(false);
    }
  };

  // Log Follow-up Outcome Handler
  const handleFollowUpOutcomeSubmit = async (outcomeData) => {
    if (!selectedFollowUp) return;
    try {
      setSubmittingAction(true);
      await logFollowUpOutcome(selectedFollowUp.id, outcomeData);
      showNotification({
        type: "success",
        message: `Follow-up outcome logged (${outcomeData.outcome}).`,
      });
      setFollowUpModalOpen(false);
      fetchDashboard();
    } catch (err) {
      showNotification({
        type: "error",
        message: err.response?.data?.message || "Failed to log outcome.",
      });
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleOpenNavigation = (v) => {
    const lat = v.latitude || v.lead_latitude;
    const lng = v.longitude || v.lead_longitude;
    if (lat && lng) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, "_blank");
    } else if (v.location || v.address) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(v.location || v.address)}`, "_blank");
    }
  };

  if (loading) {
    return <IgniteLoader message="Loading your Sales Workspace..." />;
  }

  const visits = data.today_visits || [];
  const followups = data.today_followups || [];

  return (
    <div className="sales-dashboard-page">
      {/* LOCATION PERMISSION PROMPT */}
      {(gpsStatus === "denied" || gpsStatus === "unavailable") && (
        <LocationPermissionModal
          open={true}
          isDenied={gpsStatus === "denied"}
          onRequestPermission={requestLocation}
        />
      )}

      {/* 1. HERO SALES PERSON GREETING & DUTY BAR */}
      <div className="sales-hero-card">
        <div className="sales-hero-content">
          <div className="sales-hero-avatar">
            {(user?.first_name || user?.name || "R")[0].toUpperCase()}
          </div>
          <div>
            <span className="sales-hero-eyebrow">FIELD SALES WORKSPACE</span>
            <h2>Good Morning, {user?.first_name || user?.name || "Rahul"} 👋</h2>
            <p>You have {visits.length} scheduled visit(s) and {followups.length} pending follow-up(s) today.</p>
          </div>
        </div>

        <div className="sales-hero-action">
          <button
            type="button"
            className={`sales-duty-btn ${isFieldDutyActive ? "active" : ""}`}
            onClick={toggleFieldDuty}
          >
            <span className="sales-duty-dot" />
            {isFieldDutyActive ? "Field Duty Active [GPS ON]" : "Start Field Duty"}
          </button>
        </div>
      </div>

      {/* 2. SUMMARY STATS TILES */}
      <div className="sales-stats-grid">
        <div className="sales-stat-tile">
          <div className="sales-stat-icon sales-stat-icon--blue">
            <Calendar size={20} />
          </div>
          <div>
            <small>Today's Visits</small>
            <strong>{data.stats.today_visits_count ?? visits.length}</strong>
          </div>
        </div>

        <div className="sales-stat-tile">
          <div className="sales-stat-icon sales-stat-icon--amber">
            <Clock size={20} />
          </div>
          <div>
            <small>Pending Follow-ups</small>
            <strong>{data.stats.pending_followups_count ?? followups.length}</strong>
          </div>
        </div>

        <div className="sales-stat-tile">
          <div className="sales-stat-icon sales-stat-icon--emerald">
            <CheckCircle size={20} />
          </div>
          <div>
            <small>Completed Today</small>
            <strong>{data.stats.completed_today_count ?? 0}</strong>
          </div>
        </div>

        <div className="sales-stat-tile">
          <div className="sales-stat-icon sales-stat-icon--purple">
            <TrendingUp size={20} />
          </div>
          <div>
            <small>Deals Converted</small>
            <strong>{data.stats.converted_leads_count ?? 0}</strong>
          </div>
        </div>
      </div>

      {/* 3. TWO COLUMN WORKSPACE: TODAY'S VISITS & TODAY'S FOLLOW-UPS */}
      <div className="sales-workspace-grid">
        {/* LEFT COLUMN: TODAY'S FIELD VISITS */}
        <div className="sales-column">
          <div className="sales-section-header">
            <h3>📍 TODAY'S VISITS ({visits.length})</h3>
            <span className="sales-section-badge">{visits.filter(v => v.status === "Completed").length} Done</span>
          </div>

          {visits.length === 0 ? (
            <Card className="sales-empty-card">
              <CheckCircle size={32} color="#10b981" />
              <h4>No pending visits for today!</h4>
              <p>Great job! All assigned visits are completed or none are scheduled for today.</p>
            </Card>
          ) : (
            <div className="sales-card-stack">
              {visits.map((v) => {
                const isCompleted = v.status === "Completed";
                const isInProgress = v.status === "In Progress";
                const priority = v.priority || "High";
                const priorityColor = priority === "High" ? "#ef4444" : priority === "Medium" ? "#f59e0b" : "#10b981";

                return (
                  <div key={v.id} className={`sales-visit-card ${isCompleted ? "completed" : ""}`}>
                    {/* TOP BADGE ROW */}
                    <div className="sales-visit-header">
                      <span
                        className="sales-priority-badge"
                        style={{ background: `${priorityColor}15`, color: priorityColor, border: `1px solid ${priorityColor}40` }}
                      >
                        ● {priority} Priority
                      </span>
                      <span className={`sales-status-badge sales-status-badge--${(v.status || "scheduled").toLowerCase().replace(" ", "_")}`}>
                        {v.status || "Scheduled"}
                      </span>
                    </div>

                    {/* CLIENT NAME & DETAILS */}
                    <h4 className="sales-visit-title">{v.company_name || v.lead_title || "Client Name"}</h4>
                    
                    <div className="sales-visit-info">
                      <div>
                        <MapPin size={14} color="#64748b" />
                        <span>{v.location || v.lead_address || "Client Address"}</span>
                      </div>
                      <div>
                        <Clock size={14} color="#64748b" />
                        <span>Today • {v.visit_time || "11:00 AM"}</span>
                      </div>
                      <div>
                        <User size={14} color="#64748b" />
                        <span>{v.lead_name || v.customer_name || "Contact Person"}</span>
                      </div>
                    </div>

                    {/* MANAGER INSTRUCTIONS */}
                    {v.instructions && (
                      <div className="sales-instructions-box">
                        <strong>Manager's Note:</strong> "{v.instructions}"
                      </div>
                    )}

                    {/* ACTIONS */}
                    <div className="sales-visit-actions">
                      <button
                        type="button"
                        className="sales-btn-secondary"
                        onClick={() => {
                          setSelectedVisit({
                            ...v,
                            id: String(v.id),
                            companyName: v.company_name || v.lead_title,
                            leadName: v.lead_name || v.customer_name,
                            employeeName: v.assigned_to_name || v.employee_name || "Sales Person",
                            scheduledDate: v.visit_date,
                            scheduledTime: v.visit_time,
                            location: v.location || v.lead_address,
                            purpose: v.purpose || v.visit_purpose || "Product Demo & Pricing",
                            visitStatus: v.status,
                            priority: v.priority,
                            instructions: v.instructions,
                            contactPhone: v.contact_phone,
                            leadLatitude: v.latitude,
                            leadLongitude: v.longitude,
                            checkInTime: v.check_in_time,
                            checkOutTime: v.check_out_time,
                            checkInLatitude: v.check_in_latitude,
                            checkInLongitude: v.check_in_longitude,
                            checkInDistanceMeters: v.check_in_distance_meters,
                            isLocationOverridden: v.is_location_overridden,
                            overrideReason: v.check_in_override_reason,
                            overrideNotes: v.check_in_override_notes,
                            clientResponse: v.client_response,
                            feedback: v.feedback,
                            meetingNotes: v.meeting_notes,
                            outcome: v.outcome,
                            photos: v.photos || [],
                          });
                          setVisitDetailsOpen(true);
                        }}
                      >
                        <Eye size={14} /> View Details
                      </button>

                      <button
                        type="button"
                        className="sales-btn-secondary"
                        onClick={() => handleOpenNavigation(v)}
                      >
                        <Compass size={14} color="#0284c7" /> Navigate
                      </button>

                      {!isCompleted && !isInProgress && (
                        <Button
                          variant="primary"
                          onClick={() => {
                            setSelectedVisit({
                              ...v,
                              id: String(v.id),
                              companyName: v.company_name || v.lead_title,
                              location: v.location,
                              leadLatitude: v.latitude,
                              leadLongitude: v.longitude,
                            });
                            setCheckInOpen(true);
                          }}
                        >
                          <Play size={14} /> Start Visit
                        </Button>
                      )}

                      {isInProgress && (
                        <Button
                          variant="primary"
                          onClick={() => {
                            setSelectedVisit({
                              ...v,
                              id: String(v.id),
                              companyName: v.company_name || v.lead_title,
                              leadName: v.lead_name || v.customer_name,
                            });
                            setReportOpen(true);
                          }}
                        >
                          Submit Report
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: TODAY'S FOLLOW-UPS */}
        <div className="sales-column">
          <div className="sales-section-header">
            <h3>🔔 TODAY'S FOLLOW-UPS ({followups.length})</h3>
            <span className="sales-section-badge sales-section-badge--amber">Action Required</span>
          </div>

          {followups.length === 0 ? (
            <Card className="sales-empty-card">
              <CheckCircle size={32} color="#0284c7" />
              <h4>No pending follow-ups due!</h4>
              <p>You have addressed all phone calls, demos and negotiation follow-ups.</p>
            </Card>
          ) : (
            <div className="sales-card-stack">
              {followups.map((fu) => {
                const attemptsCount = fu.call_attempts?.length || 0;
                return (
                  <div key={fu.id} className="sales-followup-card">
                    <div className="sales-followup-header">
                      <span className="sales-followup-type-badge">
                        {fu.follow_up_type === "Call" ? "📞 Phone Call" : fu.follow_up_type === "WhatsApp" ? "💬 WhatsApp" : "💻 Demo Meeting"}
                      </span>
                      <span className="sales-followup-due">
                        Due: {fu.due_date} {fu.due_time ? `• ${fu.due_time}` : ""}
                      </span>
                    </div>

                    <h4 className="sales-visit-title">{fu.lead_company_name || fu.lead_title || "Client"}</h4>

                    <p className="sales-followup-reason">
                      <strong>Reason:</strong> {fu.reason || "Pricing / Demo Discussion"}
                    </p>

                    <div className="sales-followup-meta">
                      <span>👤 {fu.lead_contact_name || "Contact Person"}</span>
                      {fu.lead_phone && <span>📞 {fu.lead_phone}</span>}
                      {attemptsCount > 0 && (
                        <span className="sales-attempt-tag">
                          {attemptsCount} attempt(s) recorded
                        </span>
                      )}
                    </div>

                    {/* FOLLOW-UP ACTIONS */}
                    <div className="sales-followup-actions">
                      {fu.lead_phone && (
                        <a href={`tel:${fu.lead_phone}`} className="sales-btn-call">
                          <Phone size={14} /> Call
                        </a>
                      )}

                      {fu.lead_phone && (
                        <a
                          href={`https://wa.me/${fu.lead_phone.replace(/[^0-9]/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="sales-btn-whatsapp"
                        >
                          <MessageSquare size={14} /> WhatsApp
                        </a>
                      )}

                      <button
                        type="button"
                        className="sales-btn-primary"
                        onClick={() => {
                          setSelectedFollowUp(fu);
                          setFollowUpModalOpen(true);
                        }}
                      >
                        <CheckCircle size={14} /> Log Outcome
                      </button>

                      {fu.lead && (
                        <button
                          type="button"
                          className="sales-btn-icon"
                          title="View 360 History"
                          onClick={() => {
                            setSelectedLeadId(fu.lead);
                            setTimelineDrawerOpen(true);
                          }}
                        >
                          <Layers size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ================================================================= */}
      {/* MODALS & DRAWERS                                                  */}
      {/* ================================================================= */}

      {/* 1. VISIT DETAILS DRAWER */}
      <Drawer
        open={visitDetailsOpen}
        onClose={() => setVisitDetailsOpen(false)}
        title="Visit Details"
      >
        {selectedVisit && (
          <VisitDetails
            visit={selectedVisit}
            isSales={true}
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
      <Modal
        open={checkInOpen}
        onClose={() => setCheckInOpen(false)}
        title="Start Field Visit"
      >
        {selectedVisit && (
          <VisitCheckIn
            visit={selectedVisit}
            loading={submittingAction}
            onCheckIn={handleCheckIn}
          />
        )}
      </Modal>

      {/* 3. VISIT REPORT & PHOTO SUBMISSION MODAL */}
      <Modal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        title="Submit Visit Report"
      >
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
      <Modal
        open={followUpModalOpen}
        onClose={() => setFollowUpModalOpen(false)}
        title="Log Follow-up Outcome"
      >
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
      <Drawer
        open={timelineDrawerOpen}
        onClose={() => setTimelineDrawerOpen(false)}
        title="Lead 360° History"
      >
        {selectedLeadId && (
          <LeadTimelineDrawer
            leadId={selectedLeadId}
            onClose={() => setTimelineDrawerOpen(false)}
          />
        )}
      </Drawer>
    </div>
  );
};

export default SalesDashboard;
