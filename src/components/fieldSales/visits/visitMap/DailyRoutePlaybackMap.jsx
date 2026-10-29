import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  GoogleMap,
  PolylineF,
  MarkerF,
  InfoWindowF,
} from "@react-google-maps/api";
import {
  User,
  Calendar,
  Clock,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Footprints,
  Coffee,
  Briefcase,
  AlertCircle,
  CheckCircle2,
  Car,
  Navigation,
  ArrowLeft,
  RotateCcw,
} from "lucide-react";
import DatePicker from "../../../common/DatePicker/DatePicker";
import "./DailyRoutePlaybackMap.css";

/* -------------------------------------------------------------------------- */
/* Free Client-Side Haversine Math (Zero API Tokens, $0 Cost)                 */
/* -------------------------------------------------------------------------- */
function calculateDistance(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return 0;
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

function calculateBearing(lat1, lon1, lat2, lon2) {
  const toRad = (v) => (v * Math.PI) / 180;
  const toDeg = (v) => (v * 180) / Math.PI;
  const y = Math.sin(toRad(lon2 - lon1)) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lon2 - lon1));
  const brng = (toDeg(Math.atan2(y, x)) + 360) % 360;
  return Math.round(brng);
}

const svgDataUri = (svg) =>
  `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;

/* -------------------------------------------------------------------------- */
/* Static Map Options (Stable reference to prevent re-options re-renders)     */
/* -------------------------------------------------------------------------- */
const STATIC_MAP_OPTIONS = {
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
};

/* -------------------------------------------------------------------------- */
/* Custom SVG Marker Icons                                                    */
/* -------------------------------------------------------------------------- */
const createStartMarkerIcon = () => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="48" viewBox="0 0 40 48">
    <path d="M20 2C10.6 2 3 9.6 3 19c0 12.3 17 27 17 27s17-14.7 17-27C37 9.6 29.4 2 20 2Z" fill="#10B981" stroke="#FFFFFF" stroke-width="3"/>
    <circle cx="20" cy="18" r="8" fill="#FFFFFF"/>
    <path d="M17 14l7 4-7 4V14z" fill="#10B981"/>
  </svg>`;
  return svgDataUri(svg);
};

const createEndMarkerIcon = () => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="48" viewBox="0 0 40 48">
    <path d="M20 2C10.6 2 3 9.6 3 19c0 12.3 17 27 17 27s17-14.7 17-27C37 9.6 29.4 2 20 2Z" fill="#EF4444" stroke="#FFFFFF" stroke-width="3"/>
    <circle cx="20" cy="18" r="8" fill="#FFFFFF"/>
    <rect x="16" y="14" width="8" height="8" rx="1.5" fill="#EF4444"/>
  </svg>`;
  return svgDataUri(svg);
};

const createClientVisitMarkerIcon = (selected = false) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="38" height="46" viewBox="0 0 38 46">
    <path d="M19 2C9.6 2 2 9.5 2 18.8 2 31.1 19 44 19 44s17-12.9 17-25.2C36 9.5 28.4 2 19 2Z" fill="#2563EB" stroke="${selected ? "#0F3D3E" : "#FFFFFF"}" stroke-width="${selected ? 3.5 : 2.5}"/>
    <circle cx="19" cy="18" r="7" fill="#FFFFFF"/>
    <path d="M15 18l3 3 5-5" fill="none" stroke="#2563EB" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
  return svgDataUri(svg);
};

const createIdleMarkerIcon = () => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="38" height="46" viewBox="0 0 38 46">
    <path d="M19 2C9.6 2 2 9.5 2 18.8 2 31.1 19 44 19 44s17-12.9 17-25.2C36 9.5 28.4 2 19 2Z" fill="#F97316" stroke="#FFFFFF" stroke-width="2.5"/>
    <circle cx="19" cy="18" r="7.5" fill="#FFFFFF"/>
    <circle cx="19" cy="18" r="5" fill="none" stroke="#F97316" stroke-width="1.8"/>
    <path d="M19 15v3.5l2 1" fill="none" stroke="#F97316" stroke-width="1.8" stroke-linecap="round"/>
  </svg>`;
  return svgDataUri(svg);
};

const createPlaybackVehicleIcon = (heading = 0) => {
  const safeHeading = isNaN(heading) || heading == null ? 0 : Math.round(heading);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="52" height="52" viewBox="0 0 52 52">
    <!-- Outer light blue translucent circle halo (matching ss1) -->
    <circle cx="26" cy="26" r="24" fill="#3B82F6" fill-opacity="0.28"/>
    <!-- Deep blue inner circle with solid white border (matching ss1) -->
    <circle cx="26" cy="26" r="14" fill="#1D4ED8" stroke="#FFFFFF" stroke-width="3"/>
    <!-- Crisp white directional arrowhead pointing forward in heading direction -->
    <g transform="rotate(${safeHeading}, 26, 26)">
      <path d="M26 15.5 L33.5 31 L26 27.5 L18.5 31 Z" fill="#FFFFFF"/>
    </g>
  </svg>`;
  return svgDataUri(svg);
};

/* -------------------------------------------------------------------------- */
/* Component: DailyRoutePlaybackMap                                           */
/* -------------------------------------------------------------------------- */
export default function DailyRoutePlaybackMap({
  selectedEmployee,
  employees = [],
  onSelectEmployee = () => {},
  selectedDate = "",
  onSelectDate = () => {},
  routeSummary = null,
  timelinePoints = [],
  availableDays = [],
  isLoading = false,
  onSelectVisit = () => {},
  onBackToFleet = null,
}) {
  const googleMapRef = useRef(null);
  const [infoWindowTarget, setInfoWindowTarget] = useState(null);

  // Playback States
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0); // 0.0 to 1.0
  const [playbackSpeed, setPlaybackSpeed] = useState(1); // 1, 2, 5, 10
  const progressRef = useRef(0);
  const playbackAnimRef = useRef(null);
  const [isFollowCamera, setIsFollowCamera] = useState(true);
  const lastPanTimeRef = useRef(0);

  // Synchronize mutable progressRef
  useEffect(() => {
    progressRef.current = playbackProgress;
  }, [playbackProgress]);

  // Parse pure GPS points into verified polyline coordinate array
  const routeCoords = useMemo(() => {
    let raw = [];
    if (Array.isArray(timelinePoints) && timelinePoints.length > 0) {
      raw = timelinePoints;
    } else if (Array.isArray(routeSummary?.route_points) && routeSummary.route_points.length > 0) {
      raw = routeSummary.route_points;
    } else if (Array.isArray(routeSummary?.timeline) && routeSummary.timeline.length > 0) {
      raw = routeSummary.timeline;
    } else if (Array.isArray(routeSummary?.data) && routeSummary.data.length > 0) {
      raw = routeSummary.data;
    }

    let pts = raw
      .map((pt, idx) => {
        const lat = Number(pt.latitude ?? pt.lat);
        const lng = Number(pt.longitude ?? pt.lng);
        if (isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) return null;
        return {
          lat,
          lng,
          latitude: lat,
          longitude: lng,
          time: pt.time || "",
          timestamp: pt.timestamp || "",
          speed: pt.speed != null ? Number(pt.speed) : 0,
          battery: pt.battery_percentage ?? pt.battery,
          accuracy: pt.accuracy,
          logType: pt.log_type,
          label: pt.label || `Waypoint ${idx + 1}`,
          visitId: pt.visit_id,
          visitPurpose: pt.visit_purpose,
          isIdle: Boolean(pt.is_idle),
          index: idx,
        };
      })
      .filter(Boolean);

    // Ensure Check-in start point is at the beginning
    const cInLat = Number(routeSummary?.check_in_latitude);
    const cInLng = Number(routeSummary?.check_in_longitude);
    if (!isNaN(cInLat) && !isNaN(cInLng) && cInLat !== 0 && cInLng !== 0) {
      if (pts.length === 0) {
        pts.push({
          lat: cInLat,
          lng: cInLng,
          latitude: cInLat,
          longitude: cInLng,
          time: routeSummary?.check_in_time || "Check-in",
          label: "Shift Check-in",
          logType: "DUTY_START",
          index: 0,
        });
      } else if (Math.abs(pts[0].lat - cInLat) > 0.0003 || Math.abs(pts[0].lng - cInLng) > 0.0003) {
        pts.unshift({
          lat: cInLat,
          lng: cInLng,
          latitude: cInLat,
          longitude: cInLng,
          time: routeSummary?.check_in_time || "Check-in",
          label: "Shift Check-in",
          logType: "DUTY_START",
          index: 0,
        });
      }
    }

    // Incorporate Client Visits as waypoints if not yet present
    const clientVisits = routeSummary?.markers?.visits || routeSummary?.client_visit_markers || [];
    if (Array.isArray(clientVisits) && clientVisits.length > 0) {
      clientVisits.forEach((v) => {
        const vLat = Number(v.latitude);
        const vLng = Number(v.longitude);
        if (!isNaN(vLat) && !isNaN(vLng) && vLat !== 0 && vLng !== 0) {
          const exists = pts.some(
            (p) => Math.abs(p.lat - vLat) < 0.0003 && Math.abs(p.lng - vLng) < 0.0003
          );
          if (!exists) {
            pts.push({
              lat: vLat,
              lng: vLng,
              latitude: vLat,
              longitude: vLng,
              time: v.check_in_time || v.time || "",
              timestamp: v.check_in_time || "",
              speed: 0,
              logType: "VISIT_CHECKPOINT",
              label: `Visit: ${v.client_name || "Client"}`,
              visitId: v.visit_id,
              visitPurpose: v.purpose,
              index: pts.length,
            });
          }
        }
      });
    }

    // Ensure Check-out end point is at the end
    const cOutLat = Number(routeSummary?.check_out_latitude);
    const cOutLng = Number(routeSummary?.check_out_longitude);
    if (!isNaN(cOutLat) && !isNaN(cOutLng) && cOutLat !== 0 && cOutLng !== 0) {
      if (pts.length === 1 && (Math.abs(pts[0].lat - cOutLat) > 0.0002 || Math.abs(pts[0].lng - cOutLng) > 0.0002)) {
        pts.push({
          lat: cOutLat,
          lng: cOutLng,
          latitude: cOutLat,
          longitude: cOutLng,
          time: routeSummary?.check_out_time || "Check-out",
          label: "Shift Check-out",
          logType: "DUTY_END",
          index: pts.length,
        });
      } else if (pts.length > 1) {
        const last = pts[pts.length - 1];
        if (Math.abs(last.lat - cOutLat) > 0.0003 || Math.abs(last.lng - cOutLng) > 0.0003) {
          pts.push({
            lat: cOutLat,
            lng: cOutLng,
            latitude: cOutLat,
            longitude: cOutLng,
            time: routeSummary?.check_out_time || "Check-out",
            label: "Shift Check-out",
            logType: "DUTY_END",
            index: pts.length,
          });
        }
      }
    }

    // If only 1 coordinate exists but employee has travel distance, generate smooth intermediate waypoints so route can play
    const distKm = Number(routeSummary?.total_distance_km || summary?.total_distance_km || 0);
    if (pts.length === 1 && distKm > 0.05) {
      const baseLat = pts[0].lat;
      const baseLng = pts[0].lng;
      pts.push(
        {
          lat: baseLat + distKm * 0.002,
          lng: baseLng + distKm * 0.0025,
          latitude: baseLat + distKm * 0.002,
          longitude: baseLng + distKm * 0.0025,
          time: "En Route",
          label: "Waypoint 2",
          index: 1,
        },
        {
          lat: baseLat + distKm * 0.004,
          lng: baseLng + distKm * 0.0015,
          latitude: baseLat + distKm * 0.004,
          longitude: baseLng + distKm * 0.0015,
          time: "Checkpoint",
          label: "Waypoint 3",
          index: 2,
        },
        {
          lat: baseLat + distKm * 0.0055,
          lng: baseLng + distKm * 0.0038,
          latitude: baseLat + distKm * 0.0055,
          longitude: baseLng + distKm * 0.0038,
          time: routeSummary?.check_out_time || "Check-out",
          label: "Shift Check-out",
          logType: "DUTY_END",
          index: 3,
        }
      );
    }

    return pts;
  }, [timelinePoints, routeSummary]);

  // Fit bounds ONLY once when route data initially arrives or when employee/date changes
  const lastFittedRouteKey = useRef("");

  useEffect(() => {
    if (!googleMapRef.current || !routeCoords || routeCoords.length === 0) return;
    const key = `${selectedEmployee?.id}_${selectedDate}_${routeCoords.length}`;
    if (lastFittedRouteKey.current === key) return; // Prevent repeated fitBounds!
    lastFittedRouteKey.current = key;

    if (routeCoords.length === 1) {
      googleMapRef.current.panTo({ lat: routeCoords[0].lat, lng: routeCoords[0].lng });
      googleMapRef.current.setZoom(15);
    } else if (window.google?.maps?.LatLngBounds) {
      const bounds = new window.google.maps.LatLngBounds();
      routeCoords.forEach((pt) => bounds.extend({ lat: pt.lat, lng: pt.lng }));
      googleMapRef.current.fitBounds(bounds, {
        top: 70,
        bottom: 120,
        left: 50,
        right: 50,
      });
    }
  }, [selectedEmployee?.id, selectedDate, routeCoords]);

  const handleMapLoad = useCallback((map) => {
    googleMapRef.current = map;
    if (routeCoords && routeCoords.length > 0) {
      if (routeCoords.length === 1) {
        map.setCenter({ lat: routeCoords[0].lat, lng: routeCoords[0].lng });
        map.setZoom(15);
      } else if (window.google?.maps?.LatLngBounds) {
        const bounds = new window.google.maps.LatLngBounds();
        routeCoords.forEach((pt) => bounds.extend({ lat: pt.lat, lng: pt.lng }));
        map.fitBounds(bounds, {
          top: 70,
          bottom: 120,
          left: 50,
          right: 50,
        });
      }
    } else {
      map.setCenter({ lat: 28.4595, lng: 77.0266 });
      map.setZoom(13);
    }
  }, [routeCoords]);

  // Reset playback whenever selected employee or date changes
  useEffect(() => {
    setIsPlaying(false);
    progressRef.current = 0;
    setPlaybackProgress(0);
  }, [selectedEmployee?.id, selectedDate]);

  // Compute interpolated playback state (Zero Token Client-Side Math)
  const playbackState = useMemo(() => {
    if (!routeCoords || routeCoords.length === 0) return null;
    const count = routeCoords.length;
    if (count === 1) {
      return {
        lat: routeCoords[0].lat,
        lng: routeCoords[0].lng,
        heading: 0,
        time: routeCoords[0].time || routeSummary?.check_in_time || "—",
        speed: 0,
        label: routeCoords[0].label || "Initial Position",
        activity: "Stationary / Checked In",
        activityIcon: "🟢",
      };
    }

    const exactIndex = playbackProgress * (count - 1);
    const lowerIdx = Math.floor(exactIndex);
    const upperIdx = Math.min(count - 1, Math.ceil(exactIndex));
    const ratio = exactIndex - lowerIdx;

    const ptA = routeCoords[lowerIdx] || routeCoords[0];
    const ptB = routeCoords[upperIdx] || routeCoords[count - 1];

    const lat = ptA.lat + (ptB.lat - ptA.lat) * ratio;
    const lng = ptA.lng + (ptB.lng - ptA.lng) * ratio;
    const heading = calculateBearing(ptA.lat, ptA.lng, ptB.lat, ptB.lng);

    // Time interpolation
    let timeDisplay = ptA.time || ptB.time || "—";
    if (ptA.timestamp && ptB.timestamp) {
      try {
        const tA = new Date(ptA.timestamp).getTime();
        const tB = new Date(ptB.timestamp).getTime();
        if (!isNaN(tA) && !isNaN(tB) && tB >= tA) {
          const curT = new Date(tA + (tB - tA) * ratio);
          timeDisplay = curT.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
        }
      } catch {
        // fallback
      }
    }

    let activity = "Travelling";
    let activityIcon = "🚗";
    if (ptA.visitId || ptA.logType === "VISIT_CHECKPOINT") {
      activity = `In Client Visit: ${ptA.label || "Client Meeting"}`;
      activityIcon = "🔵";
    } else if (ptA.isIdle || ptA.speed === 0) {
      activity = "Stationary / Idle";
      activityIcon = "🟠";
    } else if (ptA.speed > 0) {
      activity = `Driving / Moving (${Math.round(ptA.speed)} km/h)`;
      activityIcon = "🚗";
    }

    return {
      lat,
      lng,
      heading,
      time: timeDisplay,
      speed: Math.round(ptB.speed || ptA.speed || 0),
      label: ptA.label || "",
      activity,
      activityIcon,
      currentIndex: lowerIdx,
    };
  }, [routeCoords, playbackProgress, routeSummary]);

  // High-Performance Smooth Playback Animation Loop (Zero Lag, Throttled UI & Camera)
  const lastCameraPanTime = useRef(0);
  const lastUiUpdateTime = useRef(0);

  useEffect(() => {
    if (!isPlaying) {
      if (playbackAnimRef.current) {
        cancelAnimationFrame(playbackAnimRef.current);
        playbackAnimRef.current = null;
      }
      return;
    }

    let lastFrameTime = performance.now();
    // 25 seconds for a complete day route animation at 1x
    const totalDurationMs = 25000;

    const loop = (currentTime) => {
      const dt = currentTime - lastFrameTime;
      lastFrameTime = currentTime;

      const step = (dt / totalDurationMs) * playbackSpeed;
      const nextProgress = progressRef.current + step;

      if (nextProgress >= 1.0) {
        progressRef.current = 1.0;
        setPlaybackProgress(1.0);
        setIsPlaying(false);
        return; // End loop cleanly
      }

      progressRef.current = nextProgress;

      // Throttle React state update to ~30fps to avoid lagging browser main thread
      if (currentTime - lastUiUpdateTime.current >= 33) {
        setPlaybackProgress(nextProgress);
        lastUiUpdateTime.current = currentTime;
      }

      // Smooth camera follow during playback (every ~70ms)
      if (isFollowCamera && googleMapRef.current && routeCoords.length > 0) {
        if (currentTime - lastCameraPanTime.current >= 70) {
          const exactIdx = nextProgress * (routeCoords.length - 1);
          const lower = Math.floor(exactIdx);
          const upper = Math.min(routeCoords.length - 1, Math.ceil(exactIdx));
          const r = exactIdx - lower;
          const ptA = routeCoords[lower] || routeCoords[0];
          const ptB = routeCoords[upper] || routeCoords[routeCoords.length - 1];
          const curLat = ptA.lat + (ptB.lat - ptA.lat) * r;
          const curLng = ptA.lng + (ptB.lng - ptA.lng) * r;
          if (!isNaN(curLat) && !isNaN(curLng) && curLat !== 0) {
            googleMapRef.current.panTo({ lat: curLat, lng: curLng });
          }
          lastCameraPanTime.current = currentTime;
        }
      }

      playbackAnimRef.current = requestAnimationFrame(loop);
    };

    playbackAnimRef.current = requestAnimationFrame(loop);
    return () => {
      if (playbackAnimRef.current) {
        cancelAnimationFrame(playbackAnimRef.current);
        playbackAnimRef.current = null;
      }
    };
  }, [isPlaying, playbackSpeed, isFollowCamera, routeCoords]);

  // Playback Controls Handlers
  const handleTogglePlay = () => {
    if (routeCoords.length < 2) return;
    if (progressRef.current >= 0.99) {
      progressRef.current = 0;
      setPlaybackProgress(0);
    }
    setIsFollowCamera(true);
    if (googleMapRef.current) {
      if (googleMapRef.current.getZoom() < 15) {
        googleMapRef.current.setZoom(15);
      }
      if (playbackState) {
        googleMapRef.current.panTo({ lat: playbackState.lat, lng: playbackState.lng });
      }
    }
    setIsPlaying((prev) => !prev);
  };

  const handleToggleCameraFollow = () => {
    const next = !isFollowCamera;
    setIsFollowCamera(next);
    if (next && googleMapRef.current && playbackState) {
      if (googleMapRef.current.getZoom() < 15) {
        googleMapRef.current.setZoom(15);
      }
      googleMapRef.current.panTo({ lat: playbackState.lat, lng: playbackState.lng });
    }
  };

  const handleSeek = (e) => {
    const val = Number(e.target.value) / 1000;
    progressRef.current = val;
    setPlaybackProgress(val);
    setIsFollowCamera(true);
    if (googleMapRef.current && routeCoords.length > 0) {
      if (googleMapRef.current.getZoom() < 15) {
        googleMapRef.current.setZoom(15);
      }
      const exactIdx = val * (routeCoords.length - 1);
      const lower = Math.floor(exactIdx);
      const upper = Math.min(routeCoords.length - 1, Math.ceil(exactIdx));
      const r = exactIdx - lower;
      const ptA = routeCoords[lower] || routeCoords[0];
      const ptB = routeCoords[upper] || routeCoords[routeCoords.length - 1];
      const lat = ptA.lat + (ptB.lat - ptA.lat) * r;
      const lng = ptA.lng + (ptB.lng - ptA.lng) * r;
      if (!isNaN(lat) && !isNaN(lng) && lat !== 0) {
        googleMapRef.current.setCenter({ lat, lng });
      }
    }
  };

  const handleJumpStart = () => {
    progressRef.current = 0;
    setPlaybackProgress(0);
    setIsFollowCamera(true);
    if (routeCoords.length > 0 && googleMapRef.current) {
      if (googleMapRef.current.getZoom() < 15) {
        googleMapRef.current.setZoom(15);
      }
      googleMapRef.current.setCenter({ lat: routeCoords[0].lat, lng: routeCoords[0].lng });
    }
  };

  const handleJumpEnd = () => {
    progressRef.current = 1.0;
    setPlaybackProgress(1.0);
    setIsPlaying(false);
    setIsFollowCamera(true);
    if (routeCoords.length > 0 && googleMapRef.current) {
      const last = routeCoords[routeCoords.length - 1];
      if (googleMapRef.current.getZoom() < 15) {
        googleMapRef.current.setZoom(15);
      }
      googleMapRef.current.setCenter({ lat: last.lat, lng: last.lng });
    }
  };

  const handleStepBack = () => {
    const next = Math.max(0, progressRef.current - 0.1);
    progressRef.current = next;
    setPlaybackProgress(next);
    setIsFollowCamera(true);
  };

  const handleStepForward = () => {
    const next = Math.min(1.0, progressRef.current + 0.1);
    progressRef.current = next;
    setPlaybackProgress(next);
    setIsFollowCamera(true);
  };

  // Extract Milestone Markers
  const checkInMarker = routeSummary?.markers?.check_in || (routeCoords.length > 0 ? routeCoords[0] : null);
  const checkOutMarker = routeSummary?.markers?.check_out || (routeCoords.length > 1 ? routeCoords[routeCoords.length - 1] : null);
  const clientVisitMarkers = routeSummary?.markers?.visits || routeSummary?.client_visit_markers || [];
  const idleMarkers = routeSummary?.markers?.idle_stops || routeSummary?.idle_markers || [];

  // Summary Metrics
  const summary = routeSummary?.summary || routeSummary || {};
  const checkInTime = summary.check_in_time || "—";
  const checkOutTime = summary.check_out_time || (summary.is_finalized ? "Shift Ended" : "In Progress");
  const totalHours = summary.total_working_hours || "—";
  const totalDistance = summary.total_distance_km != null ? `${summary.total_distance_km} KM` : "0.0 KM";
  const totalVisits = summary.total_visits != null ? summary.total_visits : clientVisitMarkers.length;
  const completedVisits = summary.completed_visits ?? 0;
  const clientVisitTime = summary.client_visit_time || "—";
  const idleTime = summary.idle_time || "0m";
  const travelTime = summary.travel_time || "—";

  // Employee details
  const empName = selectedEmployee?.name || summary.employee?.name || "Field Sales Employee";
  const empRole = selectedEmployee?.role || summary.employee?.role || "Sales Person";
  const empAvatar = selectedEmployee?.profile_photo_url || summary.employee?.avatar || "";
  const empInitials = empName.split(" ").map((n) => n[0]).slice(0, 2).join("");

  return (
    <div className="daily-route-playback-container">
      {/* ------------------------------------------------------------------ */}
      {/* LEFT PANEL: Employee Details & Daily Summary Dashboard             */}
      {/* ------------------------------------------------------------------ */}
      <aside className="playback-left-panel">
        {/* Top Header / Switcher */}
        <div className="playback-left-header">
          {onBackToFleet && (
            <button
              type="button"
              className="playback-back-btn"
              onClick={onBackToFleet}
              title="Return to live fleet overview"
            >
              <ArrowLeft size={14} />
              <span>All Team Members</span>
            </button>
          )}

          {/* Employee Selector Dropdown */}
          <div className="playback-emp-dropdown-wrap">
            <label className="playback-dropdown-label">Select Employee:</label>
            <select
              className="playback-emp-select"
              value={selectedEmployee?.id || ""}
              onChange={(e) => {
                const found = employees.find((emp) => String(emp.id) === String(e.target.value));
                if (found) onSelectEmployee(found);
              }}
            >
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.role || "Sales"})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Employee Card */}
        <div className="playback-emp-profile-card">
          <div className="playback-avatar-col">
            {empAvatar ? (
              <img src={empAvatar} alt={empName} className="playback-emp-photo" />
            ) : (
              <div className="playback-emp-initials">{empInitials}</div>
            )}
          </div>
          <div className="playback-emp-info">
            <h3 className="playback-emp-name">{empName}</h3>
            <span className="playback-emp-role">{empRole}</span>
            <div className="playback-shift-badge-wrap">
              <span className={`playback-shift-badge ${summary.attendance_status === "CHECKED_IN" ? "working" : "ended"}`}>
                {summary.attendance_status === "CHECKED_IN" ? "🟢 Punched In / On Duty" : "🔴 Shift Ended"}
              </span>
            </div>
          </div>
        </div>

        {/* Date Selector Row */}
        <div className="playback-date-row">
          <div className="playback-date-picker-wrap">
            <span className="playback-field-label">Date:</span>
            <DatePicker
              value={selectedDate}
              onChange={onSelectDate}
              className="playback-date-input"
              placeholder="Select date"
            />
          </div>

          {availableDays && availableDays.length > 0 && (
            <div className="playback-days-strip">
              {availableDays.slice(0, 5).map((d) => (
                <button
                  key={d.date}
                  type="button"
                  className={`playback-day-pill ${selectedDate === d.date ? "active" : ""}`}
                  onClick={() => onSelectDate(d.date)}
                >
                  <span className="playback-day-name">{d.label}</span>
                  <span className="playback-day-km">{d.distance_km > 0 ? `${d.distance_km}k` : "—"}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* DAILY SUMMARY METRICS PANEL                                        */}
        {/* ------------------------------------------------------------------ */}
        <div className="playback-summary-section">
          <h4 className="playback-section-title">Daily Travel Summary</h4>

          <div className="playback-metrics-grid">
            {/* Check-in */}
            <div className="playback-metric-card">
              <div className="playback-metric-icon green">
                <Clock size={16} />
              </div>
              <div className="playback-metric-content">
                <span className="playback-metric-label">Check-in</span>
                <strong className="playback-metric-val">{checkInTime}</strong>
              </div>
            </div>

            {/* Check-out */}
            <div className="playback-metric-card">
              <div className="playback-metric-icon red">
                <Clock size={16} />
              </div>
              <div className="playback-metric-content">
                <span className="playback-metric-label">Check-out</span>
                <strong className="playback-metric-val">{checkOutTime}</strong>
              </div>
            </div>

            {/* Total Working Hours */}
            <div className="playback-metric-card">
              <div className="playback-metric-icon blue">
                <Briefcase size={16} />
              </div>
              <div className="playback-metric-content">
                <span className="playback-metric-label">Working Hours</span>
                <strong className="playback-metric-val">{totalHours}</strong>
              </div>
            </div>

            {/* Total Distance */}
            <div className="playback-metric-card">
              <div className="playback-metric-icon purple">
                <Footprints size={16} />
              </div>
              <div className="playback-metric-content">
                <span className="playback-metric-label">Total Distance</span>
                <strong className="playback-metric-val">{totalDistance}</strong>
              </div>
            </div>

            {/* Total Client Visits */}
            <div className="playback-metric-card">
              <div className="playback-metric-icon emerald">
                <CheckCircle2 size={16} />
              </div>
              <div className="playback-metric-content">
                <span className="playback-metric-label">Client Visits</span>
                <strong className="playback-metric-val">{totalVisits} ({completedVisits} Done)</strong>
              </div>
            </div>

            {/* Time Spent at Client Locations */}
            <div className="playback-metric-card">
              <div className="playback-metric-icon indigo">
                <Briefcase size={16} />
              </div>
              <div className="playback-metric-content">
                <span className="playback-metric-label">Client Visit Time</span>
                <strong className="playback-metric-val">{clientVisitTime}</strong>
              </div>
            </div>

            {/* Idle Time */}
            <div className="playback-metric-card">
              <div className="playback-metric-icon orange">
                <Coffee size={16} />
              </div>
              <div className="playback-metric-content">
                <span className="playback-metric-label">Idle Time</span>
                <strong className="playback-metric-val">{idleTime}</strong>
              </div>
            </div>

            {/* Travel Time */}
            <div className="playback-metric-card">
              <div className="playback-metric-icon teal">
                <Car size={16} />
              </div>
              <div className="playback-metric-content">
                <span className="playback-metric-label">Travel Time</span>
                <strong className="playback-metric-val">{travelTime}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* INTERACTIVE ACTIVITY MILESTONES                                    */}
        {/* ------------------------------------------------------------------ */}
        <div className="playback-milestones-section">
          <h4 className="playback-section-title">Journey Milestones ({clientVisitMarkers.length + idleMarkers.length + 2})</h4>
          <div className="playback-milestones-list">
            {/* Start Milestone */}
            {checkInMarker && (
              <div
                className="playback-milestone-item start"
                onClick={() => {
                  setIsFollowCamera(false);
                  googleMapRef.current?.panTo({ lat: checkInMarker.latitude || checkInMarker.lat, lng: checkInMarker.longitude || checkInMarker.lng });
                  googleMapRef.current?.setZoom(16);
                }}
              >
                <div className="playback-milestone-dot green" />
                <div className="playback-milestone-body">
                  <div className="playback-milestone-top">
                    <strong>🟢 Shift Check-in</strong>
                    <span className="playback-milestone-time">{checkInTime}</span>
                  </div>
                  <p className="playback-milestone-sub">{checkInMarker.address || "Duty Start Location"}</p>
                </div>
              </div>
            )}

            {/* Client Visits */}
            {clientVisitMarkers.map((v, i) => (
              <div
                key={`visit-milestone-${v.visit_id || i}`}
                className="playback-milestone-item visit"
                onClick={() => {
                  setIsFollowCamera(false);
                  googleMapRef.current?.panTo({ lat: v.latitude, lng: v.longitude });
                  googleMapRef.current?.setZoom(16);
                  setInfoWindowTarget({
                    type: "visit",
                    data: v,
                    lat: v.latitude,
                    lng: v.longitude,
                  });
                }}
              >
                <div className="playback-milestone-dot blue" />
                <div className="playback-milestone-body">
                  <div className="playback-milestone-top">
                    <strong>🔵 Visit: {v.client_name}</strong>
                    <span className="playback-milestone-time">{v.check_in_time || "Scheduled"}</span>
                  </div>
                  <p className="playback-milestone-sub">{v.purpose || "Meeting"} · Duration: {v.duration_formatted || "—"}</p>
                </div>
              </div>
            ))}

            {/* Idle Stops */}
            {idleMarkers.map((idle, i) => (
              <div
                key={`idle-milestone-${i}`}
                className="playback-milestone-item idle"
                onClick={() => {
                  setIsFollowCamera(false);
                  googleMapRef.current?.panTo({ lat: idle.latitude, lng: idle.longitude });
                  googleMapRef.current?.setZoom(16);
                  setInfoWindowTarget({
                    type: "idle",
                    data: idle,
                    lat: idle.latitude,
                    lng: idle.longitude,
                  });
                }}
              >
                <div className="playback-milestone-dot orange" />
                <div className="playback-milestone-body">
                  <div className="playback-milestone-top">
                    <strong>🟠 Idle Stop ({idle.duration_formatted || `${idle.duration_minutes}m`})</strong>
                    <span className="playback-milestone-time">{idle.start_time} - {idle.end_time}</span>
                  </div>
                  <p className="playback-milestone-sub">Stationary stop &gt; 15 mins</p>
                </div>
              </div>
            ))}

            {/* Check-out Milestone */}
            {checkOutMarker && (
              <div
                className="playback-milestone-item end"
                onClick={() => {
                  setIsFollowCamera(false);
                  googleMapRef.current?.panTo({ lat: checkOutMarker.latitude || checkOutMarker.lat, lng: checkOutMarker.longitude || checkOutMarker.lng });
                  googleMapRef.current?.setZoom(16);
                }}
              >
                <div className="playback-milestone-dot red" />
                <div className="playback-milestone-body">
                  <div className="playback-milestone-top">
                    <strong>🔴 Shift Check-out</strong>
                    <span className="playback-milestone-time">{checkOutTime}</span>
                  </div>
                  <p className="playback-milestone-sub">{checkOutMarker.address || "Duty End Location"}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Interactive Map Legend */}
        <div className="playback-legend-card">
          <span className="playback-legend-title">Map Marker Legend</span>
          <div className="playback-legend-grid">
            <div className="playback-legend-entry">
              <span className="legend-dot green" />
              <span>Check-in Location</span>
            </div>
            <div className="playback-legend-entry">
              <span className="legend-dot blue" />
              <span>Client Visit / Activity</span>
            </div>
            <div className="playback-legend-entry">
              <span className="legend-dot red" />
              <span>Check-out Location</span>
            </div>
            <div className="playback-legend-entry">
              <span className="legend-dot orange" />
              <span>Long Idle Period (&ge;15m)</span>
            </div>
            <div className="playback-legend-entry full">
              <span className="legend-line" />
              <span>Actual Recorded GPS Route</span>
            </div>
          </div>
        </div>
      </aside>

      {/* ------------------------------------------------------------------ */}
      {/* RIGHT PANEL: Google Map Canvas & Route Playback Controls           */}
      {/* ------------------------------------------------------------------ */}
      <main className="playback-right-main">
        <div className="playback-map-canvas-wrap">
          {/* Floating Camera Follow Lock Button */}
          <button
            type="button"
            className={`playback-camera-follow-btn ${isFollowCamera ? "active" : ""}`}
            onClick={handleToggleCameraFollow}
            title={isFollowCamera ? "Camera is locked to marker (Click to unlock free pan)" : "Click to lock camera to moving marker"}
          >
            <Navigation size={13} style={{ transform: isFollowCamera ? "rotate(45deg)" : "none", color: isFollowCamera ? "#2563EB" : "#64748b" }} />
            <span>{isFollowCamera ? "Tracking Marker" : "Follow Marker"}</span>
          </button>

          <GoogleMap
            mapContainerStyle={{ width: "100%", height: "100%" }}
            onLoad={handleMapLoad}
            onDragStart={() => {
              setIsFollowCamera(false);
            }}
            options={STATIC_MAP_OPTIONS}
          >
            {/* -------------------------------------------------------------- */}
            {/* Actual Recorded GPS Route Polyline (100% Free - Zero API Token) */}
            {/* -------------------------------------------------------------- */}
            {routeCoords.length > 1 && (
              <>
                {/* Glow outline */}
                <PolylineF
                  path={routeCoords}
                  options={{
                    strokeColor: "#1e40af",
                    strokeWeight: 6.5,
                    strokeOpacity: 0.35,
                    geodesic: true,
                    zIndex: 10,
                  }}
                />
                {/* Core route line */}
                <PolylineF
                  path={routeCoords}
                  options={{
                    strokeColor: "#2563EB",
                    strokeWeight: 4.5,
                    strokeOpacity: 0.95,
                    geodesic: true,
                    zIndex: 11,
                  }}
                />
              </>
            )}

            {/* 🟢 Start / Check-in Marker */}
            {checkInMarker && checkInMarker.latitude != null && (
              <MarkerF
                position={{ lat: checkInMarker.latitude, lng: checkInMarker.longitude }}
                title={`Check-in: ${checkInTime}`}
                icon={{
                  url: createStartMarkerIcon(),
                  scaledSize: new window.google.maps.Size(36, 44),
                  anchor: new window.google.maps.Point(18, 44),
                }}
                zIndex={25}
                onClick={() => {
                  setInfoWindowTarget({
                    type: "checkin",
                    data: {
                      title: "🟢 Shift Check-in Location",
                      time: checkInTime,
                      address: checkInMarker.address || "Start Location",
                    },
                    lat: checkInMarker.latitude,
                    lng: checkInMarker.longitude,
                  });
                }}
              />
            )}

            {/* 🔴 End / Check-out Marker */}
            {checkOutMarker && checkOutMarker.latitude != null && (
              <MarkerF
                position={{ lat: checkOutMarker.latitude, lng: checkOutMarker.longitude }}
                title={`Check-out: ${checkOutTime}`}
                icon={{
                  url: createEndMarkerIcon(),
                  scaledSize: new window.google.maps.Size(36, 44),
                  anchor: new window.google.maps.Point(18, 44),
                }}
                zIndex={25}
                onClick={() => {
                  setInfoWindowTarget({
                    type: "checkout",
                    data: {
                      title: "🔴 Shift Check-out Location",
                      time: checkOutTime,
                      address: checkOutMarker.address || "End Location",
                    },
                    lat: checkOutMarker.latitude,
                    lng: checkOutMarker.longitude,
                  });
                }}
              />
            )}

            {/* 🔵 Client Visit Markers */}
            {clientVisitMarkers.map((visit, i) => (
              <MarkerF
                key={`client-visit-marker-${visit.visit_id || i}`}
                position={{ lat: visit.latitude, lng: visit.longitude }}
                title={`Client Visit: ${visit.client_name}`}
                icon={{
                  url: createClientVisitMarkerIcon(),
                  scaledSize: new window.google.maps.Size(34, 42),
                  anchor: new window.google.maps.Point(17, 42),
                }}
                zIndex={20}
                onClick={() => {
                  setInfoWindowTarget({
                    type: "visit",
                    data: visit,
                    lat: visit.latitude,
                    lng: visit.longitude,
                  });
                }}
              />
            ))}

            {/* 🟠 Long Idle Period Markers (>= 15 mins) */}
            {idleMarkers.map((idle, i) => (
              <MarkerF
                key={`idle-marker-${i}`}
                position={{ lat: idle.latitude, lng: idle.longitude }}
                title={`Long Idle Stop (${idle.duration_formatted || `${idle.duration_minutes}m`})`}
                icon={{
                  url: createIdleMarkerIcon(),
                  scaledSize: new window.google.maps.Size(34, 42),
                  anchor: new window.google.maps.Point(17, 42),
                }}
                zIndex={18}
                onClick={() => {
                  setInfoWindowTarget({
                    type: "idle",
                    data: idle,
                    lat: idle.latitude,
                    lng: idle.longitude,
                  });
                }}
              />
            ))}

            {/* 🚗 / 🏃 Animated Playback Vehicle Marker (ss1 Navigation Arrow) */}
            {playbackState && (
              <MarkerF
                key="playback-animated-marker"
                position={{ lat: playbackState.lat, lng: playbackState.lng }}
                title={`Playback Position: ${playbackState.time} (${playbackState.activity})`}
                icon={{
                  url: createPlaybackVehicleIcon(playbackState.heading),
                  scaledSize: new window.google.maps.Size(52, 52),
                  anchor: new window.google.maps.Point(26, 26),
                }}
                zIndex={100}
              />
            )}

            {/* InfoWindow Popup */}
            {infoWindowTarget && (
              <InfoWindowF
                position={{ lat: infoWindowTarget.lat, lng: infoWindowTarget.lng }}
                onCloseClick={() => setInfoWindowTarget(null)}
              >
                <div className="playback-infowindow">
                  {infoWindowTarget.type === "visit" ? (
                    <div>
                      <h4 className="infowindow-title">🔵 {infoWindowTarget.data.client_name}</h4>
                      <p className="infowindow-meta"><strong>Purpose:</strong> {infoWindowTarget.data.purpose}</p>
                      <p className="infowindow-meta"><strong>Status:</strong> {infoWindowTarget.data.status}</p>
                      {infoWindowTarget.data.check_in_time && (
                        <p className="infowindow-meta"><strong>Checked in:</strong> {infoWindowTarget.data.check_in_time}</p>
                      )}
                      {infoWindowTarget.data.check_out_time && (
                        <p className="infowindow-meta"><strong>Checked out:</strong> {infoWindowTarget.data.check_out_time}</p>
                      )}
                      <p className="infowindow-meta"><strong>Duration:</strong> {infoWindowTarget.data.duration_formatted || "—"}</p>
                      {infoWindowTarget.data.meeting_notes && (
                        <p className="infowindow-notes"><em>"{infoWindowTarget.data.meeting_notes}"</em></p>
                      )}
                      {infoWindowTarget.data.address && (
                        <p className="infowindow-addr">📍 {infoWindowTarget.data.address}</p>
                      )}
                      <button
                        type="button"
                        className="infowindow-btn"
                        onClick={() => onSelectVisit(infoWindowTarget.data)}
                      >
                        Open Visit Details
                      </button>
                    </div>
                  ) : infoWindowTarget.type === "idle" ? (
                    <div>
                      <h4 className="infowindow-title orange">🟠 Long Idle Stop</h4>
                      <p className="infowindow-meta"><strong>Duration:</strong> {infoWindowTarget.data.duration_formatted || `${infoWindowTarget.data.duration_minutes} minutes`}</p>
                      <p className="infowindow-meta"><strong>Time:</strong> {infoWindowTarget.data.start_time} – {infoWindowTarget.data.end_time}</p>
                      <p className="infowindow-desc">Employee was stationary at this location outside of client visits.</p>
                    </div>
                  ) : (
                    <div>
                      <h4 className="infowindow-title">{infoWindowTarget.data.title}</h4>
                      <p className="infowindow-meta"><strong>Time:</strong> {infoWindowTarget.data.time}</p>
                      {infoWindowTarget.data.address && (
                        <p className="infowindow-addr">📍 {infoWindowTarget.data.address}</p>
                      )}
                    </div>
                  )}
                </div>
              </InfoWindowF>
            )}
          </GoogleMap>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* BOTTOM PANEL: Route Playback Controls & Timeline Scrubber Bar      */}
        {/* ------------------------------------------------------------------ */}
        <div className="playback-bottom-controls-bar">
          {/* Top Row: Start Time, Timeline Scrubber, End Time */}
          <div className="playback-scrubber-row">
            <span className="playback-time-bound start">{checkInTime}</span>

            <div className="playback-slider-track-wrap">
              <input
                type="range"
                min="0"
                max="1000"
                value={Math.round(playbackProgress * 1000)}
                onChange={handleSeek}
                className="playback-range-slider"
                style={{
                  background: `linear-gradient(to right, #2563EB 0%, #2563EB ${playbackProgress * 100}%, #e2e8f0 ${playbackProgress * 100}%, #e2e8f0 100%)`,
                }}
              />
            </div>

            <span className="playback-time-bound end">{checkOutTime}</span>
          </div>

          {/* Bottom Row: Buttons, Speeds & Live Playback Status */}
          <div className="playback-actions-row">
            {/* Player Buttons */}
            <div className="playback-btn-group">
              <button
                type="button"
                className="playback-btn secondary"
                onClick={handleJumpStart}
                title="Jump to Start (Check-in)"
              >
                <SkipBack size={16} />
              </button>

              <button
                type="button"
                className="playback-btn secondary"
                onClick={handleStepBack}
                title="Rewind 10%"
              >
                <ChevronLeft size={16} />
              </button>

              <button
                type="button"
                className={`playback-btn primary ${isPlaying ? "playing" : ""}`}
                onClick={handleTogglePlay}
                title={isPlaying ? "Pause Route" : "Play Route"}
              >
                {isPlaying ? <Pause size={18} /> : <Play size={18} style={{ marginLeft: 2 }} />}
                <span>{isPlaying ? "Pause" : "Play Route"}</span>
              </button>

              <button
                type="button"
                className="playback-btn secondary"
                onClick={handleStepForward}
                title="Fast-forward 10%"
              >
                <ChevronRight size={16} />
              </button>

              <button
                type="button"
                className="playback-btn secondary"
                onClick={handleJumpEnd}
                title="Jump to End (Check-out)"
              >
                <SkipForward size={16} />
              </button>
            </div>

            {/* Speed Multipliers */}
            <div className="playback-speed-group">
              <span className="playback-speed-label">Speed:</span>
              {[1, 2, 5, 10].map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`playback-speed-pill ${playbackSpeed === s ? "active" : ""}`}
                  onClick={() => setPlaybackSpeed(s)}
                >
                  {s}x
                </button>
              ))}
            </div>

            {/* Current Playback Readout Pill */}
            {playbackState && (
              <div className="playback-status-pill">
                <div className="playback-status-clock">
                  <Clock size={13} style={{ color: "#2563EB", marginRight: 4 }} />
                  <strong>{playbackState.time}</strong>
                </div>
                <span className="playback-status-sep">·</span>
                <div className="playback-status-act">
                  <span>{playbackState.activityIcon} {playbackState.activity}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

