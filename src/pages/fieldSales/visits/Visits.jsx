import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { Plus, AlertTriangle, RefreshCw } from "lucide-react";

import PageHeader from "../../../components/common/PageHeader/PageHeader";
import Button from "../../../components/common/Button/Button";
import Card from "../../../components/common/Card/Card";
import Modal from "../../../components/common/Modal/Modal";
import Drawer from "../../../components/common/Drawer/Drawer";

import VisitStats from "../../../components/fieldSales/visits/visitStats/VisitStats";
import VisitFilters from "../../../components/fieldSales/visits/visitFilters/VisitFilters";
import VisitTable from "../../../components/fieldSales/visits/visitTable/VisitTable";
import VisitMap from "../../../components/fieldSales/visits/visitMap/VisitMap";
import VisitDetails from "../../../components/fieldSales/visits/visitDetails/VisitDetails";
import VisitCheckIn from "../../../components/fieldSales/visits/visitCheckIn/VisitCheckIn";
import VisitCheckOut from "../../../components/fieldSales/visits/visitCheckOut/VisitCheckOut";
import LocationPermissionModal from "../../../components/fieldSales/common/LocationPermissionModal/LocationPermissionModal";
import { getCurrentUser, isFieldSalesManager, isSalesPerson } from "../../../utils/permissionUtils";
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


import "./Visits.css";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const formatTime = (date = new Date()) =>
  date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });

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

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

const Visits = () => {
  const { showNotification } = useNotification();
  const user = useMemo(() => getCurrentUser(), []);
  const isManager = isFieldSalesManager(user);
  const isSales = isSalesPerson(user);

  const [visits, setVisits] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [liveLocations, setLiveLocations] = useState([]);
  const [timelinePoints, setTimelinePoints] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [date, setDate] = useState("");
  const [employee, setEmployee] = useState("");
  const [status, setStatus] = useState("");

  const [viewMode, setViewMode] = useState(isManager ? "map" : "list");

  const [selectedVisit, setSelectedVisit] = useState(null);
  const [selectedEntity, setSelectedEntity] = useState(null);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [checkOutOpen, setCheckOutOpen] = useState(false);
  const [checkoutSubmitting, setCheckoutSubmitting] = useState(false);

  const [currentUserLocation, setCurrentUserLocation] = useState({
    latitude: 28.4595,
    longitude: 77.0266,
    accuracy: 8,
  });
  const [gpsStatus, setGpsStatus] = useState("loading");
  const lastPingTimeRef = useRef(0);

  // Load visits and employees with real-time periodic background sync
  const loadLiveVisits = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const [visitsRes, empsRes] = await Promise.allSettled([
        getFieldSalesVisits(),
        isManager ? getFieldSalesEmployees({ role: "SALES_PERSON" }) : Promise.resolve(null),
      ]);

      if (visitsRes.status === "fulfilled") {
        const data = visitsRes.value?.data || visitsRes.value?.results || visitsRes.value || [];
        if (Array.isArray(data)) {
          const mapped = data.map((v) => ({
            id: String(v.id),
            leadId: v.lead ? String(v.lead) : String(v.customer || v.id),
            leadName: v.lead_name || v.customer_name || "Lead Client",
            companyName: v.company_name || v.customer_company || "Client Company",
            employeeId: String(v.assigned_to || v.employee_id || ""),
            employeeName: v.assigned_to_name || v.employee_name || "Sales Person",
            employeeRole: v.assigned_to_role || "Sales Person",
            scheduledDate: v.visit_date || getToday(),
            scheduledTime: v.visit_time || "11:00 AM",
            location: v.location || v.lead_address || "Client Location",
            purpose: v.purpose || v.visit_purpose || "Product Demo & Pricing",
            visitStatus: normalizeVisitStatus(v.status),
            rawStatus: v.status,
            priority: v.priority || "High",
            instructions: v.instructions || "",
            contactPhone: v.contact_phone || "",
            outcome: v.outcome || null,
            leadLatitude: Number(v.latitude || v.lead_latitude || 28.4597),
            leadLongitude: Number(v.longitude || v.lead_longitude || 77.0264),
            currentLatitude: currentUserLocation?.latitude || 28.4595,
            currentLongitude: currentUserLocation?.longitude || 77.0266,
            distance: calculateDistance(
              currentUserLocation?.latitude || 28.4595,
              currentUserLocation?.longitude || 77.0266,
              Number(v.latitude || 28.4597),
              Number(v.longitude || 77.0264)
            ),
            gpsAccuracy: currentUserLocation?.accuracy || 8,
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
          }));
          setVisits(mapped);
        }
      }

      if (empsRes.status === "fulfilled" && empsRes.value) {
        const empData = empsRes.value?.data || empsRes.value?.results || empsRes.value || [];
        if (Array.isArray(empData)) {
          setEmployees(
            empData.map((e) => ({
              id: String(e.id),
              name: e.full_name || `${e.first_name || ""} ${e.last_name || ""}`.trim() || e.email,
              role: e.role || "Sales Person",
              email: e.email,
              phone: e.phone_number || e.phone,
            }))
          );
        }
      }
    } catch (err) {
      console.warn("Could not load backend visits:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [isManager, currentUserLocation?.latitude, currentUserLocation?.longitude, currentUserLocation?.accuracy]);

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

  /* ---------------------------------------------------------------------- */
  /* Sales Person Live GPS Heartbeat Ping (Every 12 seconds)                */
  /* Overwrites 1 single row per employee in backend + logs 1hr trail       */
  /* ---------------------------------------------------------------------- */
  useEffect(() => {
    if (!isSales || gpsStatus !== "success" || !currentUserLocation) return;

    const doPing = async () => {
      try {
        await pingFieldSalesLocation({
          latitude: currentUserLocation.latitude,
          longitude: currentUserLocation.longitude,
          accuracy: currentUserLocation.accuracy,
        });
      } catch (err) {
        console.warn("Location ping error:", err);
      }
    };

    // Immediate ping
    doPing();

    // 12-second interval
    const interval = setInterval(doPing, 12000);

    return () => clearInterval(interval);
  }, [isSales, gpsStatus, currentUserLocation?.latitude, currentUserLocation?.longitude]);

  /* ---------------------------------------------------------------------- */
  /* Manager Live Team Locations Polling (Every 12 seconds)                  */
  /* Fetches real-time lat/lng & active tracking status of all sales team   */
  /* ---------------------------------------------------------------------- */
  useEffect(() => {
    if (!isManager) return;

    let isMounted = true;
    const fetchTeamLive = async () => {
      try {
        const res = await getTeamLiveLocations();
        const data = res?.data || res?.results || res || [];
        if (isMounted && Array.isArray(data)) {
          setLiveLocations(data);
        }
      } catch (err) {
        console.warn("Team live location fetch error:", err);
      }
    };

    fetchTeamLive();
    const interval = setInterval(fetchTeamLive, 12000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isManager]);

  /* ---------------------------------------------------------------------- */
  /* Fetch Employee Timeline Journey Trail when Sales Person selected       */
  /* ---------------------------------------------------------------------- */
  useEffect(() => {
    if (!selectedEntity || selectedEntity.type !== "employee") {
      setTimelinePoints([]);
      return;
    }

    let isMounted = true;
    const loadTimeline = async () => {
      try {
        const res = await getEmployeeTimelineHistory(selectedEntity.id);
        const points = res?.timeline || res?.data || res || [];
        if (isMounted && Array.isArray(points)) {
          setTimelinePoints(points);
        }
      } catch (err) {
        console.warn("Timeline history fetch error:", err);
        if (isMounted) setTimelinePoints([]);
      }
    };

    loadTimeline();
    return () => { isMounted = false; };
  }, [selectedEntity?.id, selectedEntity?.type]);

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
    currentUserLocation.latitude,
    currentUserLocation.longitude,
    currentUserLocation.accuracy,
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

  const filteredMapLeads = useMemo(() => {
    return filteredVisits
      .filter((v) => v.leadLatitude != null && v.leadLongitude != null)
      .map((v) => ({
        id: v.leadId || v.id,
        name: v.leadName,
        companyName: v.companyName,
        address: v.location,
        latitude: v.leadLatitude,
        longitude: v.leadLongitude,
        assignedEmployeeId: v.employeeId,
        assignedEmployeeName: v.employeeName,
        scheduledDate: v.scheduledDate,
        scheduledVisitTime: v.scheduledTime,
        visitStatus: v.visitStatus,
      }));
  }, [filteredVisits]);

  const filteredMapEmployees = useMemo(() => {
    const map = new Map();

    // 1. First populate from employees list / visits
    employees.forEach((emp) => {
      map.set(String(emp.id), {
        id: String(emp.id),
        name: emp.name,
        role: emp.role || "Sales Person",
        phone: emp.phone,
        latitude: null,
        longitude: null,
        isActiveTracking: false,
        lastUpdated: "Not connected",
        accuracy: 10,
        status: "SCHEDULED",
        currentVisit: null,
      });
    });

    // 2. Overlay visits data
    filteredVisits.forEach((v) => {
      if (v.employeeRole === "Manager") return;
      const empId = String(v.employeeId);
      if (!empId) return;

      const existing = map.get(empId) || {
        id: empId,
        name: v.employeeName,
        role: v.employeeRole || "Sales Person",
        phone: "",
        latitude: null,
        longitude: null,
        isActiveTracking: false,
        lastUpdated: "Today",
        accuracy: 8,
        status: "SCHEDULED",
        currentVisit: null,
      };

      if (v.visitStatus === "CHECKED_IN") {
        existing.status = "IN_PROGRESS";
        existing.currentVisit = v;
      }

      // If no GPS yet, default to lead coordinate
      if (existing.latitude == null && v.leadLatitude != null) {
        existing.latitude = v.leadLatitude;
        existing.longitude = v.leadLongitude;
      }

      map.set(empId, existing);
    });

    // 3. Overlay real-time GPS from liveLocations (from team-live API)
    liveLocations.forEach((loc) => {
      const empId = String(loc.id || loc.employee_id || loc.employee);
      const existing = map.get(empId);
      if (existing) {
        if (loc.latitude != null) existing.latitude = Number(loc.latitude);
        if (loc.longitude != null) existing.longitude = Number(loc.longitude);
        if (loc.accuracy != null) existing.accuracy = Number(loc.accuracy || 8);
        existing.isActiveTracking = Boolean(loc.is_active_tracking);
        existing.batteryLevel = loc.battery_level;
        existing.updatedAt = loc.last_ping_at || loc.updated_at;
        existing.lastUpdated = loc.is_active_tracking ? "Live Now" : "Location Inactive";
      } else if (loc.name || loc.employee_name) {
        map.set(empId, {
          id: empId,
          name: loc.name || loc.employee_name,
          role: "Sales Person",
          latitude: loc.latitude != null ? Number(loc.latitude) : null,
          longitude: loc.longitude != null ? Number(loc.longitude) : null,
          accuracy: Number(loc.accuracy || 8),
          isActiveTracking: Boolean(loc.is_active_tracking),
          batteryLevel: loc.battery_level,
          lastUpdated: loc.is_active_tracking ? "Live Now" : "Location Inactive",
          status: "SCHEDULED",
          currentVisit: null,
        });
      }
    });

    return Array.from(map.values());
  }, [filteredVisits, employees, liveLocations]);

  // Check for inactive employees to alert Manager
  const inactiveEmployees = useMemo(() => {
    if (!isManager) return [];
    return filteredMapEmployees.filter(
      (emp) => emp.latitude != null && emp.isActiveTracking === false
    );
  }, [isManager, filteredMapEmployees]);

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

    const now = new Date();
    const liveDist = calculateDistance(
      currentUserLocation.latitude,
      currentUserLocation.longitude,
      selectedVisit.leadLatitude,
      selectedVisit.leadLongitude
    ) || selectedVisit.distance || 0;

    setCheckInLoading(true);
    let checkInSuccess = false;
    let checkInRes = null;
    try {
      checkInRes = await checkInFieldSalesVisit(selectedVisit.id, {
        latitude: currentUserLocation.latitude,
        longitude: currentUserLocation.longitude,
        accuracy: currentUserLocation.accuracy,
        distance_meters: liveDist,
        is_location_overridden: Boolean(overrideData?.is_location_overridden),
        override_reason: overrideData?.override_reason || "",
        override_notes: overrideData?.override_notes || "",
      });
      checkInSuccess = true;
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

    if (checkInSuccess) {
      setVisits((currentVisits) =>
        currentVisits.map((visit) =>
          visit.id === selectedVisit.id
            ? {
              ...visit,
              visitStatus: "CHECKED_IN",
              checkInTime: formatTime(now),
              currentLatitude: currentUserLocation.latitude,
              currentLongitude: currentUserLocation.longitude,
              gpsAccuracy: currentUserLocation.accuracy,
              distance: liveDist,
              checkInLatitude: currentUserLocation.latitude,
              checkInLongitude: currentUserLocation.longitude,
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
        checkInTime: formatTime(now),
        currentLatitude: currentUserLocation.latitude,
        currentLongitude: currentUserLocation.longitude,
        gpsAccuracy: currentUserLocation.accuracy,
        distance: liveDist,
        checkInLatitude: currentUserLocation.latitude,
        checkInLongitude: currentUserLocation.longitude,
        checkInDistanceMeters: liveDist,
        isLocationOverridden: Boolean(overrideData?.is_location_overridden),
        overrideReason: overrideData?.override_reason || "",
        overrideNotes: overrideData?.override_notes || "",
      }));

      setCheckInOpen(false);
      loadLiveVisits(true);
    }
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

    const now = new Date();
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
              visitStatus: "COMPLETED",
              clientResponse: reportData.client_response,
              feedback: reportData.feedback,
              photos: reportData.photos || [],
              outcome: reportData.client_response,
              checkOutTime: formatTime(now),
            }
            : visit
        )
      );

      setSelectedVisit((current) => ({
        ...current,
        visitStatus: "COMPLETED",
        clientResponse: reportData.client_response,
        feedback: reportData.feedback,
        photos: reportData.photos || [],
        outcome: reportData.client_response,
        checkOutTime: formatTime(now),
      }));

      setCheckOutOpen(false);
      setDetailsOpen(false);

      // Re-fetch from server to ensure database sync
      try {
        const refreshed = await getFieldSalesVisits();
        const vList = refreshed?.data || (Array.isArray(refreshed) ? refreshed : []);
        if (vList.length > 0) {
          setVisits(vList);
        }
      } catch (refErr) {
        console.warn("Could not reload visits after checkout:", refErr);
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
                {inactiveEmployees.length === 1 ? "has" : "have"} disabled location or stopped sending GPS heartbeats (&gt; 2 mins).
              </p>
            </div>
          </div>
        </div>
      )}

      <VisitStats stats={stats} />

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
          <VisitMap
            visits={filteredVisits}
            leads={filteredMapLeads}
            employees={filteredMapEmployees}
            currentUserLocation={currentUserLocation}
            selectedEntity={selectedEntity}
            onSelectEntity={setSelectedEntity}
            onSelectVisit={openVisit}
            gpsStatus={gpsStatus}
            onLocateRequest={requestLocation}
            showTeamActivity={isManager}
            timelinePoints={timelinePoints}
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