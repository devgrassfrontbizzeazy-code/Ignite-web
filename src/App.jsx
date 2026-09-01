import { BrowserRouter, Routes, Route } from "react-router-dom";

/* Website */
import HomePage from "./pages/landingPage/HomePage";
import Contact from "./components/landingPage/Contact/Contact";

/* Authentication */
import LoginPage from "./pages/auth/Login/Login";
import ForgotPasswordPage from "./pages/auth/ForgotPassword/ForgotPassword";
import ResetPasswordPage from "./pages/auth/ResetPassword/ResetPassword";
import CreateAccount from "./pages/auth/CreateAccount/CreateAccount";

/* Company Setup */
import CompanySetupRoutes from "./pages/companySetup/CompanySetupRoutes";

/* Route Protection */
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";

import "./App.css";

function App() {
  return (
    <BrowserRouter>

      <Routes>

        {/* ================= PUBLIC ================= */}

        <Route
          path="/"
          element={<HomePage />}
        />

        <Route
          path="/contact"
          element={<Contact />}
        />

        {/* Authentication */}
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
          element={<CreateAccount />}
        />


        {/* ================= PROTECTED ================= */}

        <Route element={<ProtectedRoute />}>

          <Route
            path="/company-setup/*"
            element={<CompanySetupRoutes />}
          />

          {/* Dashboard will go here */}
          {/* 
          <Route
            path="/dashboard"
            element={<Dashboard />}
          />
          */}

        </Route>

      </Routes>

    </BrowserRouter>
  );
}

export default App;

