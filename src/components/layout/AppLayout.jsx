import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopNavbar from "./TopNavbar";
import useFieldSalesWebTracker from "../../hooks/useFieldSalesWebTracker";
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
    <div className="app-layout">
      <Sidebar />

      <div className="app-layout__content">
        <TopNavbar
          title={title}
          breadcrumbs={breadcrumbs}
          userName={currentUserName}
          userRole={currentUserRole}
        />

        <main className="app-layout__main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}