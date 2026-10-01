import { useEffect, useState } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Phone,
  Mail,
  Camera,
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
      ["negotiation", "follow-up required", "demo required"].includes(value)
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
      </section>

      {/* =====================================================
          LEAD INFORMATION
      ===================================================== */}
      <section className="lead-details__section">
        <h3 className="lead-details__section-title">
          Lead Information
        </h3>

        <div className="lead-details__info-grid">
          <div className="lead-details__field">
            <span className="lead-details__label">
              Assigned Sales Rep
            </span>
            <span className="lead-details__value">
              {lead.assigned_to_name || "Unassigned"}
            </span>
          </div>

          <div className="lead-details__field">
            <span className="lead-details__label">
              Priority
            </span>
            <span
              className={`lead-details__value ${String(lead.priority).toLowerCase() === "high"
                ? "lead-details__value--danger"
                : ""
                }`}
            >
              {lead.priority || "—"}
            </span>
          </div>

          <div className="lead-details__field">
            <span className="lead-details__label">
              Estimated Value
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
        </div>

        {lead.address && (
          <div className="lead-details__location">
            <MapPin size={16} />
            <span>{lead.address}</span>
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