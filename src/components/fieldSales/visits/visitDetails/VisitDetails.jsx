import {
  CalendarDays,
  Clock3,
  MapPin,
  Navigation,
  UserRound,
} from "lucide-react";

import "./VisitDetails.css";

const VisitDetails = ({ visit }) => {
  if (!visit) {
    return null;
  }

  return (
    <div className="visit-details">
      <div className="visit-details__hero">
        <div className="visit-details__company-icon">
          {visit.companyName
            .slice(0, 1)
            .toUpperCase()}
        </div>

        <div>
          <span className="visit-details__eyebrow">
            FIELD VISIT
          </span>

          <h3>{visit.companyName}</h3>
          <p>{visit.leadName}</p>
        </div>
      </div>

      <div className="visit-details__status-row">
        <span
          className={`visit-status visit-status--${visit.visitStatus.toLowerCase()}`}
        >
          <span className="visit-status__dot" />
          {visit.visitStatus === "CHECKED_IN"
            ? "Visit in progress"
            : visit.visitStatus === "CHECKED_OUT"
              ? "Visit completed"
              : "Visit scheduled"}
        </span>

        {visit.outcome && (
          <span className="visit-details__outcome">
            {visit.outcome === "FOLLOW_UP"
              ? "Follow-up"
              : visit.outcome === "DEAL_WON"
                ? "Deal Won"
                : "Lost"}
          </span>
        )}
      </div>

      <div className="visit-details__section">
        <span className="visit-details__section-title">
          Visit Information
        </span>

        <div className="visit-details__grid">
          <div className="visit-details__item">
            <CalendarDays size={16} />
            <div>
              <small>Scheduled</small>
              <strong>
                {visit.scheduledDate}
              </strong>
            </div>
          </div>

          <div className="visit-details__item">
            <Clock3 size={16} />
            <div>
              <small>Time</small>
              <strong>
                {visit.scheduledTime}
              </strong>
            </div>
          </div>

          <div className="visit-details__item">
            <UserRound size={16} />
            <div>
              <small>Assigned To</small>
              <strong>
                {visit.employeeName}
              </strong>
            </div>
          </div>

          <div className="visit-details__item">
            <MapPin size={16} />
            <div>
              <small>Location</small>
              <strong>{visit.location}</strong>
            </div>
          </div>
        </div>
      </div>

      {visit.visitStatus === "CHECKED_IN" && (
        <div className="visit-details__live-card">
          <div className="visit-details__live-header">
            <span className="visit-details__live-indicator">
              <span />
              LIVE VISIT
            </span>

            <Navigation size={15} />
          </div>

          <div className="visit-details__live-grid">
            <div>
              <small>Distance</small>
              <strong>{visit.distance}m</strong>
            </div>

            <div>
              <small>GPS Accuracy</small>
              <strong>±{visit.gpsAccuracy}m</strong>
            </div>

            <div>
              <small>Checked In</small>
              <strong>{visit.checkInTime}</strong>
            </div>
          </div>
        </div>
      )}

      {visit.description && (
        <div className="visit-details__section">
          <span className="visit-details__section-title">
            Meeting Notes
          </span>

          <p className="visit-details__description">
            {visit.description}
          </p>
        </div>
      )}
    </div>
  );
};

export default VisitDetails;