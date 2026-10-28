// Codex local edit test
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";

import { OrganizationProvider } from "./context/OrganizationContext/OrganizationContext";
import { NotificationProvider } from "./context/NotificationContext";
import { isFieldSalesManager, canViewWorkManagement, canViewTeams } from "./utils/permissionUtils";

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
import Dashboard from "./pages/dashboard/Dashboard";

import OrganizationOverview from "./pages/OrganizationOverview/OrganizationOverview";

import WorkSchedule from "./pages/workSchedule/WorkSchedule";

import DepartmentsPage from "./pages/departments/Departments";

import DesignationsPage from "./pages/designations/Designations";

import RolesPermissions from "./pages/rolesPermissions/RolesPermissions";
import AddRole from "./pages/rolesPermissions/AddRole/AddRole";
import EditRole from "./pages/rolesPermissions/EditRole/EditRole";

import Employees from "./pages/employees/Employees";
import AddEmployee from "./pages/employees/AddEmployee/AddEmployee";
import EditEmployee from "./pages/employees/EditEmployee/EditEmployee";
import EmployeeProfile from "./pages/employees/EmployeeProfile/EmployeeProfile";

import Attendance from "./pages/attendance/Attendance";

import LeavePolicies from "./pages/leavePolicies/LeavePolicies";
import Leaves from "./pages/leaves/Leaves";

import Holidays from "./pages/holidays/Holidays";

import Teams from "./pages/Teams/Teams";
import TeamDetails from "./pages/Teams/TeamDetails";

import Tasks from "./pages/Tasks/Tasks";
import TaskDetailsPage from "./pages/Tasks/TaskDetailsPage";
import WorkManagement from "./pages/workManagement/WorkManagement";

import { TeamsTasksProvider, useTeamsTasks } from "./context/TeamsTasksContext";

import Profile from "./pages/profile/Profile";

import FieldSalesEmployees from "./pages/fieldSales/employees/FieldSalesEmployees";
import Leads from "./pages/fieldSales/leads/Leads";
import LeadForm from "./components/fieldSales/leads/LeadForm/LeadForm";
import Visits from "./pages/fieldSales/visits/Visits";
import SalesDashboard from "./pages/fieldSales/SalesDashboard";


import Payslips from "./pages/account/Payslips";
import SalaryStructures from "./pages/account/SalaryStructures/SalaryStructures";
import ProcessPayroll from "./pages/account/ProcessPayroll/ProcessPayroll";
import PayrollHistory from "./pages/account/PayrollHistory/PayrollHistory";
import EmployeeSelfService from "./pages/account/EmployeeSelfService/EmployeeSelfService";
import PayrollSettings from "./pages/account/PayrollSettings/PayrollSettings";
import MyPayslips from "./pages/account/MyPayslips/MyPayslips";

/* Platform Super Admin */
import SuperAdminGuard from "./features/superAdmin/components/SuperAdminGuard";
import SuperAdminLayout from "./features/superAdmin/components/SuperAdminLayout";
import SuperAdminLoginPage from "./features/superAdmin/pages/SuperAdminLoginPage";
import DashboardPage from "./features/superAdmin/pages/DashboardPage";
import CompaniesPage from "./features/superAdmin/pages/CompaniesPage";
import CompanyDetailPage from "./features/superAdmin/pages/CompanyDetailPage";
import EmployeesPage from "./features/superAdmin/pages/EmployeesPage";
import UsersPage from "./features/superAdmin/pages/UsersPage";
import AnalyticsPage from "./features/superAdmin/pages/AnalyticsPage";

/* =========================================================
   TEMPORARY / DASHBOARD
========================================================= */

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
   WORK MANAGEMENT GUARD
========================================================= */

function WorkManagementGuard() {
  const { loading, workManagementAccess } = useTeamsTasks();

  const [user] = (() => {
    try {
      return [JSON.parse(localStorage.getItem("user") || "{}")];
    } catch {
      return [{}];
    }
  })();

  const rawRole = String(user?.role || "").toUpperCase();

  const isAdminOrOwner =
    rawRole === "OWNER" ||
    rawRole === "ADMIN" ||
    rawRole === "ADMINISTRATOR" ||
    rawRole === "HR" ||
    user?.is_superuser === true;

  const userPermissions = Array.isArray(user?.permissions) ? user.permissions : [];
  const hasWorkManagementPermission =
    canViewWorkManagement(user) ||
    canViewTeams(user) ||
    userPermissions.includes("view_team") ||
    userPermissions.includes("teams.view") ||
    userPermissions.includes("teams.view_team") ||
    userPermissions.includes("view_task") ||
    userPermissions.includes("tasks.view");

  const hasExplicitAccess = isAdminOrOwner || hasWorkManagementPermission;

  /*
   * TeamsTasksProvider needs to finish its initial team request
   * before we can determine team membership, unless user already has explicit permission or is admin.
   */
  if (loading && !hasExplicitAccess) {
    return (
      <div
        style={{
          minHeight: "300px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#64748b",
          fontSize: "14px",
        }}
      >
        Loading...
      </div>
    );
  }

  const hasAccess = hasExplicitAccess || workManagementAccess?.hasAccess === true;

  if (!hasAccess) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

function FieldSalesManagerGuard() {
  const isManager = isFieldSalesManager();
  if (!isManager) {
    return <Navigate to="/field-sales/visits" replace />;
  }
  return <Outlet />;
}

/* =========================================================
   APP
========================================================= */

export default function App() {
  return (
    <TeamsTasksProvider>
      <OrganizationProvider>
        <NotificationProvider>
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

                <Route
                  path="/forgot-password"
                  element={<ForgotPasswordPage />}
                />

                <Route path="/reset-password" element={<ResetPasswordPage />} />

                <Route path="/signup" element={<SignupPage />} />

                <Route path="/accept-invite" element={<AcceptInvitePage />} />
                <Route path="/accept-invitation" element={<AcceptInvitePage />} />

                {/* =====================================================
                    PLATFORM SUPER ADMIN
                    Requires database-verified Django platform superuser (SuperAdminGuard).
                    Has separate authentication at /admin/login.
                    Does not require tenant company setup or company permissions.
                ===================================================== */}
                <Route path="/admin/login" element={<SuperAdminLoginPage />} />

                <Route element={<SuperAdminGuard />}>
                  <Route element={<SuperAdminLayout />}>
                    <Route path="/admin" element={<DashboardPage />} />
                    <Route path="/admin/companies" element={<CompaniesPage />} />
                    <Route path="/admin/companies/:id" element={<CompanyDetailPage />} />
                    <Route path="/admin/employees" element={<EmployeesPage />} />
                    <Route path="/admin/users" element={<UsersPage />} />
                    <Route path="/admin/analytics" element={<AnalyticsPage />} />
                  </Route>
                </Route>

                {/* =====================================================
                    INITIAL COMPANY SETUP
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
                    <Route element={<AppLayout />}>
                      {/* =================================================
                          EMPLOYEE ACCESSIBLE ROUTES
                      ================================================= */}

                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/profile" element={<Profile />} />

                      <Route
                        path="/field-sales"
                        element={<SalesDashboard />}
                      />
                      <Route
                        path="/field-sales/dashboard"
                        element={<SalesDashboard />}
                      />


                      <Route path="/field-sales/leads" element={<Leads />} />
                      <Route
                        path="/field-sales/leads/add"
                        element={<LeadForm />}
                      />
                      <Route
                        path="/field-sales/leads/:id/edit"
                        element={<LeadForm />}
                      />
                      <Route element={<FieldSalesManagerGuard />}>
                        <Route
                          path="/field-sales/employees"
                          element={<FieldSalesEmployees />}
                        />
                      </Route>
                      <Route path="/field-sales/visits" element={<Visits />} />

                      <Route path="/attendance" element={<Attendance />} />

                      <Route path="/leaves" element={<Leaves />} />

                      <Route path="/holidays" element={<Holidays />} />
                      <Route path="/my-payslips" element={<MyPayslips />} />

                      {/* =================================================
                          WORK MANAGEMENT

                          Access is based on backend team context.

                          Admin / Owner / HR:
                          - Full access

                          Team Lead:
                          - Team access

                          Team Member:
                          - Team access

                          Non-team employee:
                          - Redirected to dashboard
                      ================================================= */}

                      <Route element={<WorkManagementGuard />}>
                        <Route
                          path="/work-management"
                          element={<WorkManagement />}
                        />

                        <Route path="/teams" element={<Teams />} />

                        <Route path="/teams/:id" element={<TeamDetails />} />

                        <Route path="/tasks" element={<Tasks />} />

                        <Route
                          path="/tasks/:id"
                          element={<TaskDetailsPage />}
                        />
                      </Route>

                      {/* =================================================
                          ADMIN ONLY ROUTES
                      ================================================= */}

                      <Route element={<PermissionGuard adminOnly />}>
                        <Route
                          path="/organization-overview"
                          element={<OrganizationOverview />}
                        />

                        <Route
                          path="/work-schedule"
                          element={<WorkSchedule />}
                        />

                        <Route
                          path="/roles-permissions"
                          element={<RolesPermissions />}
                        />

                        <Route
                          path="/roles-permissions/add"
                          element={<AddRole />}
                        />

                        <Route
                          path="/roles-permissions/create"
                          element={<AddRole />}
                        />

                        <Route
                          path="/roles-permissions/:id/edit"
                          element={<EditRole />}
                        />

                        <Route
                          path="/leave-policies"
                          element={<LeavePolicies />}
                        />

                        <Route path="/settings" element={<Settings />} />

                        <Route
                          path="/account/payslips"
                          element={<Payslips />}
                        />
                        <Route
                          path="/account/salary-structures"
                          element={<SalaryStructures />}
                        />

                        <Route
                          path="/account/process-payroll"
                          element={<ProcessPayroll />}
                        />

                        <Route
                          path="/account/payroll-history"
                          element={<PayrollHistory />}
                        />
                        <Route
                          path="/account/payroll-settings"
                          element={<PayrollSettings />}
                        />
                        <Route
                          path="/account/my-payroll"
                          element={<EmployeeSelfService />}
                        />

                      </Route>

                      {/* =================================================
                          DEPARTMENT PERMISSION
                      ================================================= */}

                      <Route
                        element={
                          <PermissionGuard requiredPermission="view_department" />
                        }
                      >
                        <Route
                          path="/departments"
                          element={<DepartmentsPage />}
                        />
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
                        element={
                          <PermissionGuard requiredPermission="view_user" />
                        }
                      >
                        <Route path="/employees" element={<Employees />} />

                        <Route
                          path="/employees/add"
                          element={<AddEmployee />}
                        />

                        <Route
                          path="/employees/:id/edit"
                          element={<EditEmployee />}
                        />

                        <Route
                          path="/employees/:id"
                          element={<EmployeeProfile />}
                        />
                      </Route>
                    </Route>
                  </Route>
                </Route>
              </Routes>
            </CompanySetupProvider>
          </BrowserRouter>
        </NotificationProvider>
      </OrganizationProvider>
    </TeamsTasksProvider>
  );
}
