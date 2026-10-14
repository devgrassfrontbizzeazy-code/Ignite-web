import { useEffect, useState } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Phone,
  Mail,
  Camera,
  ShieldAlert,
  AlertCircle,
  UserCheck,
  History,
  ArrowRight,
  HelpCircle,
} from "lucide-react";
import "./LeadTimelineDrawer.css";
import { getLeadTimelineHistory } from "../../../../services/api/fieldSalesAPI";
import IgniteLoader from "../../../common/IgniteLoader/IgniteLoader";

const LeadTimelineDrawer = ({ leadId, onClose }) => {
  const [timelineData, setTimelineData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!leadId) return;

    let isMounted = true;

    const fetchTimeline = async () => {
      try {
        setLoading(true);

        const res = await getLeadTimelineHistory(leadId);

        if (isMounted && res?.data) {
          setTimelineData(res.data);
        }
      } catch (err) {
        console.error("Error fetching lead timeline:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchTimeline();

    return () => {
      isMounted = false;
    };
  }, [leadId]);

  if (loading) {
    return (
      <div className="lead-details-loading">
        <IgniteLoader size={32} />
        <span>Loading lead details...</span>
      </div>
    );
  }

  if (!timelineData) {
    return (
      <div className="lead-details-empty">
        No lead details found.
      </div>
    );
  }

  const {
    lead,
    visits = [],
    activities = [],
    assignment_history = [],
  } = timelineData;

  const contactName =
    lead.contact_name ||
    `${lead.first_name || ""} ${lead.last_name || ""}`.trim() ||
    "Lead";

  const estimatedValue = Number(
    lead.conversion_value || lead.estimated_value || 0
  );

  const getStatusClass = (status) => {
    const value = String(status || "")
      .toLowerCase()
      .replace(/_/g, " ")
      .trim();

    if (["converted", "won", "completed"].includes(value)) {
      return "lead-status lead-status--success";
    }

    if (["lost", "not interested"].includes(value)) {
      return "lead-status lead-status--danger";
    }

    if (
      ["negotiation", "follow-up required", "demo required", "pending approval"].includes(value)
    ) {
      return "lead-status lead-status--warning";
    }

    if (
      ["in progress", "scheduled", "checked in", "checked out"].includes(value)
    ) {
      return "lead-status lead-status--info";
    }

    return "lead-status";
  };

  const getActivityClass = (activityType) => {
    const type = String(activityType || "").toUpperCase();

    if (type === "DEAL_CONVERTED") {
      return "lead-timeline__dot lead-timeline__dot--success";
    }

    if (type === "DEAL_LOST") {
      return "lead-timeline__dot lead-timeline__dot--danger";
    }

    if (type.includes("VISIT")) {
      return "lead-timeline__dot lead-timeline__dot--teal";
    }

    if (type.includes("REASSIGN") || type.includes("ASSIGN")) {
      return "lead-timeline__dot lead-timeline__dot--warning";
    }

    return "lead-timeline__dot";
  };

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getAssignmentTypeTagClass = (type) => {
    const t = String(type || "").toUpperCase();
    if (t.includes("REASSIGN")) return "lead-assignment-type-tag--reassigned";
    if (t.includes("ESCALAT")) return "lead-assignment-type-tag--escalated";
    if (t.includes("SELF")) return "lead-assignment-type-tag--self";
    return "";
  };

  const formatAssignmentType = (type) => {
    const t = String(type || "").toUpperCase();
    if (t === "INITIAL") return "Initial Assignment";
    if (t === "REASSIGNED") return "Reassigned";
    if (t === "SELF_ASSIGNED") return "Self-Assigned";
    if (t === "ESCALATED") return "Escalated";
    if (t === "REQUESTED") return "Assignment Requested";
    if (t === "APPROVED") return "Assignment Approved";
    return type || "Assigned";
  };

  return (
    <div className="lead-details">
      {/* =====================================================
          LEAD OVERVIEW
      ===================================================== */}
      <section className="lead-details__section">
        <div className="lead-details__title-row">
          <div>
            <h2 className="lead-details__name">
              {lead.company_name || lead.title || contactName}
            </h2>

            {lead.company_name && (
              <p className="lead-details__subtitle">
                {contactName}
              </p>
            )}
          </div>

          <span className={getStatusClass(lead.status)}>
            {lead.status || "New"}
          </span>
        </div>

        {/* Contact */}
        <div className="lead-details__contact-row">
          {lead.phone && (
            <div className="lead-details__contact-item">
              <Phone size={15} />
              <span>{lead.phone}</span>
            </div>
          )}

          {lead.email && (
            <div className="lead-details__contact-item">
              <Mail size={15} />
              <span>{lead.email}</span>
            </div>
          )}
        </div>

        {/* ESCALATION BANNER (Case 7) */}
        {lead.is_escalated && (
          <div className="lead-details__banner lead-details__banner--escalated">
            <ShieldAlert size={20} />
            <div>
              <strong>Escalated to Management</strong>
              <p>{lead.escalation_reason || "Assistance or guidance requested from supervisor."}</p>
              {lead.escalated_by_name && (
                <small>
                  Escalated by {lead.escalated_by_name} {lead.escalated_at ? `on ${formatDate(lead.escalated_at)}` : ""}
                </small>
              )}
            </div>
          </div>
        )}

        {/* PENDING APPROVAL BANNER (Case 4 / Case 14) */}
        {lead.approval_status === "PENDING_APPROVAL" && (
          <div className="lead-details__banner lead-details__banner--pending">
            <AlertCircle size={20} />
            <div>
              <strong>Pending Manager Assignment Approval</strong>
              <p>
                Requested Assignee: <strong>{lead.requested_assignee_name || "Sales Rep"}</strong>
              </p>
              {lead.approval_notes && <small>Note: {lead.approval_notes}</small>}
            </div>
          </div>
        )}

        {/* LOST LEAD BANNER (Case 12) */}
        {lead.status?.toUpperCase() === "LOST" && (
          <div className="lead-details__banner lead-details__banner--lost">
            <AlertCircle size={20} />
            <div>
              <strong>Lead Marked as Lost</strong>
              {lead.lost_reason_category && (
                <p>Reason: <strong>{lead.lost_reason_category}</strong></p>
              )}
              {lead.lost_reason && (
                <small>{lead.lost_reason}</small>
              )}
            </div>
          </div>
        )}
      </section>

      {/* =====================================================
          LEAD INFORMATION
      ===================================================== */}
      <section className="lead-details__section">
        <h3 className="lead-details__section-title">
          Lead Information & Ownership
        </h3>

        <div className="lead-details__info-grid">
          {/* ASSIGNED SALES REP */}
          <div className="lead-details__field">
            <span className="lead-details__label">
              Assigned Sales Rep
            </span>
            <span className="lead-details__value">
              {lead.assigned_to_name || "Unassigned"}
            </span>
          </div>

          {/* ASSIGNED BY */}
          <div className="lead-details__field">
            <span className="lead-details__label">
              Assigned By
            </span>
            <span className="lead-details__value">
              {lead.assigned_by_name || "—"}
            </span>
          </div>

          {/* CREATED BY */}
          <div className="lead-details__field">
            <span className="lead-details__label">
              Created By
            </span>
            <span className="lead-details__value">
              {lead.created_by_name || "System"}{" "}
              {lead.created_by_role && (
                <small style={{ color: "var(--color-text-secondary)", fontSize: "11px" }}>
                  ({lead.created_by_role})
                </small>
              )}
            </span>
          </div>

          {/* ASSIGNMENT STATUS */}
          <div className="lead-details__field">
            <span className="lead-details__label">
              Assignment Status
            </span>
            <span className="lead-details__value">
              {lead.assignment_status || (lead.assigned_to ? "Assigned" : "Unassigned")}
            </span>
          </div>

          <div className="lead-details__field">
            <span className="lead-details__label">
              Priority
            </span>
            <span
              className={`lead-details__value ${
                String(lead.priority).toLowerCase() === "high"
                  ? "lead-details__value--danger"
                  : ""
              }`}
            >
              {lead.priority || "—"}
            </span>
          </div>

          <div className="lead-details__field">
            <span className="lead-details__label">
              Estimated / Deal Value
            </span>
            <span className="lead-details__value">
              ₹{estimatedValue.toLocaleString("en-IN")}
            </span>
          </div>

          {lead.source && (
            <div className="lead-details__field">
              <span className="lead-details__label">
                Source
              </span>
              <span className="lead-details__value">
                {lead.source}
              </span>
            </div>
          )}

          {lead.is_duplicate && (
            <div className="lead-details__field">
              <span className="lead-details__label">
                Duplicate Flag
              </span>
              <span className="lead-details__value" style={{ color: "#d97706" }}>
                Identified as duplicate
              </span>
            </div>
          )}
        </div>

        {lead.address && (
          <div className="lead-details__location">
            <MapPin size={16} />
            <span>{lead.address}</span>
          </div>
        )}
      </section>

      {/* =====================================================
          ASSIGNMENT AUDIT TRAIL (Case 15)
      ===================================================== */}
      <section className="lead-details__section">
        <div className="lead-details__section-header">
          <h3 className="lead-details__section-title">
            Assignment Audit Trail
          </h3>

          {assignment_history.length > 0 && (
            <span className="lead-details__count">
              {assignment_history.length}
            </span>
          )}
        </div>

        {assignment_history.length === 0 ? (
          <div className="lead-details__empty-state">
            No previous reassignments recorded.
          </div>
        ) : (
          <div className="lead-assignment-list">
            {assignment_history.map((hist) => (
              <div className="lead-assignment-card" key={hist.id}>
                <div className="lead-assignment-card__header">
                  <span
                    className={`lead-assignment-type-tag ${getAssignmentTypeTagClass(
                      hist.assignment_type
                    )}`}
                  >
                    {formatAssignmentType(hist.assignment_type)}
                  </span>
                  <span className="lead-assignment-card__time">
                    {formatDate(hist.assigned_at)} at {formatTime(hist.assigned_at)}
                  </span>
                </div>

                <div className="lead-assignment-card__parties">
                  <span className="lead-assignment-party">
                    <User size={13} />
                    Assigned To: <strong>{hist.assigned_to_name || "Unassigned"}</strong>
                  </span>

                  {hist.previous_assigned_to_name && (
                    <span className="lead-assignment-party">
                      <ArrowRight size={13} />
                      Prev: <span>{hist.previous_assigned_to_name}</span>
                    </span>
                  )}

                  <span className="lead-assignment-party">
                    <UserCheck size={13} />
                    Assigned By: <strong>{hist.assigned_by_name || "System"}</strong>
                  </span>
                </div>

                {hist.reason && (
                  <p className="lead-assignment-card__reason">
                    Reason: {hist.reason}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* =====================================================
          ACTIVITY
      ===================================================== */}
      <section className="lead-details__section">
        <div className="lead-details__section-header">
          <h3 className="lead-details__section-title">
            Activity
          </h3>

          {activities.length > 0 && (
            <span className="lead-details__count">
              {activities.length}
            </span>
          )}
        </div>

        {activities.length === 0 ? (
          <div className="lead-details__empty-state">
            No activity records yet.
          </div>
        ) : (
          <div className="lead-timeline">
            {activities.map((activity, index) => (
              <div
                className="lead-timeline__item"
                key={activity.id || index}
              >
                <div className={getActivityClass(activity.activity_type)} />

                <div className="lead-timeline__content">
                  <div className="lead-timeline__top">
                    <span className="lead-timeline__title">
                      {activity.title}
                    </span>

                    {activity.performed_at && (
                      <span className="lead-timeline__date">
                        {formatDate(activity.performed_at)}
                      </span>
                    )}
                  </div>

                  {activity.description && (
                    <p className="lead-timeline__description">
                      {activity.description}
                    </p>
                  )}

                  {activity.employee_name && (
                    <span className="lead-timeline__employee">
                      <User size={12} />
                      {activity.employee_name}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* =====================================================
          FIELD VISITS
      ===================================================== */}
      <section className="lead-details__section">
        <div className="lead-details__section-header">
          <h3 className="lead-details__section-title">
            Field Visits
          </h3>

          {visits.length > 0 && (
            <span className="lead-details__count">
              {visits.length}
            </span>
          )}
        </div>

        {visits.length === 0 ? (
          <div className="lead-details__empty-state">
            No field visits recorded yet.
          </div>
        ) : (
          <div className="lead-visits">
            {visits.map((visit) => (
              <div
                className="lead-visit"
                key={visit.id}
              >
                <div className="lead-visit__header">
                  <div>
                    <span className="lead-visit__code">
                      {visit.visit_code}
                    </span>

                    <span className="lead-visit__date">
                      {formatDate(visit.visit_date)}
                    </span>
                  </div>

                  <span className={getStatusClass(visit.status)}>
                    {visit.status || "Scheduled"}
                  </span>
                </div>

                <div className="lead-visit__meta">
                  <div className="lead-visit__meta-item">
                    <Clock size={14} />
                    <span>
                      Check-in:{" "}
                      {visit.check_in_time
                        ? formatTime(visit.check_in_time)
                        : "Not started"}
                    </span>
                  </div>

                  <div className="lead-visit__meta-item">
                    <Clock size={14} />
                    <span>
                      Check-out:{" "}
                      {visit.check_out_time
                        ? formatTime(visit.check_out_time)
                        : "—"}
                    </span>
                  </div>
                </div>

                {visit.feedback && (
                  <p className="lead-visit__feedback">
                    {visit.feedback}
                  </p>
                )}

                {visit.photos?.length > 0 && (
                  <div className="lead-visit__photos">
                    <div className="lead-visit__photos-label">
                      <Camera size={14} />
                      Photos
                    </div>

                    <div className="lead-visit__photo-list">
                      {visit.photos.map((photo, index) => (
                        <img
                          key={index}
                          src={photo.photo_url || photo.photo}
                          alt="Visit"
                          className="lead-visit__photo"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default LeadTimelineDrawer;