import React, { useEffect, useState } from "react";
import {
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";

import IgniteLoader from "../common/IgniteLoader/IgniteLoader";
import { getCompany } from "../../services/api/companyAPI";
import { useOrganization } from "../../context/OrganizationContext/OrganizationContext";

const CompanySetupGuard = () => {
  const location = useLocation();
  const { setCompany } = useOrganization();

  const [loading, setLoading] = useState(true);
  const [companyExists, setCompanyExists] =
    useState(false);

  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;

    const checkCompany = async () => {
      // If user is already identified as an employee or member, they belong to an existing company
      const storedUser = (() => {
        try {
          return JSON.parse(localStorage.getItem("user") || "{}");
        } catch {
          return {};
        }
      })();

      const role = String(storedUser.role || "").toUpperCase();
      const isEmployee =
        role === "MEMBER" ||
        role === "EMPLOYEE" ||
        role.includes("MEMBER") ||
        role.includes("EMPLOYEE");

      try {
        const response = await getCompany();

        if (mounted) {
          if (response?.data) {
            setCompany(response.data);
          }
          setCompanyExists(true);
        }
      } catch (err) {
        console.error("Company setup check failed:", err);
        const status = err?.response?.status;

        if (mounted) {
          if (isEmployee || status === 403) {
            // Employees or users without company edit permission belong to an existing company
            setCompanyExists(true);
          } else if (status === 404) {
            setCompanyExists(false);
          } else if (status === 401) {
            // Token expired or invalid — clear auth state and redirect to login
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            localStorage.removeItem("user");
            localStorage.removeItem("ignite_authenticated");
            window.location.href = "/login";
          } else {
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
    return <IgniteLoader text="Checking your account..." />;
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
          fontFamily: "inherit",
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

