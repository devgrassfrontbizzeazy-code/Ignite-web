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
import OrganizationOverview from "./pages/OrganizationOverview/OrganizationOverview";

import DepartmentsPage from "./pages/departments/Departments";
import DesignationsPage from "./pages/designations/Designations";
import RolesPermissions from "./pages/rolesPermissions/RolesPermissions";
import Employees from "./pages/employees/Employees";
import AddEmployee from "./pages/employees/AddEmployee/AddEmployee";
import EditEmployee from "./pages/employees/EditEmployee/EditEmployee";
import Attendance from "./pages/attendance/Attendance";
import LeavePolicies from "./pages/leavePolicies/LeavePolicies";
import Leaves from "./pages/leaves/Leaves";
import Holidays from "./pages/holidays/Holidays";

/* =========================================================
   TEMPORARY / DASHBOARD
========================================================= */

function DashboardPreview() {
  return (
    <div style={{ padding: "32px" }}>
      <h1
        style={{
          fontSize: "24px",
          fontWeight: "700",
          color: "#0f172a",
          marginBottom: "8px",
        }}
      >
        Dashboard
      </h1>

      <p style={{ color: "#64748b" }}>
        Welcome to your Ignite Workspace Dashboard. Use the sidebar to navigate
        your attendance, leaves, and organization tools.
      </p>
    </div>
  );
}



function Settings() {
  return (
    <div style={{ padding: "32px" }}>
      <h1
        style={{
          fontSize: "24px",
          fontWeight: "700",
          color: "#0f172a",
          marginBottom: "8px",
        }}
      >
        Settings
      </h1>

      <p style={{ color: "#64748b" }}>Organization and platform settings.</p>
    </div>
  );
}

/* =========================================================
   APP
========================================================= */

export default function App() {
  return (
    <OrganizationProvider>
      <BrowserRouter>
        <CompanySetupProvider>
          <Routes>
            {/* =====================================================
                PUBLIC WEBSITE
            ===================================================== */}

            <Route path="/" element={<HomePage />} />

            <Route path="/contact" element={<Contact />} />

            {/* =====================================================
                AUTHENTICATION
            ===================================================== */}

            <Route path="/login" element={<LoginPage />} />

            <Route path="/forgot-password" element={<ForgotPasswordPage />} />

            <Route path="/reset-password" element={<ResetPasswordPage />} />

            <Route path="/signup" element={<SignupPage />} />

            <Route path="/accept-invite" element={<AcceptInvitePage />} />

            {/* =====================================================
                INITIAL COMPANY SETUP

                Protected, but NOT behind CompanySetupGuard.

                Flow:

                Company Details
                      ↓
                Address
                      ↓
                Business Settings
                      ↓
                Review
                      ↓
                Account Created
            ===================================================== */}

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

            {/* =====================================================
                AUTHENTICATED COMPANY EDITING

                IMPORTANT:

                These routes are OUTSIDE CompanySetupGuard.

                Therefore an already configured company can edit
                individual sections without being redirected into
                the onboarding wizard.

                AppLayout uses <Outlet />, so each edit page is
                nested inside an AppLayout route.
            ===================================================== */}

            <Route element={<ProtectedRoute />}>
              {/* -------------------------------------------------
                  COMPANY DETAILS EDIT
              ------------------------------------------------- */}

              <Route
                element={
                  <AppLayout
                    title="Company Details"
                    breadcrumbs={["Organization", "Company Details"]}
                    userName="Anu Sharma"
                    userRole="Administrator"
                    companyName="Ignite"
                  />
                }
              >
                <Route
                  path="/company/edit"
                  element={<CompanyDetails mode="edit" />}
                />
              </Route>

              {/* -------------------------------------------------
                  COMPANY ADDRESS EDIT
              ------------------------------------------------- */}

              <Route
                element={
                  <AppLayout
                    title="Company Address"
                    breadcrumbs={["Organization", "Company Address"]}
                    userName="Anu Sharma"
                    userRole="Administrator"
                    companyName="Ignite"
                  />
                }
              >
                <Route
                  path="/company/address/edit"
                  element={<Address mode="edit" />}
                />
              </Route>

              {/* -------------------------------------------------
                  BUSINESS SETTINGS EDIT
              ------------------------------------------------- */}

              <Route
                element={
                  <AppLayout
                    title="Business Settings"
                    breadcrumbs={["Organization", "Business Settings"]}
                    userName="Anu Sharma"
                    userRole="Administrator"
                    companyName="Ignite"
                  />
                }
              >
                <Route
                  path="/company/business-settings/edit"
                  element={<BusinessSettings mode="edit" />}
                />
              </Route>
            </Route>

            {/* =====================================================
                AUTHENTICATED APPLICATION

                Requires:

                1. Valid access token
                2. Company already configured
            ===================================================== */}

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
                  {/* =================================================
                      EMPLOYEE ACCESSIBLE ROUTES
                  ================================================= */}

                  <Route path="/dashboard" element={<DashboardPreview />} />

                  <Route path="/attendance" element={<Attendance />} />

                  <Route path="/leaves" element={<Leaves />} />

                  <Route path="/holidays" element={<Holidays />} />

                  {/* =================================================
                      ADMIN ONLY ROUTES
                  ================================================= */}

                  <Route element={<PermissionGuard adminOnly />}>
                    <Route
                      path="/organization-overview"
                      element={<OrganizationOverview />}
                    />

                    <Route
                      path="/roles-permissions"
                      element={<RolesPermissions />}
                    />
                    <Route path="/leave-policies" element={<LeavePolicies />} />

                    <Route path="/settings" element={<Settings />} />
                  </Route>

                  {/* =================================================
                      DEPARTMENT PERMISSION
                  ================================================= */}

                  <Route
                    element={
                      <PermissionGuard requiredPermission="view_department" />
                    }
                  >
                    <Route path="/departments" element={<DepartmentsPage />} />
                  </Route>

                  {/* =================================================
                      DESIGNATION PERMISSION
                  ================================================= */}

                  <Route
                    element={
                      <PermissionGuard requiredPermission="view_designation" />
                    }
                  >
                    <Route
                      path="/designations"
                      element={<DesignationsPage />}
                    />
                  </Route>

                  {/* =================================================
                      EMPLOYEE PERMISSION
                  ================================================= */}

                  <Route
                    element={<PermissionGuard requiredPermission="view_user" />}
                  >
                    <Route path="/employees" element={<Employees />} />

                    <Route path="/employees/add" element={<AddEmployee />} />

                    <Route
                      path="/employees/:id/edit"
                      element={<EditEmployee />}
                    />
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
