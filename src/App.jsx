import { BrowserRouter, Routes, Route } from "react-router-dom";

import { OrganizationProvider } from "./context/OrganizationContext/OrganizationContext";

/* Website */
import HomePage from "./pages/landingPage/HomePage";
import Contact from "./components/landingPage/Contact/Contact";

/* Authentication */
import LoginPage from "./pages/auth/Login/Login";
import ForgotPasswordPage from "./pages/auth/ForgotPassword/ForgotPassword";
import ResetPasswordPage from "./pages/auth/ResetPassword/ResetPassword";
import SignupPage from "./pages/auth/CreateAccount/CreateAccount";
import AcceptInvitePage from "./pages/auth/AcceptInvite/AcceptInvite";

/* Company Setup */
import CompanyDetails from "./pages/companySetup/CompanyDetails/CompanyDetails";
import Address from "./pages/companySetup/Address/Address";
import BusinessSettings from "./pages/companySetup/BusinessSettings/BusinessSettings";
import Review from "./pages/companySetup/Review/Review";
import AccountCreated from "./pages/companySetup/AccountCreated/AccountCreated";

import { CompanySetupProvider } from "./pages/companySetup/CompanySetupContext";

/* Authenticated Layout */
import AppLayout from "./components/layout/AppLayout";

/* Guards */
import ProtectedRoute from "./components/auth/ProtectedRoute";
import CompanySetupGuard from "./components/auth/CompanySetupGuard";
import PermissionGuard from "./components/auth/PermissionGuard";

/* Organization */
import OrganizationSetup from "./pages/OrganizationSetup/OrganizationSetup";
import DepartmentsPage from "./pages/departments/Departments";
import DesignationsPage from "./pages/designations/Designations";
import RolesPermissions from "./pages/rolesPermissions/RolesPermissions";
import Employees from "./pages/employees/Employees";
import AddEmployee from "./pages/employees/AddEmployee/AddEmployee";
import EditEmployee from "./pages/employees/EditEmployee/EditEmployee";
import Attendance from "./pages/attendance/Attendance";
import Leaves from "./pages/leaves/Leaves";

/* Temporary / Dashboard */
function DashboardPreview() {
  return (
    <div style={{ padding: "32px" }}>
      <h1 style={{ fontSize: "24px", fontWeight: "700", color: "#0f172a", marginBottom: "8px" }}>Dashboard</h1>
      <p style={{ color: "#64748b" }}>
        Welcome to your Ignite Workspace Dashboard. Use the sidebar to navigate your attendance, leaves, and organization tools.
      </p>
    </div>
  );
}

function Holidays() {
  return (
    <div style={{ padding: "32px" }}>
      <h1 style={{ fontSize: "24px", fontWeight: "700", color: "#0f172a", marginBottom: "8px" }}>Holidays</h1>
      <p style={{ color: "#64748b" }}>Official organization holidays calendar.</p>
    </div>
  );
}

function Settings() {
  return (
    <div style={{ padding: "32px" }}>
      <h1 style={{ fontSize: "24px", fontWeight: "700", color: "#0f172a", marginBottom: "8px" }}>Settings</h1>
      <p style={{ color: "#64748b" }}>Organization and platform settings.</p>
    </div>
  );
}

export default function App() {
  return (
    <OrganizationProvider>
      <BrowserRouter>
        <CompanySetupProvider>
          <Routes>
            {/* =====================================
                PUBLIC WEBSITE
            ===================================== */}

            <Route path="/" element={<HomePage />} />

            <Route path="/contact" element={<Contact />} />

            {/* =====================================
                AUTHENTICATION
            ===================================== */}

            <Route path="/login" element={<LoginPage />} />

            <Route path="/forgot-password" element={<ForgotPasswordPage />} />

            <Route path="/reset-password" element={<ResetPasswordPage />} />

            <Route path="/signup" element={<SignupPage />} />

            <Route path="/accept-invite" element={<AcceptInvitePage />} />

            {/* =====================================
                COMPANY SETUP

                These routes require authentication,
                but DO NOT require company existence.
            ===================================== */}

            <Route element={<ProtectedRoute />}>
              <Route
                path="/company-setup/company-details"
                element={<CompanyDetails />}
              />

              <Route path="/company-setup/address" element={<Address />} />

              <Route
                path="/company-setup/business-settings"
                element={<BusinessSettings />}
              />

              <Route path="/company-setup/review" element={<Review />} />

              <Route
                path="/company-setup/account-created"
                element={<AccountCreated />}
              />
            </Route>

            {/* =====================================
                AUTHENTICATED APPLICATION

                Requires:
                1. Valid access token
                2. Company already configured
            ===================================== */}

            <Route element={<ProtectedRoute />}>
              <Route element={<CompanySetupGuard />}>
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
                  {/* Inbuilt Employee Accessible Routes */}
                  <Route path="/dashboard" element={<DashboardPreview />} />
                  <Route path="/attendance" element={<Attendance />} />
                  <Route path="/leaves" element={<Leaves />} />
                  <Route path="/holidays" element={<Holidays />} />

                  {/* Admin Only Routes */}
                  <Route element={<PermissionGuard adminOnly />}>
                    <Route path="/organization-setup" element={<OrganizationSetup />} />
                    <Route path="/roles-permissions" element={<RolesPermissions />} />
                    <Route path="/settings" element={<Settings />} />
                  </Route>

                  {/* Permission-Gated Modules */}
                  <Route element={<PermissionGuard requiredPermission="view_department" />}>
                    <Route path="/departments" element={<DepartmentsPage />} />
                  </Route>

                  <Route element={<PermissionGuard requiredPermission="view_designation" />}>
                    <Route path="/designations" element={<DesignationsPage />} />
                  </Route>

                  <Route element={<PermissionGuard requiredPermission="view_user" />}>
                    <Route path="/employees" element={<Employees />} />
                    <Route path="/employees/add" element={<AddEmployee />} />
                    <Route path="/employees/:id/edit" element={<EditEmployee />} />
                  </Route>
                </Route>
              </Route>
            </Route>
          </Routes>
        </CompanySetupProvider>
      </BrowserRouter>
    </OrganizationProvider>
  );
}
