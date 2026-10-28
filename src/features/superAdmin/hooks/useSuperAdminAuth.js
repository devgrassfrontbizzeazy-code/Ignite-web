import { useState, useEffect, useCallback } from "react";
import superAdminAPI from "../services/superAdminAPI";
import {
  getSuperAdminAccessToken,
  getSuperAdminRefreshToken,
} from "../../../services/api/axios";

/**
 * Hook to verify platform Super Admin authorization directly with backend.
 * Never trusts client-side storage or claims; verifies against DB via /api/super-admin/me/.
 */
export function useSuperAdminAuth() {
  const [authStatus, setAuthStatus] = useState("loading"); // "loading" | "authorized" | "forbidden" | "unauthorized" | "error"
  const [superAdminUser, setSuperAdminUser] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const verifyAccess = useCallback(async () => {
    const accessToken = getSuperAdminAccessToken();
    const refreshToken = getSuperAdminRefreshToken();

    if (!accessToken && !refreshToken) {
      setAuthStatus("unauthorized");
      setSuperAdminUser(null);
      setErrorMessage("No authentication token found. Please sign in.");
      return;
    }

    setAuthStatus("loading");
    setErrorMessage("");

    try {
      const response = await superAdminAPI.getMe();
      const userData = response?.data;

      // Ensure user is an active Django superuser
      if (userData && userData.is_superuser && userData.is_active) {
        setSuperAdminUser(userData);
        setAuthStatus("authorized");
      } else {
        // Authenticated, but not an active platform superuser
        setSuperAdminUser(userData || null);
        setAuthStatus("forbidden");
        setErrorMessage(
          "Your account does not have platform-wide Super Admin privileges. Platform administration is restricted to system superusers."
        );
      }
    } catch (err) {
      const statusCode = err?.response?.status;
      const backendMessage =
        err?.response?.data?.message ||
        err?.response?.data?.detail ||
        err?.message;

      if (statusCode === 401) {
        // Unauthenticated or token invalid and couldn't be refreshed
        setAuthStatus("unauthorized");
        setSuperAdminUser(null);
        setErrorMessage(backendMessage || "Authentication required.");
      } else if (statusCode === 403) {
        // Authenticated company admin or employee without platform superuser role
        // Crucial: preserve existing session, do not log out
        setAuthStatus("forbidden");
        setErrorMessage(
          backendMessage ||
            "Access denied. Platform Super Admin privileges required."
        );
      } else {
        // Network or 500 error
        setAuthStatus("error");
        setErrorMessage(
          backendMessage ||
            "Unable to verify platform authorization. Please check network connection."
        );
      }
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    verifyAccess();
  }, [verifyAccess]);

  return {
    authStatus,
    superAdminUser,
    errorMessage,
    verifyAccess,
  };
}

export default useSuperAdminAuth;
