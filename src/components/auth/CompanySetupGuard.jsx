import React, { useEffect, useState } from "react";
import {
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";

import { getCompany } from "../../services/api/companyAPI";

const CompanySetupGuard = () => {
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [companyExists, setCompanyExists] =
    useState(false);

  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;

    const checkCompany = async () => {
      try {
        await getCompany();

        if (mounted) {
          setCompanyExists(true);
        }
      } catch (err) {
        console.error(
          "Company setup check failed:",
          err
        );

        const status =
          err?.response?.status;

        if (mounted) {
          if (status === 404) {
            setCompanyExists(false);
          } else if (status === 401) {
            // Token expired or invalid — clear auth state and redirect to login
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            localStorage.removeItem("user");
            localStorage.removeItem("ignite_authenticated");
            window.location.href = "/login";
          } else {
            /*
             * Don't treat server/network errors as
             * "company not setup".
             */
            setError(true);
          }
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    checkCompany();

    return () => {
      mounted = false;
    };
  }, []);

  // ------------------------------------------
  // LOADING
  // ------------------------------------------

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Manrope, sans-serif",
        }}
      >
        Checking your account...
      </div>
    );
  }

  // ------------------------------------------
  // ERROR
  // ------------------------------------------

  if (error) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Manrope, sans-serif",
          textAlign: "center",
          padding: "24px",
        }}
      >
        <div>
          <h2>
            Unable to verify your company
          </h2>

          <p>
            Please refresh the page and try again.
          </p>
        </div>
      </div>
    );
  }

  // ------------------------------------------
  // COMPANY NOT SET UP
  // ------------------------------------------

  if (!companyExists) {
    return (
      <Navigate
        to="/company-setup/company-details"
        replace
        state={{
          from: location.pathname,
        }}
      />
    );
  }

  // ------------------------------------------
  // COMPANY EXISTS
  // ------------------------------------------

  return <Outlet />;
};

export default CompanySetupGuard;

