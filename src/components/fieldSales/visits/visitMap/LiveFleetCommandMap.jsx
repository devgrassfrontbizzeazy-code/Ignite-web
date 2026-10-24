import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  Search,
  User,
  MapPin,
  Navigation,
  CheckCircle2,
  Clock,
  Layers,
  Crosshair,
  AlertTriangle,
  ChevronRight,
  Battery,
  Footprints,
  Phone,
  ExternalLink,
  Calendar,
  ChevronLeft,
  TrendingUp,
} from "lucide-react";
import {
  useJsApiLoader,
  GoogleMap,
  MarkerF,
  InfoWindowF,
  PolylineF,
  DirectionsRenderer,
} from "@react-google-maps/api";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import "./LiveFleetCommandMap.css";

/* -------------------------------------------------------------------------- */
/* Free Client-Side Haversine Math (Zero API Tokens, $0 Cost)                 */
/* -------------------------------------------------------------------------- */
function calculateDistance(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const R = 6371000;
  const toRad = (v) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a)));
  return Math.round(R * c);
}

function formatKm(meters) {
  if (meters == null) return "—";
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
  return `${meters} m`;
}

function estimateEtaMins(meters) {
  if (meters == null) return "—";
  // Avg urban field travel speed ~ 25 km/h -> 1 km takes ~ 2.4 mins
  const mins = Math.max(2, Math.round((meters / 1000) * 2.5));
  return `${mins} mins`;
}

export function formatPingTimestamp(isoOrFormatted) {
  if (!isoOrFormatted) return "Earlier";
  try {
    const d = new Date(isoOrFormatted);
    if (!isNaN(d.getTime())) {
      const timeStr = d.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });
      const dateStr = d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      return `${timeStr}, ${dateStr}`;
    }
  } catch {
    // fallback
  }
  return isoOrFormatted;
}

export function formatLastSeenAgo(isoString, fallbackHuman) {
  if (!isoString) return fallbackHuman || "offline";
  try {
    const d = new Date(isoString);
    if (!isNaN(d.getTime())) {
      const diffSecs = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000));
      if (diffSecs < 60) return `${Math.max(1, diffSecs)}s ago`;
      if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)}m ago`;
      if (diffSecs < 86400) {
        const hours = Math.floor(diffSecs / 3600);
        const mins = Math.floor((diffSecs % 3600) / 60);
        return mins > 0 ? `${hours}h ${mins}m ago` : `${hours}h ago`;
      }
      return `${Math.floor(diffSecs / 86400)}d ago`;
    }
  } catch {
    // fallback
  }
  return fallbackHuman || "offline";
}

/* -------------------------------------------------------------------------- */
/* Real Road Routing Fallback via OSRM (100% Free Road Geometry)              */
/* -------------------------------------------------------------------------- */
async function fetchOsrmRoute(originLat, originLng, destLat, destLng) {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${originLng},${originLat};${destLng},${destLat}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.code === "Ok" && data.routes?.[0]) {
      const route = data.routes[0];
      const coords = route.geometry.coordinates.map(([lng, lat]) => ({
        lat: Number(lat),
        lng: Number(lng),
      }));
      const distKm = (route.distance / 1000).toFixed(1) + " km";
      const durMins = Math.max(1, Math.round(route.duration / 60)) + " mins";
      return { coords, distanceText: distKm, durationText: durMins };
    }
  } catch (err) {
    console.warn("OSRM road fallback warning:", err);
  }
  return null;
}

// Leaflet Pan Component
function LeafletMapController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] != null && center[1] != null) {
      map.panTo(center, { animate: true, duration: 0.8 });
      if (zoom) map.setZoom(zoom);
    }
  }, [center, zoom, map]);
  return null;
}

// Custom Leaflet Icons
const createLeafletRepIcon = (initials, isActive) => {
  return L.divIcon({
    className: "fleet-custom-icon",
    html: `
      <div class="fleet-marker-rep ${isActive ? "active" : "inactive"}">
        <span class="fleet-marker-rep__badge">${initials}</span>
        ${isActive ? '<span class="fleet-marker-rep__pulse"></span>' : ""}
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  });
};

const createLeafletLeadIcon = (isCompleted, isSelected) => {
  return L.divIcon({
    className: "fleet-custom-icon",
    html: `
      <div class="fleet-marker-lead ${isCompleted ? "completed" : "pending"} ${isSelected ? "selected" : ""}">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          ${
            isCompleted
              ? '<polyline points="20 6 9 17 4 12"></polyline>'
              : '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle>'
          }
        </svg>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  });
};

function createLeafletCheckpointIcon(label, isFinalized = false) {
  const bg = label === "IN" ? "#10b981" : isFinalized ? "#ef4444" : "#3b82f6";
  return L.divIcon({
    className: "fleet-custom-marker",
    html: `<div style="background:${bg};color:#fff;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3);">${label}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

const GOOGLE_MAPS_LIBRARIES = ["places", "geometry"];

const mapContainerStyle = {
  width: "100%",
  height: "100%",
};

const defaultCenter = { lat: 18.5204, lng: 73.8567 }; // Pune default

export default function LiveFleetCommandMap({
  visits = [],
  leads = [],
  employees = [],
  currentUserLocation,
  selectedEntity,
  onSelectEntity,
  onSelectVisit,
  gpsStatus = "success",
  timelinePoints = [],
  availableDays = [],
  selectedRouteDate = "",
  onSelectRouteDate = () => {},
  selectedRouteMonth = "",
  selectedRouteYear = "",
  onChangeRouteMonth = () => {},
  routeSummary = null,
  isManager = true,
}) {
  const googleApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
  const { isLoaded: isGoogleLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: googleApiKey,
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState("all"); // 'all' | 'active'
  const [selectedRepId, setSelectedRepId] = useState(null);
  const [focusedLead, setFocusedLead] = useState(null);
  const [infoWindowTarget, setInfoWindowTarget] = useState(null); // { type, data, lat, lng }

  // Road Routing States (DirectionsService & OSRM)
  const [directionsResult, setDirectionsResult] = useState(null);
  const [osrmRoadCoords, setOsrmRoadCoords] = useState(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [routeStats, setRouteStats] = useState(null); // { distanceText, durationText }

  const currentMonth = Number(routeSummary?.month || (new Date().getMonth() + 1));
  const currentYear = Number(routeSummary?.year || new Date().getFullYear());

  const handlePrevMonth = () => {
    let m = currentMonth - 1;
    let y = currentYear;
    if (m < 1) {
      m = 12;
      y -= 1;
    }
    onChangeRouteMonth(m, y);
  };

  const handleNextMonth = () => {
    let m = currentMonth + 1;
    let y = currentYear;
    if (m > 12) {
      m = 1;
      y += 1;
    }
    onChangeRouteMonth(m, y);
  };

  const googleMapRef = useRef(null);
  const lastRouteKeyRef = useRef("");
  const isRoutingRef = useRef(false);

  // Sync external selectedEntity with selectedRepId
  useEffect(() => {
    if (selectedEntity?.type === "employee") {
      setSelectedRepId(String(selectedEntity.id));
    }
  }, [selectedEntity]);

  // Selected Employee object
  const selectedEmployee = useMemo(() => {
    if (!selectedRepId) return null;
    return employees.find((e) => String(e.id) === String(selectedRepId)) || null;
  }, [employees, selectedRepId]);

  // Parse 5-day route waypoints into coordinates array
  const historyRouteCoords = useMemo(() => {
    if (!timelinePoints || !timelinePoints.length) return [];
    return timelinePoints
      .map((pt, idx) => {
        const lat = Number(pt.latitude);
        const lng = Number(pt.longitude);
        if (isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) return null;
        return {
          lat,
          lng,
          timestamp: pt.timestamp,
          speed: pt.speed,
          battery: pt.battery_percentage,
          accuracy: pt.accuracy,
          logType: pt.log_type,
          index: idx,
        };
      })
      .filter(Boolean);
  }, [timelinePoints]);

  // Fit bounds when employee 5-day route changes
  useEffect(() => {
    if (historyRouteCoords.length > 0 && googleMapRef.current && window.google?.maps?.LatLngBounds) {
      if (historyRouteCoords.length === 1) {
        googleMapRef.current.panTo({
          lat: historyRouteCoords[0].lat,
          lng: historyRouteCoords[0].lng,
        });
        googleMapRef.current.setZoom(15);
      } else {
        const bounds = new window.google.maps.LatLngBounds();
        historyRouteCoords.forEach((pt) => {
          bounds.extend({ lat: pt.lat, lng: pt.lng });
        });
        googleMapRef.current.fitBounds(bounds, {
          top: 90,
          right: 70,
          bottom: 70,
          left: 70,
        });
      }
    }
  }, [historyRouteCoords]);

  // Real Road Route calculation (Zero loop, memoized by rep & lead coordinates)
  useEffect(() => {
    if (!selectedEmployee || !focusedLead) {
      setDirectionsResult(null);
      setOsrmRoadCoords(null);
      setRouteStats(null);
      setIsCalculatingRoute(false);
      lastRouteKeyRef.current = "";
      return;
    }

    const originLat = Number(selectedEmployee.latitude);
    const originLng = Number(selectedEmployee.longitude);
    const destLat = Number(focusedLead.leadLatitude ?? focusedLead.latitude);
    const destLng = Number(focusedLead.leadLongitude ?? focusedLead.longitude);

    if (
      isNaN(originLat) ||
      isNaN(originLng) ||
      isNaN(destLat) ||
      isNaN(destLng)
    ) {
      setDirectionsResult(null);
      setOsrmRoadCoords(null);
      setRouteStats(null);
      setIsCalculatingRoute(false);
      return;
    }

    // Stable route key (rounds to 4 decimals ~11m to prevent re-calculating on micro-jitter)
    const routeKey = `${selectedEmployee.id}_${originLat.toFixed(4)}_${originLng.toFixed(4)}_to_${focusedLead.id}_${destLat.toFixed(4)}_${destLng.toFixed(4)}`;

    if (lastRouteKeyRef.current === routeKey || isRoutingRef.current) {
      return;
    }

    lastRouteKeyRef.current = routeKey;
    isRoutingRef.current = true;
    setIsCalculatingRoute(true);

    const fitRouteBounds = () => {
      if (googleMapRef.current && window.google?.maps?.LatLngBounds) {
        const bounds = new window.google.maps.LatLngBounds();
        bounds.extend({ lat: originLat, lng: originLng });
        bounds.extend({ lat: destLat, lng: destLng });
        googleMapRef.current.fitBounds(bounds, {
          top: 60,
          right: 60,
          bottom: 60,
          left: 60,
        });
      }
    };

    // 1. Try Google DirectionsService first if Maps JS API is loaded
    if (isGoogleLoaded && window.google?.maps?.DirectionsService) {
      const directionsService = new window.google.maps.DirectionsService();
      directionsService.route(
        {
          origin: { lat: originLat, lng: originLng },
          destination: { lat: destLat, lng: destLng },
          travelMode: window.google.maps.TravelMode.DRIVING,
        },
        async (result, status) => {
          if (
            (status === window.google.maps.DirectionsStatus.OK || status === "OK") &&
            result
          ) {
            setDirectionsResult(result);
            setOsrmRoadCoords(null);
            const leg = result.routes?.[0]?.legs?.[0];
            if (leg) {
              setRouteStats({
                distanceText: leg.distance?.text || "",
                durationText: leg.duration?.text || "",
              });
            }
            fitRouteBounds();
            setIsCalculatingRoute(false);
            isRoutingRef.current = false;
          } else {
            console.warn(
              "Google DirectionsService returned:",
              status,
              "- using OSRM road geometry fallback"
            );
            // Fallback to OSRM real road coordinates
            const osrmData = await fetchOsrmRoute(originLat, originLng, destLat, destLng);
            if (osrmData) {
              setDirectionsResult(null);
              setOsrmRoadCoords(osrmData.coords);
              setRouteStats({
                distanceText: osrmData.distanceText,
                durationText: osrmData.durationText,
              });
              fitRouteBounds();
            } else {
              setDirectionsResult(null);
              setOsrmRoadCoords(null);
              setRouteStats(null);
            }
            setIsCalculatingRoute(false);
            isRoutingRef.current = false;
          }
        }
      );
    } else {
      // Leaflet fallback or Google Maps not loaded yet
      fetchOsrmRoute(originLat, originLng, destLat, destLng).then((osrmData) => {
        if (osrmData) {
          setDirectionsResult(null);
          setOsrmRoadCoords(osrmData.coords);
          setRouteStats({
            distanceText: osrmData.distanceText,
            durationText: osrmData.durationText,
          });
        }
        setIsCalculatingRoute(false);
        isRoutingRef.current = false;
      });
    }
  }, [
    selectedEmployee?.id,
    selectedEmployee?.latitude,
    selectedEmployee?.longitude,
    focusedLead?.id,
    focusedLead?.leadLatitude,
    focusedLead?.latitude,
    focusedLead?.leadLongitude,
    focusedLead?.longitude,
    isGoogleLoaded,
  ]);

  // Selected Employee's visits
  const selectedRepVisits = useMemo(() => {
    if (!selectedEmployee) return [];
    return visits.filter(
      (v) =>
        String(v.employeeId || v.assigned_to_id || v.assigned_to?.id) ===
        String(selectedEmployee.id)
    );
  }, [visits, selectedEmployee]);

  const pendingVisits = useMemo(() => {
    return selectedRepVisits.filter(
      (v) => v.visitStatus !== "COMPLETED" && v.status !== "Completed"
    );
  }, [selectedRepVisits]);

  const completedVisits = useMemo(() => {
    return selectedRepVisits.filter(
      (v) => v.visitStatus === "COMPLETED" || v.status === "Completed"
    );
  }, [selectedRepVisits]);

  // Filtered employees for left sidebar
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchSearch =
        !searchQuery.trim() ||
        emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (emp.email && emp.email.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchFilter =
        filterTab === "all" || (filterTab === "active" && Boolean(emp.isActiveTracking));

      return matchSearch && matchFilter;
    });
  }, [employees, searchQuery, filterTab]);

  const activeCount = useMemo(() => {
    return employees.filter((e) => Boolean(e.isActiveTracking)).length;
  }, [employees]);

  // Smooth pan to rep or lead
  const panToCoords = useCallback((lat, lng, zoom = 15) => {
    if (lat == null || lng == null) return;
    if (googleMapRef.current) {
      googleMapRef.current.panTo({ lat, lng });
      googleMapRef.current.setZoom(zoom);
    }
  }, []);

  const handleSelectRep = (emp) => {
    setSelectedRepId(String(emp.id));
    setFocusedLead(null);
    setDirectionsResult(null);
    setOsrmRoadCoords(null);
    setRouteStats(null);
    onSelectEntity?.({ type: "employee", id: emp.id });
    if (emp.latitude != null && emp.longitude != null) {
      panToCoords(Number(emp.latitude), Number(emp.longitude), 15);
    }
  };

  const handleFocusLead = (visit) => {
    setFocusedLead(visit);
    const vLat = visit.leadLatitude ?? visit.latitude;
    const vLng = visit.leadLongitude ?? visit.longitude;
    if (vLat != null && vLng != null) {
      setInfoWindowTarget({
        type: "lead",
        data: visit,
        lat: Number(vLat),
        lng: Number(vLng),
      });

      // Fit bounds if both rep and lead positions exist
      if (
        selectedEmployee?.latitude != null &&
        selectedEmployee?.longitude != null &&
        googleMapRef.current &&
        window.google?.maps?.LatLngBounds
      ) {
        const bounds = new window.google.maps.LatLngBounds();
        bounds.extend({
          lat: Number(selectedEmployee.latitude),
          lng: Number(selectedEmployee.longitude),
        });
        bounds.extend({ lat: Number(vLat), lng: Number(vLng) });
        googleMapRef.current.fitBounds(bounds, {
          top: 60,
          right: 60,
          bottom: 60,
          left: 60,
        });
      } else {
        panToCoords(Number(vLat), Number(vLng), 15);
      }
    }
  };

  // Compute map center
  const currentMapCenter = useMemo(() => {
    if (focusedLead) {
      const lat = focusedLead.leadLatitude ?? focusedLead.latitude;
      const lng = focusedLead.leadLongitude ?? focusedLead.longitude;
      if (lat != null && lng != null) return { lat: Number(lat), lng: Number(lng) };
    }
    if (selectedEmployee && selectedEmployee.latitude != null) {
      return {
        lat: Number(selectedEmployee.latitude),
        lng: Number(selectedEmployee.longitude),
      };
    }
    const firstActive = employees.find((e) => e.latitude != null);
    if (firstActive) {
      return { lat: Number(firstActive.latitude), lng: Number(firstActive.longitude) };
    }
    if (currentUserLocation?.latitude != null) {
      return {
        lat: Number(currentUserLocation.latitude),
        lng: Number(currentUserLocation.longitude),
      };
    }
    return defaultCenter;
  }, [focusedLead, selectedEmployee, employees, currentUserLocation]);

  return (
    <div className="live-fleet-command">
      {/* ==================================================================== */}
      {/* LEFT SIDEBAR: Sales Reps & Team Telemetry                           */}
      {/* ==================================================================== */}
      <aside className="fleet-col fleet-col--left">
        <div className="fleet-col__header">
          <div className="fleet-col__title-row">
            <h3 className="fleet-col__title">Sales Fleet</h3>
            <span className="fleet-live-pill">
              <span className="fleet-live-pill__dot" />
              {activeCount} Live
            </span>
          </div>

          <div className="fleet-search-box">
            <Search size={14} className="fleet-search-box__icon" />
            <input
              type="text"
              placeholder="Search employee..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="fleet-search-box__input"
            />
          </div>

          <div className="fleet-tabs">
            <button
              type="button"
              className={`fleet-tab ${filterTab === "all" ? "fleet-tab--active" : ""}`}
              onClick={() => setFilterTab("all")}
            >
              All ({employees.length})
            </button>
            <button
              type="button"
              className={`fleet-tab ${filterTab === "active" ? "fleet-tab--active" : ""}`}
              onClick={() => setFilterTab("active")}
            >
              Active Live ({activeCount})
            </button>
          </div>
        </div>

        <div className="fleet-emp-list">
          {filteredEmployees.length > 0 ? (
            filteredEmployees.map((emp) => {
              const isSelected = String(selectedRepId) === String(emp.id);
              const isLive = Boolean(emp.isActiveTracking);
              const initials = emp.name
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("");

              return (
                <div
                  key={emp.id}
                  className={`fleet-emp-card ${isSelected ? "fleet-emp-card--selected" : ""}`}
                  onClick={() => handleSelectRep(emp)}
                >
                  <div className="fleet-emp-card__avatar-col">
                    <div className={`fleet-avatar ${isLive ? "fleet-avatar--live" : ""}`}>
                      {initials}
                      <span
                        className={`fleet-avatar__status-dot ${isLive ? "online" : "offline"}`}
                        title={isLive ? "Tracking Active" : "Offline / Checked out"}
                      />
                    </div>
                  </div>

                  <div className="fleet-emp-card__body">
                    <div className="fleet-emp-card__top">
                      <strong className="fleet-emp-card__name">{emp.name}</strong>
                      {emp.battery_level != null && (
                        <span className="fleet-emp-card__battery">
                          <Battery size={11} /> {emp.battery_level}%
                        </span>
                      )}
                    </div>

                    <div className="fleet-emp-card__meta">
                      <span>📍 {emp.today_visits_count ?? 0} Visits</span>
                      <span className="fleet-meta-dot">•</span>
                      <span>
                        <Footprints size={12} style={{ display: "inline", marginRight: 2 }} />
                        {emp.today_distance_km ? `${emp.today_distance_km} KM` : "0.0 KM"}
                      </span>
                    </div>

                    <div className="fleet-emp-card__last-seen">
                      {isLive ? (
                        <span className="text-emerald" style={{ color: "#059669", fontWeight: 600 }}>
                          🟢 Live ({emp.active_visit_client || "In Visit"})
                        </span>
                      ) : emp.visit_stage === "CHECKED_OUT" ? (
                        <span
                          className="fleet-last-seen-checked-out"
                          style={{ color: "#d97706", fontWeight: 600 }}
                          title={`Checked out at ${emp.check_out_time_formatted || "today"} (Visit completed)`}
                        >
                          🟡 Checked Out {emp.check_out_time_formatted ? `(${emp.check_out_time_formatted})` : ""}
                        </span>
                      ) : emp.visit_stage === "NOT_CHECKED_IN" ? (
                        <span className="text-muted" style={{ color: "#64748b" }}>
                          ⚪ Scheduled (Not Checked In)
                        </span>
                      ) : emp.latitude != null ? (
                        <span
                          className="fleet-last-seen-stale"
                          title={`Recorded at ${formatPingTimestamp(emp.last_ping_at || emp.last_ping_formatted)}`}
                        >
                          ⚠️ Last Known: {formatLastSeenAgo(emp.last_ping_at, emp.last_seen_human)}
                        </span>
                      ) : (
                        <span className="text-muted">⚪ Offline (No GPS)</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="fleet-empty-state">No matching team members</div>
          )}
        </div>
      </aside>

      {/* ==================================================================== */}
      {/* CENTER: Google Map / Leaflet Fallback                                */}
      {/* ==================================================================== */}
      <main className="fleet-col fleet-col--center">
        {/* Monthly Route History & Date Picker Bar */}
        {selectedEmployee && (
          <div className="fleet-route-history-bar">
            <div className="fleet-route-history-bar__main">
              <div className="fleet-route-history-bar__rep-info">
                <Footprints size={16} className="fleet-route-icon" />
                <div className="fleet-route-text">
                  <span className="fleet-route-rep-name">{selectedEmployee.name}</span>
                  <span className="fleet-route-sub">
                    {routeSummary?.selected_date_label || (routeSummary?.date ? `Route on ${routeSummary.date}` : "Daily Travel Graph")}
                  </span>
                </div>
                {routeSummary?.is_finalized ? (
                  <span className="fleet-badge finalized" title="Route completed & raw logs compacted (Lifetime stored)">
                    ✓ Finalized
                  </span>
                ) : (
                  <span className="fleet-badge active" title="Active workday session in progress">
                    ● Active Today
                  </span>
                )}
              </div>

              {/* Day Metrics */}
              <div className="fleet-route-metrics">
                <div className="fleet-metric-item">
                  <span className="fleet-metric-label">Day Distance</span>
                  <strong className="fleet-metric-val">
                    {routeSummary?.total_distance_km != null ? `${routeSummary.total_distance_km} KM` : "0.0 KM"}
                  </strong>
                </div>
                {routeSummary?.check_in_time && (
                  <div className="fleet-metric-item">
                    <span className="fleet-metric-label">Check-In</span>
                    <strong className="fleet-metric-val">
                      {routeSummary.check_in_time}
                    </strong>
                  </div>
                )}
                {routeSummary?.check_out_time ? (
                  <div className="fleet-metric-item">
                    <span className="fleet-metric-label">Check-Out</span>
                    <strong className="fleet-metric-val">
                      {routeSummary.check_out_time}
                    </strong>
                  </div>
                ) : (
                  <div className="fleet-metric-item">
                    <span className="fleet-metric-label">Check-Out</span>
                    <span className="fleet-metric-val in-progress">In Progress</span>
                  </div>
                )}
                <div className="fleet-metric-item">
                  <span className="fleet-metric-label">Waypoints</span>
                  <strong className="fleet-metric-val">{historyRouteCoords.length} pts</strong>
                </div>
              </div>
            </div>

            {/* Month Navigation & Lifetime Date Picker Row */}
            <div className="fleet-month-control-row">
              <div className="fleet-month-switcher">
                <button
                  type="button"
                  className="fleet-month-btn"
                  onClick={handlePrevMonth}
                  title="Previous month"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="fleet-month-name">
                  <Calendar size={13} style={{ marginRight: 4 }} />
                  {routeSummary?.month_label || "Current Month"}
                </span>
                <button
                  type="button"
                  className="fleet-month-btn"
                  onClick={handleNextMonth}
                  title="Next month"
                >
                  <ChevronRight size={14} />
                </button>
              </div>

              <div className="fleet-month-stat-pill" title="Monthly travel distance summary">
                <TrendingUp size={13} style={{ color: "#7c3aed" }} />
                <span>
                  Month Total: <strong>{routeSummary?.month_total_distance_km ?? 0} KM</strong>
                  {" "}({routeSummary?.month_active_days ?? 0} active days)
                </span>
              </div>

              <div className="fleet-datepicker-wrap" title="Jump to any lifetime date">
                <span className="fleet-datepicker-label">Jump to Date:</span>
                <input
                  type="date"
                  value={selectedRouteDate || (routeSummary?.selected_date || "")}
                  onChange={(e) => onSelectRouteDate(e.target.value)}
                  className="fleet-datepicker-input"
                />
              </div>
            </div>

            {/* Scrollable Month Days Ribbon */}
            {availableDays && availableDays.length > 0 && (
              <div className="fleet-days-ribbon">
                <div className="fleet-ribbon-scroll">
                  {availableDays.map((d) => {
                    const isSelectedDate = (selectedRouteDate || availableDays[0]?.date) === d.date;
                    const hasTravel = d.distance_km > 0;
                    return (
                      <button
                        key={d.date}
                        type="button"
                        className={`fleet-day-pill ${isSelectedDate ? "fleet-day-pill--active" : ""} ${hasTravel ? "fleet-day-pill--has-travel" : ""}`}
                        onClick={() => onSelectRouteDate(d.date)}
                        title={`${d.full_date_label || d.date}: ${d.distance_km} KM (${d.waypoints_count} points)`}
                      >
                        <span className="fleet-day-pill__label">{d.label}</span>
                        {hasTravel ? (
                          <span className="fleet-day-pill__km">{d.distance_km} KM</span>
                        ) : (
                          <span className="fleet-day-pill__km-muted">—</span>
                        )}
                        {d.is_finalized && <span className="fleet-day-pill__check">✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {isGoogleLoaded && googleApiKey ? (
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={currentMapCenter}
            zoom={13}
            onLoad={(map) => {
              googleMapRef.current = map;
            }}
            options={{
              disableDefaultUI: false,
              zoomControl: true,
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: true,
              styles: [
                {
                  featureType: "poi",
                  elementType: "labels",
                  stylers: [{ visibility: "off" }],
                },
              ],
            }}
          >
            {/* Sales Rep Markers */}
            {employees.map((emp) => {
              if (emp.latitude == null || emp.longitude == null) return null;
              const isSelected = String(selectedRepId) === String(emp.id);
              const isLive = Boolean(emp.isActiveTracking);

              return (
                <MarkerF
                  key={`google-rep-${emp.id}`}
                  position={{ lat: Number(emp.latitude), lng: Number(emp.longitude) }}
                  onClick={() => {
                    handleSelectRep(emp);
                    setInfoWindowTarget({
                      type: "employee",
                      data: emp,
                      lat: Number(emp.latitude),
                      lng: Number(emp.longitude),
                    });
                  }}
                  icon={{
                    path: window.google.maps.SymbolPath.CIRCLE,
                    scale: isSelected ? 12 : 9,
                    fillColor: isLive ? "#0ba37f" : "#d97706",
                    fillOpacity: 1,
                    strokeColor: "#ffffff",
                    strokeWeight: 2.5,
                  }}
                />
              );
            })}

            {/* Leads / Visits Markers for Selected Rep */}
            {selectedRepVisits.map((v) => {
              const vLat = v.leadLatitude ?? v.latitude;
              const vLng = v.leadLongitude ?? v.longitude;
              if (vLat == null || vLng == null) return null;
              const isCompleted =
                v.visitStatus === "COMPLETED" || v.status === "Completed";
              const isFocused = focusedLead && focusedLead.id === v.id;

              return (
                <MarkerF
                  key={`google-lead-${v.id}`}
                  position={{ lat: Number(vLat), lng: Number(vLng) }}
                  onClick={() => {
                    setFocusedLead(v);
                    setInfoWindowTarget({
                      type: "lead",
                      data: v,
                      lat: Number(vLat),
                      lng: Number(vLng),
                    });
                  }}
                  icon={{
                    path: window.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
                    scale: isFocused ? 7 : 5,
                    fillColor: isCompleted ? "#0ba37f" : "#d97706",
                    fillOpacity: 1,
                    strokeColor: "#ffffff",
                    strokeWeight: 2,
                  }}
                />
              );
            })}

            {/* Real Road Driving Route via Google DirectionsRenderer */}
            {directionsResult && (
              <DirectionsRenderer
                directions={directionsResult}
                options={{
                  suppressMarkers: true,
                  preserveViewport: true,
                  polylineOptions: {
                    strokeColor: "#1d4ed8",
                    strokeWeight: 6,
                    strokeOpacity: 0.88,
                  },
                }}
              />
            )}

            {/* Fallback Real Road Driving Route via OSRM if Google Directions API not enabled */}
            {!directionsResult && osrmRoadCoords && osrmRoadCoords.length > 0 && (
              <PolylineF
                path={osrmRoadCoords}
                options={{
                  strokeColor: "#1d4ed8",
                  strokeWeight: 6,
                  strokeOpacity: 0.88,
                }}
              />
            )}

            {/* 5-Day History Route Trail (Check-in to Check-out waypoints) */}
            {historyRouteCoords.length > 1 && (
              <>
                <PolylineF
                  path={historyRouteCoords}
                  options={{
                    strokeColor: "#4c1d95",
                    strokeWeight: 7,
                    strokeOpacity: 0.45,
                    geodesic: true,
                    zIndex: 20,
                  }}
                />
                <PolylineF
                  path={historyRouteCoords}
                  options={{
                    strokeColor: "#8b5cf6",
                    strokeWeight: 4,
                    strokeOpacity: 0.95,
                    geodesic: true,
                    zIndex: 21,
                  }}
                />
              </>
            )}

            {/* Start / Check-in Marker */}
            {historyRouteCoords.length > 0 && (
              <MarkerF
                key={`route-start-${historyRouteCoords[0].timestamp || 0}`}
                position={{ lat: historyRouteCoords[0].lat, lng: historyRouteCoords[0].lng }}
                title={`Start / Check-in: ${formatPingTimestamp(historyRouteCoords[0].timestamp)}`}
                onClick={() => {
                  setInfoWindowTarget({
                    type: "checkpoint",
                    data: {
                      title: "🟢 Check-In / Workday Start",
                      time: formatPingTimestamp(historyRouteCoords[0].timestamp),
                      battery: historyRouteCoords[0].battery,
                      speed: historyRouteCoords[0].speed,
                    },
                    lat: historyRouteCoords[0].lat,
                    lng: historyRouteCoords[0].lng,
                  });
                }}
                icon={{
                  path: window.google.maps.SymbolPath.CIRCLE,
                  scale: 8,
                  fillColor: "#10b981",
                  fillOpacity: 1,
                  strokeColor: "#ffffff",
                  strokeWeight: 2.5,
                }}
              />
            )}

            {/* End / Check-out Marker */}
            {historyRouteCoords.length > 1 && (
              <MarkerF
                key={`route-end-${historyRouteCoords[historyRouteCoords.length - 1].timestamp || 1}`}
                position={{
                  lat: historyRouteCoords[historyRouteCoords.length - 1].lat,
                  lng: historyRouteCoords[historyRouteCoords.length - 1].lng,
                }}
                title={`${routeSummary?.is_finalized ? "Check-Out" : "Latest Location"}: ${formatPingTimestamp(historyRouteCoords[historyRouteCoords.length - 1].timestamp)}`}
                onClick={() => {
                  setInfoWindowTarget({
                    type: "checkpoint",
                    data: {
                      title: routeSummary?.is_finalized
                        ? "🔴 Check-Out / Workday End"
                        : "🔵 Latest Recorded Location",
                      time: formatPingTimestamp(historyRouteCoords[historyRouteCoords.length - 1].timestamp),
                      battery: historyRouteCoords[historyRouteCoords.length - 1].battery,
                      speed: historyRouteCoords[historyRouteCoords.length - 1].speed,
                    },
                    lat: historyRouteCoords[historyRouteCoords.length - 1].lat,
                    lng: historyRouteCoords[historyRouteCoords.length - 1].lng,
                  });
                }}
                icon={{
                  path: window.google.maps.SymbolPath.CIRCLE,
                  scale: 8,
                  fillColor: routeSummary?.is_finalized ? "#ef4444" : "#3b82f6",
                  fillOpacity: 1,
                  strokeColor: "#ffffff",
                  strokeWeight: 2.5,
                }}
              />
            )}

            {/* Intermediate 10-Minute Checkpoint Dots */}
            {historyRouteCoords.slice(1, -1).map((pt, i) => (
              <MarkerF
                key={`checkpoint-dot-${i}-${pt.lat}`}
                position={{ lat: pt.lat, lng: pt.lng }}
                title={`Checkpoint #${i + 1} (${formatPingTimestamp(pt.timestamp)})`}
                onClick={() => {
                  setInfoWindowTarget({
                    type: "checkpoint",
                    data: {
                      title: `⏱ 10-Min Checkpoint #${i + 1}`,
                      time: formatPingTimestamp(pt.timestamp),
                      battery: pt.battery,
                      speed: pt.speed,
                    },
                    lat: pt.lat,
                    lng: pt.lng,
                  });
                }}
                icon={{
                  path: window.google.maps.SymbolPath.CIRCLE,
                  scale: 3.5,
                  fillColor: "#7c3aed",
                  fillOpacity: 0.8,
                  strokeColor: "#ffffff",
                  strokeWeight: 1,
                }}
              />
            ))}

            {/* InfoWindow */}
            {infoWindowTarget && (
              <InfoWindowF
                position={{ lat: infoWindowTarget.lat, lng: infoWindowTarget.lng }}
                onCloseClick={() => setInfoWindowTarget(null)}
              >
                <div className="fleet-infowindow">
                  {infoWindowTarget.type === "checkpoint" ? (
                    <div>
                      <strong>{infoWindowTarget.data.title}</strong>
                      <p style={{ margin: "4px 0 2px", color: "#334155", fontSize: "12px" }}>
                        🕒 {infoWindowTarget.data.time}
                      </p>
                      {infoWindowTarget.data.battery != null && (
                        <small style={{ color: "#64748b", display: "block" }}>
                          🔋 Battery: {infoWindowTarget.data.battery}%
                          {infoWindowTarget.data.speed != null ? ` • Speed: ${infoWindowTarget.data.speed} km/h` : ""}
                        </small>
                      )}
                    </div>
                  ) : infoWindowTarget.type === "employee" ? (
                    <div>
                      <strong>{infoWindowTarget.data.name}</strong>
                      {infoWindowTarget.data.isActiveTracking ? (
                        <p style={{ color: "#059669", fontWeight: 600, margin: "2px 0" }}>
                          🟢 Live Tracking (In Visit: {infoWindowTarget.data.active_visit_client || "Client"})
                        </p>
                      ) : infoWindowTarget.data.visit_stage === "CHECKED_OUT" ? (
                        <div style={{ background: "#fffbeb", border: "1px solid #fde68a", padding: "6px 8px", borderRadius: "6px", margin: "4px 0" }}>
                          <p style={{ color: "#d97706", fontWeight: 700, margin: "0 0 2px" }}>
                            🟡 Checked Out Today
                          </p>
                          <p style={{ color: "#475569", fontSize: "11px", margin: "0 0 2px" }}>
                            {infoWindowTarget.data.check_in_time_formatted && `In: ${infoWindowTarget.data.check_in_time_formatted} • `}
                            Out: <strong>{infoWindowTarget.data.check_out_time_formatted || "Completed"}</strong>
                            {infoWindowTarget.data.last_visit_client ? ` (${infoWindowTarget.data.last_visit_client})` : ""}
                          </p>
                          <p style={{ color: "#92400e", fontSize: "10px", margin: "0" }}>
                            Live tracking is stopped after checkout.
                          </p>
                        </div>
                      ) : infoWindowTarget.data.visit_stage === "NOT_CHECKED_IN" ? (
                        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "6px 8px", borderRadius: "6px", margin: "4px 0" }}>
                          <p style={{ color: "#334155", fontWeight: 700, margin: "0 0 2px" }}>
                            ⚪ Scheduled (Not Checked In)
                          </p>
                          <p style={{ color: "#64748b", fontSize: "10px", margin: "0" }}>
                            {infoWindowTarget.data.today_visits_count || 0} visits scheduled today.
                          </p>
                        </div>
                      ) : (
                        <div style={{ background: "#fffbeb", border: "1px solid #fde68a", padding: "6px 8px", borderRadius: "6px", margin: "4px 0" }}>
                          <p style={{ color: "#d97706", fontWeight: 700, margin: "0 0 2px" }}>
                            ⚠️ Inactive / Not Live
                          </p>
                          <p style={{ color: "#475569", fontSize: "11px", margin: "0 0 2px" }}>
                            📌 Showing <strong>Last Known Location</strong>
                          </p>
                          <p style={{ color: "#64748b", fontSize: "10px", margin: "0" }}>
                            Recorded: <strong>{formatPingTimestamp(infoWindowTarget.data.last_ping_at || infoWindowTarget.data.last_ping_formatted)}</strong>
                            {` (${formatLastSeenAgo(infoWindowTarget.data.last_ping_at, infoWindowTarget.data.last_seen_human)})`}
                          </p>
                        </div>
                      )}
                      <small style={{ color: "#64748b" }}>
                        Distance Today: {infoWindowTarget.data.today_distance_km || 0} km • {infoWindowTarget.data.today_visits_count || 0} Visits
                      </small>
                    </div>
                  ) : (
                    <div>
                      <strong>{infoWindowTarget.data.companyName || infoWindowTarget.data.leadName}</strong>
                      <p>Status: {infoWindowTarget.data.visitStatus}</p>
                      <button
                        type="button"
                        className="fleet-btn-xs"
                        onClick={() => onSelectVisit(infoWindowTarget.data)}
                      >
                        Open Visit Details
                      </button>
                    </div>
                  )}
                </div>
              </InfoWindowF>
            )}
          </GoogleMap>
        ) : (
          /* Graceful Leaflet fallback if Google Maps key not active */
          <MapContainer
            center={[currentMapCenter.lat, currentMapCenter.lng]}
            zoom={13}
            scrollWheelZoom={true}
            className="fleet-leaflet-map"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LeafletMapController center={[currentMapCenter.lat, currentMapCenter.lng]} />

            {/* Rep Markers */}
            {employees.map((emp) => {
              if (emp.latitude == null || emp.longitude == null) return null;
              const isLive = Boolean(emp.isActiveTracking);
              const initials = emp.name
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("");

              return (
                <Marker
                  key={`leaflet-rep-${emp.id}`}
                  position={[Number(emp.latitude), Number(emp.longitude)]}
                  icon={createLeafletRepIcon(initials, isLive)}
                  eventHandlers={{
                    click: () => handleSelectRep(emp),
                  }}
                >
                  <Popup>
                    <div className="fleet-popup">
                      <strong>{emp.name}</strong>
                      <div className="fleet-popup__meta">
                        {isLive
                          ? `🟢 Live (${emp.active_visit_client || "In Visit"})`
                          : emp.visit_stage === "CHECKED_OUT"
                          ? `🟡 Checked Out (${emp.check_out_time_formatted || "Completed"})`
                          : emp.visit_stage === "NOT_CHECKED_IN"
                          ? "⚪ Scheduled"
                          : "⚪ Inactive"} • {emp.today_distance_km || 0} km
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {/* Selected Rep Visits */}
            {selectedRepVisits.map((v) => {
              const vLat = v.leadLatitude ?? v.latitude;
              const vLng = v.leadLongitude ?? v.longitude;
              if (vLat == null || vLng == null) return null;
              const isCompleted =
                v.visitStatus === "COMPLETED" || v.status === "Completed";
              const isFocused = focusedLead && focusedLead.id === v.id;

              return (
                <Marker
                  key={`leaflet-visit-${v.id}`}
                  position={[Number(vLat), Number(vLng)]}
                  icon={createLeafletLeadIcon(isCompleted, isFocused)}
                  eventHandlers={{
                    click: () => setFocusedLead(v),
                  }}
                >
                  <Popup>
                    <div className="fleet-popup">
                      <strong>{v.companyName || v.leadName}</strong>
                      <p>{v.address || "Visit address"}</p>
                      <button
                        type="button"
                        className="fleet-btn-xs"
                        onClick={() => onSelectVisit(v)}
                      >
                        View Visit
                      </button>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {/* Real Road Route Polyline on Leaflet */}
            {osrmRoadCoords && osrmRoadCoords.length > 0 ? (
              <Polyline
                positions={osrmRoadCoords.map((c) => [c.lat, c.lng])}
                color="#1d4ed8"
                weight={5}
                opacity={0.88}
              />
            ) : (
              selectedEmployee &&
              focusedLead &&
              selectedEmployee.latitude != null &&
              (focusedLead.leadLatitude ?? focusedLead.latitude) != null && (
                <Polyline
                  positions={[
                    [Number(selectedEmployee.latitude), Number(selectedEmployee.longitude)],
                    [
                      Number(focusedLead.leadLatitude ?? focusedLead.latitude),
                      Number(focusedLead.leadLongitude ?? focusedLead.longitude),
                    ],
                  ]}
                  color="#1d4ed8"
                  dashArray="6, 6"
                  weight={3}
                />
              )
            )}

            {/* 5-Day History Polyline on Leaflet */}
            {historyRouteCoords.length > 1 && (
              <Polyline
                positions={historyRouteCoords.map((c) => [c.lat, c.lng])}
                pathOptions={{ color: "#8b5cf6", weight: 5, opacity: 0.9 }}
              />
            )}

            {/* Start Marker Leaflet */}
            {historyRouteCoords.length > 0 && (
              <Marker
                key="leaflet-route-start"
                position={[historyRouteCoords[0].lat, historyRouteCoords[0].lng]}
                icon={createLeafletCheckpointIcon("IN")}
              >
                <Popup>
                  <div className="fleet-popup">
                    <strong>🟢 Check-In / Day Start</strong>
                    <p>{formatPingTimestamp(historyRouteCoords[0].timestamp)}</p>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* End Marker Leaflet */}
            {historyRouteCoords.length > 1 && (
              <Marker
                key="leaflet-route-end"
                position={[
                  historyRouteCoords[historyRouteCoords.length - 1].lat,
                  historyRouteCoords[historyRouteCoords.length - 1].lng,
                ]}
                icon={createLeafletCheckpointIcon(
                  routeSummary?.is_finalized ? "OUT" : "NOW",
                  routeSummary?.is_finalized
                )}
              >
                <Popup>
                  <div className="fleet-popup">
                    <strong>
                      {routeSummary?.is_finalized ? "🔴 Check-Out / Day End" : "🔵 Latest Point"}
                    </strong>
                    <p>
                      {formatPingTimestamp(
                        historyRouteCoords[historyRouteCoords.length - 1].timestamp
                      )}
                    </p>
                  </div>
                </Popup>
              </Marker>
            )}
          </MapContainer>
        )}

        {/* Banner: When Selected Rep is Inactive or Checked Out */}
        {selectedEmployee && !selectedEmployee.isActiveTracking && (
          <div className="fleet-stale-warning-hud">
            <div className="fleet-stale-warning-hud__icon">
              {selectedEmployee.visit_stage === "CHECKED_OUT" ? (
                <CheckCircle2 size={16} color="#d97706" />
              ) : selectedEmployee.visit_stage === "NOT_CHECKED_IN" ? (
                <Clock size={16} color="#475569" />
              ) : (
                <AlertTriangle size={16} />
              )}
            </div>
            <div className="fleet-stale-warning-hud__content">
              <div className="fleet-stale-warning-hud__title">
                {selectedEmployee.visit_stage === "CHECKED_OUT"
                  ? `${selectedEmployee.name} Checked Out Today`
                  : selectedEmployee.visit_stage === "NOT_CHECKED_IN"
                  ? `${selectedEmployee.name} Has Not Checked In Yet`
                  : `${selectedEmployee.name} is Inactive`}
              </div>
              <div className="fleet-stale-warning-hud__desc">
                {selectedEmployee.visit_stage === "CHECKED_OUT" ? (
                  <>
                    {selectedEmployee.check_in_time_formatted && (
                      <>Checked in: <strong>{selectedEmployee.check_in_time_formatted}</strong> • </>
                    )}
                    Checked out: <strong>{selectedEmployee.check_out_time_formatted || "Completed"}</strong>
                    {selectedEmployee.last_visit_client ? ` (${selectedEmployee.last_visit_client})` : ""}.
                    {" "}Live GPS tracking is paused because the visit is completed.
                  </>
                ) : selectedEmployee.visit_stage === "NOT_CHECKED_IN" ? (
                  <>
                    Visits scheduled: <strong>{selectedEmployee.today_visits_count ?? 0}</strong>.
                    {" "}Live tracking will activate once the representative checks in to a visit.
                  </>
                ) : selectedEmployee.latitude != null ? (
                  <>
                    Showing Last Known Location recorded at{" "}
                    <strong>{formatPingTimestamp(selectedEmployee.last_ping_at || selectedEmployee.last_ping_formatted)}</strong>
                    {` (${formatLastSeenAgo(selectedEmployee.last_ping_at, selectedEmployee.last_seen_human)})`}.
                  </>
                ) : (
                  <>No GPS signal received from device yet today.</>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Floating Route Navigation HUD */}
        {focusedLead && (routeStats || isCalculatingRoute) && (
          <div className="fleet-route-floating-hud">
            <div className="fleet-route-floating-hud__icon">
              <Navigation size={15} />
            </div>
            <div className="fleet-route-floating-hud__info">
              <span className="fleet-route-floating-hud__title">
                {focusedLead.companyName || focusedLead.leadName || "Client"}
              </span>
              <span className="fleet-route-floating-hud__meta">
                {isCalculatingRoute
                  ? "Calculating road route..."
                  : `🛣️ ${routeStats?.distanceText || "—"} • ⏱️ ${routeStats?.durationText || "—"} drive`}
              </span>
            </div>
            <button
              type="button"
              className="fleet-route-floating-hud__close"
              onClick={() => {
                setFocusedLead(null);
                setDirectionsResult(null);
                setOsrmRoadCoords(null);
                setRouteStats(null);
              }}
              title="Close route"
            >
              ×
            </button>
          </div>
        )}

        {/* Floating Map Legend */}
        <div className="fleet-map-legend">
          <div className="fleet-legend-item">
            <span className="fleet-legend-dot fleet-legend-dot--rep" />
            <span>Rep (Live)</span>
          </div>
          <div className="fleet-legend-item">
            <span className="fleet-legend-dot fleet-legend-dot--stale" />
            <span>Rep (Last Known)</span>
          </div>
          <div className="fleet-legend-item">
            <span className="fleet-legend-dot fleet-legend-dot--pending" />
            <span>Pending Client</span>
          </div>
          <div className="fleet-legend-item">
            <span className="fleet-legend-dot fleet-legend-dot--completed" />
            <span>Completed Visit</span>
          </div>
        </div>
      </main>

      {/* ==================================================================== */}
      {/* RIGHT SIDEBAR: Selected Rep's Leads & Distances                     */}
      {/* ==================================================================== */}
      <aside className="fleet-col fleet-col--right">
        {selectedEmployee ? (
          <>
            <div className="fleet-col__header">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <h4 className="fleet-rep-title">{selectedEmployee.name}</h4>
                {selectedEmployee.isActiveTracking ? (
                  <span className="fleet-live-pill">
                    <span className="fleet-live-pill__dot" />
                    Live
                  </span>
                ) : selectedEmployee.visit_stage === "CHECKED_OUT" ? (
                  <span
                    className="fleet-inactive-pill"
                    style={{ background: "#fef3c7", color: "#92400e", borderColor: "#fde68a" }}
                  >
                    🟡 Checked Out
                  </span>
                ) : selectedEmployee.visit_stage === "NOT_CHECKED_IN" ? (
                  <span
                    className="fleet-inactive-pill"
                    style={{ background: "#f1f5f9", color: "#475569", borderColor: "#e2e8f0" }}
                  >
                    ⚪ Scheduled
                  </span>
                ) : (
                  <span
                    className="fleet-inactive-pill"
                    title={formatPingTimestamp(selectedEmployee.last_ping_at || selectedEmployee.last_ping_formatted)}
                  >
                    ⚠️ Inactive ({formatLastSeenAgo(selectedEmployee.last_ping_at, selectedEmployee.last_seen_human)})
                  </span>
                )}
              </div>
              <p className="fleet-rep-subtitle">
                {selectedEmployee.isActiveTracking
                  ? `🟢 In Visit with ${selectedEmployee.active_visit_client || "Client"} (Checked in: ${selectedEmployee.check_in_time_formatted || "Today"})`
                  : selectedEmployee.visit_stage === "CHECKED_OUT"
                  ? `🟡 Checked out at ${selectedEmployee.check_out_time_formatted || "today"}${selectedEmployee.last_visit_client ? ` (${selectedEmployee.last_visit_client})` : ""}`
                  : selectedEmployee.visit_stage === "NOT_CHECKED_IN"
                  ? "⚪ Not checked in yet today"
                  : (selectedEmployee.last_ping_at || selectedEmployee.last_ping_formatted)
                  ? `Last Location: ${formatPingTimestamp(selectedEmployee.last_ping_at || selectedEmployee.last_ping_formatted)}`
                  : "Today's Visits Schedule"}
              </p>

              <div className="fleet-counter-row">
                <div className="fleet-counter-card">
                  <span className="fleet-counter-card__label">Total</span>
                  <strong className="fleet-counter-card__num">{selectedRepVisits.length}</strong>
                </div>
                <div className="fleet-counter-card fleet-counter-card--done">
                  <span className="fleet-counter-card__label">Done</span>
                  <strong className="fleet-counter-card__num">{completedVisits.length}</strong>
                </div>
                <div className="fleet-counter-card fleet-counter-card--left">
                  <span className="fleet-counter-card__label">Left</span>
                  <strong className="fleet-counter-card__num">{pendingVisits.length}</strong>
                </div>
              </div>
            </div>

            <div className="fleet-lead-feed">
              <div className="fleet-feed-section-header">
                🔴 PENDING CLIENT VISITS ({pendingVisits.length})
              </div>

              {pendingVisits.length > 0 ? (
                pendingVisits.map((visit, idx) => {
                  const vLat = visit.leadLatitude ?? visit.latitude;
                  const vLng = visit.leadLongitude ?? visit.longitude;
                  const distMeters =
                    selectedEmployee.latitude != null && vLat != null
                      ? calculateDistance(
                          selectedEmployee.latitude,
                          selectedEmployee.longitude,
                          vLat,
                          vLng
                        )
                      : null;

                  const isFocused = focusedLead && focusedLead.id === visit.id;

                  return (
                    <div
                      key={visit.id}
                      className={`fleet-lead-card ${isFocused ? "fleet-lead-card--focused" : ""}`}
                    >
                      <div className="fleet-lead-card__header">
                        <span className="fleet-lead-card__num">{idx + 1}</span>
                        <strong className="fleet-lead-card__title">
                          {visit.companyName || visit.leadName || "Client"}
                        </strong>
                        <span
                          className={`fleet-badge fleet-badge--${visit.priority?.toLowerCase() || "medium"}`}
                        >
                          {visit.priority || "Medium"}
                        </span>
                      </div>

                      <div className="fleet-lead-card__details">
                        {visit.contactPerson && (
                          <div className="fleet-lead-meta">
                            <User size={12} /> {visit.contactPerson}
                          </div>
                        )}
                        {visit.address && (
                          <div className="fleet-lead-meta">
                            <MapPin size={12} /> {visit.address}
                          </div>
                        )}
                      </div>

                      {/* Distance & ETA Banner */}
                      <div
                        className={`fleet-distance-banner ${
                          isFocused ? "fleet-distance-banner--road" : ""
                        }`}
                      >
                        <div className="fleet-distance-item">
                          <span className="fleet-distance-label">
                            {isFocused && routeStats ? "🛣️ Road Dist:" : "Distance:"}
                          </span>
                          <strong className="fleet-distance-val">
                            {isFocused
                              ? routeStats?.distanceText ||
                                (isCalculatingRoute ? "Calculating..." : formatKm(distMeters))
                              : formatKm(distMeters)}
                          </strong>
                        </div>
                        <div className="fleet-distance-item">
                          <span className="fleet-distance-label">
                            {isFocused && routeStats ? "⏱️ Drive Time:" : "ETA:"}
                          </span>
                          <strong className="fleet-distance-val">
                            {isFocused
                              ? routeStats?.durationText ||
                                (isCalculatingRoute ? "..." : `~${estimateEtaMins(distMeters)}`)
                              : `~${estimateEtaMins(distMeters)}`}
                          </strong>
                        </div>
                      </div>

                      <div className="fleet-lead-card__footer">
                        <button
                          type="button"
                          className={`fleet-btn ${isFocused ? "fleet-btn--active-route" : "fleet-btn--outline"}`}
                          onClick={() => handleFocusLead(visit)}
                        >
                          <Navigation size={12} /> {isFocused ? "Route Active" : "Focus on Map"}
                        </button>
                        <button
                          type="button"
                          className="fleet-btn fleet-btn--primary"
                          onClick={() => onSelectVisit(visit)}
                        >
                          Details
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="fleet-all-completed">
                  <CheckCircle2 size={24} color="#0ba37f" />
                  <p>All scheduled visits completed today! 🎉</p>
                </div>
              )}

              {completedVisits.length > 0 && (
                <>
                  <div className="fleet-feed-section-header" style={{ marginTop: 20 }}>
                    🟢 COMPLETED VISITS ({completedVisits.length})
                  </div>
                  {completedVisits.map((visit) => (
                    <div key={visit.id} className="fleet-lead-card fleet-lead-card--completed">
                      <div className="fleet-lead-card__header">
                        <CheckCircle2 size={14} color="#0ba37f" />
                        <strong className="fleet-lead-card__title">
                          {visit.companyName || visit.leadName}
                        </strong>
                      </div>
                      <small className="text-muted">
                        Completed at {visit.checkOutTime || "Today"}
                      </small>
                    </div>
                  ))}
                </>
              )}
            </div>
          </>
        ) : (
          <div className="fleet-empty-selection">
            <div className="fleet-empty-selection__icon">
              <User size={32} />
            </div>
            <h4>Select a Sales Representative</h4>
            <p>
              Click on any field sales employee from the left panel to inspect their live GPS position, today's traveled kilometers, and pending visits route.
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}
