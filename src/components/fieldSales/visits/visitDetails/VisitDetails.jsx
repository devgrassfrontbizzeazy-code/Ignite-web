import {
  CalendarDays,
  Clock3,
  MapPin,
  Navigation,
  UserRound,
  Phone,
  Compass,
  FileText,
  AlertCircle,
  Camera,
  Play,
} from "lucide-react";
import Button from "../../../common/Button/Button";
import "./VisitDetails.css";

const VisitDetails = ({
  visit,
  isSales = false,
  onStartVisit,
  onNavigate,
}) => {
  if (!visit) {
    return null;
  }

  const handleOpenMaps = () => {
    if (onNavigate) {
      onNavigate(visit);
      return;
    }
    const lat = visit.leadLatitude || visit.latitude;
    const lng = visit.leadLongitude || visit.longitude;
    if (lat && lng) {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
        "_blank"
      );
    } else if (visit.location) {
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          visit.location
        )}`,
        "_blank"
      );
    }
  };

  const priority = visit.priority || "High";
  const priorityColor =
    priority.toLowerCase() === "high"
      ? "#ef4444"
      : priority.toLowerCase() === "medium"
        ? "#f59e0b"
        : "#10b981";

  return (
    <div className="visit-details">

      {/* =========================================================
        VISIT HEADER
    ========================================================= */}
      <section className="visit-details__header">

        <div className="visit-details__identity">
          <div className="visit-details__avatar">
            {(visit.companyName || "C").charAt(0).toUpperCase()}
          </div>

          <div className="visit-details__identity-content">
            <div className="visit-details__eyebrow">
              FIELD VISIT
            </div>

            <h2>
              {visit.companyName || "Client"}
            </h2>

            <div className="visit-details__contact">
              <UserRound size={13} />
              <span>
                {visit.leadName || "Contact Person"}
              </span>
            </div>
          </div>
        </div>

        <span
          className={`visit-details__priority visit-details__priority--${priority.toLowerCase()}`}
        >
          {priority}
        </span>

      </section>


      {/* =========================================================
        STATUS + ACTIONS
    ========================================================= */}
      <section className="visit-details__command">

        <div className="visit-details__status-line">

          <span
            className={`visit-status visit-status--${String(
              visit.visitStatus
            ).toLowerCase()}`}
          >
            <span className="visit-status__dot" />

            {visit.visitStatus === "CHECKED_IN" ||
              visit.visitStatus === "IN_PROGRESS"
              ? "In Progress"
              : visit.visitStatus === "CHECKED_OUT" ||
                visit.visitStatus === "COMPLETED"
                ? "Completed"
                : "Not Started"}
          </span>

          {visit.clientResponse && (
            <span className="visit-details__response">
              {visit.clientResponse}
            </span>
          )}

        </div>


        <div className="visit-details__actions">

          <button
            type="button"
            className="visit-details__action visit-details__action--navigate"
            onClick={handleOpenMaps}
          >
            <Navigation size={15} />
            Navigate
          </button>

          {visit.contactPhone && (
            <a
              href={`tel:${visit.contactPhone}`}
              className="visit-details__action visit-details__action--call"
            >
              <Phone size={15} />
              Call
            </a>
          )}

          {visit.visitStatus !== "CHECKED_OUT" &&
            visit.visitStatus !== "COMPLETED" && (
              <Button
                variant="primary"
                onClick={() => onStartVisit?.(visit)}
                className="visit-details__start"
              >
                <Play size={15} />

                {visit.visitStatus === "CHECKED_IN" ||
                  visit.visitStatus === "IN_PROGRESS"
                  ? "Visit in Progress"
                  : "Start Visit"}
              </Button>
            )}

        </div>

      </section>


      {/* =========================================================
        VISIT ESSENTIALS
    ========================================================= */}
      <section className="visit-details__block">

        <div className="visit-details__block-heading">
          <div>
            <span>Visit Details</span>
            <small>Schedule and assignment</small>
          </div>
        </div>


        <div className="visit-details__details-grid">

          <div className="visit-details__detail">
            <div className="visit-details__detail-icon">
              <CalendarDays size={15} />
            </div>

            <div>
              <small>Date</small>
              <strong>
                {visit.scheduledDate || "Today"}
              </strong>
            </div>
          </div>


          <div className="visit-details__detail">
            <div className="visit-details__detail-icon">
              <Clock3 size={15} />
            </div>

            <div>
              <small>Time</small>
              <strong>
                {visit.scheduledTime || "11:00 AM"}
              </strong>
            </div>
          </div>


          <div className="visit-details__detail">
            <div className="visit-details__detail-icon">
              <UserRound size={15} />
            </div>

            <div>
              <small>Assigned To</small>
              <strong>
                {visit.employeeName || "Sales Person"}
              </strong>
            </div>
          </div>


          <div className="visit-details__detail">
            <div className="visit-details__detail-icon">
              <FileText size={15} />
            </div>

            <div>
              <small>Purpose</small>
              <strong>
                {visit.purpose || "Product Demo & Pricing"}
              </strong>
            </div>
          </div>


          <div className="visit-details__detail visit-details__detail--location">

            <div className="visit-details__detail-icon">
              <MapPin size={15} />
            </div>

            <div>
              <small>Location</small>

              <strong>
                {visit.location || "Client address"}
              </strong>
            </div>

          </div>

        </div>

      </section>


      {/* =========================================================
        MANAGER INSTRUCTIONS
    ========================================================= */}
      {visit.instructions && (
        <section className="visit-details__notice">

          <div className="visit-details__notice-icon">
            <AlertCircle size={15} />
          </div>

          <div>
            <span>Manager Instructions</span>

            <p>
              {visit.instructions}
            </p>
          </div>

        </section>
      )}


      {/* =========================================================
        FIELD EXECUTION
    ========================================================= */}
      <section className="visit-details__block">

        <div className="visit-details__block-heading">
          <div>
            <span>Visit Execution</span>
            <small>On-field activity</small>
          </div>
        </div>


        <div className="visit-details__execution">

          <div className="visit-details__execution-step">

            <div className="visit-details__execution-marker visit-details__execution-marker--start">
              <span />
            </div>

            <div className="visit-details__execution-content">
              <small>Check-in</small>

              <strong>
                {visit.checkInTime
                  ? visit.checkInTime.includes("T")
                    ? new Date(
                      visit.checkInTime
                    ).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })
                    : visit.checkInTime
                  : "Not recorded"}
              </strong>
            </div>

          </div>


          <div className="visit-details__execution-line" />


          <div className="visit-details__execution-step">

            <div
              className={`visit-details__execution-marker ${visit.checkOutTime
                  ? "visit-details__execution-marker--complete"
                  : "visit-details__execution-marker--pending"
                }`}
            >
              <span />
            </div>

            <div className="visit-details__execution-content">
              <small>Check-out</small>

              <strong>
                {visit.checkOutTime
                  ? visit.checkOutTime.includes("T")
                    ? new Date(
                      visit.checkOutTime
                    ).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })
                    : visit.checkOutTime
                  : "Pending"}
              </strong>
            </div>

          </div>

        </div>

      </section>


      {/* =========================================================
        LOCATION VERIFICATION
    ========================================================= */}
      {(visit.visitStatus === "CHECKED_IN" ||
        visit.visitStatus === "IN_PROGRESS" ||
        visit.visitStatus === "CHECKED_OUT" ||
        visit.visitStatus === "COMPLETED" ||
        visit.checkInTime) && (

          <section className="visit-details__location-card">

            <div className="visit-details__location-header">

              <div>
                <span>Location Verification</span>
                <small>GPS captured during visit</small>
              </div>

              <div className="visit-details__gps-status">
                <span />
                Recorded
              </div>

            </div>


            <div className="visit-details__location-stats">

              <div>
                <small>Distance from client</small>

                <strong
                  className={
                    visit.isLocationOverridden
                      ? "is-warning"
                      : ""
                  }
                >
                  {visit.checkInDistanceMeters != null
                    ? `${Math.round(
                      visit.checkInDistanceMeters
                    )}m`
                    : visit.distance != null
                      ? `${Math.round(visit.distance)}m`
                      : "0m"}
                </strong>
              </div>


              <div>
                <small>Check-in coordinates</small>

                <strong>
                  {visit.checkInLatitude &&
                    visit.checkInLongitude
                    ? `${Number(
                      visit.checkInLatitude
                    ).toFixed(4)}°, ${Number(
                      visit.checkInLongitude
                    ).toFixed(4)}°`
                    : "Captured"}
                </strong>
              </div>


              <div>
                <small>Check-in time</small>

                <strong>
                  {visit.checkInTime
                    ? visit.checkInTime.includes("T")
                      ? new Date(
                        visit.checkInTime
                      ).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })
                      : visit.checkInTime
                    : "Recorded"}
                </strong>
              </div>

            </div>


            {visit.isLocationOverridden && (
              <div className="visit-details__override">

                <AlertCircle size={14} />

                <div>
                  <strong>
                    Location override
                  </strong>

                  <span>
                    {visit.overrideReason || "Other"}
                  </span>

                  {visit.overrideNotes && (
                    <p>
                      {visit.overrideNotes}
                    </p>
                  )}
                </div>

              </div>
            )}

          </section>
        )}


      {/* =========================================================
        VISIT REPORT
    ========================================================= */}
      {(visit.clientResponse ||
        visit.feedback ||
        visit.meetingNotes ||
        visit.outcome ||
        visit.outcomeDescription) && (

          <section className="visit-details__block">

            <div className="visit-details__block-heading">
              <div>
                <span>Visit Report</span>
                <small>Client response and meeting notes</small>
              </div>
            </div>


            <div className="visit-details__report">

              {visit.clientResponse && (
                <div className="visit-details__report-outcome">

                  <small>Client response</small>

                  <span
                    className={
                      visit.clientResponse === "Converted" ||
                        visit.clientResponse === "Deal Won"
                        ? "won"
                        : visit.clientResponse === "Not Interested" ||
                          visit.clientResponse === "Lost"
                          ? "lost"
                          : "neutral"
                    }
                  >
                    {visit.clientResponse}
                  </span>

                </div>
              )}


              {(visit.feedback ||
                visit.meetingNotes ||
                visit.outcomeDescription ||
                visit.outcome) && (

                  <div className="visit-details__notes">

                    <small>Meeting notes</small>

                    <p>
                      {visit.feedback ||
                        visit.meetingNotes ||
                        visit.outcomeDescription ||
                        visit.outcome}
                    </p>

                  </div>

                )}

            </div>

          </section>
        )}


      {/* =========================================================
        PHOTOS
    ========================================================= */}
      {Array.isArray(visit.photos) &&
        visit.photos.length > 0 && (

          <section className="visit-details__block">

            <div className="visit-details__block-heading">
              <div>
                <span>
                  Visit Photos
                </span>

                <small>
                  {visit.photos.length} geo-stamped photo
                  {visit.photos.length !== 1 ? "s" : ""}
                </small>
              </div>
            </div>


            <div className="visit-details__photos">

              {visit.photos.map((photo, index) => (
                <div
                  key={photo.id || index}
                  className="visit-details__photo"
                >
                  <img
                    src={photo.photo_url || photo.photo}
                    alt="Visit proof"
                  />

                  <span>
                    {photo.captured_at
                      ? new Date(
                        photo.captured_at
                      ).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                      : "Photo"}
                  </span>
                </div>
              ))}

            </div>

          </section>
        )}

    </div>
  );
};

export default VisitDetails;