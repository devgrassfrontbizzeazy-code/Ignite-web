
import { useEffect, useState } from "react";
import "./TopNavbar.css";
import { useLocation } from "react-router-dom";
import { getCompany } from "../../services/api/companyAPI";
import NotificationBell from "../notification/NotificationBell/NotificationBell";
import { useOrganization } from "../../context/OrganizationContext/OrganizationContext";

/* ==========================================================================
   Icons
   ========================================================================== */

const iconProps = {
  width: 20,
  height: 20,
  viewBox: "0 0 20 20",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

const MenuIcon = () => (
  <svg {...iconProps}>
    <path d="M3 5.5h14M3 10h14M3 14.5h14" />
  </svg>
);

const BellIcon = () => (
  <svg {...iconProps}>
    <path d="M5 8.5a5 5 0 0 1 10 0c0 3.2 1 4.3 1.6 5H3.4c.6-.7 1.6-1.8 1.6-5Z" />
    <path d="M8.3 16.5a1.8 1.8 0 0 0 3.4 0" />
  </svg>
);

/* ==========================================================================
   TopNavbar
   ========================================================================== */

export default function TopNavbar({ onMenuClick }) {
  const location = useLocation();
  const { company, setCompany } = useOrganization();

  const [companyName, setCompanyName] = useState("");

  /* ------------------------------------------------------------------------
     Fetch company from backend / context
     ------------------------------------------------------------------------ */

  useEffect(() => {
    if (company?.name) {
      setCompanyName(company.name);
      return;
    }

    let mounted = true;

    const fetchCompany = async () => {
      try {
        const response = await getCompany();

        const companyData = response?.data;

        if (mounted && companyData) {
          setCompany(companyData);
          setCompanyName(companyData.name || "");
        }
      } catch (error) {
        console.error("Failed to fetch company:", error);
      }
    };

    fetchCompany();

    return () => {
      mounted = false;
    };
  }, [company, setCompany]);

  /* ------------------------------------------------------------------------
     Page configuration
     ------------------------------------------------------------------------ */

  const pageConfig = {
    "/dashboard": {
      title: "Dashboard",
      breadcrumbs: ["Home", "Dashboard"],
    },
    "/employees": {
      title: "Employees",
      breadcrumbs: ["Home", "Employees"],
    },
    "/departments": {
      title: "Departments",
      breadcrumbs: ["Home", "Departments"],
    },
    "/designations": {
      title: "Designations",
      breadcrumbs: ["Home", "Designations"],
    },
    "/attendance": {
      title: "Attendance",
      breadcrumbs: ["Home", "Attendance"],
    },
    "/leaves": {
      title: "Leave",
      breadcrumbs: ["Home", "Leave"],
    },
    "/holidays": {
      title: "Holidays",
      breadcrumbs: ["Home", "Holidays"],
    },
    "/organization-overview": {
      title: "Organization",
      breadcrumbs: ["Home", "Organization"],
    },
  };

  const currentPage = pageConfig[location.pathname] || {
    title: "",
    breadcrumbs: [],
  };

  return (
    <header className="top-navbar">
      {/* Left */}
      <div className="top-navbar__heading">
        <button
          type="button"
          className="top-navbar__menu"
          aria-label="Toggle menu"
          onClick={onMenuClick}
        >
          <MenuIcon />
        </button>

        {(currentPage.title || currentPage.breadcrumbs.length > 0) && (
          <div className="top-navbar__titles">
            {currentPage.title && (
              <h1 className="top-navbar__title">
                {currentPage.title}
              </h1>
            )}

            {currentPage.breadcrumbs.length > 0 && (
              <p className="top-navbar__breadcrumb">
                {currentPage.breadcrumbs.join(" / ")}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Right */}
      <div className="top-navbar__actions">
        {companyName && (
          <div
            className="top-navbar__company"
            title={companyName}
          >
            {companyName}
          </div>
        )}

        <NotificationBell />
      </div>
    </header>
  );
}

