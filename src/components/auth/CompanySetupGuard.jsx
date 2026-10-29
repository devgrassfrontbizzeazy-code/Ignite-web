import React, { useEffect, useState } from "react";
import {
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";

import IgniteLoader from "../common/IgniteLoader/IgniteLoader";
import { getCompany } from "../../services/api/companyAPI";
import { clearAuthSession } from "../../services/api/axios";
import { useOrganization } from "../../context/OrganizationContext/OrganizationContext";

const CompanySetupGuard = () => {
  const location = useLocation();
  const { setCompany } = useOrganization();

  const syncUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  })();
  const syncRole = String(syncUser.role || "").toUpperCase();
  const syncIsOwnerOrAdmin =
    syncRole === "OWNER" ||
    syncRole === "ADMIN" ||
    syncRole === "ADMINISTRATOR" ||
    syncUser.is_superuser === true;
  const syncIsEmployee = !syncIsOwnerOrAdmin;
  const syncHasCompany = Boolean(syncUser.company_id || syncUser.companyId);
  const isSynchronouslyKnown = syncHasCompany || (syncIsOwnerOrAdmin && !syncHasCompany);

  const [loading, setLoading] = useState(true);
  const [companyExists, setCompanyExists] = useState(syncHasCompany);
  const [notInCompany, setNotInCompany] = useState(syncIsEmployee && !syncHasCompany && !syncUser.is_field_sales);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;

    const checkCompany = async () => {
      const storedUser = (() => {
        try {
          return JSON.parse(localStorage.getItem("user") || "{}");
        } catch {
          return {};
        }
      })();

      const role = String(storedUser.role || "").toUpperCase();
      const isOwnerOrAdmin =
        role === "OWNER" ||
        role === "ADMIN" ||
        role === "ADMINISTRATOR" ||
        storedUser.is_superuser === true;
      const isEmployee = !isOwnerOrAdmin;
      const hasCompany = Boolean(storedUser.company_id || storedUser.companyId);

      // If user is an employee and has no company association, they are not in any company
      if (isEmployee && !hasCompany && !storedUser.is_field_sales) {
        if (mounted) {
          setNotInCompany(true);
          setLoading(false);
        }
        return;
      }

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
          if (status === 404) {
            if (isEmployee) {
              setNotInCompany(true);
            } else {
              setCompanyExists(false);
            }
          } else if (status === 403) {
            if (isEmployee && !hasCompany) {
              setNotInCompany(true);
            } else {
              setCompanyExists(true);
            }
          } else if (status === 401) {
            setError(true);
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
  // NOT IN ANY COMPANY
  // ------------------------------------------

  if (notInCompany) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f8fafc",
          padding: "24px",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <div
          style={{
            maxWidth: "460px",
            width: "100%",
            background: "#ffffff",
            borderRadius: "16px",
            padding: "40px 32px",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)",
            textAlign: "center",
            border: "1px solid #e2e8f0",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              background: "#fee2e2",
              color: "#ef4444",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
              fontSize: "28px",
            }}
          >
            🏢
          </div>
          <h2
            style={{
              fontSize: "22px",
              fontWeight: "700",
              color: "#0f172a",
              marginBottom: "12px",
            }}
          >
            You are not in any company now
          </h2>
          <p
            style={{
              fontSize: "14px",
              color: "#64748b",
              lineHeight: "1.6",
              marginBottom: "28px",
            }}
          >
            Your account is not associated with any active company. If you believe this is an error, please contact your organization administrator.
          </p>
          <button
            onClick={() => {
              clearAuthSession();
              window.location.href = "/login";
            }}
            style={{
              width: "100%",
              padding: "12px 20px",
              background: "#f97316",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "background 0.2s",
            }}
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

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

