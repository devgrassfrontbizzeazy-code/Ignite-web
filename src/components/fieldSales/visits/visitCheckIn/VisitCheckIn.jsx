import { useState } from "react";
import { CheckCircle2, MapPin, Navigation, Target, ShieldCheck, AlertTriangle, AlertCircle, FileText } from "lucide-react";
import Button from "../../../common/Button/Button";
import "./VisitCheckIn.css";

const VisitCheckIn = ({
  visit,
  onCheckIn,
  loading = false,
}) => {
  const distance = visit?.distance != null ? visit.distance : 50;
  // Standard geo-fence threshold
  const withinRadius = distance <= 250;

  // Auto-open override inputs if outside radius
  const [showOverride, setShowOverride] = useState(!withinRadius);
  const [overrideReason, setOverrideReason] = useState("Client Pin Inaccurate");
  const [overrideNotes, setOverrideNotes] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  if (!visit) return null;

  const handleStandardCheckIn = () => {
    setErrorMsg("");
    onCheckIn?.({
      is_location_overridden: false,
    });
  };

  const handleOverrideCheckIn = () => {
    const trimmed = overrideNotes.trim();
    if (trimmed.length < 10) {
      setErrorMsg("Please provide at least 10 letters explaining the reason.");
      return;
    }
    setErrorMsg("");
    onCheckIn?.({
      is_location_overridden: true,
      override_reason: overrideReason,
      override_notes: trimmed,
    });
  };

  return (
    <div className="visit-checkin">
      <div className="visit-checkin__lead">
        <div className="visit-checkin__lead-icon">
          <MapPin size={20} />
        </div>

        <div>
          <span>ON-SITE GPS VERIFICATION</span>
          <h3>{visit.companyName || "Client"}</h3>
          <p>{visit.location || "Client address"}</p>
        </div>
      </div>

      <div className="visit-checkin__location-card">
        <div className="visit-checkin__location-header">
          <div>
            <span className="visit-checkin__label">Client Destination</span>
            <strong>
              {visit.leadLatitude ? `${Number(visit.leadLatitude).toFixed(5)}°, ${Number(visit.leadLongitude).toFixed(5)}°` : "Coordinates Recorded"}
            </strong>
          </div>
          <Navigation size={20} />
        </div>

        <div className="visit-checkin__metrics">
          <div>
            <small>Live Distance</small>
            <strong style={{ color: withinRadius ? "#059669" : "#dc2626" }}>
              {distance} meters
            </strong>
          </div>

          <div>
            <small>GPS Accuracy</small>
            <strong>±{visit.gpsAccuracy || 8} m</strong>
          </div>

          <div>
            <small>Allowed Radius</small>
            <strong>250 m</strong>
          </div>
        </div>
      </div>

      <div
        className={`visit-checkin__radius ${
          withinRadius
            ? "visit-checkin__radius--valid"
            : "visit-checkin__radius--invalid"
        }`}
      >
        <div className="visit-checkin__radius-icon">
          {withinRadius ? (
            <ShieldCheck size={20} color="#059669" />
          ) : (
            <AlertTriangle size={20} color="#dc2626" />
          )}
        </div>

        <div>
          <strong>
            {withinRadius
              ? "✓ You are at the client location"
              : "Outside client geo-fence"}
          </strong>

          <p>
            {withinRadius
              ? "GPS verified. You can now check in to begin the field visit."
              : `Current distance is ${distance}m away from client pin. Please fill the reason below to check in.`}
          </p>
        </div>
      </div>

      {/* OVERRIDE FORM */}
      {!withinRadius && (
        <div className="visit-checkin__override-container">
          <div className="visit-checkin__override-header">
            <div className="visit-checkin__override-title">
              <AlertCircle size={16} color="#d97706" />
              <strong>
                Location Mismatch? Check in with Reason
              </strong>
            </div>
            <button
              type="button"
              onClick={() => setShowOverride(!showOverride)}
              className="visit-checkin__override-toggle"
            >
              {showOverride ? "Collapse" : "Expand"}
            </button>
          </div>

          {showOverride && (
            <div style={{ marginTop: "10px" }}>
              <div className="visit-checkin__override-notice">
                📍 <strong>Live location note:</strong> Your current check-in GPS coordinates and distance from the lead ({distance} meters away) will be permanently recorded in the database and shown to your manager.
              </div>

              <div className="visit-checkin__field-group">
                <label className="visit-checkin__field-label">
                  Select Reason Category <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <select
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  className="visit-checkin__field-select"
                >
                  <option value="Client Pin Inaccurate">Client GPS pin inaccurate / wrong address pin</option>
                  <option value="Client Relocated/Shifted">Client shifted or meeting at alternate location</option>
                  <option value="GPS Signal Drift">High-rise building / poor GPS signal drift</option>
                  <option value="Meeting Outside Office">Meeting client nearby (Cafe, Site, etc.)</option>
                  <option value="Other">Other Reason</option>
                </select>
              </div>

              <div className="visit-checkin__field-group">
                <label className="visit-checkin__field-label">
                  Description / Explanation <span style={{ color: "#dc2626" }}>* (Min. 10 letters)</span>
                </label>
                <textarea
                  value={overrideNotes}
                  onChange={(e) => {
                    setOverrideNotes(e.target.value);
                    if (e.target.value.trim().length >= 10) setErrorMsg("");
                  }}
                  placeholder="Explain why you are checking in away from the client pin (e.g. Client requested meeting at nearby coffee shop / Ground floor lobby)..."
                  rows={3}
                  className={`visit-checkin__field-textarea ${errorMsg ? "visit-checkin__field-textarea--error" : ""}`}
                />
                <div className="visit-checkin__field-meta">
                  {errorMsg ? (
                    <span style={{ color: "#dc2626", fontSize: "11px", fontWeight: "600" }}>
                      {errorMsg}
                    </span>
                  ) : (
                    <span style={{ color: overrideNotes.trim().length >= 10 ? "#059669" : "#64748b", fontSize: "11px" }}>
                      {overrideNotes.trim().length >= 10 ? "✓ Minimum length reached" : `Minimum 10 characters required (${overrideNotes.trim().length}/10)`}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="visit-checkin__actions">
        {withinRadius ? (
          <Button
            variant="primary"
            disabled={loading}
            onClick={handleStandardCheckIn}
            className="visit-checkin__submit-btn"
          >
            {loading ? "Checking in..." : "CHECK IN [RECORD VISIT TIME]"}
          </Button>
        ) : (
          <Button
            variant="primary"
            disabled={loading || overrideNotes.trim().length < 10}
            onClick={handleOverrideCheckIn}
            className="visit-checkin__submit-btn"
            style={{
              background: overrideNotes.trim().length < 10 ? "#94a3b8" : "#d97706",
              borderColor: overrideNotes.trim().length < 10 ? "#94a3b8" : "#b45309",
              cursor: overrideNotes.trim().length < 10 ? "not-allowed" : "pointer",
            }}
          >
            {loading
              ? "Submitting..."
              : overrideNotes.trim().length < 10
              ? "ENTER REASON (MIN 10 CHARS) TO CHECK IN"
              : "CHECK IN WITH REASON (OVERRIDE)"}
          </Button>
        )}
      </div>
    </div>
  );
};

export default VisitCheckIn;