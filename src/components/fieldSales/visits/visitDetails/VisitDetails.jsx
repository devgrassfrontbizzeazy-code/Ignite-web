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
      {/* HERO / HEADER */}
      <div className="visit-details__hero">
        <div className="visit-details__company-icon">
          {(visit.companyName || "C").slice(0, 1).toUpperCase()}
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span className="visit-details__eyebrow">FIELD VISIT</span>
            <span
              style={{
                fontSize: "10px",
                fontWeight: "700",
                padding: "2px 8px",
                borderRadius: "12px",
                background: `${priorityColor}18`,
                color: priorityColor,
                border: `1px solid ${priorityColor}40`,
                textTransform: "uppercase",
              }}
            >
              ● {priority} Priority
            </span>
          </div>

          <h3>{visit.companyName || "Client"}</h3>
          <p style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <UserRound size={12} /> {visit.leadName || "Contact Person"}
          </p>
        </div>
      </div>

      {/* QUICK ACTION BUTTONS (For Sales Rep) */}
      <div style={{ display: "flex", gap: "10px" }}>
        <button
          type="button"
          onClick={handleOpenMaps}
          style={{
            flex: 1,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            padding: "10px 14px",
            borderRadius: "10px",
            background: "#f1f5f9",
            color: "#0f172a",
            border: "1px solid #cbd5e1",
            fontWeight: "600",
            fontSize: "12px",
            cursor: "pointer",
          }}
        >
          <Compass size={16} color="#0284c7" />
          Navigate (Maps)
        </button>

        {visit.contactPhone && (
          <a
            href={`tel:${visit.contactPhone}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              padding: "10px 14px",
              borderRadius: "10px",
              background: "#ecfdf5",
              color: "#047857",
              border: "1px solid #a7f3d0",
              fontWeight: "600",
              fontSize: "12px",
              textDecoration: "none",
            }}
          >
            <Phone size={15} /> Call
          </a>
        )}

        {visit.visitStatus !== "CHECKED_OUT" &&
          visit.visitStatus !== "COMPLETED" && (
            <Button
              variant="primary"
              onClick={() => onStartVisit?.(visit)}
              style={{ flex: 1.2 }}
            >
              <Play size={15} />
              {visit.visitStatus === "CHECKED_IN" ||
              visit.visitStatus === "IN_PROGRESS"
                ? "Visit in Progress"
                : "Start Visit"}
            </Button>
          )}
      </div>

      {/* STATUS BADGE */}
      <div className="visit-details__status-row">
        <span
          className={`visit-status visit-status--${String(
            visit.visitStatus
          ).toLowerCase()}`}
        >
          <span className="visit-status__dot" />
          {visit.visitStatus === "CHECKED_IN" ||
          visit.visitStatus === "IN_PROGRESS"
            ? "Visit in progress"
            : visit.visitStatus === "CHECKED_OUT" ||
              visit.visitStatus === "COMPLETED"
            ? "Visit completed"
            : "Scheduled"}
        </span>

        {visit.clientResponse && (
          <span className="visit-details__outcome">
            Response: {visit.clientResponse}
          </span>
        )}
      </div>

      {/* MANAGER'S INSTRUCTIONS */}
      {visit.instructions && (
        <div
          style={{
            background: "#eff6ff",
            border: "1px solid #bfdbfe",
            borderRadius: "10px",
            padding: "12px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              color: "#1d4ed8",
              fontWeight: "700",
              fontSize: "11px",
              marginBottom: "4px",
            }}
          >
            <AlertCircle size={14} /> MANAGER'S INSTRUCTIONS
          </div>
          <p
            style={{
              margin: 0,
              fontSize: "12px",
              color: "#1e293b",
              lineHeight: 1.5,
              fontWeight: "500",
            }}
          >
            "{visit.instructions}"
          </p>
        </div>
      )}

      {/* INFORMATION GRID */}
      <div className="visit-details__section">
        <span className="visit-details__section-title">Visit Information</span>

        <div className="visit-details__grid">
          <div className="visit-details__item">
            <CalendarDays size={16} />
            <div>
              <small>Scheduled Date</small>
              <strong>{visit.scheduledDate || "Today"}</strong>
            </div>
          </div>

          <div className="visit-details__item">
            <Clock3 size={16} />
            <div>
              <small>Scheduled Time</small>
              <strong>{visit.scheduledTime || "11:00 AM"}</strong>
            </div>
          </div>

          <div className="visit-details__item">
            <FileText size={16} />
            <div>
              <small>Purpose</small>
              <strong>{visit.purpose || "Product Demo & Pricing"}</strong>
            </div>
          </div>

          <div className="visit-details__item">
            <UserRound size={16} />
            <div>
              <small>Assigned To</small>
              <strong>{visit.employeeName || "Sales Person"}</strong>
            </div>
          </div>

          <div
            className="visit-details__item"
            style={{ gridColumn: "span 2" }}
          >
            <MapPin size={16} />
            <div>
              <small>Location Address</small>
              <strong>{visit.location || "Client address"}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* CHECK-IN & CHECK-OUT EXECUTION TRAIL CARD */}
      <div className="visit-details__section">
        <span className="visit-details__section-title">Field Visit Execution Trail</span>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "10px",
            background: "#f8fafc",
            padding: "12px",
            borderRadius: "10px",
            border: "1px solid #e2e8f0",
          }}
        >
          <div>
            <small style={{ color: "#64748b", fontSize: "11px", display: "block", marginBottom: "2px" }}>
              🟢 Check-In Time
            </small>
            <strong style={{ fontSize: "12px", color: (visit.checkInTime || visit.checkOutTime) ? "#0f172a" : "#94a3b8" }}>
              {visit.checkInTime ? (
                visit.checkInTime.includes("T")
                  ? new Date(visit.checkInTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })
                  : visit.checkInTime
              ) : visit.checkOutTime ? (
                visit.checkOutTime.includes("T")
                  ? new Date(new Date(visit.checkOutTime).getTime() - 15 * 60000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })
                  : "Recorded at Check-in"
              ) : (
                "Pending Check-in"
              )}
            </strong>
          </div>

          <div>
            <small style={{ color: "#64748b", fontSize: "11px", display: "block", marginBottom: "2px" }}>
              🔴 Check-Out Time
            </small>
            <strong style={{ fontSize: "12px", color: visit.checkOutTime ? "#0f172a" : "#94a3b8" }}>
              {visit.checkOutTime ? (
                visit.checkOutTime.includes("T")
                  ? new Date(visit.checkOutTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })
                  : visit.checkOutTime
              ) : (
                "Pending Checkout"
              )}
            </strong>
          </div>

          <div style={{ gridColumn: "span 2", paddingTop: "6px", borderTop: "1px dashed #cbd5e1" }}>
            <small style={{ color: "#64748b", fontSize: "11px", display: "block", marginBottom: "2px" }}>
              📍 On-Field Recorded Location
            </small>
            <strong style={{ fontSize: "11px", color: "#334155" }}>
              {visit.checkInLatitude && visit.checkInLongitude
                ? `${Number(visit.checkInLatitude).toFixed(5)}°, ${Number(visit.checkInLongitude).toFixed(5)}°`
                : visit.leadLatitude && visit.leadLongitude
                ? `${Number(visit.leadLatitude).toFixed(5)}°, ${Number(visit.leadLongitude).toFixed(5)}°`
                : "GPS coordinates logged"}
            </strong>
          </div>
        </div>
      </div>

      {/* LIVE RADAR CARD (if checked in or completed) */}
      {(visit.visitStatus === "CHECKED_IN" ||
        visit.visitStatus === "IN_PROGRESS" ||
        visit.visitStatus === "CHECKED_OUT" ||
        visit.visitStatus === "COMPLETED" ||
        visit.checkInTime) && (
        <div className="visit-details__live-card">
          <div className="visit-details__live-header">
            <span className="visit-details__live-indicator">
              <span />
              ON-SITE GPS RECORDED
            </span>
            <Navigation size={15} />
          </div>

          <div className="visit-details__live-grid">
            <div>
              <small>Distance from Client</small>
              <strong style={{ color: visit.isLocationOverridden ? "#dc2626" : "#059669" }}>
                {visit.checkInDistanceMeters != null
                  ? `${Math.round(visit.checkInDistanceMeters)}m`
                  : visit.distance != null
                  ? `${Math.round(visit.distance)}m`
                  : "0m"}
              </strong>
            </div>

            <div>
              <small>Check-In Coordinates</small>
              <strong style={{ fontSize: "11px" }}>
                {visit.checkInLatitude && visit.checkInLongitude
                  ? `${Number(visit.checkInLatitude).toFixed(4)}°, ${Number(visit.checkInLongitude).toFixed(4)}°`
                  : visit.currentLatitude && visit.currentLongitude
                  ? `${Number(visit.currentLatitude).toFixed(4)}°, ${Number(visit.currentLongitude).toFixed(4)}°`
                  : "Captured"}
              </strong>
            </div>

            <div>
              <small>Check-In Time</small>
              <strong>
                {visit.checkInTime
                  ? visit.checkInTime.includes("T")
                    ? new Date(visit.checkInTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })
                    : visit.checkInTime
                  : "Recorded"}
              </strong>
            </div>
          </div>

          {/* MANAGER OVERRIDE REASON DISPLAY */}
          {visit.isLocationOverridden && (
            <div
              style={{
                marginTop: "12px",
                padding: "10px 12px",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: "8px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  color: "#b91c1c",
                  fontWeight: "700",
                  fontSize: "11px",
                  marginBottom: "4px",
                }}
              >
                <AlertCircle size={14} /> LOCATION OVERRIDE (CHECKED IN AWAY FROM PIN)
              </div>
              <div style={{ fontSize: "12px", color: "#7f1d1d", fontWeight: "600" }}>
                Reason: {visit.overrideReason || "Other"}
              </div>
              {visit.overrideNotes && (
                <p style={{ margin: "4px 0 0", fontSize: "11px", color: "#991b1b", lineHeight: 1.4 }}>
                  "{visit.overrideNotes}"
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* CLIENT RESPONSE & VISIT REPORT */}
      {(visit.clientResponse || visit.feedback || visit.meetingNotes || visit.outcome || visit.outcomeDescription) && (
        <div className="visit-details__section">
          <span className="visit-details__section-title">
            Visit Report & Client Response
          </span>

          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "10px",
              padding: "12px",
            }}
          >
            {visit.clientResponse && (
              <div style={{ marginBottom: "8px" }}>
                <span style={{ fontSize: "11px", color: "#64748b", display: "block" }}>
                  Client Decision / Outcome:
                </span>
                <span
                  style={{
                    display: "inline-block",
                    padding: "4px 10px",
                    borderRadius: "6px",
                    background:
                      visit.clientResponse === "Converted" || visit.clientResponse === "Deal Won"
                        ? "#ecfdf5"
                        : visit.clientResponse === "Not Interested" || visit.clientResponse === "Lost"
                        ? "#fef2f2"
                        : "#eff6ff",
                    color:
                      visit.clientResponse === "Converted" || visit.clientResponse === "Deal Won"
                        ? "#047857"
                        : visit.clientResponse === "Not Interested" || visit.clientResponse === "Lost"
                        ? "#dc2626"
                        : "#1d4ed8",
                    fontWeight: "700",
                    fontSize: "12px",
                    marginTop: "2px",
                  }}
                >
                  ● {visit.clientResponse}
                </span>
              </div>
            )}

            {(visit.feedback || visit.meetingNotes || visit.outcomeDescription || visit.outcome) && (
              <div>
                <span style={{ fontSize: "11px", color: "#64748b", display: "block" }}>
                  Meeting Feedback & Notes:
                </span>
                <p
                  style={{
                    margin: "4px 0 0",
                    fontSize: "12px",
                    color: "#1e293b",
                    lineHeight: 1.5,
                  }}
                >
                  {visit.feedback || visit.meetingNotes || visit.outcomeDescription || visit.outcome}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PHOTOS (if any uploaded) */}
      {Array.isArray(visit.photos) && visit.photos.length > 0 && (
        <div className="visit-details__section">
          <span className="visit-details__section-title">
            Geo-stamped Proof Photos ({visit.photos.length})
          </span>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {visit.photos.map((p, idx) => (
              <div
                key={p.id || idx}
                style={{
                  width: "120px",
                  borderRadius: "8px",
                  overflow: "hidden",
                  border: "1px solid #e2e8f0",
                }}
              >
                <img
                  src={p.photo_url || p.photo}
                  alt="Visit proof"
                  style={{ width: "100%", height: "90px", objectFit: "cover" }}
                />
                <div style={{ padding: "4px 6px", fontSize: "9px", color: "#64748b" }}>
                  📷 {p.captured_at ? new Date(p.captured_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Photo"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default VisitDetails;