import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  Search,
  User,
  MapPin,
  Navigation,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronRight,
  Battery,
  Footprints,
  Calendar,
  ChevronLeft,
  TrendingUp,
  RefreshCw,
  UserRound,
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
import DatePicker from "../../../common/DatePicker/DatePicker";

import "./LiveFleetCommandMap.css";
import DailyRoutePlaybackMap from "./DailyRoutePlaybackMap";

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

const isValidCoordinatePair = (latitude, longitude) => {
  const latValue = typeof latitude === "string" ? latitude.trim() : latitude;
  const lngValue = typeof longitude === "string" ? longitude.trim() : longitude;
  if (
    latValue == null ||
    latValue === "" ||
    lngValue == null ||
    lngValue === ""
  ) {
    return null;
  }

  const lat = Number(latValue);
  const lng = Number(lngValue);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;

  return { lat, lng };
};

const isEmployeeOnShift = (employee) =>
  employee?.attendance_status === "CHECKED_IN" ||
  employee?.shiftStatus === "WORKING" ||
  employee?.shiftStatus === "ON_BREAK";

const isCompletedVisit = (visit) =>
  ["CHECKED_OUT", "COMPLETED"].includes(
    String(visit?.visitStatus || visit?.rawStatus || "").toUpperCase()
  );

const isActiveVisit = (visit) =>
  ["NOT_STARTED", "ASSIGNED", "PENDING", "SCHEDULED", "CHECKED_IN", "IN_PROGRESS"].includes(
    String(visit?.visitStatus || "").toUpperCase()
  );

const VISIT_MARKER_CLUSTER_RADIUS_METERS = 25;

const getVisitStatusLabel = (visit) => {
  const status = String(visit?.visitStatus || "").toUpperCase();
  if (["NOT_STARTED", "ASSIGNED", "PENDING", "SCHEDULED"].includes(status)) {
    return "Assigned";
  }
  if (status === "CHECKED_IN" || status === "IN_PROGRESS") return "In progress";
  if (isCompletedVisit(visit)) return "Completed";
  return visit?.rawStatus || status || "Status unavailable";
};

const getVisitMarkerColor = (visit) => {
  if (isCompletedVisit(visit)) return "#73777A";
  if (["CHECKED_IN", "IN_PROGRESS"].includes(
    String(visit?.visitStatus || "").toUpperCase()
  )) return "#D4AF37";
  return "#2563EB";
};

const svgDataUri = (svg) =>
  `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;

const createCheckpointMarkerIcon = (label, isFinalized = false) => {
  const bg = label === "IN" ? "#10b981" : isFinalized ? "#ef4444" : "#3b82f6";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
    <circle cx="18" cy="18" r="15" fill="${bg}" stroke="#FFFFFF" stroke-width="2.5"/>
    <text x="18" y="22" text-anchor="middle" font-family="Arial,sans-serif" font-size="11" font-weight="800" fill="#FFFFFF">${label}</text>
  </svg>`;
  return svgDataUri(svg);
};

const createEmployeeMarkerIcon = (selected = false) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="42" height="48" viewBox="0 0 42 48">
    <path d="M21 2C10.5 2 2 10.4 2 20.8 2 34.5 21 46 21 46s19-11.5 19-25.2C40 10.4 31.5 2 21 2Z" fill="#0BA37F" stroke="${selected ? "#D4AF37" : "#FFFFFF"}" stroke-width="${selected ? 4 : 3}"/>
    <circle cx="21" cy="16" r="5" fill="#FFFFFF"/>
    <path d="M11.5 31c.8-5 4.5-8 9.5-8s8.7 3 9.5 8" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/>
  </svg>`;
  return svgDataUri(svg);
};

const createVisitMarkerIcon = (visit, selected = false) => {
  const color = getVisitMarkerColor(visit);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="38" height="46" viewBox="0 0 38 46">
    <path d="M19 2C9.6 2 2 9.5 2 18.8 2 31.1 19 44 19 44s17-12.9 17-25.2C36 9.5 28.4 2 19 2Z" fill="${color}" stroke="${selected ? "#0F3D3E" : "#FFFFFF"}" stroke-width="${selected ? 3.5 : 2.5}"/>
    <rect x="11" y="11" width="16" height="14" rx="2" fill="none" stroke="#FFFFFF" stroke-width="2"/>
    <path d="M14 9v4m10-4v4M11 16h16m-12 4h2m3 0h2" fill="none" stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round"/>
  </svg>`;
  return svgDataUri(svg);
};

const createVisitGroupMarkerIcon = (group, selected = false) => {
  const colors = [...new Set(group.visits.map(getVisitMarkerColor))];
  const fill = colors.length === 1 ? colors[0] : "#0F3D3E";
  const count = group.visits.length;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="42" height="48" viewBox="0 0 42 48">
    <path d="M21 2C10.5 2 2 10.4 2 20.8 2 34.5 21 46 21 46s19-11.5 19-25.2C40 10.4 31.5 2 21 2Z" fill="${fill}" stroke="${selected ? "#D4AF37" : "#FFFFFF"}" stroke-width="${selected ? 4 : 3}"/>
    <rect x="12" y="12" width="18" height="16" rx="2" fill="none" stroke="#FFFFFF" stroke-width="2"/>
    <path d="M15 10v4m12-4v4M12 17h18" fill="none" stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round"/>
    ${colors.length > 1 ? colors.slice(0, 3).map((color, index) => `<circle cx="${16 + index * 5}" cy="23" r="1.7" fill="${color}"/>`).join("") : ""}
    <circle cx="33" cy="10" r="8" fill="#FFFFFF" stroke="#0F3D3E" stroke-width="1.5"/>
    <text x="33" y="13" text-anchor="middle" font-family="Arial,sans-serif" font-size="8" font-weight="700" fill="#0F3D3E">${count}</text>
  </svg>`;
  return svgDataUri(svg);
};

const getDisplayTime = (value) => {
  if (value == null) return null;
  const text = String(value).trim();
  if (!text || ["—", "-", "N/A", "NULL"].includes(text.toUpperCase())) return null;
  if (text.includes("T") || (text.includes("-") && text.length > 10)) {
    try {
      const d = new Date(text);
      if (!isNaN(d.getTime())) {
        return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
      }
    } catch {
      // fallback
    }
  }
  return text;
};

/* -------------------------------------------------------------------------- */
/* Real Road Routing Fallback via OSRM (100% Free Road Geometry)              */
/* -------------------------------------------------------------------------- */

async function fetchOsrmMultiRoute(waypoints) {
  if (!waypoints || waypoints.length < 2) return null;
  try {
    let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
    let directDistMeters = 0;
    for (let i = 0; i < waypoints.length; i++) {
      const pt = waypoints[i];
      if (pt.lat < minLat) minLat = pt.lat;
      if (pt.lat > maxLat) maxLat = pt.lat;
      if (pt.lng < minLng) minLng = pt.lng;
      if (pt.lng > maxLng) maxLng = pt.lng;
      if (i > 0) {
        directDistMeters += (calculateDistance(
          waypoints[i - 1].lat,
          waypoints[i - 1].lng,
          pt.lat,
          pt.lng
        ) || 0) * 1000;
      }
    }

    let selected = waypoints;
    if (waypoints.length > 25) {
      const step = Math.ceil(waypoints.length / 23);
      selected = [
        waypoints[0],
        ...waypoints.slice(1, -1).filter((_, idx) => idx % step === 0),
        waypoints[waypoints.length - 1],
      ];
    }
    const coordString = selected
      .map((pt) => `${Number(pt.lng).toFixed(6)},${Number(pt.lat).toFixed(6)}`)
      .join(";");
    const url = `https://router.project-osrm.org/route/v1/driving/${coordString}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.code === "Ok" && data.routes?.[0]?.geometry?.coordinates) {
      const osrmDist = data.routes[0].distance || 0;
      // Guard against wild highway detours (e.g. OSRM routing miles away to highway junctions)
      if (directDistMeters > 0 && osrmDist > directDistMeters * 1.8) {
        console.warn(`OSRM detour rejected: route distance ${Math.round(osrmDist)}m vs direct ${Math.round(directDistMeters)}m`);
        return null;
      }

      // Guard against wander outside the waypoints bounding box (max 0.015 deg ~ 1.5 km buffer)
      const latBuffer = 0.015;
      const lngBuffer = 0.015;
      const coords = data.routes[0].geometry.coordinates;
      const hasWildDetour = coords.some(
        ([lng, lat]) =>
          lat < minLat - latBuffer ||
          lat > maxLat + latBuffer ||
          lng < minLng - lngBuffer ||
          lng > maxLng + lngBuffer
      );
      if (hasWildDetour) {
        console.warn("OSRM detour rejected: road path wandered outside route bounding box.");
        return null;
      }

      return coords.map(([lng, lat]) => ({
        lat: Number(lat),
        lng: Number(lng),
      }));
    }
  } catch (err) {
    console.warn("OSRM multi-waypoint road route warning:", err);
  }
  return null;
}

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

// Leaflet Pan & Fit Bounds Component
function LeafletMapController({ center, zoom, bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length >= 2) {
      try {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
        return;
      } catch (e) {}
    }
    if (center && center[0] != null && center[1] != null) {
      map.panTo(center, { animate: true, duration: 0.8 });
      if (zoom) map.setZoom(zoom);
    }
  }, [center, zoom, bounds, map]);
  return null;
}

function createLeafletWaypointIcon(number) {
  return L.divIcon({
    className: "fleet-custom-marker",
    html: `<div style="background:#7c3aed;color:#fff;width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;border:2px solid #fff;box-shadow:0 2px 5px rgba(0,0,0,0.25);">${number}</div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

const createLeafletIcon = (url, visit = false, grouped = false) =>
  L.icon({
    iconUrl: url,
    iconSize: grouped ? [42, 48] : visit ? [38, 46] : [42, 48],
    iconAnchor: grouped ? [21, 46] : visit ? [19, 44] : [21, 46],
    popupAnchor: [0, grouped ? -44 : visit ? -42 : -44],
  });

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
  employees = [],
  currentUserLocation,
  selectedEntity,
  onSelectEntity,
  onSelectVisit,
  timelinePoints = [],
  availableDays = [],
  selectedRouteDate = "",
  onSelectRouteDate = () => {},
  onChangeRouteMonth = () => {},
  routeSummary = null,
  isLoading = false,
  attendanceUnavailable = false,
  attendanceStatusAvailable = false,
  visitsUnavailable = false,
  employeesUnavailable = false,
  locationsUnavailable = false,
  timelineLoading = false,
  timelineError = false,
  onRefresh,
}) {
  const googleApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
  const { isLoaded: isGoogleLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: googleApiKey,
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState("all"); // 'all' | 'active'
  const [visitMapFilter, setVisitMapFilter] = useState("all");
  const [mapViewSubMode, setMapViewSubMode] = useState("fleet"); // "fleet" | "playback"
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedRepId, setSelectedRepId] = useState(null);
  const [focusedLead, setFocusedLead] = useState(null);
  const [infoWindowTarget, setInfoWindowTarget] = useState(null); // { type, data, lat, lng }

  // Road Routing States (DirectionsService & OSRM)
  const [directionsResult, setDirectionsResult] = useState(null);
  const [historyDirectionsResult, setHistoryDirectionsResult] = useState(null);
  const [historyRoadCoords, setHistoryRoadCoords] = useState(null);
  const lastHistoryRouteKeyRef = useRef("");
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

  // Selected Day & Shift Derivations for Route History
  const todayStr = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }, []);

  const activeSelectedDate = selectedRouteDate || routeSummary?.selected_date || "";
  const isViewingToday = !activeSelectedDate || activeSelectedDate === todayStr;

  const currentDayFromRibbon = useMemo(() => {
    if (!availableDays || !availableDays.length) return null;
    return (
      availableDays.find((d) => d.date === activeSelectedDate) ||
      (activeSelectedDate ? null : availableDays[0])
    );
  }, [availableDays, activeSelectedDate]);

  const activeCheckInTime = useMemo(() => {
    if (isViewingToday) {
      return (
        selectedEmployee?.shiftCheckIn ||
        selectedEmployee?.check_in_time_formatted ||
        routeSummary?.check_in_time ||
        currentDayFromRibbon?.check_in_time ||
        null
      );
    }
    return (
      routeSummary?.check_in_time ||
      currentDayFromRibbon?.check_in_time ||
      null
    );
  }, [isViewingToday, selectedEmployee, routeSummary, currentDayFromRibbon]);

  const activeCheckOutTime = useMemo(() => {
    if (isViewingToday) {
      return (
        selectedEmployee?.shiftCheckOut ||
        selectedEmployee?.check_out_time_formatted ||
        routeSummary?.check_out_time ||
        currentDayFromRibbon?.check_out_time ||
        null
      );
    }
    return (
      routeSummary?.check_out_time ||
      currentDayFromRibbon?.check_out_time ||
      null
    );
  }, [isViewingToday, selectedEmployee, routeSummary, currentDayFromRibbon]);

  const activeDistanceKm = useMemo(() => {
    if (isViewingToday) {
      if (selectedEmployee?.today_distance_km != null) {
        return selectedEmployee.today_distance_km;
      }
      return routeSummary?.total_distance_km ?? currentDayFromRibbon?.distance_km ?? 0;
    }
    return routeSummary?.total_distance_km ?? currentDayFromRibbon?.distance_km ?? 0;
  }, [isViewingToday, selectedEmployee, routeSummary, currentDayFromRibbon]);

  const activeAttendanceStatus = useMemo(() => {
    if (isViewingToday) {
      if (selectedEmployee?.attendance_status) return String(selectedEmployee.attendance_status);
      if (isEmployeeOnShift(selectedEmployee)) return "CHECKED_IN";
      if (selectedEmployee?.shiftCheckOut) return "CHECKED_OUT";
      return "NOT_CHECKED_IN";
    }
    if (routeSummary?.attendance_status) return String(routeSummary.attendance_status);
    if (activeCheckOutTime || routeSummary?.is_finalized || currentDayFromRibbon?.is_finalized) {
      return "CHECKED_OUT";
    }
    if (activeCheckInTime) return "CHECKED_IN";
    return "NOT_CHECKED_IN";
  }, [isViewingToday, selectedEmployee, routeSummary, currentDayFromRibbon, activeCheckOutTime, activeCheckInTime]);

  const activeCheckInAddress = useMemo(() => {
    return (
      routeSummary?.check_in_address ||
      routeSummary?.start_location_name ||
      (isViewingToday ? selectedEmployee?.check_in_address : null) ||
      ""
    );
  }, [routeSummary, isViewingToday, selectedEmployee]);

  const activeCheckOutAddress = useMemo(() => {
    return (
      routeSummary?.check_out_address ||
      routeSummary?.end_location_name ||
      (isViewingToday ? selectedEmployee?.check_out_address : null) ||
      ""
    );
  }, [routeSummary, isViewingToday, selectedEmployee]);

  // Parse 5-day route waypoints into coordinates array (guarantees polyline and OUT marker when check-out / distance exists)
  const historyRouteCoords = useMemo(() => {
    let pts = [];
    if (timelinePoints && timelinePoints.length) {
      pts = timelinePoints
        .map((pt, idx) => {
          const coords = isValidCoordinatePair(pt.latitude, pt.longitude);
          if (!coords || (coords.lat === 0 && coords.lng === 0)) return null;
          return {
            ...coords,
            timestamp: pt.timestamp,
            speed: pt.speed,
            battery: pt.battery_percentage,
            accuracy: pt.accuracy,
            logType: pt.log_type,
            time: pt.time,
            address: pt.address,
            index: idx,
          };
        })
        .filter(Boolean);
    }

    // Defensive fallback if points are empty but routeSummary has check-in coordinates
    if (pts.length === 0 && routeSummary) {
      const startCoord = isValidCoordinatePair(
        routeSummary.check_in_latitude,
        routeSummary.check_in_longitude
      );
      if (startCoord) {
        pts.push({
          ...startCoord,
          logType: "DUTY_START",
          time: activeCheckInTime,
          address: activeCheckInAddress,
          index: 0,
        });
      }
    }

    // If we only have 1 point (or if checkout exists), ensure end/checkout point is present on historical / finalized days so graph and OUT marker render!
    if (pts.length === 1) {
      const endCoord = isValidCoordinatePair(
        routeSummary?.check_out_latitude,
        routeSummary?.check_out_longitude
      );
      if (endCoord && (Math.abs(endCoord.lat - pts[0].lat) > 0.0001 || Math.abs(endCoord.lng - pts[0].lng) > 0.0001)) {
        pts.push({
          ...endCoord,
          logType: "DUTY_END",
          time: activeCheckOutTime,
          address: activeCheckOutAddress,
          index: 1,
        });
      }
    }

    return pts;
  }, [
    timelinePoints,
    routeSummary,
    activeCheckInTime,
    activeCheckOutTime,
    activeCheckInAddress,
    activeCheckOutAddress,
    currentDayFromRibbon,
    activeDistanceKm,
    isViewingToday,
  ]);

  // Fit bounds when employee 5-day route changes
  useEffect(() => {
    if (historyRouteCoords.length > 0 && googleMapRef.current && window.google?.maps?.LatLngBounds) {
      if (historyRouteCoords.length === 1) {
        googleMapRef.current?.panTo?.({
          lat: historyRouteCoords[0].lat,
          lng: historyRouteCoords[0].lng,
        });
        googleMapRef.current.setZoom(15);
      } else {
        const bounds = new window.google.maps.LatLngBounds();
        historyRouteCoords.forEach((pt) => {
          bounds.extend({ lat: pt.lat, lng: pt.lng });
        });
        googleMapRef.current?.fitBounds?.(bounds, {
          top: 90,
          right: 70,
          bottom: 70,
          left: 70,
        });
      }
    }
  }, [historyRouteCoords]);

  // Turn-by-Turn Road Route Calculation for Daily History Trail (snaps polyline to real street network)
  useEffect(() => {
    if (!historyRouteCoords || historyRouteCoords.length < 2) {
      setHistoryDirectionsResult(null);
      setHistoryRoadCoords(null);
      lastHistoryRouteKeyRef.current = "";
      return;
    }

    const origin = historyRouteCoords[0];
    const destination = historyRouteCoords[historyRouteCoords.length - 1];
    const routeKey = `hist_${origin.lat.toFixed(4)}_${origin.lng.toFixed(4)}_to_${destination.lat.toFixed(4)}_${destination.lng.toFixed(4)}_count${historyRouteCoords.length}`;

    if (lastHistoryRouteKeyRef.current === routeKey) return;
    lastHistoryRouteKeyRef.current = routeKey;

    let isSubscribed = true;

    // Fetch OSRM Road Geometry (100% Free Road Snapping across all checkpoints)
    fetchOsrmMultiRoute(historyRouteCoords).then((roadPts) => {
      if (isSubscribed && roadPts && roadPts.length > 0) {
        setHistoryRoadCoords(roadPts);
      }
    });

    // Zero API Token Route: Render actual recorded GPS path directly without DirectionsService charges
    setHistoryDirectionsResult(null);

    return () => {
      isSubscribed = false;
    };
  }, [historyRouteCoords, isGoogleLoaded]);

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

    const origin = isValidCoordinatePair(
      selectedEmployee.latitude,
      selectedEmployee.longitude
    );
    const destination = isValidCoordinatePair(
      focusedLead.leadLatitude ?? focusedLead.latitude,
      focusedLead.leadLongitude ?? focusedLead.longitude
    );

    if (!origin || !destination) {
      setDirectionsResult(null);
      setOsrmRoadCoords(null);
      setRouteStats(null);
      setIsCalculatingRoute(false);
      return;
    }

    const { lat: originLat, lng: originLng } = origin;
    const { lat: destLat, lng: destLng } = destination;

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
        googleMapRef.current?.fitBounds?.(bounds, {
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
    return visits.filter((visit) => {
      const assignedEmployee =
        visit.employeeId ??
        visit.assigned_to_id ??
        visit.assigned_to?.id ??
        visit.assigned_to;
      const assignedEmployeeId =
        assignedEmployee && typeof assignedEmployee === "object"
          ? assignedEmployee.id
          : assignedEmployee;
      return String(assignedEmployeeId ?? "") === String(selectedEmployee.id);
    });
  }, [visits, selectedEmployee]);

  const selectedRepMapVisits = useMemo(
    () =>
      visitMapFilter === "active"
        ? selectedRepVisits.filter(isActiveVisit)
        : selectedRepVisits,
    [selectedRepVisits, visitMapFilter]
  );

  const selectedRepMapVisitGroups = useMemo(() => {
    const groups = new Map();
    selectedRepMapVisits.forEach((visit) => {
      const coords = isValidCoordinatePair(
        visit.leadLatitude ?? visit.latitude,
        visit.leadLongitude ?? visit.longitude
      );
      if (!coords) return;
      const nearbyGroup = Array.from(groups.values()).find((group) => {
        const distance = calculateDistance(
          group.coords.lat,
          group.coords.lng,
          coords.lat,
          coords.lng
        );
        return distance != null && distance <= VISIT_MARKER_CLUSTER_RADIUS_METERS;
      });
      const key = nearbyGroup?.key || `${coords.lat.toFixed(6)},${coords.lng.toFixed(6)}`;
      const group = nearbyGroup || { key, coords, visits: [] };
      group.visits.push(visit);
      groups.set(key, group);
    });
    return Array.from(groups.values());
  }, [selectedRepMapVisits]);

  const pendingVisits = useMemo(() => {
    return selectedRepVisits.filter(isActiveVisit);
  }, [selectedRepVisits]);

  const completedVisits = useMemo(() => {
    return selectedRepVisits.filter(isCompletedVisit);
  }, [selectedRepVisits]);

  const selectedRepInProgressVisit = useMemo(
    () =>
      selectedRepVisits.find((visit) =>
        ["CHECKED_IN", "IN_PROGRESS"].includes(
          String(visit.visitStatus || "").toUpperCase()
        )
      ) || null,
    [selectedRepVisits]
  );

  const infoWindowData = useMemo(() => {
    if (!infoWindowTarget) return null;
    if (infoWindowTarget.type === "employee") {
      return (
        employees.find(
          (employee) => String(employee.id) === String(infoWindowTarget.data?.id)
        ) || null
      );
    }
    if (infoWindowTarget.type === "lead") {
      return (
        selectedRepVisits.find(
          (visit) => String(visit.id) === String(infoWindowTarget.data?.id)
        ) || null
      );
    }
    if (infoWindowTarget.type === "visit-group") {
      return infoWindowTarget.data
        .map((visit) =>
          selectedRepVisits.find(
            (currentVisit) => String(currentVisit.id) === String(visit.id)
          )
        )
        .filter(Boolean);
    }
    return infoWindowTarget.data;
  }, [employees, infoWindowTarget, selectedRepVisits]);

  // Filtered employees for left sidebar
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchSearch =
        !searchQuery.trim() ||
        String(emp.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (emp.email && emp.email.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchFilter =
        filterTab === "all" ||
        (filterTab === "on_shift" &&
          attendanceStatusAvailable && isEmployeeOnShift(emp)) ||
        (filterTab === "active" && Boolean(emp.isActiveTracking));

      return matchSearch && matchFilter;
    });
  }, [employees, searchQuery, filterTab, attendanceStatusAvailable]);

  const activeCount = useMemo(() => {
    return employees.filter((e) => Boolean(e.isActiveTracking)).length;
  }, [employees]);

  const onShiftCount = useMemo(
    () => employees.filter(isEmployeeOnShift).length,
    [employees]
  );

  const activeVisitCount = useMemo(
    () => visits.filter(isActiveVisit).length,
    [visits]
  );

  const trackingDataErrors = [
    visitsUnavailable && "visit assignments",
    employeesUnavailable && "employee roster",
    attendanceUnavailable && "shift attendance",
    locationsUnavailable && "GPS locations",
  ].filter(Boolean);

  // Smooth pan to rep or lead
  const panToCoords = useCallback((lat, lng, zoom = 15) => {
    if (lat == null || lng == null) return;
    if (googleMapRef.current) {
      googleMapRef.current?.panTo?.({ lat, lng });
      googleMapRef.current.setZoom(zoom);
    }
  }, []);

  const handleSelectRep = (emp) => {
    setSelectedRepId(String(emp.id));
    setFocusedLead(null);
    setInfoWindowTarget(null);
    setDirectionsResult(null);
    setHistoryDirectionsResult(null);
    setOsrmRoadCoords(null);
    setRouteStats(null);
    onSelectEntity?.({ type: "employee", id: emp.id });
    const coords = isValidCoordinatePair(emp.latitude, emp.longitude);
    if (coords) {
      panToCoords(coords.lat, coords.lng, 15);
    }
  };

  const handleFocusLead = (visit) => {
    setFocusedLead(visit);
    const vLat = visit.leadLatitude ?? visit.latitude;
    const vLng = visit.leadLongitude ?? visit.longitude;
    const coords = isValidCoordinatePair(vLat, vLng);
    if (coords) {
      setInfoWindowTarget({
        type: "lead",
        data: visit,
        lat: coords.lat,
        lng: coords.lng,
      });

      // Fit bounds if both rep and lead positions exist
      const employeeCoords = isValidCoordinatePair(
        selectedEmployee?.latitude,
        selectedEmployee?.longitude
      );
      if (employeeCoords && googleMapRef.current && window.google?.maps?.LatLngBounds) {
        const bounds = new window.google.maps.LatLngBounds();
        bounds.extend(employeeCoords);
        bounds.extend(coords);
        googleMapRef.current?.fitBounds?.(bounds, {
          top: 60,
          right: 60,
          bottom: 60,
          left: 60,
        });
      } else {
        panToCoords(coords.lat, coords.lng, 15);
      }
    }
  };

  const handleVisitGroupClick = (group) => {
    setFocusedLead(null);
    setDirectionsResult(null);
    setOsrmRoadCoords(null);
    setRouteStats(null);
    setInfoWindowTarget({
      type: "visit-group",
      data: group.visits,
      lat: group.coords.lat,
      lng: group.coords.lng,
    });
    panToCoords(group.coords.lat, group.coords.lng, 15);
  };

  // Compute map center
  const currentMapCenter = useMemo(() => {
    if (focusedLead) {
      const lat = focusedLead.leadLatitude ?? focusedLead.latitude;
      const lng = focusedLead.leadLongitude ?? focusedLead.longitude;
      const coords = isValidCoordinatePair(lat, lng);
      if (coords) return coords;
    }
    const selectedCoords = isValidCoordinatePair(
      selectedEmployee?.latitude,
      selectedEmployee?.longitude
    );
    if (selectedCoords) {
      return selectedCoords;
    }
    const firstActive = employees.find((e) =>
      isValidCoordinatePair(e.latitude, e.longitude)
    );
    if (firstActive) {
      return isValidCoordinatePair(firstActive.latitude, firstActive.longitude);
    }
    const userCoords = isValidCoordinatePair(
      currentUserLocation?.latitude,
      currentUserLocation?.longitude
    );
    if (userCoords) {
      return userCoords;
    }
    return defaultCenter;
  }, [focusedLead, selectedEmployee, employees, currentUserLocation]);

  const refresh = async () => {
    if (!onRefresh || isRefreshing) return;
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  const leafletRouteBounds = useMemo(() => {
    const pts = (historyRoadCoords && historyRoadCoords.length >= 2)
      ? historyRoadCoords
      : historyRouteCoords;
    if (pts && pts.length >= 2) {
      return pts.map((p) => [p.lat, p.lng]);
    }
    return null;
  }, [historyRoadCoords, historyRouteCoords]);

  if (mapViewSubMode === "playback") {
    return (
      <div className="live-fleet-command">
        <DailyRoutePlaybackMap
          selectedEmployee={selectedEmployee || (employees.length > 0 ? employees[0] : null)}
          employees={employees}
          onSelectEmployee={(emp) => handleSelectRep(emp)}
          selectedDate={selectedRouteDate || routeSummary?.selected_date || ""}
          onSelectDate={onSelectRouteDate}
          routeSummary={routeSummary}
          timelinePoints={timelinePoints}
          availableDays={availableDays}
          isLoading={timelineLoading}
          onSelectVisit={onSelectVisit}
          onBackToFleet={() => setMapViewSubMode("fleet")}
        />
      </div>
    );
  }

  return (
    <div className="live-fleet-command">
      {/* ==================================================================== */}
      {/* Team controls and employee selection */}
      {/* ==================================================================== */}
      <aside className="fleet-col fleet-col--left">
        <div className="fleet-col__header">
          <div className="fleet-view-mode-toggle-bar">
            <button
              type="button"
              className={`fleet-mode-toggle-btn ${mapViewSubMode === "fleet" ? "active" : ""}`}
              onClick={() => setMapViewSubMode("fleet")}
            >
              <UserRound size={13} />
              <span>Live Fleet</span>
            </button>
            <button
              type="button"
              className={`fleet-mode-toggle-btn ${mapViewSubMode === "playback" ? "active" : ""}`}
              onClick={() => {
                setMapViewSubMode("playback");
                if (!selectedEmployee && employees.length > 0) {
                  handleSelectRep(employees[0]);
                }
              }}
            >
              <Footprints size={13} />
              <span>Route Playback</span>
            </button>
          </div>

          <div className="fleet-col__title-row">
            <h3 className="fleet-col__title">Sales Fleet</h3>
            <button
              type="button"
              className="fleet-refresh-button"
              onClick={() => void refresh()}
              disabled={isRefreshing || !onRefresh}
              aria-label="Refresh employee tracking data"
            >
              <RefreshCw size={14} className={isRefreshing ? "is-spinning" : ""} />
              {isRefreshing ? "Refreshing" : "Refresh"}
            </button>
          </div>

          <div className="fleet-summary-grid" aria-label="Team tracking summary">
            <div className="fleet-summary-card">
              <span>Employees</span>
              <strong>{employees.length}</strong>
            </div>
            <div className="fleet-summary-card">
              <span>On shift</span>
              <strong>{attendanceStatusAvailable ? onShiftCount : "—"}</strong>
            </div>
            <div className="fleet-summary-card">
              <span>Live GPS</span>
              <strong>{activeCount}</strong>
            </div>
            <div className="fleet-summary-card">
              <span>Active visits</span>
              <strong>{activeVisitCount}</strong>
            </div>
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
              aria-pressed={filterTab === "all"}
            >
              All ({employees.length})
            </button>
            {attendanceStatusAvailable && (
              <button
                type="button"
                className={`fleet-tab ${filterTab === "on_shift" ? "fleet-tab--active" : ""}`}
                onClick={() => setFilterTab("on_shift")}
                aria-pressed={filterTab === "on_shift"}
              >
                On shift ({onShiftCount})
              </button>
            )}
            <button
              type="button"
              className={`fleet-tab ${filterTab === "active" ? "fleet-tab--active" : ""}`}
              onClick={() => setFilterTab("active")}
              aria-pressed={filterTab === "active"}
            >
              Live GPS ({activeCount})
            </button>
          </div>
        </div>

        {trackingDataErrors.length > 0 && (
          <div className="fleet-data-warning" role="alert">
            <strong>Some tracking data is unavailable:</strong>{" "}
            {trackingDataErrors.join(", ")}. Refresh or try again later.
          </div>
        )}

        {isLoading && employees.length === 0 && visits.length === 0 && (
          <div className="fleet-data-loading" role="status">
            Loading team tracking data…
          </div>
        )}

        <div className="fleet-emp-list">
          {filteredEmployees.length > 0 ? (
            filteredEmployees.map((emp) => {
              const isSelected = String(selectedRepId) === String(emp.id);
              const coords = isValidCoordinatePair(emp.latitude, emp.longitude);
              const isLive = Boolean(emp.isActiveTracking && coords);
              const isStale = Boolean(emp.is_stale_location && coords);
              const isOnShift = isEmployeeOnShift(emp);
              const shiftLabel = isOnShift
                ? "On shift"
                : emp.shiftStatus
                  ? String(emp.shiftStatus).replaceAll("_", " ")
                  : attendanceUnavailable
                    ? "Shift status unavailable"
                    : "Shift status unknown";
              const initials = String(emp.name || "")
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("");

              return (
                <button
                  type="button"
                  key={emp.id}
                  className={`fleet-emp-card ${isSelected ? "fleet-emp-card--selected" : ""}`}
                  onClick={() => handleSelectRep(emp)}
                  aria-pressed={isSelected}
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
                      <strong className="fleet-emp-card__name">{emp.name || "Unnamed employee"}</strong>
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
                      <button
                        type="button"
                        className="fleet-card-play-shortcut"
                        title="Replay daily travel route on Google Maps"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectRep(emp);
                          setMapViewSubMode("playback");
                        }}
                      >
                        ▶ Play
                      </button>
                    </div>

                    <div className="fleet-emp-card__last-seen">
                      {isLive ? (
                        <span className="text-emerald">
                          Live GPS · {shiftLabel}
                        </span>
                      ) : isStale ? (
                        <span
                          className="fleet-last-seen-stale"
                          title={`Recorded at ${formatPingTimestamp(emp.last_ping_at || emp.last_ping_formatted)}`}
                        >
                          Stale GPS · {formatLastSeenAgo(emp.last_ping_at, emp.last_seen_human)} · {shiftLabel}
                        </span>
                      ) : isOnShift ? (
                        coords ? (
                          <span className="fleet-last-seen-stale">
                            Last known GPS · {formatLastSeenAgo(emp.last_ping_at, emp.last_seen_human)} · On shift
                          </span>
                        ) : (
                          <span className="text-shift">On shift · Location unavailable</span>
                        )
                      ) : emp.shiftStatus === "NOT_STARTED" ||
                        emp.shiftStatus === "ABSENT" ? (
                        <span className="text-muted">Off shift</span>
                      ) : coords ? (
                        <span
                          className="fleet-last-seen-stale"
                          title={`Recorded at ${formatPingTimestamp(emp.last_ping_at || emp.last_ping_formatted)}`}
                        >
                          Last known GPS · {formatLastSeenAgo(emp.last_ping_at, emp.last_seen_human)} · {shiftLabel}
                        </span>
                      ) : (
                        <span className="text-muted">
                          Location unavailable · {shiftLabel}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
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
                <button
                  type="button"
                  className="fleet-switch-to-playback-btn"
                  title="Open full daily route playback on Google Maps"
                  onClick={() => setMapViewSubMode("playback")}
                >
                  ▶ Replay Route
                </button>
                <span
                  className={`fleet-badge ${isViewingToday ? (isEmployeeOnShift(selectedEmployee) ? "active" : "finalized") : "finalized"}`}
                  title="Shift status for selected date"
                >
                  {isViewingToday
                    ? isEmployeeOnShift(selectedEmployee)
                      ? "On shift"
                      : selectedEmployee.shiftCheckOut
                      ? "Shift ended"
                      : attendanceUnavailable
                      ? "Shift unavailable"
                      : "Shift status unknown"
                    : activeAttendanceStatus === "CHECKED_OUT"
                    ? "Shift ended"
                    : activeAttendanceStatus === "CHECKED_IN"
                    ? "Punched in"
                    : "Finalized"}
                </span>
              </div>

              {/* Day Metrics */}
              <div className="fleet-route-metrics">
                <div className="fleet-metric-item">
                  <span className="fleet-metric-label">Day Distance</span>
                  <strong className="fleet-metric-val">
                    {activeDistanceKm != null ? `${activeDistanceKm} KM` : "—"}
                  </strong>
                </div>
                {activeCheckInTime && (
                  <div className="fleet-metric-item">
                    <span className="fleet-metric-label">Shift punch-in</span>
                    <strong className="fleet-metric-val">
                      {getDisplayTime(activeCheckInTime) || activeCheckInTime}
                    </strong>
                  </div>
                )}
                {activeCheckOutTime ? (
                  <div className="fleet-metric-item">
                    <span className="fleet-metric-label">Shift punch-out</span>
                    <strong className="fleet-metric-val">
                      {getDisplayTime(activeCheckOutTime) || activeCheckOutTime}
                    </strong>
                  </div>
                ) : isViewingToday && isEmployeeOnShift(selectedEmployee) ? (
                  <div className="fleet-metric-item">
                    <span className="fleet-metric-label">Shift punch-out</span>
                    <span className="fleet-metric-val in-progress">Not yet recorded</span>
                  </div>
                ) : !isViewingToday ? (
                  <div className="fleet-metric-item">
                    <span className="fleet-metric-label">Shift punch-out</span>
                    <span className="fleet-metric-val text-muted">Not recorded</span>
                  </div>
                ) : null}
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
                <DatePicker
                  value={selectedRouteDate || routeSummary?.selected_date || ""}
                  onChange={onSelectRouteDate}
                  className="fleet-history-date-picker"
                  placeholder="Select date"
                />
              </div>
              <div className="fleet-visit-map-filter" role="group" aria-label="Visit marker filter">
                <button
                  type="button"
                  className={`fleet-tab ${visitMapFilter === "all" ? "fleet-tab--active" : ""}`}
                  onClick={() => setVisitMapFilter("all")}
                  aria-pressed={visitMapFilter === "all"}
                >
                  All Visits
                </button>
                <button
                  type="button"
                  className={`fleet-tab ${visitMapFilter === "active" ? "fleet-tab--active" : ""}`}
                  onClick={() => setVisitMapFilter("active")}
                  aria-pressed={visitMapFilter === "active"}
                >
                  Active Visits
                </button>
              </div>
            </div>

            <div className="fleet-history-state" role="status">
              {timelineLoading
                ? "Loading location history…"
                : timelineError
                  ? "Location history could not be loaded for this date."
                  : historyRouteCoords.length === 0
                    ? "No location history recorded for this date."
                    : `${historyRouteCoords.length} historical GPS points`}
            </div>

            {/* Scrollable Month Days Ribbon */}
            {availableDays && availableDays.length > 0 && (
              <div className="fleet-days-ribbon">
                <div className="fleet-ribbon-scroll">
                  {availableDays.map((d) => {
                    const isSelectedDate =
                      (selectedRouteDate || routeSummary?.selected_date || availableDays[0]?.date) === d.date;
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
              const coords = isValidCoordinatePair(emp.latitude, emp.longitude);
              if (!coords) return null;
              const isSelected = String(selectedRepId) === String(emp.id);

              return (
                <MarkerF
                  key={`google-rep-${emp.id}`}
                  position={coords}
                  onClick={() => {
                    handleSelectRep(emp);
                    setInfoWindowTarget({
                      type: "employee",
                      data: emp,
                      ...coords,
                    });
                  }}
                  title={`${emp.name || "Employee"} · ${
                    emp.is_stale_location
                      ? "Stale GPS"
                      : emp.isActiveTracking
                        ? "Live GPS"
                        : "Last known GPS"
                  }`}
                  icon={{
                    url: createEmployeeMarkerIcon(isSelected),
                    scaledSize: new window.google.maps.Size(42, 48),
                    anchor: new window.google.maps.Point(21, 46),
                  }}
                />
              );
            })}

            {/* Selected employee's assigned visit markers */}
            {selectedRepMapVisitGroups.map((group) => {
              const isGrouped = group.visits.length > 1;
              const isFocused = group.visits.some(
                (visit) => focusedLead?.id === visit.id
              );
              const firstVisit = group.visits[0];
              const markerIcon = isGrouped
                ? createVisitGroupMarkerIcon(group, isFocused)
                : createVisitMarkerIcon(firstVisit, isFocused);
              const markerTitle = isGrouped
                ? `${group.visits.length} visits near this location`
                : `${firstVisit.companyName || firstVisit.leadName || "Visit"} · ${getVisitStatusLabel(firstVisit)}`;

              return (
                <MarkerF
                  key={`google-visit-group-${group.key}`}
                  position={group.coords}
                  onClick={() => {
                    if (isGrouped) {
                      handleVisitGroupClick(group);
                    } else {
                      handleFocusLead(firstVisit);
                    }
                  }}
                  title={markerTitle}
                  icon={{
                    url: markerIcon,
                    scaledSize: new window.google.maps.Size(
                      isGrouped ? 42 : 38,
                      isGrouped ? 48 : 46
                    ),
                    anchor: new window.google.maps.Point(
                      isGrouped ? 21 : 19,
                      isGrouped ? 46 : 44
                    ),
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

            {/* Turn-by-Turn Road Route Trail (Snaps to real driving street network) */}
            {historyDirectionsResult && (
              <DirectionsRenderer
                directions={historyDirectionsResult}
                options={{
                  suppressMarkers: true,
                  preserveViewport: true,
                  polylineOptions: {
                    strokeColor: "#7c3aed",
                    strokeWeight: 6,
                    strokeOpacity: 0.92,
                    zIndex: 22,
                  },
                }}
              />
            )}

            {/* Real Street Route Polyline via OSRM when DirectionsRenderer not used */}
            {!historyDirectionsResult && historyRoadCoords && historyRoadCoords.length > 0 && (
              <>
                <PolylineF
                  path={historyRoadCoords}
                  options={{
                    strokeColor: "#4c1d95",
                    strokeWeight: 7,
                    strokeOpacity: 0.45,
                    geodesic: true,
                    zIndex: 20,
                  }}
                />
                <PolylineF
                  path={historyRoadCoords}
                  options={{
                    strokeColor: "#7c3aed",
                    strokeWeight: 5,
                    strokeOpacity: 0.95,
                    geodesic: true,
                    zIndex: 22,
                  }}
                />
              </>
            )}

            {/* Continuous Fallback History Polyline if neither DirectionsService nor OSRM road route loaded */}
            {!historyDirectionsResult && (!historyRoadCoords || historyRoadCoords.length === 0) && historyRouteCoords.length > 1 && (
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

            {/* Intermediate Checkpoints (Google Maps) */}
            {historyRouteCoords.length > 2 &&
              historyRouteCoords.slice(1, -1).map((pt, idx) => (
                <MarkerF
                  key={`route-waypoint-${pt.index ?? idx}-${pt.timestamp ?? idx}`}
                  position={{ lat: pt.lat, lng: pt.lng }}
                  icon={{
                    path: window.google?.maps?.SymbolPath?.CIRCLE || 0,
                    scale: 6,
                    fillColor: "#7c3aed",
                    fillOpacity: 1,
                    strokeColor: "#ffffff",
                    strokeWeight: 2,
                  }}
                  title={pt.label || `Waypoint ${idx + 1}`}
                  onClick={() => {
                    setInfoWindowTarget({
                      type: "checkpoint",
                      data: {
                        title: `📍 ${pt.label || `Waypoint ${idx + 1}`}`,
                        time: pt.time || formatPingTimestamp(pt.timestamp),
                        address: pt.address || "",
                        battery: pt.battery,
                        speed: pt.speed,
                      },
                      lat: pt.lat,
                      lng: pt.lng,
                    });
                  }}
                />
              ))}

            {/* Start / Check-in Marker (Green Badge Marker) */}
            {historyRouteCoords.length > 0 && (
              <MarkerF
                key={`route-start-${historyRouteCoords[0].timestamp || 0}`}
                position={{ lat: historyRouteCoords[0].lat, lng: historyRouteCoords[0].lng }}
                title={`Shift Check-in: ${activeCheckInTime || formatPingTimestamp(historyRouteCoords[0].timestamp)}`}
                onClick={() => {
                  setInfoWindowTarget({
                    type: "checkpoint",
                    data: {
                      title: "🟢 Shift Check-in Location",
                      time: activeCheckInTime || formatPingTimestamp(historyRouteCoords[0].timestamp),
                      address: activeCheckInAddress || "",
                      battery: historyRouteCoords[0].battery,
                      speed: historyRouteCoords[0].speed,
                    },
                    lat: historyRouteCoords[0].lat,
                    lng: historyRouteCoords[0].lng,
                  });
                }}
                icon={
                  window.google?.maps?.Size
                    ? {
                        url: createCheckpointMarkerIcon("IN"),
                        scaledSize: new window.google.maps.Size(32, 32),
                        anchor: new window.google.maps.Point(16, 16),
                      }
                    : {
                        path: window.google?.maps?.SymbolPath?.CIRCLE || 0,
                        scale: 9,
                        fillColor: "#10b981",
                        fillOpacity: 1,
                        strokeColor: "#ffffff",
                        strokeWeight: 2.5,
                      }
                }
              />
            )}

            {/* End / Check-out Marker (Red if checked out / finalized, Blue if in progress) */}
            {historyRouteCoords.length > 1 && (
              <MarkerF
                key={`route-end-${historyRouteCoords[historyRouteCoords.length - 1].timestamp || 1}`}
                position={{
                  lat: historyRouteCoords[historyRouteCoords.length - 1].lat,
                  lng: historyRouteCoords[historyRouteCoords.length - 1].lng,
                }}
                title={
                  activeCheckOutTime || routeSummary?.is_finalized || !isViewingToday
                    ? `Shift Check-out: ${activeCheckOutTime || formatPingTimestamp(historyRouteCoords[historyRouteCoords.length - 1].timestamp)}`
                    : `Live Location: ${formatPingTimestamp(historyRouteCoords[historyRouteCoords.length - 1].timestamp)}`
                }
                onClick={() => {
                  const isCheckout = Boolean(activeCheckOutTime || routeSummary?.is_finalized || !isViewingToday);
                  setInfoWindowTarget({
                    type: "checkpoint",
                    data: {
                      title: isCheckout ? "🔴 Shift Check-out Location" : "🔵 Current Live Position",
                      time: isCheckout
                        ? (activeCheckOutTime || formatPingTimestamp(historyRouteCoords[historyRouteCoords.length - 1].timestamp))
                        : formatPingTimestamp(historyRouteCoords[historyRouteCoords.length - 1].timestamp),
                      address: activeCheckOutAddress || "",
                      battery: historyRouteCoords[historyRouteCoords.length - 1].battery,
                      speed: historyRouteCoords[historyRouteCoords.length - 1].speed,
                    },
                    lat: historyRouteCoords[historyRouteCoords.length - 1].lat,
                    lng: historyRouteCoords[historyRouteCoords.length - 1].lng,
                  });
                }}
                icon={
                  window.google?.maps?.Size
                    ? {
                        url: createCheckpointMarkerIcon(
                          activeCheckOutTime || routeSummary?.is_finalized || !isViewingToday ? "OUT" : "NOW",
                          Boolean(activeCheckOutTime || routeSummary?.is_finalized || !isViewingToday)
                        ),
                        scaledSize: new window.google.maps.Size(32, 32),
                        anchor: new window.google.maps.Point(16, 16),
                      }
                    : {
                        path: window.google?.maps?.SymbolPath?.CIRCLE || 0,
                        scale: 9,
                        fillColor: activeCheckOutTime || routeSummary?.is_finalized || !isViewingToday ? "#ef4444" : "#3b82f6",
                        fillOpacity: 1,
                        strokeColor: "#ffffff",
                        strokeWeight: 2.5,
                      }
                }
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
                  path: window.google?.maps?.SymbolPath?.CIRCLE || 0,
                  scale: 3.5,
                  fillColor: "#7c3aed",
                  fillOpacity: 0.8,
                  strokeColor: "#ffffff",
                  strokeWeight: 1,
                }}
              />
            ))}

            {/* InfoWindow */}
            {infoWindowTarget &&
              infoWindowData &&
              (!Array.isArray(infoWindowData) || infoWindowData.length > 0) && (
                <InfoWindowF
                  position={{ lat: infoWindowTarget.lat, lng: infoWindowTarget.lng }}
                  onCloseClick={() => setInfoWindowTarget(null)}
                >
                  <div className="fleet-infowindow">
                    {infoWindowTarget.type === "checkpoint" ? (
                      <div>
                        <strong>{infoWindowData.title}</strong>
                        <p>{infoWindowData.time}</p>
                        {infoWindowData.address && (
                          <p style={{ margin: "2px 0 4px", fontSize: "11px", color: "#64748b" }}>
                            📍 {infoWindowData.address}
                          </p>
                        )}
                        {infoWindowData.battery != null && (
                          <small>
                            Battery: {infoWindowData.battery}%
                            {infoWindowData.speed != null
                              ? ` · Speed: ${infoWindowData.speed} km/h`
                              : ""}
                          </small>
                        )}
                      </div>
                    ) : infoWindowTarget.type === "employee" ? (
                      <div>
                        <strong>{infoWindowData.name || "Employee"}</strong>
                        <p>
                          Shift: {isEmployeeOnShift(infoWindowData)
                            ? `On shift${getDisplayTime(infoWindowData.shiftCheckIn)
                              ? ` · punched in ${getDisplayTime(infoWindowData.shiftCheckIn)}`
                              : ""}`
                            : infoWindowData.shiftStatus || "Unavailable"}
                        </p>
                        <p>
                          GPS: {!isValidCoordinatePair(infoWindowData.latitude, infoWindowData.longitude)
                            ? "Location unavailable"
                            : infoWindowData.is_stale_location
                              ? "Stale"
                              : infoWindowData.isActiveTracking
                                ? "Live"
                                : "Last known"}
                        </p>
                        {(infoWindowData.last_ping_at || infoWindowData.last_ping_formatted) && (
                          <p>
                            Last GPS update: {formatPingTimestamp(
                              infoWindowData.last_ping_at || infoWindowData.last_ping_formatted
                            )}
                          </p>
                        )}
                        {isValidCoordinatePair(infoWindowData.latitude, infoWindowData.longitude) && (
                          <p>
                            Location: {Number(infoWindowData.latitude).toFixed(6)}, {Number(infoWindowData.longitude).toFixed(6)}
                          </p>
                        )}
                      </div>
                    ) : infoWindowTarget.type === "visit-group" ? (
                      <div className="fleet-visit-group-popup">
                        <strong>{infoWindowData.length} visits near this location</strong>
                        {infoWindowData.map((visit) => (
                          <div className="fleet-visit-group-popup__item" key={visit.id}>
                            <strong>{visit.companyName || visit.leadName || "Visit"}</strong>
                            <p>Assigned to: {visit.employeeName || selectedEmployee?.name || "Employee unavailable"}</p>
                            {visit.address && <p>{visit.address}</p>}
                            <p>Status: {getVisitStatusLabel(visit)}</p>
                            {(visit.scheduledDate || visit.scheduledTime) && (
                              <p>
                                Scheduled: {[visit.scheduledDate, visit.scheduledTime].filter(Boolean).join(" · ")}
                              </p>
                            )}
                            {getDisplayTime(visit.checkInTime) && (
                              <p>Check-in: {getDisplayTime(visit.checkInTime)}</p>
                            )}
                            {getDisplayTime(visit.checkOutTime) && (
                              <p>Check-out: {getDisplayTime(visit.checkOutTime)}</p>
                            )}
                            <div className="fleet-lead-card__footer">
                              <button
                                type="button"
                                className="fleet-btn-xs"
                                onClick={() => handleFocusLead(visit)}
                              >
                                Focus
                              </button>
                              <button
                                type="button"
                                className="fleet-btn-xs"
                                onClick={() => onSelectVisit(visit)}
                              >
                                Visit details
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div>
                        <strong>{infoWindowData.companyName || infoWindowData.leadName || "Visit"}</strong>
                        <p>Assigned to: {infoWindowData.employeeName || selectedEmployee?.name || "Employee unavailable"}</p>
                        {infoWindowData.address && <p>{infoWindowData.address}</p>}
                        <p>Status: {getVisitStatusLabel(infoWindowData)}</p>
                        {(infoWindowData.scheduledDate || infoWindowData.scheduledTime) && (
                          <p>
                            Scheduled: {[infoWindowData.scheduledDate, infoWindowData.scheduledTime].filter(Boolean).join(" · ")}
                          </p>
                        )}
                        {getDisplayTime(infoWindowData.checkInTime) && (
                          <p>Check-in: {getDisplayTime(infoWindowData.checkInTime)}</p>
                        )}
                        {getDisplayTime(infoWindowData.checkOutTime) && (
                          <p>Check-out: {getDisplayTime(infoWindowData.checkOutTime)}</p>
                        )}
                        <button
                          type="button"
                          className="fleet-btn-xs"
                          onClick={() => onSelectVisit(infoWindowData)}
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
            <LeafletMapController center={[currentMapCenter.lat, currentMapCenter.lng]} bounds={leafletRouteBounds} />

            {/* Rep Markers */}
            {employees.map((emp) => {
              const coords = isValidCoordinatePair(emp.latitude, emp.longitude);
              if (!coords) return null;
              const isSelected = String(selectedRepId) === String(emp.id);

              return (
                <Marker
                  key={`leaflet-rep-${emp.id}`}
                  position={[coords.lat, coords.lng]}
                  icon={createLeafletIcon(createEmployeeMarkerIcon(isSelected))}
                  eventHandlers={{
                    click: () => {
                      handleSelectRep(emp);
                      setInfoWindowTarget({
                        type: "employee",
                        data: emp,
                        lat: coords.lat,
                        lng: coords.lng,
                      });
                    },
                  }}
                >
                  <Popup>
                    <div className="fleet-popup">
                      <strong>{emp.name || "Employee"}</strong>
                      <div className="fleet-popup__meta">
                        {isEmployeeOnShift(emp)
                          ? `On shift${getDisplayTime(emp.shiftCheckIn) ? ` · punched in ${getDisplayTime(emp.shiftCheckIn)}` : ""}`
                          : emp.shiftStatus || "Shift status unavailable"}
                      </div>
                      <div className="fleet-popup__meta">
                        {emp.is_stale_location
                          ? "Stale GPS"
                          : emp.isActiveTracking
                            ? "Live GPS"
                            : "Last known GPS"}
                        {emp.last_ping_at
                          ? ` · ${formatPingTimestamp(emp.last_ping_at)}`
                          : ""}
                      </div>
                      <div className="fleet-popup__meta">
                        {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {/* Selected Rep Visits */}
            {selectedRepMapVisitGroups.map((group) => {
              const isGrouped = group.visits.length > 1;
              const firstVisit = group.visits[0];
              const isFocused = group.visits.some(
                (visit) => focusedLead?.id === visit.id
              );
              const markerIcon = isGrouped
                ? createVisitGroupMarkerIcon(group, isFocused)
                : createVisitMarkerIcon(firstVisit, isFocused);

              return (
                <Marker
                  key={`leaflet-visit-group-${group.key}`}
                  position={[group.coords.lat, group.coords.lng]}
                  icon={createLeafletIcon(markerIcon, true, isGrouped)}
                  eventHandlers={{
                    click: () => {
                      if (isGrouped) {
                        handleVisitGroupClick(group);
                      } else {
                        handleFocusLead(firstVisit);
                      }
                    },
                  }}
                >
                  <Popup>
                    <div className="fleet-popup fleet-visit-group-popup">
                      <strong>
                        {isGrouped
                          ? `${group.visits.length} visits near this location`
                          : firstVisit.companyName || firstVisit.leadName || "Visit"}
                      </strong>
                      {group.visits.map((visit) => (
                        <div className="fleet-visit-group-popup__item" key={visit.id}>
                          <strong>{visit.companyName || visit.leadName || "Visit"}</strong>
                          {visit.address && <p>{visit.address}</p>}
                          <div className="fleet-popup__meta">
                            Assigned to: {visit.employeeName || selectedEmployee?.name || "Employee unavailable"}
                          </div>
                          <div className="fleet-popup__meta">
                            Status: {getVisitStatusLabel(visit)}
                          </div>
                          {(visit.scheduledDate || visit.scheduledTime) && (
                            <div className="fleet-popup__meta">
                              Scheduled: {[visit.scheduledDate, visit.scheduledTime].filter(Boolean).join(" · ")}
                            </div>
                          )}
                          {getDisplayTime(visit.checkInTime) && (
                            <div className="fleet-popup__meta">
                              Check-in: {getDisplayTime(visit.checkInTime)}
                            </div>
                          )}
                          {getDisplayTime(visit.checkOutTime) && (
                            <div className="fleet-popup__meta">
                              Check-out: {getDisplayTime(visit.checkOutTime)}
                            </div>
                          )}
                          <div className="fleet-lead-card__footer">
                            <button
                              type="button"
                              className="fleet-btn-xs"
                              onClick={() => handleFocusLead(visit)}
                            >
                              Focus
                            </button>
                            <button
                              type="button"
                              className="fleet-btn-xs"
                              onClick={() => onSelectVisit(visit)}
                            >
                              Details
                            </button>
                          </div>
                        </div>
                      ))}
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

            {/* 5-Day Road Route Polyline on Leaflet (Snaps along actual street driving paths) */}
            {historyRouteCoords.length > 1 && (
              <Polyline
                positions={
                  historyRoadCoords && historyRoadCoords.length > 0
                    ? historyRoadCoords.map((c) => [c.lat, c.lng])
                    : historyRouteCoords.map((c) => [c.lat, c.lng])
                }
                pathOptions={{ color: "#7c3aed", weight: 6, opacity: 0.92 }}
              />
            )}

            {/* Intermediate Waypoints along Daily Route on Leaflet */}
            {historyRouteCoords.length > 2 &&
              historyRouteCoords.slice(1, -1).map((pt, idx) => (
                <Marker
                  key={`leaflet-waypoint-${pt.index ?? idx}-${pt.timestamp ?? idx}`}
                  position={[pt.lat, pt.lng]}
                  icon={createLeafletWaypointIcon(idx + 1)}
                >
                  <Popup>
                    <div className="fleet-popup">
                      <strong>{pt.label || `Waypoint ${idx + 1}`}</strong>
                      <p>{pt.time || formatPingTimestamp(pt.timestamp)}</p>
                      {pt.address && <p>{pt.address}</p>}
                      {pt.battery != null && <p>Battery: {pt.battery}%</p>}
                    </div>
                  </Popup>
                </Marker>
              ))}

            {/* Start Marker Leaflet */}
            {historyRouteCoords.length > 0 && (
              <Marker
                key="leaflet-route-start"
                position={[historyRouteCoords[0].lat, historyRouteCoords[0].lng]}
                icon={createLeafletCheckpointIcon("IN")}
              >
                <Popup>
                  <div className="fleet-popup">
                    <strong>First recorded location</strong>
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
                  activeCheckOutTime || routeSummary?.is_finalized || !isViewingToday ? "OUT" : "NOW",
                  Boolean(activeCheckOutTime || routeSummary?.is_finalized || !isViewingToday)
                )}
              >
                <Popup>
                  <div className="fleet-popup">
                    <strong>
                      {activeCheckOutTime || routeSummary?.is_finalized || !isViewingToday
                        ? "🔴 Shift Check-out Location"
                        : "Last recorded location"}
                    </strong>
                    <p>
                      {activeCheckOutTime || formatPingTimestamp(
                        historyRouteCoords[historyRouteCoords.length - 1].timestamp
                      )}
                    </p>
                    {activeCheckOutAddress && <p>{activeCheckOutAddress}</p>}
                  </div>
                </Popup>
              </Marker>
            )}
          </MapContainer>
        )}

        {/* Shift attendance and visit activity are separate states. */}
        {selectedEmployee && isViewingToday && !selectedEmployee.isActiveTracking && (
          <div className="fleet-stale-warning-hud">
            <div className="fleet-stale-warning-hud__icon">
              {isEmployeeOnShift(selectedEmployee) ? (
                <Clock size={16} color="#475569" />
              ) : isCompletedVisit({ visitStatus: selectedEmployee.visit_stage }) ? (
                <CheckCircle2 size={16} color="#d97706" />
              ) : (
                <AlertTriangle size={16} />
              )}
            </div>
            <div className="fleet-stale-warning-hud__content">
              <div className="fleet-stale-warning-hud__title">
                {isEmployeeOnShift(selectedEmployee)
                  ? `${selectedEmployee.name} is on shift`
                  : selectedEmployee.shiftStatus === "NOT_STARTED" ||
                    selectedEmployee.shiftStatus === "ABSENT"
                  ? `${selectedEmployee.name} is off shift`
                  : `${selectedEmployee.name} has no live GPS`}
              </div>
              <div className="fleet-stale-warning-hud__desc">
                {isEmployeeOnShift(selectedEmployee) ? (
                  <>
                    Shift punch-in
                    {getDisplayTime(selectedEmployee.shiftCheckIn) && (
                      <>: <strong>{getDisplayTime(selectedEmployee.shiftCheckIn)}</strong></>
                    )}
                    .{" "}
                    {selectedRepInProgressVisit
                      ? `Visit in progress: ${selectedRepInProgressVisit.companyName || selectedRepInProgressVisit.leadName || "assigned visit"}. Live GPS is unavailable.`
                      : "No visit is checked in; shift punch-in does not start a visit."}
                  </>
                ) : selectedEmployee.shiftStatus === "NOT_STARTED" ||
                  selectedEmployee.shiftStatus === "ABSENT" ? (
                  <>
                    No active shift punch-in is recorded.
                  </>
                ) : selectedEmployee.latitude != null ? (
                  <>
                    Shift status is{" "}
                    <strong>{attendanceUnavailable ? "unavailable" : "not returned"}</strong>.
                    Showing the last known GPS location recorded at{" "}
                    <strong>{formatPingTimestamp(selectedEmployee.last_ping_at || selectedEmployee.last_ping_formatted)}</strong>
                    {` (${formatLastSeenAgo(selectedEmployee.last_ping_at, selectedEmployee.last_seen_human)})`}.
                  </>
                ) : (
                  <>
                    {attendanceUnavailable
                      ? "Shift attendance could not be loaded. "
                      : "Shift status was not returned. "}
                    No live GPS location is available.
                  </>
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
                {focusedLead.companyName || focusedLead.leadName || "Visit"}
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
            <UserRound size={14} className="fleet-legend-person" />
            <span>Employee location</span>
          </div>
          <div className="fleet-legend-item">
            <MapPin size={14} className="fleet-legend-visit fleet-legend-visit--scheduled" />
            <span>Scheduled / assigned</span>
          </div>
          <div className="fleet-legend-item">
            <MapPin size={14} className="fleet-legend-visit fleet-legend-visit--progress" />
            <span>In progress</span>
          </div>
          <div className="fleet-legend-item">
            <MapPin size={14} className="fleet-legend-visit fleet-legend-visit--completed" />
            <span>Completed</span>
          </div>
        </div>
      </main>

      {/* ==================================================================== */}
      {/* Selected employee and assigned visit details */}
      {/* ==================================================================== */}
      <aside className="fleet-col fleet-col--right">
        {selectedEmployee ? (
          <>
            <div className="fleet-col__header">
              <div className="fleet-selected-employee-header">
                <div>
                  <h4 className="fleet-rep-title">{selectedEmployee.name}</h4>
                  <p className="fleet-rep-code" style={{ fontSize: "12px", color: "#64748b", margin: "2px 0 4px" }}>
                    ID: {selectedEmployee.employee_code || selectedEmployee.employee_id || selectedEmployee.id}
                  </p>
                  <p className="fleet-rep-subtitle">
                    {isViewingToday ? (
                      isEmployeeOnShift(selectedEmployee)
                        ? `On shift${getDisplayTime(selectedEmployee.shiftCheckIn) ? ` · punched in ${getDisplayTime(selectedEmployee.shiftCheckIn)}` : ""}. ${
                            selectedRepInProgressVisit
                              ? `Visit in progress: ${selectedRepInProgressVisit.companyName || selectedRepInProgressVisit.leadName || "Assigned visit"}.`
                              : "No visit is checked in."
                          }${selectedEmployee.isActiveTracking ? " Live GPS is active." : ""}`
                        : attendanceUnavailable || !selectedEmployee.shiftStatus
                        ? "Shift status unavailable; GPS and visit status are separate."
                        : selectedEmployee.shiftStatus === "NOT_STARTED" ||
                          selectedEmployee.shiftStatus === "ABSENT"
                        ? "No shift punch-in is recorded."
                        : `Attendance status: ${selectedEmployee.shiftStatus}`
                    ) : (
                      activeAttendanceStatus === "CHECKED_OUT"
                        ? `Shift ended · punched out${activeCheckOutTime ? ` at ${getDisplayTime(activeCheckOutTime) || activeCheckOutTime}` : ""}.`
                        : activeAttendanceStatus === "CHECKED_IN"
                        ? `Shift started · punched in${activeCheckInTime ? ` at ${getDisplayTime(activeCheckInTime) || activeCheckInTime}` : ""}.`
                        : `Route on ${routeSummary?.selected_date_label || activeSelectedDate}.`
                    )}
                  </p>
                  {selectedEmployee.visit_stage && isViewingToday && (
                    <p className="fleet-visit-stage">
                      Visit tracking: {String(selectedEmployee.visit_stage).replace(/_/g, " ")}
                      {selectedEmployee.check_in_time_formatted
                        ? ` · visit check-in ${selectedEmployee.check_in_time_formatted}`
                        : ""}
                    </p>
                  )}
                </div>

                <span
                  className={`fleet-shift-pill ${
                    isViewingToday
                      ? isEmployeeOnShift(selectedEmployee)
                        ? "fleet-shift-pill--active"
                        : selectedEmployee.isActiveTracking
                        ? "fleet-shift-pill--gps"
                        : ""
                      : activeAttendanceStatus === "CHECKED_OUT"
                      ? "fleet-shift-pill--completed"
                      : "fleet-shift-pill--active"
                  }`}
                >
                  {isViewingToday
                    ? isEmployeeOnShift(selectedEmployee)
                      ? "ON SHIFT"
                      : selectedEmployee.isActiveTracking
                      ? "GPS LIVE"
                      : selectedEmployee.shiftStatus === "NOT_STARTED" ||
                        selectedEmployee.shiftStatus === "ABSENT"
                      ? "OFF SHIFT"
                      : attendanceUnavailable
                      ? "SHIFT UNKNOWN"
                      : "STATUS UNKNOWN"
                    : activeAttendanceStatus === "CHECKED_OUT"
                    ? "SHIFT ENDED"
                    : activeAttendanceStatus === "CHECKED_IN"
                    ? "PUNCHED IN"
                    : "OFF SHIFT"}
                </span>
              </div>

              {/* Authoritative Workday Attendance & Field Telemetry Card */}
              <div className="fleet-attendance-tracking-card">
                <div className="fleet-att-row">
                  <span className="fleet-att-label">Attendance:</span>
                  <span className={`fleet-att-badge fleet-att-badge--${String(activeAttendanceStatus || "not_checked_in").toLowerCase()}`}>
                    {activeAttendanceStatus === "CHECKED_IN"
                      ? "Checked In"
                      : activeAttendanceStatus === "CHECKED_OUT"
                      ? "Checked Out"
                      : "Not Checked In"}
                  </span>
                </div>

                <div className="fleet-att-row">
                  <span className="fleet-att-label">GPS Telemetry:</span>
                  {isViewingToday ? (
                    <span className={`fleet-gps-badge ${selectedEmployee.isActiveTracking && !selectedEmployee.is_stale_location ? "live" : selectedEmployee.is_stale_location ? "stale" : selectedEmployee.hasLiveGps ? "cached" : "none"}`}>
                      {selectedEmployee.isActiveTracking && !selectedEmployee.is_stale_location
                        ? "🟢 Live GPS"
                        : selectedEmployee.is_stale_location
                        ? "⚠️ Stale GPS (> 2m ago)"
                        : selectedEmployee.hasLiveGps
                        ? "Last known GPS"
                        : "Location unavailable"}
                    </span>
                  ) : (
                    <span className="fleet-gps-badge cached">
                      📁 Historical Route
                    </span>
                  )}
                </div>

                <div className="fleet-att-row">
                  <span className="fleet-att-label">Check-in:</span>
                  <span className="fleet-att-val">
                    {activeCheckInTime ? (getDisplayTime(activeCheckInTime) || activeCheckInTime) : "—"}
                    {activeCheckInAddress && (
                      <span className="fleet-att-subtext">📍 {activeCheckInAddress}</span>
                    )}
                  </span>
                </div>

                {(activeCheckOutTime || !isViewingToday) && (
                  <div className="fleet-att-row">
                    <span className="fleet-att-label">Check-out:</span>
                    <span className="fleet-att-val">
                      {activeCheckOutTime ? (getDisplayTime(activeCheckOutTime) || activeCheckOutTime) : "—"}
                      {activeCheckOutAddress && (
                        <span className="fleet-att-subtext">📍 {activeCheckOutAddress}</span>
                      )}
                    </span>
                  </div>
                )}

                <div className="fleet-att-row">
                  <span className="fleet-att-label">Day Distance:</span>
                  <strong className="fleet-att-val text-emerald">
                    {activeDistanceKm != null ? `${activeDistanceKm} KM` : "0 KM"}
                  </strong>
                </div>

                <div className="fleet-att-row">
                  <span className="fleet-att-label">{isViewingToday ? "Last GPS Ping:" : "Route Date:"}</span>
                  <span className="fleet-att-val">
                    {isViewingToday
                      ? (selectedEmployee.last_ping_formatted || (selectedEmployee.last_ping_at ? formatPingTimestamp(selectedEmployee.last_ping_at) : "—"))
                      : (routeSummary?.selected_date_label || activeSelectedDate || "Historical Day")}
                  </span>
                </div>

                <a
                  href={`/employees/${selectedEmployee.employee_id || selectedEmployee.id}`}
                  className="fleet-open-profile-btn"
                  title="Open salesperson profile and full attendance details"
                >
                  <UserRound size={13} />
                  Open Salesperson Profile
                </a>
              </div>

              <div className="fleet-counter-row">
                <div className="fleet-counter-card">
                  <span className="fleet-counter-card__label">Assigned</span>
                  <strong className="fleet-counter-card__num">{selectedRepVisits.length}</strong>
                </div>
                <div className="fleet-counter-card fleet-counter-card--done">
                  <span className="fleet-counter-card__label">Completed</span>
                  <strong className="fleet-counter-card__num">{completedVisits.length}</strong>
                </div>
                <div className="fleet-counter-card fleet-counter-card--left">
                  <span className="fleet-counter-card__label">Active</span>
                  <strong className="fleet-counter-card__num">{pendingVisits.length}</strong>
                </div>
              </div>
            </div>

            <div className="fleet-lead-feed">
              <div className="fleet-feed-section-header">
                Active assigned visits ({pendingVisits.length})
              </div>

              {visitsUnavailable ? (
                <div className="fleet-empty-state" role="status">
                  Assigned visits could not be loaded. Refresh to try again.
                </div>
              ) : pendingVisits.length > 0 ? (
                pendingVisits.map((visit, idx) => {
                  const vLat = visit.leadLatitude ?? visit.latitude;
                  const vLng = visit.leadLongitude ?? visit.longitude;
                  const visitCoords = isValidCoordinatePair(vLat, vLng);
                  const employeeCoords = isValidCoordinatePair(
                    selectedEmployee.latitude,
                    selectedEmployee.longitude
                  );
                  const distMeters =
                    employeeCoords && visitCoords
                      ? calculateDistance(
                          employeeCoords.lat,
                          employeeCoords.lng,
                          visitCoords.lat,
                          visitCoords.lng
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
                          {visit.companyName || visit.leadName || "Visit"}
                        </strong>
                        <span className={`fleet-visit-status fleet-visit-status--${visit.visitStatus?.toLowerCase() || "unknown"}`}>
                          {getVisitStatusLabel(visit)}
                        </span>
                      </div>

                      <div className="fleet-lead-card__details">
                        {visit.address && (
                          <div className="fleet-lead-meta">
                            <MapPin size={12} /> {visit.address}
                          </div>
                        )}
                        {(visit.scheduledDate || visit.scheduledTime) && (
                          <div className="fleet-visit-time">
                            <Calendar size={12} />
                            {visit.scheduledDate || ""}
                            {visit.scheduledDate && visit.scheduledTime ? " · " : ""}
                            {visit.scheduledTime || ""}
                          </div>
                        )}
                        {getDisplayTime(visit.checkInTime) && (
                          <div className="fleet-visit-time">
                            <Clock size={12} />
                            Visit check-in: {getDisplayTime(visit.checkInTime)}
                          </div>
                        )}
                        {getDisplayTime(visit.checkOutTime) && (
                          <div className="fleet-visit-time">
                            <Clock size={12} />
                            Visit check-out: {getDisplayTime(visit.checkOutTime)}
                          </div>
                        )}
                        {!visitCoords && (
                          <div className="fleet-visit-location-unavailable">
                            No map location available for this visit.
                          </div>
                        )}
                      </div>

                      {/* Distance & ETA Banner */}
                      {distMeters != null && <div
                        className={`fleet-distance-banner ${
                          isFocused ? "fleet-distance-banner--road" : ""
                        }`}
                      >
                        <div className="fleet-distance-item">
                          <span className="fleet-distance-label">
                            {isFocused && routeStats ? " Road Dist:" : "Distance:"}
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
                            {isFocused && routeStats ? "⏱ Drive Time:" : "ETA:"}
                          </span>
                          <strong className="fleet-distance-val">
                            {isFocused
                              ? routeStats?.durationText ||
                                (isCalculatingRoute ? "..." : `~${estimateEtaMins(distMeters)}`)
                              : `~${estimateEtaMins(distMeters)}`}
                          </strong>
                        </div>
                      </div>}

                      <div className="fleet-lead-card__footer">
                        <button
                          type="button"
                          className={`fleet-btn ${isFocused ? "fleet-btn--active-route" : "fleet-btn--outline"}`}
                          onClick={() => handleFocusLead(visit)}
                          disabled={!visitCoords}
                        >
                          <Navigation size={12} /> {isFocused ? "Route Active" : visitCoords ? "Focus on Map" : "No visit location"}
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
                  <MapPin size={22} color="#64748b" />
                  <p>No active assigned visits</p>
                </div>
              )}

              {/* {completedVisits.length > 0 && (
                <>
                  <div className="fleet-feed-section-header" style={{ marginTop: 20 }}>
                    🟢 COMPLETED VISITS ({completedVisits.length})
                  </div>
                  {completedVisits.map((visit) => (
                    <div key={visit.id} className="fleet-lead-card fleet-lead-card--completed">
                      <div className="fleet-lead-card__header">
                        <CheckCircle2 size={14} color="#0ba37f" />
                        <strong className="fleet-lead-card__title">
                          {visit.companyName || visit.leadName || "Visit"}
                        </strong>
                      </div>
                      {visit.checkOutTime && (
                        <small className="text-muted">
                          Completed at {visit.checkOutTime}
                        </small>
                      )}
                    </div>
                  ))}
                </>
              )} */}
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
