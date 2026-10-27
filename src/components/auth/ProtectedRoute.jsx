
import React from "react";
import {
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";

const ProtectedRoute = () => {
  const location = useLocation();

  const accessToken =
    localStorage.getItem("accessToken") ||
    localStorage.getItem("access_token");
  const refreshToken =
    localStorage.getItem("refreshToken") ||
    localStorage.getItem("refresh_token");

  // Allow session restoration if either an access token or a valid refresh token exists
  if (!accessToken && !refreshToken) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname,
        }}
      />
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;
