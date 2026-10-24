import { useEffect, useRef } from "react";
import {
  pingFieldSalesLocation,
  toggleFieldSalesLocation,
  getTodayVisits,
} from "../services/api/fieldSalesAPI";

/**
 * Global Web Tracking Hook for Field Sales Personnel
 *
 * Tracks and pings the logged-in salesperson's GPS coordinates
 * STRICTLY and EXCLUSIVELY while they have an active in-progress visit
 * (between Check-In and Check-Out).
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

    // Check if user is a Field Sales Person (Managers do not ping live location)
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
        Boolean(storedUser.is_sales_person));

    if (!isSalesPerson) return;
    if (!navigator.geolocation) return;

    let isCancelled = false;
    let syncIntervalId = null;

    // 2. Sender function with displacement & time debounce (Anti-loop & anti-spam)
    const sendLocationPing = async (latitude, longitude, accuracy) => {
      const now = Date.now();
      // Debounce: don't ping faster than every 10 seconds unless moved significantly
      if (now - lastPingTimeRef.current < 10000) return;
      if (isPingingRef.current) return;

      isPingingRef.current = true;
      try {
        await pingFieldSalesLocation({
          latitude: Number(latitude),
          longitude: Number(longitude),
          accuracy: accuracy ? Math.round(accuracy) : 10,
        });
        lastPingTimeRef.current = now;
        lastCoordsRef.current = { latitude, longitude };
      } catch (err) {
        console.warn("Web sales location ping deferred:", err?.message || err);
      } finally {
        isPingingRef.current = false;
      }
    };

    // 3. Lifecycle gate: Check if user has an active checked-in visit in progress
    const checkAndSyncTracking = async () => {
      if (isCancelled) return;
      try {
        const res = await getTodayVisits();
        const visits = Array.isArray(res) ? res : res?.data || res?.results || [];
        const hasActiveVisit = visits.some(
          (v) =>
            String(v.status || "").toUpperCase() === "IN_PROGRESS" ||
            (Boolean(v.check_in_time) && !v.check_out_time)
        );

        if (!hasActiveVisit) {
          // If no active visit is in progress, stop tracking immediately
          if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
          }
          toggleFieldSalesLocation(false).catch(() => {});
          return;
        }

        // Active visit in progress: start watching if not already active
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
            (err) => console.warn("Initial web GPS lookup notice:", err?.message || err),
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
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
              { enableHighAccuracy: true, timeout: 20000, maximumAge: 5000 }
            );
          } catch (e) {
            console.warn("Could not start geolocation watcher:", e);
          }
        } else if (lastCoordsRef.current) {
          // Send periodic heartbeat ping if already watching
          sendLocationPing(
            lastCoordsRef.current.latitude,
            lastCoordsRef.current.longitude,
            10
          );
        }
      } catch (err) {
        console.warn("Error verifying active visit status for web tracker:", err);
      }
    };

    // Initial check on mount
    void checkAndSyncTracking();

    // Check visit state every 20 seconds to activate/deactivate tracking as rep checks in / checks out
    syncIntervalId = setInterval(() => {
      void checkAndSyncTracking();
    }, 20000);

    return () => {
      isCancelled = true;
      if (syncIntervalId) clearInterval(syncIntervalId);
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      toggleFieldSalesLocation(false).catch(() => {});
    };
  }, []);

  return null;
}
