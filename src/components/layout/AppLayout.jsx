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
  return (
    <div className="app-layout">
      <Sidebar userName={userName} userRole={userRole} companyName={companyName} />

      <div className="app-layout__content">
        <TopNavbar
          title={title}
          breadcrumbs={breadcrumbs}
          userName={userName}
          userRole={userRole}
        />

        <main className="app-layout__main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}