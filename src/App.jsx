import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import {
  OrganizationProvider,
} from "./context/OrganizationContext/OrganizationContext";

/* Website */
import HomePage from "./pages/landingPage/HomePage";
import Contact from "./components/landingPage/Contact/Contact";

/* Authentication */
import LoginPage from "./pages/auth/Login/Login";
import ForgotPasswordPage from "./pages/auth/ForgotPassword/ForgotPassword";
import ResetPasswordPage from "./pages/auth/ResetPassword/ResetPassword";
import SignupPage from "./pages/auth/CreateAccount/CreateAccount";

/* Company Setup */
import CompanyDetails from "./pages/companySetup/CompanyDetails/CompanyDetails";
import Address from "./pages/companySetup/Address/Address";
import BusinessSettings from "./pages/companySetup/BusinessSettings/BusinessSettings";
import Review from "./pages/companySetup/Review/Review";
import AccountCreated from "./pages/companySetup/AccountCreated/AccountCreated";

import {
  CompanySetupProvider,
} from "./pages/companySetup/CompanySetupContext";

/* Authenticated Layout */
import AppLayout from "./components/layout/AppLayout";

/* Guards */
import ProtectedRoute from "./components/auth/ProtectedRoute";
import CompanySetupGuard from "./components/auth/CompanySetupGuard";

/* Organization */
import OrganizationSetup from "./pages/organizationSetup/OrganizationSetup";
import DepartmentsPage from "./pages/departments/Departments";
import DesignationsPage from "./pages/designations/Designations";

/* Temporary / Dashboard */
function DashboardPreview() {
  return (
    <div style={{ padding: "32px" }}>
      <h1>Dashboard</h1>

      <p>
        This is the dashboard content area.
        The Sidebar and TopNavbar are provided
        by AppLayout.
      </p>
    </div>
  );
}

function RolesPermissions() {
  return (
    <div style={{ padding: "32px" }}>
      <h1>Roles & Permissions</h1>

      <p>
        Roles and permissions page.
      </p>
    </div>
  );
}

function Employees() {
  return (
    <div style={{ padding: "32px" }}>
      <h1>Employees</h1>

      <p>
        Employees page.
      </p>
    </div>
  );
}

function Attendance() {
  return (
    <div style={{ padding: "32px" }}>
      <h1>Attendance</h1>

      <p>
        Attendance page.
      </p>
    </div>
  );
}

function Leaves() {
  return (
    <div style={{ padding: "32px" }}>
      <h1>Leaves</h1>

      <p>
        Leaves page.
      </p>
    </div>
  );
}

function Holidays() {
  return (
    <div style={{ padding: "32px" }}>
      <h1>Holidays</h1>

      <p>
        Holidays page.
      </p>
    </div>
  );
}

function Settings() {
  return (
    <div style={{ padding: "32px" }}>
      <h1>Settings</h1>

      <p>
        Settings page.
      </p>
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

            <Route
              path="/"
              element={<HomePage />}
            />

            <Route
              path="/contact"
              element={<Contact />}
            />


            {/* =====================================
                AUTHENTICATION
            ===================================== */}

            <Route
              path="/login"
              element={<LoginPage />}
            />

            <Route
              path="/forgot-password"
              element={<ForgotPasswordPage />}
            />

            <Route
              path="/reset-password"
              element={<ResetPasswordPage />}
            />

            <Route
              path="/signup"
              element={<SignupPage />}
            />


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

              <Route
                path="/company-setup/address"
                element={<Address />}
              />

              <Route
                path="/company-setup/business-settings"
                element={<BusinessSettings />}
              />

              <Route
                path="/company-setup/review"
                element={<Review />}
              />

              {/*
               * Account Created is intentionally
               * outside CompanySetupGuard.
               *
               * This allows the user to see the
               * success page immediately after setup.
               */}
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

                  {/* Dashboard */}
                  <Route
                    path="/dashboard"
                    element={<DashboardPreview />}
                  />

                  {/* Organization */}
                  <Route
                    path="/organization-setup"
                    element={<OrganizationSetup />}
                  />

                  {/* Departments */}
                  <Route
                    path="/departments"
                    element={<DepartmentsPage />}
                  />

                  {/* Designations */}
                  <Route
                    path="/designations"
                    element={<DesignationsPage />}
                  />

                  {/* Roles */}
                  <Route
                    path="/roles-permissions"
                    element={<RolesPermissions />}
                  />

                  {/* Employees */}
                  <Route
                    path="/employees"
                    element={<Employees />}
                  />

                  {/* Attendance */}
                  <Route
                    path="/attendance"
                    element={<Attendance />}
                  />

                  {/* Leaves */}
                  <Route
                    path="/leaves"
                    element={<Leaves />}
                  />

                  {/* Holidays */}
                  <Route
                    path="/holidays"
                    element={<Holidays />}
                  />

                  {/* Settings */}
                  <Route
                    path="/settings"
                    element={<Settings />}
                  />

                </Route>

              </Route>

            </Route>

          </Routes>

        </CompanySetupProvider>

      </BrowserRouter>

    </OrganizationProvider>
  );
}

