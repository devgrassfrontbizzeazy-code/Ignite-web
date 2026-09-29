import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";

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

import "./Visits.css";

/* -------------------------------------------------------------------------- */
/* Mock data - temporary until API integration                               */
/* -------------------------------------------------------------------------- */

const INITIAL_VISITS = [
  {
    id: "visit-1",
    leadId: "lead-1",
    leadName: "Rahul Sharma",
    companyName: "ABC Enterprises",
    employeeId: "emp-1",
    employeeName: "Rahul Sharma",
    scheduledDate: "2026-09-28",
    scheduledTime: "11:30 AM",
    location: "Sector 18, Gurugram",
    visitStatus: "CHECKED_IN",
    outcome: null,

    leadLatitude: 28.4597,
    leadLongitude: 77.0264,

    currentLatitude: 28.4591,
    currentLongitude: 77.0268,

    distance: 82,
    gpsAccuracy: 8,

    checkInTime: "11:34 AM",
    checkOutTime: null,

    outcomeDescription: "",
    meetingPhoto: null,
  },

  {
    id: "visit-2",
    leadId: "lead-2",
    leadName: "Priya Verma",
    companyName: "Verma Industries",
    employeeId: "emp-2",
    employeeName: "Priya Verma",
    scheduledDate: "2026-09-28",
    scheduledTime: "12:30 PM",
    location: "Golf Course Road, Gurugram",
    visitStatus: "CHECKED_OUT",
    outcome: "FOLLOW_UP",

    leadLatitude: 28.4421,
    leadLongitude: 77.1001,

    currentLatitude: 28.4424,
    currentLongitude: 77.1004,

    distance: 42,
    gpsAccuracy: 7,

    checkInTime: "12:27 PM",
    checkOutTime: "1:04 PM",

    outcomeDescription: "Client requested another discussion with the procurement team.",
    meetingPhoto: null,
  },

  {
    id: "visit-3",
    leadId: "lead-3",
    leadName: "Vikram Mehta",
    companyName: "Mehta Technologies",
    employeeId: "emp-3",
    employeeName: "Amit Kumar",
    scheduledDate: "2026-09-28",
    scheduledTime: "2:00 PM",
    location: "MG Road, Gurugram",
    visitStatus: "NOT_STARTED",
    outcome: null,

    leadLatitude: 28.4791,
    leadLongitude: 77.0956,

    currentLatitude: 28.4775,
    currentLongitude: 77.0952,

    distance: 214,
    gpsAccuracy: 12,

    checkInTime: null,
    checkOutTime: null,

    outcomeDescription: "",
    meetingPhoto: null,
  },

  {
    id: "visit-4",
    leadId: "lead-4",
    leadName: "Neha Kapoor",
    companyName: "Kapoor Retail",
    employeeId: "emp-1",
    employeeName: "Rahul Sharma",
    scheduledDate: "2026-09-28",
    scheduledTime: "4:30 PM",
    location: "DLF Phase 3, Gurugram",
    visitStatus: "NOT_STARTED",
    outcome: null,

    leadLatitude: 28.4952,
    leadLongitude: 77.0894,

    currentLatitude: 28.5001,
    currentLongitude: 77.0901,

    distance: 510,
    gpsAccuracy: 10,

    checkInTime: null,
    checkOutTime: null,

    outcomeDescription: "",
    meetingPhoto: null,
  },
];

const EMPLOYEES = [
  {
    id: "emp-1",
    name: "Rahul Sharma",
  },
  {
    id: "emp-2",
    name: "Priya Verma",
  },
  {
    id: "emp-3",
    name: "Amit Kumar",
  },
];

const MAP_LEADS = [
  {
    id: "lead-1",
    name: "Rahul Sharma",
    companyName: "ABC Enterprises",
    address: "Sector 18, Gurugram",
    latitude: 28.4597,
    longitude: 77.0264,
    assignedEmployeeId: "emp-1",
    assignedEmployeeName: "Rahul Sharma",
    scheduledDate: "2026-09-28",
    scheduledVisitTime: "11:30 AM",
    visitStatus: "CHECKED_IN",
  },
  {
    id: "lead-2",
    name: "Priya Verma",
    companyName: "Verma Industries",
    address: "Golf Course Road, Gurugram",
    latitude: 28.4421,
    longitude: 77.1001,
    assignedEmployeeId: "emp-2",
    assignedEmployeeName: "Priya Verma",
    scheduledDate: "2026-09-28",
    scheduledVisitTime: "12:30 PM",
    visitStatus: "CHECKED_OUT",
  },
  {
    id: "lead-3",
    name: "Vikram Mehta",
    companyName: "Mehta Technologies",
    address: "MG Road, Gurugram",
    latitude: 28.4791,
    longitude: 77.0956,
    assignedEmployeeId: "emp-3",
    assignedEmployeeName: "Amit Kumar",
    scheduledDate: "2026-09-28",
    scheduledVisitTime: "2:00 PM",
    visitStatus: "NOT_STARTED",
  },
  {
    id: "lead-4",
    name: "Neha Kapoor",
    companyName: "Kapoor Retail",
    address: "DLF Phase 3, Gurugram",
    latitude: 28.4952,
    longitude: 77.0894,
    assignedEmployeeId: "emp-1",
    assignedEmployeeName: "Rahul Sharma",
    scheduledDate: "2026-09-28",
    scheduledVisitTime: "4:30 PM",
    visitStatus: "NOT_STARTED",
  },
];

const MAP_EMPLOYEES = [
  {
    id: "emp-1",
    name: "Rahul Sharma",
    latitude: 28.4591,
    longitude: 77.0268,
    status: "ACTIVE",
    lastUpdated: "18 sec ago",
    accuracy: 8,
  },
  {
    id: "emp-2",
    name: "Priya Verma",
    latitude: 28.4424,
    longitude: 77.1004,
    status: "ACTIVE",
    lastUpdated: "22 sec ago",
    accuracy: 7,
  },
  {
    id: "emp-3",
    name: "Amit Kumar",
    latitude: 28.4775,
    longitude: 77.0952,
    status: "IDLE",
    lastUpdated: "1 min ago",
    accuracy: 12,
  },
];

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const formatTime = (date = new Date()) =>
  date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });

const calculateDistance = (lat1, lon1, lat2, lon2) => {
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

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

const Visits = () => {
  const [visits, setVisits] = useState(INITIAL_VISITS);

  const [search, setSearch] = useState("");
  const [date, setDate] = useState("2026-09-28");
  const [employee, setEmployee] = useState("");
  const [status, setStatus] = useState("");

  const [viewMode, setViewMode] = useState("map");

  const [selectedVisit, setSelectedVisit] = useState(null);
  const [selectedEntity, setSelectedEntity] = useState(null);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [checkOutOpen, setCheckOutOpen] = useState(false);

  const [currentUserLocation, setCurrentUserLocation] = useState({
    latitude: 28.4595,
    longitude: 77.0266,
    accuracy: 8,
  });
  const [gpsStatus, setGpsStatus] = useState("success");

  /* ---------------------------------------------------------------------- */
  /* Browser GPS                                                             */
  /* ---------------------------------------------------------------------- */

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setGpsStatus("unavailable");
      return;
    }

    setGpsStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: Math.round(position.coords.accuracy),
        });
        setGpsStatus("success");
      },
      (error) => {
        console.warn("Unable to access device location:", error);
        if (error.code === error.PERMISSION_DENIED) {
          setGpsStatus("denied");
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
  };

  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsStatus("unavailable");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setCurrentUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: Math.round(position.coords.accuracy),
        });
        setGpsStatus("success");
      },
      (error) => {
        console.warn("Unable to access device location:", error);
        if (error.code === error.PERMISSION_DENIED) {
          setGpsStatus("denied");
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
  }, []);

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
        visit.leadName.toLowerCase().includes(normalizedSearch) ||
        visit.companyName.toLowerCase().includes(normalizedSearch) ||
        visit.employeeName.toLowerCase().includes(normalizedSearch);

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

  const filteredMapLeads = useMemo(
    () =>
      MAP_LEADS.filter((lead) =>
        filteredVisits.some((visit) => visit.leadId === lead.id)
      ),
    [filteredVisits]
  );

  const filteredMapEmployees = useMemo(
    () =>
      MAP_EMPLOYEES.filter((employee) =>
        filteredVisits.some((visit) => visit.employeeId === employee.id)
      ),
    [filteredVisits]
  );

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

  const handleCheckIn = () => {
    if (!selectedVisit) {
      return;
    }

    if (selectedVisit.distance > 100) {
      return;
    }

    const now = new Date();

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
              distance: calculateDistance(
                currentUserLocation.latitude,
                currentUserLocation.longitude,
                visit.leadLatitude,
                visit.leadLongitude
              ),
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
    }));

    setCheckInOpen(false);
  };

  /* ---------------------------------------------------------------------- */
  /* Check-out                                                               */
  /* ---------------------------------------------------------------------- */

  const openCheckOut = (visit) => {
    setSelectedVisit(visit);
    setDetailsOpen(false);
    setCheckOutOpen(true);
  };

  const handleCheckout = ({
    outcome,
    outcomeDescription,
    photo,
  }) => {
    if (!selectedVisit) {
      return;
    }

    const now = new Date();

    setVisits((currentVisits) =>
      currentVisits.map((visit) =>
        visit.id === selectedVisit.id
          ? {
              ...visit,
              visitStatus: "CHECKED_OUT",
              outcome,
              outcomeDescription,
              meetingPhoto: photo,
              checkOutTime: formatTime(now),
            }
          : visit
      )
    );

    setSelectedVisit((current) => ({
      ...current,
      visitStatus: "CHECKED_OUT",
      outcome,
      outcomeDescription,
      meetingPhoto: photo,
      checkOutTime: formatTime(now),
    }));

    setCheckOutOpen(false);
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
        title="Visits"
        description="Track field visits, check-ins and customer outcomes."
        actions={
          <Button>
            <span className="visits__button-content">
              <Plus size={16} />
              Schedule Visit
            </span>
          </Button>
        }
      />

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
          employees={EMPLOYEES}
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
          />
        ) : (
          <VisitTable
            visits={filteredVisits}
            onViewVisit={openVisit}
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
            <VisitDetails visit={activeVisit} />

            <div className="visits-modal-actions">
              {activeVisit.visitStatus === "NOT_STARTED" && (
                <Button
                  disabled={activeVisit.distance > 100}
                  onClick={() => openCheckIn(activeVisit)}
                >
                  {activeVisit.distance > 100
                    ? `Move within 100m`
                    : "Start Visit"}
                </Button>
              )}

              {activeVisit.visitStatus === "CHECKED_IN" && (
                <Button onClick={() => openCheckOut(activeVisit)}>
                  Check Out
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
            />

            <div className="visits-modal-actions">
              <Button
                variant="secondary"
                onClick={() => setCheckInOpen(false)}
              >
                Cancel
              </Button>

              <Button
                disabled={activeVisit.distance > 100}
                onClick={handleCheckIn}
              >
                Check In
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
          />
        )}
      </Modal>
    </div>
  );
};

export default Visits;