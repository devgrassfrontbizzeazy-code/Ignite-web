import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';
import './AppLayout.css';

/* ==========================================================================
   AppLayout
   The authenticated application shell: Sidebar + TopNavbar + routed page
   content. Sidebar manages its own collapsed state internally, so
   AppLayout does not track or pass any collapse-related props — the
   content column simply adapts because the layout is flexbox-based.
   ========================================================================== */

export default function AppLayout({
  title,
  breadcrumbs,
  userName,
  userRole,
  companyName,
}) {
  const storedUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  })();

  const currentUserName =
    userName && userName !== "Anu Sharma"
      ? userName
      : storedUser.fullName ||
        storedUser.name ||
        `${storedUser.first_name || ""} ${storedUser.last_name || ""}`.trim() ||
        storedUser.email ||
        userName ||
        "Team Member";

  const currentUserRole =
    userRole && userRole !== "Administrator"
      ? userRole
      : storedUser.role ||
        storedUser.designation ||
        userRole ||
        "Member";

  const currentCompanyName =
    companyName && companyName !== "Ignite"
      ? companyName
      : storedUser.company_name ||
        storedUser.companyName ||
        companyName ||
        "Ignite";

  return (
    <div className="app-layout">
      <Sidebar
        userName={currentUserName}
        userRole={currentUserRole}
        companyName={currentCompanyName}
      />

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