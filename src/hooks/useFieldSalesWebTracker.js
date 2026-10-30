import { useEffect, useRef } from "react";
import {
  pingFieldSalesLocation,
  toggleFieldSalesLocation,
  getTodayVisits,
} from "../services/api/fieldSalesAPI";
import { attendanceAPI } from "../services/api/attendanceAPI";

/**
 * Global Real-Time Web Tracking Hook for Field Sales Personnel
 *
 * Sends GPS heartbeat pings every 5 seconds while the salesperson
 * is on shift or has an active visit in progress, ensuring real-time active/inactive status.
 */
export default function useFieldSalesWebTracker() {
  const lastPingTimeRef = useRef(0);
  const lastCoordsRef = useRef(null);
  const watchIdRef = useRef(null);
  const isPingingRef = useRef(false);

  useEffect(() => {
    // 1. Resolve logged-in user from localStorage
    let storedUser = null;
    try {
      storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return;
    }

    if (!storedUser || !storedUser.id) return;

    // Check if user is a Field Sales representative
    const role = String(storedUser.role || storedUser.designation || "").toUpperCase();
    const isManagerRole =
      role === "MANAGER" ||
      role.includes("MANAGER") ||
      role === "ADMIN" ||
      role === "OWNER";
    const isSalesPerson =
      !isManagerRole &&
      (role === "SALES_PERSON" ||
        role.includes("SALES") ||
        role === "MEMBER" ||
        storedUser.department === "Field Sales" ||
        Boolean(storedUser.is_sales_person) ||
        Boolean(storedUser.is_field_sales));

    if (!isSalesPerson) return;
    if (!navigator.geolocation) return;

    let isCancelled = false;

    // 2. Sender function: sends GPS ping every 5 seconds
    const sendLocationPing = async (latitude, longitude, accuracy) => {
      const now = Date.now();
      // Enforce 4.5s debounce so it sends cleanly on the 5-second cadence
      if (now - lastPingTimeRef.current < 4500) return;
      if (isPingingRef.current) return;

      isPingingRef.current = true;
      try {
        await pingFieldSalesLocation({
          latitude: Number(latitude),
          longitude: Number(longitude),
          accuracy: accuracy ? Math.round(accuracy) : 10,
          is_active_tracking: true,
          is_tracking: true,
        });
        lastPingTimeRef.current = now;
        lastCoordsRef.current = { latitude, longitude, accuracy };
      } catch (err) {
        console.warn("Real-time GPS ping error:", err?.message || err);
      } finally {
        isPingingRef.current = false;
      }
    };

    // 3. Check shift & visit status, then start tracking and send 5s heartbeats
    const checkAndSyncTracking = async () => {
      if (isCancelled) return;
      try {
        const res = await getTodayVisits().catch(() => null);
        const visits = Array.isArray(res) ? res : res?.data || res?.results || [];
        const hasActiveVisit = visits.some(
          (v) =>
            String(v.status || "").toUpperCase() === "IN_PROGRESS" ||
            (Boolean(v.check_in_time) && !v.check_out_time)
        );

        let isUserOnShift = false;
        try {
          const attRes = await attendanceAPI.getTodayAttendance().catch(() => null);
          const att = attRes?.data;
          if (att) {
            const status = String(att.status || "").toUpperCase();
            isUserOnShift =
              (status === "WORKING" || status === "ON_BREAK" || Boolean(att.checkInAt)) &&
              !att.checkOutAt;
          }
        } catch {
          // fallback
        }

        if (!isUserOnShift) {
          try {
            const userObj = JSON.parse(localStorage.getItem("user") || "{}");
            isUserOnShift =
              userObj?.attendance_status === "CHECKED_IN" ||
              userObj?.shiftStatus === "WORKING" ||
              userObj?.is_on_shift === true;
          } catch {
            // fallback
          }
        }

        const isTrackingAllowed = hasActiveVisit || isUserOnShift;

        if (!isTrackingAllowed) {
          if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
          }
          toggleFieldSalesLocation(false).catch(() => {});
          return;
        }

        // Active tracking is enabled
        toggleFieldSalesLocation(true).catch(() => {});

        // Start watcher if not running
        if (watchIdRef.current === null) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              if (!isCancelled) {
                sendLocationPing(
                  pos.coords.latitude,
                  pos.coords.longitude,
                  pos.coords.accuracy
                );
              }
            },
            (err) => console.warn("GPS lookup notice:", err?.message || err),
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
          );

          try {
            watchIdRef.current = navigator.geolocation.watchPosition(
              (pos) => {
                if (!isCancelled) {
                  sendLocationPing(
                    pos.coords.latitude,
                    pos.coords.longitude,
                    pos.coords.accuracy
                  );
                }
              },
              (err) => {
                if (err.code === 1) {
                  toggleFieldSalesLocation(false).catch(() => {});
                }
              },
              { enableHighAccuracy: true, timeout: 15000, maximumAge: 3000 }
            );
          } catch (e) {
            console.warn("Could not start geolocation watcher:", e);
          }
        } else if (lastCoordsRef.current) {
          // Send 5-second heartbeat ping with current position (keeps status Active in real time even when stationary)
          sendLocationPing(
            lastCoordsRef.current.latitude,
            lastCoordsRef.current.longitude,
            lastCoordsRef.current.accuracy || 10
          );
        }
      } catch (err) {
        console.warn("Real-time tracking sync warning:", err?.message || err);
      }
    };

    // Run immediately and poll every 5 seconds for real-time active/inactive status
    void checkAndSyncTracking();
    const syncIntervalId = setInterval(checkAndSyncTracking, 5000);

    return () => {
      isCancelled = true;
      clearInterval(syncIntervalId);
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, []);

  return null;
}