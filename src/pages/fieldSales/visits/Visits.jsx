import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, AlertTriangle } from "lucide-react";

import PageHeader from "../../../components/common/PageHeader/PageHeader";
import Button from "../../../components/common/Button/Button";
import Card from "../../../components/common/Card/Card";
import Modal from "../../../components/common/Modal/Modal";
import Drawer from "../../../components/common/Drawer/Drawer";

import VisitStats from "../../../components/fieldSales/visits/visitStats/VisitStats";
import VisitFilters from "../../../components/fieldSales/visits/visitFilters/VisitFilters";
import VisitTable from "../../../components/fieldSales/visits/visitTable/VisitTable";
import LiveFleetCommandMap, { formatLastSeenAgo } from "../../../components/fieldSales/visits/visitMap/LiveFleetCommandMap";
import { useSmartPolling } from "../../../hooks/useSmartPolling";
import VisitDetails from "../../../components/fieldSales/visits/visitDetails/VisitDetails";
import VisitCheckIn from "../../../components/fieldSales/visits/visitCheckIn/VisitCheckIn";
import VisitCheckOut from "../../../components/fieldSales/visits/visitCheckOut/VisitCheckOut";
import LocationPermissionModal from "../../../components/fieldSales/common/LocationPermissionModal/LocationPermissionModal";
import {
  canViewAttendance,
  getCurrentUser,
  isFieldSalesManager,
  isSalesPerson,
} from "../../../utils/permissionUtils";
import { useNotification } from "../../../context/NotificationContext";
import {
  getFieldSalesVisits,
  getFieldSalesEmployees,
  checkInFieldSalesVisit,
  submitFieldSalesVisitReport,
  pingFieldSalesLocation,
  toggleFieldSalesLocation,
  getTeamLiveLocations,
  getEmployeeTimelineHistory,
} from "../../../services/api/fieldSalesAPI";
import attendanceAPI from "../../../services/api/attendanceAPI";


import "./Visits.css";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
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

const getToday = () => {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const normalizeVisitStatus = (statusStr) => {
  if (!statusStr) return "NOT_STARTED";
  const s = String(statusStr).toUpperCase().replace(/\s+/g, "_");
  if (s === "SCHEDULED" || s === "NOT_STARTED") return "NOT_STARTED";
  if (s === "IN_PROGRESS" || s === "CHECKED_IN") return "CHECKED_IN";
  if (s === "COMPLETED" || s === "CHECKED_OUT") return "CHECKED_OUT";
  return s;
};

const getRelatedId = (value) => {
  if (value && typeof value === "object") {
    return value.id == null ? "" : String(value.id);
  }
  return value == null ? "" : String(value);
};

const getCoordinatePair = (latitude, longitude) => {
  const latValue = typeof latitude === "string" ? latitude.trim() : latitude;
  const lngValue = typeof longitude === "string" ? longitude.trim() : longitude;
  if (latValue == null || latValue === "" || lngValue == null || lngValue === "") {
    return null;
  }

  const lat = Number(latValue);
  const lng = Number(lngValue);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;

  return { latitude: lat, longitude: lng };
};

const getResponseItems = (response) => {
  if (response?.success === false) return null;
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.results)) return response.results;
  if (Array.isArray(response?.data)) return response.data;
  return null;
};

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

const Visits = () => {
  const { showNotification } = useNotification();
  const user = useMemo(() => getCurrentUser(), []);
  const isManager = isFieldSalesManager(user);
  const isSales = isSalesPerson(user);
  const canReadTeamAttendance = isManager && canViewAttendance(user);

  const [visits, setVisits] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [attendanceByEmployeeId, setAttendanceByEmployeeId] = useState({});
  const [visitsUnavailable, setVisitsUnavailable] = useState(false);
  const [employeesUnavailable, setEmployeesUnavailable] = useState(false);
  const [attendanceUnavailable, setAttendanceUnavailable] = useState(false);
  const [attendanceStatusAvailable, setAttendanceStatusAvailable] = useState(false);
  const [liveLocations, setLiveLocations] = useState([]);
  const [locationsUnavailable, setLocationsUnavailable] = useState(false);
  const [timelinePoints, setTimelinePoints] = useState([]);
  const [availableRouteDays, setAvailableRouteDays] = useState([]);
  const [selectedRouteDate, setSelectedRouteDate] = useState("");
  const [selectedRouteMonth, setSelectedRouteMonth] = useState("");
  const [selectedRouteYear, setSelectedRouteYear] = useState("");
  const [routeSummaryData, setRouteSummaryData] = useState(null);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [timelineError, setTimelineError] = useState(false);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [date, setDate] = useState("");
  const [employee, setEmployee] = useState("");
  const [status, setStatus] = useState("");

  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const repIdParam = searchParams.get("repId");

  const [viewMode, setViewMode] = useState(tabParam === "map" ? "map" : (tabParam === "table" || tabParam === "list") ? "table" : (isManager ? "map" : "list"));

  const [selectedVisit, setSelectedVisit] = useState(null);
  const [selectedEntity, setSelectedEntity] = useState(null);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [checkOutOpen, setCheckOutOpen] = useState(false);
  const [checkoutSubmitting, setCheckoutSubmitting] = useState(false);

  const [currentUserLocation, setCurrentUserLocation] = useState(null);
  const [gpsStatus, setGpsStatus] = useState("loading");

  // Load visits and employees with real-time periodic background sync
  const loadLiveVisits = useCallback(async (silent = false) => {
    let hasLoadError = false;
    try {
      if (!silent) setLoading(true);
      const [visitsRes, empsRes, attendanceRes] = await Promise.allSettled([
        getFieldSalesVisits(),
        isManager ? getFieldSalesEmployees() : Promise.resolve(null),
        canReadTeamAttendance
          ? attendanceAPI.getCompanyAttendance({ date: getToday() })
          : Promise.resolve(null),
      ]);

      if (visitsRes.status === "fulfilled") {
        const data = getResponseItems(visitsRes.value);
        if (Array.isArray(data)) {
          const mapped = data.map((v) => {
            const coordinates =
              getCoordinatePair(v.latitude, v.longitude) ||
              getCoordinatePair(v.lead_latitude, v.lead_longitude);
            const assignedEmployeeId =
              getRelatedId(v.assigned_to_id) ||
              getRelatedId(v.assigned_to) ||
              getRelatedId(v.employee_id);

            return {
              id: String(v.id),
              leadId: getRelatedId(v.lead ?? v.customer ?? v.id) || String(v.id),
              leadName: v.lead_name || v.customer_name || "",
              companyName: v.company_name || v.customer_company || "",
              employeeId: assignedEmployeeId,
              employeeName: v.assigned_to_name || v.employee_name || "",
              employeeRole: v.assigned_to_role || "Sales Person",
              scheduledDate: v.visit_date || null,
              scheduledTime: v.visit_time || null,
              location: v.location || v.lead_address || "",
              address: v.location || v.lead_address || "",
              purpose: v.purpose || v.visit_purpose || "",
              visitStatus: normalizeVisitStatus(v.status),
              rawStatus: v.status,
              priority: v.priority || "",
              instructions: v.instructions || "",
              contactPhone: v.contact_phone || "",
              outcome: v.outcome || null,
              leadLatitude: coordinates?.latitude ?? null,
              leadLongitude: coordinates?.longitude ?? null,
              currentLatitude: currentUserLocation?.latitude ?? null,
              currentLongitude: currentUserLocation?.longitude ?? null,
              distance: currentUserLocation && coordinates
                ? calculateDistance(
                    currentUserLocation.latitude,
                    currentUserLocation.longitude,
                    coordinates.latitude,
                    coordinates.longitude
                  )
                : null,
              gpsAccuracy: currentUserLocation?.accuracy ?? null,
              checkInTime: v.check_in_time || null,
              checkOutTime: v.check_out_time || null,
              isLocationOverridden: Boolean(v.is_location_overridden),
              overrideReason: v.check_in_override_reason || "",
              overrideNotes: v.check_in_override_notes || "",
              checkInLatitude: v.check_in_latitude ? Number(v.check_in_latitude) : null,
              checkInLongitude: v.check_in_longitude ? Number(v.check_in_longitude) : null,
              checkInDistanceMeters: v.check_in_distance_meters != null ? Number(v.check_in_distance_meters) : null,
              clientResponse: v.client_response || "",
              feedback: v.feedback || "",
              meetingNotes: v.meeting_notes || "",
              outcomeDescription: v.notes || v.outcome_description || "",
              photos: v.photos || [],
              meetingPhoto: null,
            };
          });
          setVisits(mapped);
          setVisitsUnavailable(false);
        } else {
          hasLoadError = true;
          setVisitsUnavailable(true);
          console.warn("Unexpected response shape from field sales visits endpoint.");
        }
      } else {
        hasLoadError = true;
        setVisitsUnavailable(true);
        console.warn("Could not load backend visits:", visitsRes.reason);
      }

      if (empsRes.status === "fulfilled" && empsRes.value) {
        const empData = getResponseItems(empsRes.value);
        if (Array.isArray(empData)) {
          setEmployees(
            empData
              .filter((e) => {
                const r = String(e.role || "").toUpperCase();
                return r !== "MANAGER" && !r.includes("MANAGER");
              })
              .map((e) => ({
                id: String(e.id),
                employee_id: e.employee_id ?? null,
                employeeId: e.employeeId ?? null,
                pk: e.pk ?? null,
                name: e.full_name || `${e.first_name || ""} ${e.last_name || ""}`.trim() || e.email,
                role: e.role || "Sales Person",
                email: e.email,
                phone: e.phone_number || e.phone,
              }))
          );
          setEmployeesUnavailable(false);
        } else {
          hasLoadError = true;
          setEmployeesUnavailable(true);
          console.warn("Unexpected response shape from field sales employees endpoint.");
        }
      } else if (isManager) {
        hasLoadError = true;
        setEmployeesUnavailable(true);
        console.warn("Could not load field sales employees:", empsRes.reason);
      }

      if (canReadTeamAttendance && attendanceRes.status === "fulfilled") {
        const payload = attendanceRes.value;
        const rows = getResponseItems(payload);
        const attendanceRecords = {};
        if (Array.isArray(rows) && payload?.success !== false) {
          rows.forEach((record) => {
              const employeeId = [
                record.employeeId,
                record.employee_id,
                record.employee?.id,
              ]
                .map(getRelatedId)
                .find(Boolean);
            if (employeeId) attendanceRecords[employeeId] = record;
          });
          setAttendanceByEmployeeId(attendanceRecords);
          setAttendanceUnavailable(false);
          setAttendanceStatusAvailable(true);
        } else {
          hasLoadError = true;
          setAttendanceByEmployeeId({});
          setAttendanceUnavailable(true);
          setAttendanceStatusAvailable(false);
          console.warn("Unexpected response shape from company attendance endpoint.");
        }
      } else if (canReadTeamAttendance) {
        hasLoadError = true;
        setAttendanceByEmployeeId({});
        setAttendanceUnavailable(true);
        setAttendanceStatusAvailable(false);
        console.warn("Could not load company attendance:", attendanceRes.reason);
      }
    } catch (err) {
      setVisitsUnavailable(true);
      if (canReadTeamAttendance) {
        setAttendanceByEmployeeId({});
        setAttendanceUnavailable(true);
        setAttendanceStatusAvailable(false);
      }
      console.warn("Could not load backend visits:", err);
      hasLoadError = true;
    } finally {
      if (!silent) setLoading(false);
    }
    return !hasLoadError;
  }, [canReadTeamAttendance, isManager, currentUserLocation?.latitude, currentUserLocation?.longitude, currentUserLocation?.accuracy]);

  useEffect(() => {
    loadLiveVisits(false);
    const interval = setInterval(() => {
      loadLiveVisits(true);
    }, 8000);
    return () => clearInterval(interval);
  }, [loadLiveVisits]);

  /* ---------------------------------------------------------------------- */
  /* Browser GPS & Location Watcher                                          */
  /* ---------------------------------------------------------------------- */

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsStatus("unavailable");
      return;
    }

    setGpsStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: Math.round(position.coords.accuracy),
        };
        setCurrentUserLocation(coords);
        setGpsStatus("success");

        // Ping backend immediately on manual location request if sales person
        if (isSales) {
          pingFieldSalesLocation(coords).catch(() => { });
        }
      },
      (error) => {
        console.warn("Unable to access device location:", error);
        if (error.code === error.PERMISSION_DENIED) {
          setGpsStatus("denied");
          if (isSales) {
            toggleFieldSalesLocation(false).catch(() => { });
          }
        } else {
          setGpsStatus("unavailable");
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 15000,
      }
    );
  }, [isSales]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsStatus("unavailable");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: Math.round(position.coords.accuracy),
        };
        setCurrentUserLocation(coords);
        setGpsStatus("success");
      },
      (error) => {
        console.warn("Watch position error:", error);
        if (error.code === error.PERMISSION_DENIED) {
          setGpsStatus("denied");
          if (isSales) {
            toggleFieldSalesLocation(false).catch(() => { });
          }
        } else {
          setGpsStatus("unavailable");
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 15000,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [isSales]);

  const userLocRef = useRef(currentUserLocation);
  userLocRef.current = currentUserLocation;

  /* ---------------------------------------------------------------------- */
  /* Sales Person Live GPS Heartbeat Ping (Every 15s)                       */
  /* Decoupled from location state to prevent re-render interval loop       */
  /* ---------------------------------------------------------------------- */
  useEffect(() => {
    if (!isSales || gpsStatus !== "success") return;

    let mounted = true;
    const doPing = async () => {
      const loc = userLocRef.current;
      if (!loc || !mounted) return;
      try {
        await pingFieldSalesLocation({
          latitude: loc.latitude,
          longitude: loc.longitude,
          accuracy: loc.accuracy || 10,
        });
      } catch (err) {
        console.warn("Location ping error:", err);
      }
    };

    void doPing();
    const interval = setInterval(doPing, 5000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [isSales, gpsStatus]);

  /* ---------------------------------------------------------------------- */
  /* Manager Live Team Locations Polling (Every 15s)                        */
  /* In-flight locked & pauses when tab is hidden (Zero loop & zero waste)  */
  /* ---------------------------------------------------------------------- */
  const fetchTeamLive = useCallback(async () => {
    try {
      const res = await getTeamLiveLocations();
      const data = getResponseItems(res);
      if (Array.isArray(data)) {
        setLiveLocations(data);
        setLocationsUnavailable(false);
        return true;
      }
      setLocationsUnavailable(true);
      console.warn("Unexpected response shape from team live location endpoint.");
    } catch (err) {
      setLocationsUnavailable(true);
      console.warn("Team live location fetch error:", err);
    }
    return false;
  }, []);

  useSmartPolling(fetchTeamLive, 5000, { enabled: isManager });

  const refreshManagerTracking = useCallback(async () => {
    const results = await Promise.all([
      loadLiveVisits(true),
      fetchTeamLive(),
    ]);
    if (results.some((result) => !result)) {
      showNotification({
        type: "error",
        message: "Some tracking data could not be refreshed. Please try again.",
      });
    }
  }, [fetchTeamLive, loadLiveVisits, showNotification]);

  /* ---------------------------------------------------------------------- */
  /* Fetch Employee Timeline Journey Trail when Sales Person selected       */
  /* ---------------------------------------------------------------------- */
  const handleSelectEntity = useCallback((entity) => {
    if (entity?.type === "employee" && entity?.id !== selectedEntity?.id) {
      setSelectedRouteDate("");
      setSelectedRouteMonth("");
      setSelectedRouteYear("");
    }
    setSelectedEntity(entity);
  }, [selectedEntity?.id]);

  const handleChangeRouteMonth = useCallback((m, y) => {
    setSelectedRouteMonth(m);
    setSelectedRouteYear(y);
    setSelectedRouteDate("");
  }, []);

  useEffect(() => {
    if (!selectedEntity || selectedEntity.type !== "employee") {
      setTimelinePoints([]);
      setAvailableRouteDays([]);
      setRouteSummaryData(null);
      setTimelineLoading(false);
      setTimelineError(false);
      return;
    }

    let isMounted = true;
    const loadTimeline = async () => {
      setTimelineLoading(true);
      setTimelineError(false);
      setTimelinePoints([]);
      setAvailableRouteDays([]);
      setRouteSummaryData(null);
      try {
        const res = await getEmployeeTimelineHistory(
          selectedEntity.id,
          selectedRouteDate,
          selectedRouteMonth,
          selectedRouteYear
        );
        if (res?.success === false) {
          throw new Error(res.message || "Timeline history request failed.");
        }
        if (isMounted && res) {
          const points = res.timeline || res.route_points || res.data || [];
          setTimelinePoints(Array.isArray(points) ? points : []);
          setAvailableRouteDays(res.available_days || []);
          setRouteSummaryData({
            date: res.date || res.selected_date,
            selected_date: res.selected_date,
            selected_date_label: res.selected_date_label,
            month: res.month,
            year: res.year,
            month_label: res.month_label,
            month_total_distance_km: res.month_total_distance_km,
            month_active_days: res.month_active_days,
            total_distance_km: res.total_distance_km,
            check_in_time: res.check_in_time,
            check_out_time: res.check_out_time,
            start_location_name: res.start_location_name || res.start_location,
            end_location_name: res.end_location_name || res.end_location,
            is_finalized: res.is_finalized,
            attendance_status: res.attendance_status,
            check_in_latitude: res.check_in_latitude,
            check_in_longitude: res.check_in_longitude,
            check_in_address: res.check_in_address,
            check_out_latitude: res.check_out_latitude,
            check_out_longitude: res.check_out_longitude,
            check_out_address: res.check_out_address,
          });
        } else if (isMounted) {
          setTimelinePoints([]);
          setAvailableRouteDays([]);
          setRouteSummaryData(null);
          setTimelineError(true);
        }
      } catch (err) {
        console.warn("Timeline history fetch error:", err);
        if (isMounted) {
          setTimelinePoints([]);
          setAvailableRouteDays([]);
          setRouteSummaryData(null);
          setTimelineError(true);
        }
      } finally {
        if (isMounted) setTimelineLoading(false);
      }
    };

    loadTimeline();
    return () => { isMounted = false; };
  }, [selectedEntity?.id, selectedEntity?.type, selectedRouteDate, selectedRouteMonth, selectedRouteYear]);

  /* ---------------------------------------------------------------------- */
  /* Keep visit distance synced with current GPS                             */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    if (!currentUserLocation) {
      return;
    }

    setVisits((currentVisits) =>
      currentVisits.map((visit) => {
        if (!visit.leadLatitude || !visit.leadLongitude) {
          return visit;
        }

        const distance = calculateDistance(
          currentUserLocation.latitude,
          currentUserLocation.longitude,
          visit.leadLatitude,
          visit.leadLongitude
        );

        return {
          ...visit,
          distance,
          currentLatitude: currentUserLocation.latitude,
          currentLongitude: currentUserLocation.longitude,
          gpsAccuracy: currentUserLocation.accuracy,
        };
      })
    );
  }, [
    currentUserLocation?.latitude,
    currentUserLocation?.longitude,
    currentUserLocation?.accuracy,
  ]);

  /* ---------------------------------------------------------------------- */
  /* Filters                                                                 */
  /* ---------------------------------------------------------------------- */

  const filteredVisits = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return visits.filter((visit) => {
      const matchesSearch =
        !normalizedSearch ||
        [
          visit.leadName,
          visit.companyName,
          visit.employeeName,
          visit.location,
          visit.contactPhone,
        ]
          .filter(Boolean)
          .some((value) =>
            String(value).toLowerCase().includes(normalizedSearch)
          );

      const matchesDate =
        !date || visit.scheduledDate === date;

      const matchesEmployee =
        !employee || visit.employeeId === employee;

      const matchesStatus =
        !status || visit.visitStatus === status;

      return (
        matchesSearch &&
        matchesDate &&
        matchesEmployee &&
        matchesStatus
      );
    });
  }, [
    visits,
    search,
    date,
    employee,
    status,
  ]);

  /* ---------------------------------------------------------------------- */
  /* Stats                                                                   */
  /* ---------------------------------------------------------------------- */

  const stats = useMemo(() => {
    return {
      today: filteredVisits.length,

      inProgress: filteredVisits.filter(
        (visit) => visit.visitStatus === "CHECKED_IN"
      ).length,

      completed: filteredVisits.filter(
        (visit) => visit.visitStatus === "CHECKED_OUT"
      ).length,

      followUps: filteredVisits.filter(
        (visit) => visit.outcome === "FOLLOW_UP"
      ).length,
    };
  }, [filteredVisits]);

  const filteredMapEmployees = useMemo(() => {
    const employeesById = new Map();
    const idAliases = new Map();
    const employeesByName = new Map();
    const attendanceForEmployee = (employee) => {
      const aliases = [
        employee.id,
        employee.employee_id,
        employee.employeeId,
        employee.pk,
      ]
        .filter((id) => id != null && id !== "")
        .map(String);
      return aliases
        .map((id) => attendanceByEmployeeId[id])
        .find(Boolean);
    };

    employees.forEach((employee) => {
      const employeeId = String(employee.id);
      const fullName = String(employee.name || "").trim();
      const normalizedName = fullName.toLocaleLowerCase();
      const attendance = attendanceForEmployee(employee);
      const attendanceStatus = attendance
        ? (attendance.status === "WORKING" || attendance.status === "ON_BREAK" ? "CHECKED_IN" : attendance.checkOut ? "CHECKED_OUT" : "NOT_CHECKED_IN")
        : "NOT_CHECKED_IN";
      const mapEmployee = {
        id: employeeId,
        name: fullName,
        role: employee.role || "Sales Person",
        email: employee.email,
        phone: employee.phone,
        hasLiveGps: false,
        latitude: null,
        longitude: null,
        isActiveTracking: false,
        lastUpdated: "Location unavailable",
        currentVisit: null,
        shiftStatus: attendance?.status || null,
        shiftCheckIn: attendance?.checkIn ?? null,
        shiftCheckOut: attendance?.checkOut ?? null,
        attendance_status: attendanceStatus,
        check_in_latitude: attendance?.checkInLatitude ?? null,
        check_in_longitude: attendance?.checkInLongitude ?? null,
        check_in_address: attendance?.checkInAddress || "",
        check_out_latitude: attendance?.checkOutLatitude ?? null,
        check_out_longitude: attendance?.checkOutLongitude ?? null,
        check_out_address: attendance?.checkOutAddress || "",
      };
      employeesById.set(employeeId, mapEmployee);
      [employee.id, employee.employee_id, employee.employeeId, employee.pk]
        .filter((id) => id != null && id !== "")
        .forEach((id) => idAliases.set(String(id), employeeId));
      if (normalizedName) {
        const matchingEmployees = employeesByName.get(normalizedName) || [];
        matchingEmployees.push(employeeId);
        employeesByName.set(normalizedName, matchingEmployees);
      }
    });

    liveLocations.forEach((location) => {
      const rawId = [
        location.employee_id,
        location.employeeId,
        location.employee?.id,
        location.employee,
        location.id,
      ]
        .map(getRelatedId)
        .find(Boolean);
      const locationName =
        location.name ||
        location.employee_name ||
        location.employee?.full_name ||
        "";
      const normalizedName = String(locationName).trim().toLocaleLowerCase();
      const uniqueNameMatch = employeesByName.get(normalizedName);
      const employeeId =
        idAliases.get(rawId) ||
        (uniqueNameMatch?.length === 1 ? uniqueNameMatch[0] : rawId);
      if (!employeeId) return;

      const coordinates = getCoordinatePair(location.latitude, location.longitude);
      const isStale = Boolean(location.is_stale_location);
      const isLive =
        Boolean(location.is_active_tracking) && !isStale && Boolean(coordinates);
      const pingTimestamp = location.last_ping_at || location.last_ping_formatted;
      const timeAgo = formatLastSeenAgo(
        location.last_ping_at,
        location.last_seen_human
      );
      const existing = employeesById.get(employeeId);
      const mapEmployee = existing || {
        id: employeeId,
        name: locationName,
        role: "Sales Person",
        hasLiveGps: false,
        latitude: null,
        longitude: null,
        isActiveTracking: false,
        lastUpdated: "Location unavailable",
        currentVisit: null,
        shiftStatus: null,
        shiftCheckIn: null,
        shiftCheckOut: null,
      };

      mapEmployee.latitude = coordinates?.latitude ?? null;
      mapEmployee.longitude = coordinates?.longitude ?? null;
      mapEmployee.hasLiveGps = Boolean(coordinates);
      mapEmployee.accuracy =
        location.accuracy != null ? Number(location.accuracy) : null;
      mapEmployee.isActiveTracking = isLive;
      mapEmployee.is_stale_location = isStale;
      mapEmployee.last_ping_at = location.last_ping_at || null;
      mapEmployee.last_ping_formatted = location.last_ping_formatted || null;
      mapEmployee.last_seen_human = location.last_seen_human || null;
      mapEmployee.last_seen_seconds = location.last_seen_seconds ?? null;
      mapEmployee.today_distance_km = location.today_distance_km;
      mapEmployee.today_distance_meters = location.today_distance_meters;
      mapEmployee.battery_level = location.battery_level;
      mapEmployee.today_visits_count = location.today_visits_count;
      mapEmployee.completed_visits_count = location.completed_visits_count;
      mapEmployee.pending_visits_count = location.pending_visits_count;
      mapEmployee.visit_stage = location.visit_stage;
      mapEmployee.status_label = location.status_label;
      mapEmployee.active_visit_client = location.active_visit_client;
      mapEmployee.check_in_time_formatted = location.check_in_time_formatted;
      mapEmployee.check_out_time_formatted = location.check_out_time_formatted;
      mapEmployee.last_visit_client = location.last_visit_client;
      mapEmployee.attendance_status = location.attendance_status || mapEmployee.attendance_status;
      mapEmployee.check_in_latitude = location.check_in_latitude ?? mapEmployee.check_in_latitude;
      mapEmployee.check_in_longitude = location.check_in_longitude ?? mapEmployee.check_in_longitude;
      mapEmployee.check_in_address = location.check_in_address || mapEmployee.check_in_address;
      mapEmployee.check_out_latitude = location.check_out_latitude ?? mapEmployee.check_out_latitude;
      mapEmployee.check_out_longitude = location.check_out_longitude ?? mapEmployee.check_out_longitude;
      mapEmployee.check_out_address = location.check_out_address || mapEmployee.check_out_address;
      mapEmployee.is_stale_location = Boolean(location.is_stale || location.is_stale_location);
      mapEmployee.gps_telemetry_status = location.gps_telemetry_status || (isLive ? "LIVE" : isStale ? "STALE" : "UNAVAILABLE");
      mapEmployee.gps_telemetry_label = location.gps_telemetry_label || (isLive ? "Live GPS" : pingTimestamp ? `Last known GPS · ${timeAgo}` : "Location unavailable");
      mapEmployee.lastUpdated = mapEmployee.gps_telemetry_label;
      if (!mapEmployee.name && locationName) mapEmployee.name = locationName;
      employeesById.set(employeeId, mapEmployee);
    });

    return Array.from(employeesById.values());
  }, [employees, liveLocations, attendanceByEmployeeId]);

  // Auto-select rep if repId is specified in URL query params
  useEffect(() => {
    if (repIdParam && filteredMapEmployees.length > 0 && !selectedEntity) {
      const match = filteredMapEmployees.find(
        (e) => String(e.id) === String(repIdParam) || String(e.employee_id) === String(repIdParam)
      );
      if (match) {
        handleSelectEntity({ type: "employee", id: match.id, ...match });
      }
    }
  }, [repIdParam, filteredMapEmployees, selectedEntity, handleSelectEntity]);

  const [dismissedAlertEmployees, setDismissedAlertEmployees] = useState(new Set());

  // Check for inactive employees to alert Manager (only if they are actively on shift and stopped sending)
  const inactiveEmployees = useMemo(() => {
    if (!isManager) return [];
    return filteredMapEmployees.filter((emp) => {
      // 1. Employee MUST be actively on shift (working / checked in today)
      const onShift =
        emp.attendance_status === 'CHECKED_IN' ||
        emp.shiftStatus === 'WORKING' ||
        emp.shiftStatus === 'ON_BREAK';
      if (!onShift) return false;

      // 2. Check if already dismissed by manager
      if (dismissedAlertEmployees.has(String(emp.id))) return false;

      // 3. Never flag if transmitting live or stationary within allowed window
      if (emp.gps_telemetry_status === "LIVE" || emp.gps_telemetry_status === "IDLE") {
        return false;
      }

      // 4. Flag only if GPS is explicitly disabled or heartbeats have stopped (> 120s)
      return (
        emp.gps_telemetry_status === "DISABLED" ||
        emp.gps_telemetry_status === "STALE" ||
        (emp.last_seen_seconds != null && emp.last_seen_seconds > 120) ||
        (emp.isActiveTracking === false && emp.hasLiveGps)
      );
    });
  }, [isManager, filteredMapEmployees, dismissedAlertEmployees]);

  /* ---------------------------------------------------------------------- */
  /* Select visit                                                             */
  /* ---------------------------------------------------------------------- */

  const openVisit = (visit) => {
    setSelectedVisit(visit);
    setDetailsOpen(true);
  };

  /* ---------------------------------------------------------------------- */
  /* Check-in                                                                */
  /* ---------------------------------------------------------------------- */

  const openCheckIn = (visit) => {
    setSelectedVisit(visit);
    setDetailsOpen(false);
    setCheckInOpen(true);
  };

  const [checkInLoading, setCheckInLoading] = useState(false);

  const handleCheckIn = async (overrideData = {}) => {
    if (!selectedVisit) {
      return;
    }

    if (!currentUserLocation) {
      showNotification({
        type: "error",
        message: "Waiting for GPS coordinates. Please ensure location access is enabled and try again.",
      });
      return;
    }

    const liveDist = calculateDistance(
      currentUserLocation?.latitude,
      currentUserLocation?.longitude,
      selectedVisit.leadLatitude,
      selectedVisit.leadLongitude
    ) || selectedVisit.distance || 0;

    setCheckInLoading(true);
    try {
      await checkInFieldSalesVisit(selectedVisit.id, {
        latitude: currentUserLocation?.latitude,
        longitude: currentUserLocation?.longitude,
        accuracy: currentUserLocation?.accuracy || 10,
        distance_meters: liveDist,
        is_location_overridden: Boolean(overrideData?.is_location_overridden),
        override_reason: overrideData?.override_reason || "",
        override_notes: overrideData?.override_notes || "",
      });
    } catch (err) {
      console.error("Backend check-in error:", err);
      const errMsg =
        err?.response?.data?.message ||
        err?.response?.data?.detail ||
        (typeof err?.response?.data === "string" ? err.response.data : "") ||
        "Check-in failed. Please check your network and try again.";
      alert(errMsg);
      setCheckInLoading(false);
      return;
    } finally {
      setCheckInLoading(false);
    }

    setVisits((currentVisits) =>
      currentVisits.map((visit) =>
        visit.id === selectedVisit.id
          ? {
              ...visit,
              visitStatus: "CHECKED_IN",
              currentLatitude: currentUserLocation?.latitude ?? null,
              currentLongitude: currentUserLocation?.longitude ?? null,
              gpsAccuracy: currentUserLocation?.accuracy ?? null,
              distance: liveDist,
              checkInLatitude: currentUserLocation?.latitude ?? null,
              checkInLongitude: currentUserLocation?.longitude ?? null,
              checkInDistanceMeters: liveDist,
              isLocationOverridden: Boolean(overrideData?.is_location_overridden),
              overrideReason: overrideData?.override_reason || "",
              overrideNotes: overrideData?.override_notes || "",
            }
          : visit
      )
    );

    setSelectedVisit((current) => ({
      ...current,
      visitStatus: "CHECKED_IN",
      currentLatitude: currentUserLocation?.latitude ?? null,
      currentLongitude: currentUserLocation?.longitude ?? null,
      gpsAccuracy: currentUserLocation?.accuracy ?? null,
      distance: liveDist,
      checkInLatitude: currentUserLocation?.latitude ?? null,
      checkInLongitude: currentUserLocation?.longitude ?? null,
      checkInDistanceMeters: liveDist,
      isLocationOverridden: Boolean(overrideData?.is_location_overridden),
      overrideReason: overrideData?.override_reason || "",
      overrideNotes: overrideData?.override_notes || "",
    }));

    setCheckInOpen(false);
    void loadLiveVisits(true);
  };

  /* ---------------------------------------------------------------------- */
  /* Check-out / Submit Visit Report                                         */
  /* ---------------------------------------------------------------------- */

  const openCheckOut = (visit) => {
    setSelectedVisit(visit);
    setDetailsOpen(false);
    setCheckOutOpen(true);
  };

  const handleCheckout = async (reportData) => {
    if (!selectedVisit) {
      return;
    }

    try {
      setCheckoutSubmitting(true);
      await submitFieldSalesVisitReport(selectedVisit.id, reportData);

      showNotification({
        type: "success",
        message: "Visit checked out and report submitted successfully!",
      });

      setVisits((currentVisits) =>
        currentVisits.map((visit) =>
          visit.id === selectedVisit.id
            ? {
              ...visit,
              visitStatus: "CHECKED_OUT",
              clientResponse: reportData.client_response,
              feedback: reportData.feedback,
              photos: reportData.photos || [],
              outcome: reportData.client_response,
            }
            : visit
        )
      );

      setSelectedVisit((current) => ({
        ...current,
        visitStatus: "CHECKED_OUT",
        clientResponse: reportData.client_response,
        feedback: reportData.feedback,
        photos: reportData.photos || [],
        outcome: reportData.client_response,
      }));

      setCheckOutOpen(false);
      setDetailsOpen(false);

      if (!(await loadLiveVisits(true))) {
        showNotification({
          type: "error",
          message: "Visit completed, but refreshed visit data could not be loaded.",
        });
      }
    } catch (err) {
      console.error("Backend report submission error:", err);
      const errMsg =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        (typeof err.response?.data === "string" ? err.response.data : "") ||
        "Failed to submit checkout report. Please check the entered details.";
      showNotification({
        type: "error",
        message: errMsg,
      });
    } finally {
      setCheckoutSubmitting(false);
    }
  };


  /* ---------------------------------------------------------------------- */
  /* Refresh selected visit from live state                                  */
  /* ---------------------------------------------------------------------- */

  const getSelectedVisit = () => {
    if (!selectedVisit) {
      return null;
    }

    return (
      visits.find((visit) => visit.id === selectedVisit.id) ||
      selectedVisit
    );
  };

  const activeVisit = getSelectedVisit();

  /* ---------------------------------------------------------------------- */
  /* Render                                                                  */
  /* ---------------------------------------------------------------------- */

  return (
    <div className="visits-page">
      <PageHeader
        title={isManager ? "Visits" : "My Visits"}
        description={
          isManager
            ? "Track field visits, real-time GPS locations and customer outcomes."
            : "View and complete your daily scheduled visits assigned by your manager."
        }
        actions={
          isManager ? (
            <Button>
              <span className="visits__button-content">
                <Plus size={16} />
                Schedule Visit
              </span>
            </Button>
          ) : (
            <Button onClick={() => (window.location.href = "/field-sales/leads/add")}>
              <span className="visits__button-content">
                <Plus size={16} />
                Add Lead
              </span>
            </Button>
          )
        }
      />

      {/* Mandatory location permission modal for Sales Person */}
      {isSales && (gpsStatus === "denied" || gpsStatus === "unavailable") && (
        <LocationPermissionModal
          open={true}
          isDenied={gpsStatus === "denied"}
          onRequestPermission={requestLocation}
        />
      )}

      {/* Manager Inactive Alert Banner */}
      {isManager && inactiveEmployees.length > 0 && (
        <div className="visits__inactive-alert-banner">
          <div className="visits__inactive-alert-left">
            <AlertTriangle size={18} className="visits__inactive-alert-icon" />
            <div>
              <strong>GPS Tracking Inactive Alert</strong>
              <p>
                {inactiveEmployees.map((e) => e.name).join(", ")}{" "}
                {inactiveEmployees.length === 1 ? "has" : "have"} stopped sending GPS heartbeats.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="visits__inactive-alert-dismiss"
            onClick={() => {
              setDismissedAlertEmployees((prev) => {
                const next = new Set(prev);
                inactiveEmployees.forEach((e) => next.add(String(e.id)));
                return next;
              });
            }}
            title="Dismiss alert"
          >
            ✕
          </button>
        </div>
      )}

      {(!isManager || viewMode !== "map") && <VisitStats stats={stats} />}

      <Card className="visits__workspace">
        <VisitFilters
          search={search}
          onSearchChange={setSearch}
          date={date}
          onDateChange={setDate}
          employee={employee}
          onEmployeeChange={setEmployee}
          status={status}
          onStatusChange={setStatus}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          employees={employees}
          showEmployeeFilter={isManager}
          searchPlaceholder={
            isManager
              ? "Search lead, company or employee..."
              : "Search client, company or address..."
          }
        />

        {viewMode === "map" ? (
          <LiveFleetCommandMap
            visits={isManager ? visits : filteredVisits}
            employees={filteredMapEmployees}
            isLoading={loading}
            currentUserLocation={currentUserLocation}
            selectedEntity={selectedEntity}
            onSelectEntity={handleSelectEntity}
            onSelectVisit={openVisit}
            timelinePoints={timelinePoints}
            timelineLoading={timelineLoading}
            timelineError={timelineError}
            availableDays={availableRouteDays}
            selectedRouteDate={selectedRouteDate}
            onSelectRouteDate={setSelectedRouteDate}
            onChangeRouteMonth={handleChangeRouteMonth}
            routeSummary={routeSummaryData}
            attendanceUnavailable={attendanceUnavailable}
            attendanceStatusAvailable={attendanceStatusAvailable}
            visitsUnavailable={visitsUnavailable}
            employeesUnavailable={employeesUnavailable}
            locationsUnavailable={locationsUnavailable}
            onRefresh={isManager ? refreshManagerTracking : undefined}
          />
        ) : (
          <VisitTable
            visits={filteredVisits}
            onViewVisit={openVisit}
            showEmployee={isManager}
          />
        )}
      </Card>

      {/* ------------------------------------------------------------------ */}
      {/* Visit details                                                       */}
      {/* ------------------------------------------------------------------ */}

      <Drawer
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        title="Visit Details"
      >
        {activeVisit && (
          <>
            <VisitDetails
              visit={activeVisit}
              isSales={isSales}
              onStartVisit={(v) => {
                if (v.visitStatus === "CHECKED_IN" || v.visitStatus === "IN_PROGRESS") {
                  openCheckOut(v);
                } else {
                  openCheckIn(v);
                }
              }}
            />

            <div className="visits-modal-actions">
              {activeVisit.visitStatus === "NOT_STARTED" && (
                <Button onClick={() => openCheckIn(activeVisit)}>
                  Start Visit
                </Button>
              )}

              {(activeVisit.visitStatus === "CHECKED_IN" ||
                activeVisit.visitStatus === "IN_PROGRESS") && (
                  <Button onClick={() => openCheckOut(activeVisit)}>
                    Check Out / Submit Report
                  </Button>
                )}
            </div>
          </>
        )}
      </Drawer>

      {/* ------------------------------------------------------------------ */}
      {/* Check-in                                                           */}
      {/* ------------------------------------------------------------------ */}

      <Modal
        open={checkInOpen}
        onClose={() => setCheckInOpen(false)}
        title="Start Visit"
      >
        {activeVisit && (
          <>
            <VisitCheckIn
              visit={activeVisit}
              currentUserLocation={currentUserLocation}
              onCheckIn={handleCheckIn}
              loading={checkInLoading}
            />

            <div className="visits-modal-actions">
              <Button
                variant="secondary"
                onClick={() => setCheckInOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </>
        )}
      </Modal>

      {/* ------------------------------------------------------------------ */}
      {/* Checkout                                                            */}
      {/* ------------------------------------------------------------------ */}

      <Modal
        open={checkOutOpen}
        onClose={() => setCheckOutOpen(false)}
        title="Complete Visit"
      >
        {activeVisit && (
          <VisitCheckOut
            visit={activeVisit}
            onComplete={handleCheckout}
            onCancel={() => setCheckOutOpen(false)}
            submitting={checkoutSubmitting}
          />
        )}
      </Modal>
    </div>
  );
};

export default Visits;