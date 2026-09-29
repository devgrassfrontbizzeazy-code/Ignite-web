import {
  CheckCircle2,
  MapPin,
  Navigation,
  Target,
} from "lucide-react";
import "./VisitCheckIn.css";

const VisitCheckIn = ({ visit }) => {
  const withinRadius = visit.distance <= 100;

  return (
    <div className="visit-checkin">
      <div className="visit-checkin__lead">
        <div className="visit-checkin__lead-icon">
          <MapPin size={19} />
        </div>

        <div>
          <span>CHECK-IN VISIT</span>
          <h3>{visit.companyName}</h3>
          <p>{visit.location}</p>
        </div>
      </div>

      <div className="visit-checkin__location-card">
        <div className="visit-checkin__location-header">
          <div>
            <span className="visit-checkin__label">
              Your current location
            </span>
            <strong>
              {visit.currentLatitude}° N
            </strong>
          </div>

          <Navigation size={20} />
        </div>

        <div className="visit-checkin__metrics">
          <div>
            <small>Distance</small>
            <strong>{visit.distance} m</strong>
          </div>

          <div>
            <small>GPS Accuracy</small>
            <strong>
              ±{visit.gpsAccuracy} m
            </strong>
          </div>

          <div>
            <small>Radius</small>
            <strong>100 m</strong>
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
            <CheckCircle2 size={18} />
          ) : (
            <Target size={18} />
          )}
        </div>

        <div>
          <strong>
            {withinRadius
              ? "Within visit radius"
              : "Outside visit radius"}
          </strong>

          <p>
            {withinRadius
              ? "You can check in at this location."
              : "Move within 100m of the lead to check in."}
          </p>
        </div>
      </div>
    </div>
  );
};

export default VisitCheckIn;