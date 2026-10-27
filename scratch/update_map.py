import os

map_jsx_path = r"c:\Users\lenov\OneDrive\Desktop\Ignite-web\src\components\fieldSales\visits\visitMap\LiveFleetCommandMap.jsx"
map_css_path = r"c:\Users\lenov\OneDrive\Desktop\Ignite-web\src\components\fieldSales\visits\visitMap\LiveFleetCommandMap.css"

with open(map_jsx_path, "r", encoding="utf-8") as f:
    code = f.read()

# 1. Update isEmployeeOnShift helper
old_shift_helper = '''const isEmployeeOnShift = (employee) =>
  employee?.shiftStatus === "WORKING" || employee?.shiftStatus === "ON_BREAK";'''

new_shift_helper = '''const isEmployeeOnShift = (employee) =>
  employee?.attendance_status === "CHECKED_IN" ||
  employee?.shiftStatus === "WORKING" ||
  employee?.shiftStatus === "ON_BREAK";'''

assert old_shift_helper in code, "Could not find isEmployeeOnShift"
code = code.replace(old_shift_helper, new_shift_helper, 1)

# 2. Add createCheckpointMarkerIcon after createEmployeeMarkerIcon
old_marker_helper = '''const createEmployeeMarkerIcon = (selected = false) => {'''
new_marker_helper = '''const createCheckpointMarkerIcon = (label, isFinalized = false) => {
  const bg = label === "IN" ? "#10b981" : isFinalized ? "#ef4444" : "#3b82f6";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
    <circle cx="18" cy="18" r="15" fill="${bg}" stroke="#FFFFFF" stroke-width="2.5"/>
    <text x="18" y="22" text-anchor="middle" font-family="Arial,sans-serif" font-size="11" font-weight="800" fill="#FFFFFF">${label}</text>
  </svg>`;
  return svgDataUri(svg);
};

const createEmployeeMarkerIcon = (selected = false) => {'''

assert old_marker_helper in code, "Could not find createEmployeeMarkerIcon"
code = code.replace(old_marker_helper, new_marker_helper, 1)

# 3. Update Start / Check-in MarkerF and End / Check-out MarkerF
old_start_end = '''            {/* Start / Check-in Marker */}
            {historyRouteCoords.length > 0 && (
              <MarkerF
                key={`route-start-${historyRouteCoords[0].timestamp || 0}`}
                position={{ lat: historyRouteCoords[0].lat, lng: historyRouteCoords[0].lng }}
                title={`First recorded location: ${formatPingTimestamp(historyRouteCoords[0].timestamp)}`}
                onClick={() => {
                  setInfoWindowTarget({
                    type: "checkpoint",
                    data: {
                      title: "First recorded location",
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
                title={`Last recorded location: ${formatPingTimestamp(historyRouteCoords[historyRouteCoords.length - 1].timestamp)}`}
                onClick={() => {
                  setInfoWindowTarget({
                    type: "checkpoint",
                    data: {
                      title: "Last recorded location",
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
            )}'''

new_start_end = '''            {/* Start / Check-in Marker (Green Badge Marker) */}
            {historyRouteCoords.length > 0 && (
              <MarkerF
                key={`route-start-${historyRouteCoords[0].timestamp || 0}`}
                position={{ lat: historyRouteCoords[0].lat, lng: historyRouteCoords[0].lng }}
                title={`Shift Check-in: ${routeSummary?.check_in_time || formatPingTimestamp(historyRouteCoords[0].timestamp)}`}
                onClick={() => {
                  setInfoWindowTarget({
                    type: "checkpoint",
                    data: {
                      title: "🟢 Shift Check-in Location",
                      time: routeSummary?.check_in_time || formatPingTimestamp(historyRouteCoords[0].timestamp),
                      address: routeSummary?.start_location_name || routeSummary?.check_in_address || "",
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
                  routeSummary?.is_finalized || routeSummary?.check_out_time
                    ? `Shift Check-out: ${routeSummary?.check_out_time || formatPingTimestamp(historyRouteCoords[historyRouteCoords.length - 1].timestamp)}`
                    : `Live Location: ${formatPingTimestamp(historyRouteCoords[historyRouteCoords.length - 1].timestamp)}`
                }
                onClick={() => {
                  const isCheckout = Boolean(routeSummary?.is_finalized || routeSummary?.check_out_time);
                  setInfoWindowTarget({
                    type: "checkpoint",
                    data: {
                      title: isCheckout ? "🔴 Shift Check-out Location" : "🔵 Current Live Position",
                      time: isCheckout
                        ? (routeSummary?.check_out_time || formatPingTimestamp(historyRouteCoords[historyRouteCoords.length - 1].timestamp))
                        : formatPingTimestamp(historyRouteCoords[historyRouteCoords.length - 1].timestamp),
                      address: routeSummary?.end_location_name || routeSummary?.check_out_address || "",
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
                          (routeSummary?.is_finalized || routeSummary?.check_out_time) ? "OUT" : "NOW",
                          Boolean(routeSummary?.is_finalized || routeSummary?.check_out_time)
                        ),
                        scaledSize: new window.google.maps.Size(32, 32),
                        anchor: new window.google.maps.Point(16, 16),
                      }
                    : {
                        path: window.google?.maps?.SymbolPath?.CIRCLE || 0,
                        scale: 9,
                        fillColor: (routeSummary?.is_finalized || routeSummary?.check_out_time) ? "#ef4444" : "#3b82f6",
                        fillOpacity: 1,
                        strokeColor: "#ffffff",
                        strokeWeight: 2.5,
                      }
                }
              />
            )}'''

assert old_start_end in code, "Could not find start/end markers in LiveFleetCommandMap.jsx"
code = code.replace(old_start_end, new_start_end, 1)

# 4. Update InfoWindow to display address for checkpoints
old_infowindow = '''                    {infoWindowTarget.type === "checkpoint" ? (
                      <div>
                        <strong>{infoWindowData.title}</strong>
                        <p>{infoWindowData.time}</p>
                        {infoWindowData.battery != null && ('''

new_infowindow = '''                    {infoWindowTarget.type === "checkpoint" ? (
                      <div>
                        <strong>{infoWindowData.title}</strong>
                        <p>{infoWindowData.time}</p>
                        {infoWindowData.address && (
                          <p style={{ margin: "2px 0 4px", fontSize: "11px", color: "#64748b" }}>
                            📍 {infoWindowData.address}
                          </p>
                        )}
                        {infoWindowData.battery != null && ('''

assert old_infowindow in code, "Could not find old_infowindow in LiveFleetCommandMap.jsx"
code = code.replace(old_infowindow, new_infowindow, 1)

# 5. Update right sidebar with Authoritative Workday Attendance & Tracking card
old_right_header = '''              <div className="fleet-selected-employee-header">
                <div>
                  <h4 className="fleet-rep-title">{selectedEmployee.name}</h4>
                  <p className="fleet-rep-subtitle">'''

new_right_header = '''              <div className="fleet-selected-employee-header">
                <div>
                  <h4 className="fleet-rep-title">{selectedEmployee.name}</h4>
                  <p className="fleet-rep-code" style={{ fontSize: "12px", color: "#64748b", margin: "2px 0 4px" }}>
                    ID: {selectedEmployee.employee_code || selectedEmployee.employee_id || selectedEmployee.id}
                  </p>
                  <p className="fleet-rep-subtitle">'''

assert old_right_header in code, "Could not find old_right_header in LiveFleetCommandMap.jsx"
code = code.replace(old_right_header, new_right_header, 1)

old_counter_row = '''              <div className="fleet-counter-row">
                <div className="fleet-counter-card">
                  <span className="fleet-counter-card__label">Assigned</span>'''

new_counter_row = '''              {/* Authoritative Workday Attendance & Field Telemetry Card */}
              <div className="fleet-attendance-tracking-card">
                <div className="fleet-att-row">
                  <span className="fleet-att-label">Attendance:</span>
                  <span className={`fleet-att-badge fleet-att-badge--${(selectedEmployee.attendance_status || (isEmployeeOnShift(selectedEmployee) ? "CHECKED_IN" : selectedEmployee.shiftCheckOut ? "CHECKED_OUT" : "NOT_CHECKED_IN")).toLowerCase()}`}>
                    {selectedEmployee.attendance_status === "CHECKED_IN" || isEmployeeOnShift(selectedEmployee)
                      ? "Checked In"
                      : selectedEmployee.attendance_status === "CHECKED_OUT" || selectedEmployee.shiftCheckOut
                      ? "Checked Out"
                      : "Not Checked In"}
                  </span>
                </div>

                <div className="fleet-att-row">
                  <span className="fleet-att-label">GPS Telemetry:</span>
                  <span className={`fleet-gps-badge ${selectedEmployee.isActiveTracking && !selectedEmployee.is_stale_location ? "live" : selectedEmployee.is_stale_location ? "stale" : selectedEmployee.hasLiveGps ? "cached" : "none"}`}>
                    {selectedEmployee.isActiveTracking && !selectedEmployee.is_stale_location
                      ? "🟢 Live GPS"
                      : selectedEmployee.is_stale_location
                      ? "⚠️ Stale GPS (> 2m ago)"
                      : selectedEmployee.hasLiveGps
                      ? "Last known GPS"
                      : "Location unavailable"}
                  </span>
                </div>

                <div className="fleet-att-row">
                  <span className="fleet-att-label">Check-in:</span>
                  <span className="fleet-att-val">
                    {selectedEmployee.check_in_time_formatted || selectedEmployee.shiftCheckIn || routeSummary?.check_in_time || "—"}
                    {(selectedEmployee.check_in_address || routeSummary?.start_location_name) && (
                      <span className="fleet-att-subtext">📍 {selectedEmployee.check_in_address || routeSummary?.start_location_name}</span>
                    )}
                  </span>
                </div>

                {(selectedEmployee.check_out_time_formatted || selectedEmployee.shiftCheckOut || routeSummary?.check_out_time) && (
                  <div className="fleet-att-row">
                    <span className="fleet-att-label">Check-out:</span>
                    <span className="fleet-att-val">
                      {selectedEmployee.check_out_time_formatted || selectedEmployee.shiftCheckOut || routeSummary?.check_out_time}
                      {(selectedEmployee.check_out_address || routeSummary?.end_location_name) && (
                        <span className="fleet-att-subtext">📍 {selectedEmployee.check_out_address || routeSummary?.end_location_name}</span>
                      )}
                    </span>
                  </div>
                )}

                <div className="fleet-att-row">
                  <span className="fleet-att-label">Day Distance:</span>
                  <strong className="fleet-att-val text-emerald">
                    {selectedEmployee.today_distance_km ?? routeSummary?.total_distance_km ?? 0} KM
                  </strong>
                </div>

                <div className="fleet-att-row">
                  <span className="fleet-att-label">Last GPS Ping:</span>
                  <span className="fleet-att-val">
                    {selectedEmployee.last_ping_formatted || (selectedEmployee.last_ping_at ? formatPingTimestamp(selectedEmployee.last_ping_at) : "—")}
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
                  <span className="fleet-counter-card__label">Assigned</span>'''

assert old_counter_row in code, "Could not find old_counter_row in LiveFleetCommandMap.jsx"
code = code.replace(old_counter_row, new_counter_row, 1)

with open(map_jsx_path, "w", encoding="utf-8") as f:
    f.write(code)

print("Updated LiveFleetCommandMap.jsx successfully!")

# Update LiveFleetCommandMap.css
with open(map_css_path, "r", encoding="utf-8") as f:
    css_content = f.read()

sidebar_css = """
/* =========================
   WORKDAY ATTENDANCE & TELEMETRY SIDEBAR CARD
========================= */

.fleet-attendance-tracking-card {
  margin: 10px 0 12px;
  padding: 10px 12px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.fleet-att-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  font-size: 12px;
}

.fleet-att-label {
  color: #64748b;
  font-weight: 500;
  flex-shrink: 0;
}

.fleet-att-val {
  color: #0f172a;
  font-weight: 600;
  text-align: right;
  word-break: break-word;
}

.fleet-att-subtext {
  display: block;
  font-size: 11px;
  font-weight: 400;
  color: #64748b;
  margin-top: 2px;
}

.fleet-att-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 700;
  text-transform: capitalize;
}

.fleet-att-badge--checked_in {
  background: #ecfdf5;
  color: #059669;
  border: 1px solid #a7f3d0;
}

.fleet-att-badge--checked_out {
  background: #f8fafc;
  color: #475569;
  border: 1px solid #cbd5e1;
}

.fleet-att-badge--not_checked_in {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.fleet-gps-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 600;
}

.fleet-gps-badge.live {
  background: #ecfdf5;
  color: #059669;
}

.fleet-gps-badge.stale {
  background: #fffbeb;
  color: #d97706;
}

.fleet-gps-badge.cached {
  background: #f1f5f9;
  color: #475569;
}

.fleet-gps-badge.none {
  background: #f8fafc;
  color: #94a3b8;
}

.fleet-open-profile-btn {
  margin-top: 6px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid #cbd5e1;
  background: #f8fafc;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #0f172a;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.fleet-open-profile-btn:hover {
  background: #edf2f7;
  border-color: #94a3b8;
  color: #000000;
}
"""

with open(map_css_path, "w", encoding="utf-8") as f:
    f.write(css_content + "\n" + sidebar_css)

print("Updated LiveFleetCommandMap.css successfully!")

