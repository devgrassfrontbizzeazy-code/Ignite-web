import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopNavbar from "./TopNavbar";
import useFieldSalesWebTracker from "../../hooks/useFieldSalesWebTracker";
import api from "../../services/api/axios";
import "./AppLayout.css";

/* ==========================================================================
   AppLayout
   Authenticated application shell:
   Sidebar + TopNavbar + routed page content.
   User identity is resolved from the authenticated user stored in localStorage.
   ========================================================================== */

export default function AppLayout({
  title,
  breadcrumbs,
  userName,
  userRole,
  companyName,
}) {
  // Automatically activate live web location tracking for logged-in field sales reps
  useFieldSalesWebTracker();

  // Smaller screen devices (tablets and phones) start with the sidebar collapsed
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth <= 1024;
    }
    return false;
  });

  // Automatically collapse sidebar when window resizes down to tablet/mobile breakpoint
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    const mql = window.matchMedia("(max-width: 1024px)");
    const handleMediaChange = (e) => {
      if (e.matches) {
        setCollapsed(true);
      }
    };

    if (mql.addEventListener) {
      mql.addEventListener("change", handleMediaChange);
    } else {
      mql.addListener(handleMediaChange);
    }

    return () => {
      if (mql.removeEventListener) {
        mql.removeEventListener("change", handleMediaChange);
      } else {
        mql.removeListener(handleMediaChange);
      }
    };
  }, []);

  const handleToggleSidebar = () => {
    setCollapsed((prev) => !prev);
  };

  const handleCloseSidebar = () => {
    setCollapsed(true);
  };

  // Warm up primary navigation endpoints in background for instant 0ms switching
  useEffect(() => {
    const timer = setTimeout(() => {
      api.get("/department/").catch(() => {});
      api.get("/designation/").catch(() => {});
      api.get("/roles/").catch(() => {});
      api.get("/holidays/").catch(() => {});
      api.get("/employees/").catch(() => {});
    }, 400);

    return () => clearTimeout(timer);
  }, []);

  const storedUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  })();

  const currentUserName =
    storedUser.full_name ||
    storedUser.fullName ||
    storedUser.name ||
    `${storedUser.first_name || ""} ${storedUser.last_name || ""}`.trim() ||
    storedUser.email ||
    userName ||
    "Team Member";

  const currentUserRole =
    storedUser.role ||
    storedUser.designation ||
    userRole ||
    "Member";

  const currentCompanyName =
    storedUser.company_name ||
    storedUser.companyName ||
    companyName ||
    "Ignite";

  return (
    <div
      className={`app-layout ${
        collapsed
          ? "app-layout--sidebar-collapsed"
          : "app-layout--sidebar-expanded"
      }`}
    >
      {/* Dimmed backdrop for mobile overlay drawer */}
      {!collapsed && (
        <div
          className="sidebar-backdrop is-visible"
          onClick={handleCloseSidebar}
          aria-label="Close sidebar backdrop"
        />
      )}

      <Sidebar
        collapsed={collapsed}
        onToggle={handleToggleSidebar}
        onClose={handleCloseSidebar}
      />

      <div className="app-layout__content">
        <TopNavbar
          title={title}
          breadcrumbs={breadcrumbs}
          userName={currentUserName}
          userRole={currentUserRole}
          companyName={currentCompanyName}
          onMenuClick={handleToggleSidebar}
        />

        <main className="app-layout__main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}