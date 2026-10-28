import { useState } from "react";
import { Outlet, useOutletContext } from "react-router-dom";
import SuperAdminSidebar from "./SuperAdminSidebar";
import SuperAdminHeader from "./SuperAdminHeader";
import "./SuperAdminLayout.css";

export default function SuperAdminLayout() {
  const guardContext = useOutletContext() || {};
  const superAdminUser = guardContext.superAdminUser;

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [headerInfo, setHeaderInfo] = useState({
    title: "Platform Super Admin",
    breadcrumbs: ["Platform", "Dashboard"],
  });

  return (
    <div className="super-layout">
      {/* Platform Sidebar */}
      <SuperAdminSidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
        isMobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Main Content Viewport */}
      <div className="super-layout__content">
        <SuperAdminHeader
          title={headerInfo.title}
          breadcrumbs={headerInfo.breadcrumbs}
          superAdminUser={superAdminUser}
          onOpenMobileSidebar={() => setMobileOpen(true)}
        />

        <main className="super-layout__main">
          <Outlet context={{ superAdminUser, setHeaderInfo }} />
        </main>
      </div>
    </div>
  );
}
