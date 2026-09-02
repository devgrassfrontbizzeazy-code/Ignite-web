import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

/* Website */
import HomePage from "./pages/landingPage/HomePage";
import Contact from "./components/landingPage/Contact/Contact";

/* Authentication */
import LoginPage from "./pages/auth/Login/Login";
import ForgotPasswordPage from "./pages/auth/ForgotPassword/ForgotPassword";
import ResetPasswordPage from "./pages/auth/ResetPassword/ResetPassword";

/* Authenticated Layout */
import AppLayout from "./components/layout/AppLayout";

import Card from "./components/common/card/card";
import Button from "./components/common/Button/Button";
import IconButton from "./components/common/IconButton/IconButton";
import ProgressBar from "./components/common/ProgressBar/ProgressBar";

/* Temporary / Dashboard */
function SearchIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="8.5" cy="8.5" r="5.5" />
      <path d="M13 13L17 17" />
    </svg>
  );
}

function DashboardPreview() {
  return (
    <div style={{ padding: "32px" }}>
      <h1>Dashboard</h1>
      <p>
        This is the dashboard content area. The Sidebar and TopNavbar are
        provided by AppLayout.
      </p>
    </div>
  );
}

function OrganizationSetup() {
  return (
    <Card
      title="Organization Setup"
      description="Complete the steps below to get your workspace ready."
      headerAction={<Button size="sm">Continue</Button>}
    >
      <div
        style={{
          display: "flex",
          gap: "12px",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <Button>Primary</Button>

        <Button variant="secondary">Secondary</Button>

        <Button variant="outline">Outline</Button>

        <Button variant="ghost">Ghost</Button>

        <Button variant="danger">Delete</Button>

        <Button loading>Saving...</Button>

        {/* Icon Button */}
        <IconButton icon={<SearchIcon />} label="Search" />

        <ProgressBar value={25} />

        <ProgressBar value={60} showLabel />

        <ProgressBar value={85}  showLabel />
      </div>
    </Card>
  );
}

function Departments() {
  return (
    <div style={{ padding: "32px" }}>
      <h1>Departments</h1>
      <p>Departments page.</p>
    </div>
  );
}

function Designations() {
  return (
    <div style={{ padding: "32px" }}>
      <h1>Designations</h1>
      <p>Designations page.</p>
    </div>
  );
}

function RolesPermissions() {
  return (
    <div style={{ padding: "32px" }}>
      <h1>Roles & Permissions</h1>
      <p>Roles and permissions page.</p>
    </div>
  );
}

function Employees() {
  return (
    <div style={{ padding: "32px" }}>
      <h1>Employees</h1>
      <p>Employees page.</p>
    </div>
  );
}

function Attendance() {
  return (
    <div style={{ padding: "32px" }}>
      <h1>Attendance</h1>
      <p>Attendance page.</p>
    </div>
  );
}

function Leaves() {
  return (
    <div style={{ padding: "32px" }}>
      <h1>Leaves</h1>
      <p>Leaves page.</p>
    </div>
  );
}

function Holidays() {
  return (
    <div style={{ padding: "32px" }}>
      <h1>Holidays</h1>
      <p>Holidays page.</p>
    </div>
  );
}

function Settings() {
  return (
    <div style={{ padding: "32px" }}>
      <h1>Settings</h1>
      <p>Settings page.</p>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ================================================================
            PUBLIC WEBSITE
            ================================================================ */}

        <Route path="/" element={<HomePage />} />

        <Route path="/contact" element={<Contact />} />

        {/* ================================================================
            AUTHENTICATION
            ================================================================ */}

        <Route path="/login" element={<LoginPage />} />

        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* ================================================================
            AUTHENTICATED APPLICATION
            AppLayout provides:
              Sidebar
              TopNavbar
              Main content area
              
            Every nested route is rendered inside <Outlet />
            ================================================================ */}

        <Route
          element={
            <AppLayout
              title="Dashboard"
              breadcrumbs={["Dashboard"]}
              userName="Anu Sharma"
              userRole="Administrator"
              companyName="Ignite"
            />
          }
        >
          <Route path="/dashboard" element={<DashboardPreview />} />

          <Route path="/organization-setup" element={<OrganizationSetup />} />

          <Route path="/departments" element={<Departments />} />

          <Route path="/designations" element={<Designations />} />

          <Route path="/roles-permissions" element={<RolesPermissions />} />

          <Route path="/employees" element={<Employees />} />

          <Route path="/attendance" element={<Attendance />} />

          <Route path="/leaves" element={<Leaves />} />

          <Route path="/holidays" element={<Holidays />} />

          <Route path="/settings" element={<Settings />} />
        </Route>

        {/* ================================================================
            FALLBACK
            ================================================================ */}

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
