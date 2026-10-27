visits_path = r"c:\Users\lenov\OneDrive\Desktop\Ignite-web\src\pages\fieldSales\visits\Visits.jsx"

with open(visits_path, "r", encoding="utf-8") as f:
    code = f.read()

# 1. Add useSearchParams import
old_import = 'import { useEffect, useMemo, useState, useRef, useCallback } from "react";'
new_import = 'import { useEffect, useMemo, useState, useRef, useCallback } from "react";\nimport { useSearchParams } from "react-router-dom";'

assert old_import in code, "Could not find react import in Visits.jsx"
code = code.replace(old_import, new_import, 1)

# 2. Add useSearchParams call and initialize viewMode
old_viewmode = '  const [viewMode, setViewMode] = useState(isManager ? "map" : "list");'
new_viewmode = '''  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const repIdParam = searchParams.get("repId");

  const [viewMode, setViewMode] = useState(tabParam === "map" ? "map" : (tabParam === "table" || tabParam === "list") ? "table" : (isManager ? "map" : "list"));'''

assert old_viewmode in code, "Could not find setViewMode in Visits.jsx"
code = code.replace(old_viewmode, new_viewmode, 1)

# 3. Update routeSummaryData in loadTimeline
old_summary = '''          setRouteSummaryData({
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
          });'''

new_summary = '''          setRouteSummaryData({
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
          });'''

assert old_summary in code, "Could not find setRouteSummaryData in Visits.jsx"
code = code.replace(old_summary, new_summary, 1)

# 4. Update filteredMapEmployees mapping
old_map_emp = '''      const mapEmployee = {
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
      };'''

new_map_emp = '''      const attendanceStatus = attendance
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
      };'''

assert old_map_emp in code, "Could not find mapEmployee definition in Visits.jsx"
code = code.replace(old_map_emp, new_map_emp, 1)

# 5. Update liveLocation merging into mapEmployee
old_merge = '''      mapEmployee.today_visits_count = location.today_visits_count;
      mapEmployee.completed_visits_count = location.completed_visits_count;
      mapEmployee.pending_visits_count = location.pending_visits_count;
      mapEmployee.visit_stage = location.visit_stage;
      mapEmployee.status_label = location.status_label;
      mapEmployee.active_visit_client = location.active_visit_client;
      mapEmployee.check_in_time_formatted = location.check_in_time_formatted;
      mapEmployee.check_out_time_formatted = location.check_out_time_formatted;
      mapEmployee.last_visit_client = location.last_visit_client;'''

new_merge = '''      mapEmployee.today_visits_count = location.today_visits_count;
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
      mapEmployee.is_stale_location = Boolean(location.is_stale || location.is_stale_location);'''

assert old_merge in code, "Could not find merge block in Visits.jsx"
code = code.replace(old_merge, new_merge, 1)

# 6. Auto-select rep from repIdParam
old_return_array = '''    return Array.from(employeesById.values());
  }, [employees, liveLocations, attendanceByEmployeeId]);'''

new_return_array = '''    return Array.from(employeesById.values());
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
  }, [repIdParam, filteredMapEmployees, selectedEntity, handleSelectEntity]);'''

assert old_return_array in code, "Could not find return Array in Visits.jsx"
code = code.replace(old_return_array, new_return_array, 1)

with open(visits_path, "w", encoding="utf-8") as f:
    f.write(code)

print("Updated Visits.jsx successfully!")

