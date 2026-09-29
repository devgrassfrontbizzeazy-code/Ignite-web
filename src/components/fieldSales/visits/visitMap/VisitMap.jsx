import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import {
  Building2,
  Clock3,
  Crosshair,
  MapPin,
  Navigation,
  UserRound,
  X,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

import "./VisitMap.css";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) {
    return null;
  }

  const earthRadius = 6371000;
  const toRadians = (value) => (value * Math.PI) / 180;

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(earthRadius * c);
};

const formatDistance = (meters) => {
  if (meters == null) return "—";
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
  return `${meters} m`;
};

const getVisitStatusLabel = (status) => {
  if (!status) return "—";
  const labels = {
    NOT_STARTED: "Scheduled",
    CHECKED_IN: "In Progress",
    CHECKED_OUT: "Completed",
  };
  return labels[status] || status;
};

const CHECKIN_RADIUS_METERS = 100;

/* -------------------------------------------------------------------------- */
/* Leaflet Icon Factory                                                        */
/* -------------------------------------------------------------------------- */
/* Leaflet's default icons break in Vite because it expects the images to be   */
/* served from a specific path. We create custom DivIcon markers using inline  */
/* SVG rendered from Lucide icon paths, ensuring they always render correctly. */
/* -------------------------------------------------------------------------- */

const createSvgIcon = (svgContent, bgColor, borderColor = "#fff", size = 36) => {
  return L.divIcon({
    className: "visits-map__leaflet-icon",
    html: `
      <div class="visits-map__marker-pin" style="
        width: ${size}px;
        height: ${size}px;
        background: ${bgColor};
        border: 2px solid ${borderColor};
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(15,61,62,0.22);
      ">
        ${svgContent}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2 + 4)],
  });
};

// Lucide MapPin SVG path (for leads)
const LEAD_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>`;

// Lucide UserRound SVG path (for employees)
const EMPLOYEE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/></svg>`;

// Lucide Navigation SVG (for current user)
const NAV_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>`;

// Deep teal #0F3D3E  —  for leads
const LEAD_COLOR = "#0F3D3E";
// Emerald #0BA37F    —  for employees
const EMPLOYEE_COLOR = "#0BA37F";
// Gold  #D4AF37      —  for selected
const SELECTED_COLOR = "#D4AF37";
// Blue                —  for current user
const USER_COLOR = "#2563eb";

const leadIcon = createSvgIcon(LEAD_SVG, LEAD_COLOR);
const leadIconSelected = createSvgIcon(LEAD_SVG, LEAD_COLOR, SELECTED_COLOR, 42);
const employeeIcon = createSvgIcon(EMPLOYEE_SVG, EMPLOYEE_COLOR);
const employeeIconSelected = createSvgIcon(EMPLOYEE_SVG, EMPLOYEE_COLOR, SELECTED_COLOR, 42);
const userIcon = createSvgIcon(NAV_SVG, USER_COLOR, "#fff", 32);

/* -------------------------------------------------------------------------- */
/* Map Auto-Fit Component                                                      */
/* -------------------------------------------------------------------------- */

const MapBoundsUpdater = ({ points, selectedPosition }) => {
  const map = useMap();
  const hasFitRef = useRef(false);

  // Fit bounds once on mount or when points change
  useEffect(() => {
    if (!points.length) return;

    const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng]));

    if (bounds.isValid()) {
      map.fitBounds(bounds, {
        padding: [50, 50],
        maxZoom: 16,
        animate: hasFitRef.current,
      });
      hasFitRef.current = true;
    }
  }, [points, map]);

  // Pan to selected entity
  useEffect(() => {
    if (selectedPosition) {
      map.panTo(selectedPosition, { animate: true });
    }
  }, [selectedPosition, map]);

  return null;
};

/* -------------------------------------------------------------------------- */
/* Locate Me Control                                                           */
/* -------------------------------------------------------------------------- */

const LocateMeControl = ({ currentUserLocation, onLocateRequest }) => {
  const map = useMap();

  const handleClick = () => {
    if (currentUserLocation) {
      map.setView(
        [currentUserLocation.latitude, currentUserLocation.longitude],
        17,
        { animate: true }
      );
    }
    onLocateRequest?.();
  };

  return (
    <div className="visits-map__toolbar">
      <div className="visits-map__live">
        <span className="visits-map__live-dot" aria-hidden="true" />
        <span>Live field activity</span>
      </div>

      <button type="button" className="visits-map__locate" onClick={handleClick}>
        <Crosshair size={15} />
        <span>My location</span>
      </button>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Lead Popup Content                                                          */
/* -------------------------------------------------------------------------- */

const LeadPopupContent = ({
  lead,
  visit,
  currentUserLocation,
  onClose,
  onViewVisit,
}) => {
  const distance =
    currentUserLocation && lead.latitude != null && lead.longitude != null
      ? calculateDistance(
          currentUserLocation.latitude,
          currentUserLocation.longitude,
          lead.latitude,
          lead.longitude
        )
      : null;

  const withinRadius = distance != null && distance <= CHECKIN_RADIUS_METERS;

  return (
    <div className="visits-map__popup-inner">
      <div className="visits-map__popup-header">
        <div>
          <span className="visits-map__popup-badge visits-map__popup-badge--lead">
            Lead
          </span>
          <h4>{lead.name}</h4>
        </div>
        <button
          type="button"
          className="visits-map__popup-close"
          onClick={onClose}
          aria-label="Close lead details"
        >
          <X size={14} />
        </button>
      </div>

      <div className="visits-map__popup-content">
        <div className="visits-map__info-row">
          <Building2 size={14} />
          <span>{lead.companyName || "—"}</span>
        </div>

        <div className="visits-map__info-row">
          <MapPin size={14} />
          <span>{lead.address || "—"}</span>
        </div>

        <div className="visits-map__info-row">
          <UserRound size={14} />
          <span>{lead.assignedEmployeeName || "Not assigned"}</span>
        </div>

        <div className="visits-map__info-row">
          <Clock3 size={14} />
          <span>
            {visit
              ? getVisitStatusLabel(visit.visitStatus)
              : "No visit scheduled"}
          </span>
        </div>

        {(lead.scheduledVisitTime || visit?.scheduledTime) && (
          <div className="visits-map__info-row">
            <Clock3 size={14} />
            <span>
              Scheduled: {lead.scheduledVisitTime || visit?.scheduledTime}
            </span>
          </div>
        )}

        <div className="visits-map__info-row">
          <Navigation size={14} />
          <span>
            {distance != null
              ? `Distance: ${formatDistance(distance)}`
              : "Distance unavailable"}
          </span>
        </div>

        {distance != null && (
          <div
            className={`visits-map__radius-badge ${
              withinRadius
                ? "visits-map__radius-badge--within"
                : "visits-map__radius-badge--outside"
            }`}
          >
            {withinRadius ? (
              <>
                <CheckCircle2 size={13} />
                <span>Within {CHECKIN_RADIUS_METERS}m radius</span>
              </>
            ) : (
              <>
                <AlertCircle size={13} />
                <span>Not within {CHECKIN_RADIUS_METERS}m radius</span>
              </>
            )}
          </div>
        )}
      </div>

      {visit && (
        <button
          type="button"
          className="visits-map__popup-action"
          onClick={() => onViewVisit?.(visit)}
        >
          View Visit
        </button>
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Employee Popup Content                                                      */
/* -------------------------------------------------------------------------- */

const EmployeePopupContent = ({
  employee,
  currentVisit,
  visitCount,
  onClose,
}) => {
  return (
    <div className="visits-map__popup-inner">
      <div className="visits-map__popup-header">
        <div>
          <span className="visits-map__popup-badge visits-map__popup-badge--employee">
            Member
          </span>
          <h4>{employee.name}</h4>
        </div>
        <button
          type="button"
          className="visits-map__popup-close"
          onClick={onClose}
          aria-label="Close employee details"
        >
          <X size={14} />
        </button>
      </div>

      <div className="visits-map__popup-content">
        <div className="visits-map__info-row">
          <span className="visits-map__status-pill">
            {employee.status || "ACTIVE"}
          </span>
        </div>

        <div className="visits-map__info-row">
          <MapPin size={14} />
          <span>
            {employee.latitude != null && employee.longitude != null
              ? `${employee.latitude.toFixed(4)}, ${employee.longitude.toFixed(4)}`
              : "Location unavailable"}
          </span>
        </div>

        <div className="visits-map__info-row">
          <Navigation size={14} />
          <span>
            {employee.accuracy != null
              ? `GPS accuracy ±${employee.accuracy}m`
              : "GPS accuracy —"}
          </span>
        </div>

        <div className="visits-map__info-row">
          <Clock3 size={14} />
          <span>{employee.lastUpdated || "—"}</span>
        </div>

        <div className="visits-map__info-row">
          <Building2 size={14} />
          <span>
            {currentVisit
              ? currentVisit.companyName || currentVisit.leadName
              : "No current assignment"}
          </span>
        </div>

        <div className="visits-map__info-row">
          <UserRound size={14} />
          <span>Today's visits: {visitCount || "—"}</span>
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* GPS Status Banner                                                           */
/* -------------------------------------------------------------------------- */

const GpsStatusBanner = ({ status, accuracy }) => {
  if (status === "success" && accuracy != null) {
    return (
      <div className="visits-map__location-info">
        <Navigation size={14} />
        <span>GPS ±{accuracy}m</span>
      </div>
    );
  }

  if (status === "denied") {
    return (
      <div className="visits-map__location-info visits-map__location-info--warn">
        <AlertCircle size={14} />
        <span>Location access denied</span>
      </div>
    );
  }

  if (status === "unavailable") {
    return (
      <div className="visits-map__location-info visits-map__location-info--warn">
        <AlertCircle size={14} />
        <span>Unable to determine your location</span>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="visits-map__location-info">
        <Navigation size={14} />
        <span>Getting your location…</span>
      </div>
    );
  }

  return null;
};

/* -------------------------------------------------------------------------- */
/* VisitMap                                                                     */
/* -------------------------------------------------------------------------- */

const VisitMap = ({
  visits = [],
  leads = [],
  employees = [],
  currentUserLocation,
  selectedEntity,
  onSelectEntity,
  onSelectVisit,
  gpsStatus = "success",
  onLocateRequest,
}) => {
  const mapRef = useRef(null);

  /* ------------------------------------------------------------------------ */
  /* Selection                                                                 */
  /* ------------------------------------------------------------------------ */

  const selectedLead =
    selectedEntity?.type === "lead"
      ? leads.find((l) => l.id === selectedEntity.id) || null
      : null;

  const selectedEmployee =
    selectedEntity?.type === "employee"
      ? employees.find((e) => e.id === selectedEntity.id) || null
      : null;

  const selectedLeadVisit = selectedLead
    ? visits.find((v) => v.leadId === selectedLead.id) || null
    : null;

  const employeeVisits = selectedEmployee
    ? visits.filter((v) => v.employeeId === selectedEmployee.id)
    : [];

  const selectedEmployeeVisit =
    employeeVisits.length > 0 ? employeeVisits[0] : null;

  /* ------------------------------------------------------------------------ */
  /* Map bounds                                                                */
  /* ------------------------------------------------------------------------ */

  const allPoints = useMemo(() => {
    const pts = [];

    leads.forEach((lead) => {
      if (lead.latitude != null && lead.longitude != null) {
        pts.push({ lat: lead.latitude, lng: lead.longitude });
      }
    });

    employees.forEach((emp) => {
      if (emp.latitude != null && emp.longitude != null) {
        pts.push({ lat: emp.latitude, lng: emp.longitude });
      }
    });

    if (currentUserLocation?.latitude != null && currentUserLocation?.longitude != null) {
      pts.push({
        lat: currentUserLocation.latitude,
        lng: currentUserLocation.longitude,
      });
    }

    return pts;
  }, [leads, employees, currentUserLocation]);

  const defaultCenter = useMemo(() => {
    if (currentUserLocation?.latitude != null && currentUserLocation?.longitude != null) {
      return [currentUserLocation.latitude, currentUserLocation.longitude];
    }
    if (allPoints.length > 0) {
      return [allPoints[0].lat, allPoints[0].lng];
    }
    // Fallback: Gurugram
    return [28.4595, 77.0266];
  }, [currentUserLocation, allPoints]);

  const selectedPosition = useMemo(() => {
    if (selectedLead?.latitude != null && selectedLead?.longitude != null) {
      return [selectedLead.latitude, selectedLead.longitude];
    }
    if (selectedEmployee?.latitude != null && selectedEmployee?.longitude != null) {
      return [selectedEmployee.latitude, selectedEmployee.longitude];
    }
    return null;
  }, [selectedLead, selectedEmployee]);

  /* ------------------------------------------------------------------------ */
  /* Handlers                                                                  */
  /* ------------------------------------------------------------------------ */

  const handleClosePopup = useCallback(() => {
    onSelectEntity?.(null);
  }, [onSelectEntity]);

  /* ------------------------------------------------------------------------ */
  /* Render                                                                    */
  /* ------------------------------------------------------------------------ */

  return (
    <div className="visits-map">
      <MapContainer
        ref={mapRef}
        center={defaultCenter}
        zoom={14}
        scrollWheelZoom={true}
        className="visits-map__container"
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Auto-fit / pan controls */}
        <MapBoundsUpdater
          points={allPoints}
          selectedPosition={selectedPosition}
        />

        {/* Toolbar overlay */}
        <LocateMeControl
          currentUserLocation={currentUserLocation}
          onLocateRequest={onLocateRequest}
        />

        {/* Current user marker */}
        {currentUserLocation?.latitude != null &&
          currentUserLocation?.longitude != null && (
            <Marker
              position={[
                currentUserLocation.latitude,
                currentUserLocation.longitude,
              ]}
              icon={userIcon}
              zIndexOffset={500}
            >
              <Popup closeButton={false} className="visits-map__leaflet-popup">
                <div className="visits-map__you-popup">
                  <strong>You</strong>
                  {currentUserLocation.accuracy != null && (
                    <span>GPS ±{currentUserLocation.accuracy}m</span>
                  )}
                </div>
              </Popup>
            </Marker>
          )}

        {/* Lead markers */}
        {leads.map((lead) => {
          if (lead.latitude == null || lead.longitude == null) return null;
          const isSelected =
            selectedEntity?.type === "lead" && selectedEntity.id === lead.id;

          return (
            <Marker
              key={lead.id}
              position={[lead.latitude, lead.longitude]}
              icon={isSelected ? leadIconSelected : leadIcon}
              zIndexOffset={isSelected ? 600 : 100}
              eventHandlers={{
                click: () =>
                  onSelectEntity?.({ type: "lead", id: lead.id }),
              }}
            >
              <Popup
                className="visits-map__leaflet-popup"
                closeButton={false}
                maxWidth={280}
              >
                <LeadPopupContent
                  lead={lead}
                  visit={
                    visits.find((v) => v.leadId === lead.id) || null
                  }
                  currentUserLocation={currentUserLocation}
                  onClose={handleClosePopup}
                  onViewVisit={onSelectVisit}
                />
              </Popup>
            </Marker>
          );
        })}

        {/* 100m radius circle around selected lead */}
        {selectedLead?.latitude != null && selectedLead?.longitude != null && (
          <Circle
            center={[selectedLead.latitude, selectedLead.longitude]}
            radius={CHECKIN_RADIUS_METERS}
            pathOptions={{
              color: "#0BA37F",
              fillColor: "#0BA37F",
              fillOpacity: 0.08,
              weight: 1.5,
              dashArray: "6 4",
            }}
          />
        )}

        {/* Employee markers */}
        {employees.map((emp) => {
          if (emp.latitude == null || emp.longitude == null) return null;
          const isSelected =
            selectedEntity?.type === "employee" && selectedEntity.id === emp.id;

          return (
            <Marker
              key={emp.id}
              position={[emp.latitude, emp.longitude]}
              icon={isSelected ? employeeIconSelected : employeeIcon}
              zIndexOffset={isSelected ? 600 : 200}
              eventHandlers={{
                click: () =>
                  onSelectEntity?.({ type: "employee", id: emp.id }),
              }}
            >
              <Popup
                className="visits-map__leaflet-popup"
                closeButton={false}
                maxWidth={280}
              >
                <EmployeePopupContent
                  employee={emp}
                  currentVisit={
                    visits.find((v) => v.employeeId === emp.id) || null
                  }
                  visitCount={
                    visits.filter((v) => v.employeeId === emp.id).length
                  }
                  onClose={handleClosePopup}
                />
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Legend */}
      <div className="visits-map__legend">
        <div className="visits-map__legend-item">
          <span
            className="visits-map__legend-swatch visits-map__legend-swatch--lead"
            aria-hidden="true"
          />
          Leads
        </div>

        <div className="visits-map__legend-item">
          <span
            className="visits-map__legend-swatch visits-map__legend-swatch--employee"
            aria-hidden="true"
          />
          Field Members
        </div>
      </div>

      {/* Activity panel */}
      <div className="visits-map__activity">
        <div className="visits-map__activity-header">
          <div>
            <span className="visits-map__activity-eyebrow">FIELD ACTIVITY</span>
            <strong>Today's team</strong>
          </div>
          <UserRound size={17} />
        </div>

        {visits.length > 0 ? (
          visits.slice(0, 3).map((visit) => (
            <button
              key={visit.id}
              type="button"
              className="visits-map__activity-row"
              onClick={() => onSelectVisit?.(visit)}
            >
              <span className="visits-map__activity-avatar">
                {visit.employeeName
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")}
              </span>

              <span className="visits-map__activity-info">
                <strong>{visit.employeeName}</strong>
                <small>{visit.companyName}</small>
              </span>

              <span
                className={`visits-map__activity-status visits-map__activity-status--${visit.visitStatus.toLowerCase()}`}
              />
            </button>
          ))
        ) : (
          <div className="visits-map__activity-empty">No recent activity</div>
        )}
      </div>

      {/* GPS accuracy/status */}
      <GpsStatusBanner
        status={gpsStatus}
        accuracy={currentUserLocation?.accuracy}
      />
    </div>
  );
};

export default VisitMap;