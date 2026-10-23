
import { useEffect } from "react";
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

const PAGE_CONTEXTS = {
  "/dashboard": { title: "Dashboard", breadcrumbs: ["Home", "Dashboard"] },
  "/profile": { title: "Profile", breadcrumbs: ["Home", "Profile"] },
  "/field-sales": { title: "Dashboard", breadcrumbs: ["Field Sales", "Dashboard"] },
  "/field-sales/dashboard": { title: "Dashboard", breadcrumbs: ["Field Sales", "Dashboard"] },
  "/field-sales/employees": { title: "Employees", breadcrumbs: ["Field Sales", "Employees"] },
  "/field-sales/leads": { title: "Leads", breadcrumbs: ["Field Sales", "Leads"] },
  "/field-sales/leads/add": { title: "Add Lead", breadcrumbs: ["Field Sales", "Leads", "Add Lead"] },
  "/field-sales/visits": { title: "Visits", breadcrumbs: ["Field Sales", "Visits"] },
  "/employees": { title: "Employees", breadcrumbs: ["Home", "Employees"] },
  "/employees/add": { title: "Add Employee", breadcrumbs: ["Employees", "Add Employee"] },
  "/departments": { title: "Departments", breadcrumbs: ["Home", "Departments"] },
  "/designations": { title: "Designations", breadcrumbs: ["Home", "Designations"] },
  "/roles-permissions": { title: "Roles & Permissions", breadcrumbs: ["Organization", "Roles & Permissions"] },
  "/roles-permissions/add": { title: "Add Role", breadcrumbs: ["Roles & Permissions", "Add Role"] },
  "/roles-permissions/create": { title: "Add Role", breadcrumbs: ["Roles & Permissions", "Add Role"] },
  "/attendance": { title: "Attendance", breadcrumbs: ["Home", "Attendance"] },
  "/leaves": { title: "Leaves", breadcrumbs: ["Home", "Leaves"] },
  "/holidays": { title: "Holidays", breadcrumbs: ["Home", "Holidays"] },
  "/my-payslips": { title: "My Payslips", breadcrumbs: ["Account", "My Payslips"] },
  "/organization-overview": { title: "Organization", breadcrumbs: ["Home", "Organization"] },
  "/work-management": { title: "Work Management", breadcrumbs: ["Home", "Work Management"] },
  "/teams": { title: "Teams", breadcrumbs: ["Work Management", "Teams"] },
  "/tasks": { title: "Tasks", breadcrumbs: ["Work Management", "Tasks"] },
  "/work-schedule": { title: "Work Schedule", breadcrumbs: ["Organization", "Work Schedule"] },
  "/leave-policies": { title: "Leave Policies", breadcrumbs: ["Organization", "Leave Policies"] },
  "/settings": { title: "Settings", breadcrumbs: ["Home", "Settings"] },
  "/account/payslips": { title: "Payslips", breadcrumbs: ["Account", "Payslips"] },
  "/account/salary-structures": { title: "Salary Structures", breadcrumbs: ["Account", "Salary Structures"] },
  "/account/process-payroll": { title: "Process Payroll", breadcrumbs: ["Account", "Process Payroll"] },
  "/account/payroll-history": { title: "Payroll History", breadcrumbs: ["Account", "Payroll History"] },
  "/account/payroll-settings": { title: "Payroll Settings", breadcrumbs: ["Account", "Payroll Settings"] },
  "/account/my-payroll": { title: "My Payroll", breadcrumbs: ["Account", "My Payroll"] },
};

const getPageContext = (pathname) => {
  const path = pathname.replace(/\/+$/, "") || "/";
  const exactContext = PAGE_CONTEXTS[path];
  if (exactContext) return exactContext;

  if (/^\/tasks\/[^/]+$/.test(path)) {
    return { title: "Task Details", breadcrumbs: ["Work Management", "Tasks", "Details"] };
  }
  if (/^\/teams\/[^/]+$/.test(path)) {
    return { title: "Team Details", breadcrumbs: ["Work Management", "Teams", "Details"] };
  }
  if (/^\/employees\/[^/]+\/edit$/.test(path)) {
    return { title: "Edit Employee", breadcrumbs: ["Employees", "Edit Employee"] };
  }
  if (/^\/employees\/[^/]+$/.test(path)) {
    return { title: "Employee Profile", breadcrumbs: ["Employees", "Profile"] };
  }
  if (/^\/roles-permissions\/[^/]+\/edit$/.test(path)) {
    return { title: "Edit Role", breadcrumbs: ["Roles & Permissions", "Edit Role"] };
  }
  if (/^\/field-sales\/leads\/[^/]+\/edit$/.test(path)) {
    return { title: "Edit Lead", breadcrumbs: ["Field Sales", "Leads", "Edit Lead"] };
  }

  const segments = path.split("/").filter(Boolean);
  const title = segments.at(-1)
    ?.split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ") || "Home";
  const section = segments[0]
    ?.split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

  return {
    title: /^\d+$/.test(segments.at(-1) || "") ? "Details" : title,
    breadcrumbs: section && section !== title ? [section, title] : [title],
  };
};

/* ==========================================================================
   TopNavbar
   ========================================================================== */

export default function TopNavbar({ onMenuClick }) {
  const location = useLocation();
  const { company, setCompany } = useOrganization();

  /* ------------------------------------------------------------------------
     Fetch company from backend / context
     ------------------------------------------------------------------------ */

  useEffect(() => {
    if (company?.name) {
      return;
    }

    let mounted = true;

    const fetchCompany = async () => {
      try {
        const response = await getCompany();

        const companyData = response?.data;

        if (mounted && companyData) {
          setCompany(companyData);
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

  const companyName = company?.name || "";

  /* ------------------------------------------------------------------------
     Page configuration
     ------------------------------------------------------------------------ */

  const currentPage = getPageContext(location.pathname);

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

            <nav
              className="top-navbar__breadcrumb"
              aria-label="Breadcrumb"
            >
              {currentPage.breadcrumbs.join(" / ")}
            </nav>
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
