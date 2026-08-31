import { BrowserRouter, Routes, Route } from "react-router-dom";

import HomePage from "./pages/landingPage/HomePage";
import Contact from "./components/landingPage/Contact/Contact";
import LoginPage from "./pages/auth/Login/Login";
import ForgotPasswordPage from "./pages/auth/ForgotPassword/ForgotPassword";
import ResetPasswordPage from "./pages/auth/ResetPassword/ResetPassword";

import { CompanySetupProvider } from "./pages/companySetup/CompanySetupContext";
import CompanyDetails from "./pages/companySetup/CompanyDetails/CompanyDetails";
import Address from "./pages/companySetup/Address/Address";
import BusinessSettings from "./pages/companySetup/BusinessSettings/BusinessSettings";
import Review from "./pages/companySetup/Review/Review";
import AccountCreated from "./pages/companySetup/AccountCreated/AccountCreated";

import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing Page */}
        <Route path="/" element={<HomePage />} />
        <Route path="/contact" element={<Contact />} />

        {/* Authentication */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Company Setup */}
        <Route
          path="/company-setup/*"
          element={
            <CompanySetupProvider>
              <Routes>
                <Route path="company-details" element={<CompanyDetails />} />
                <Route path="address" element={<Address />} />
                <Route
                  path="business-settings"
                  element={<BusinessSettings />}
                />
                <Route path="review" element={<Review />} />
                <Route path="account-created" element={<AccountCreated />} />
              </Routes>
            </CompanySetupProvider>
          }
        />


      </Routes>
    </BrowserRouter>
  );
}

export default App;
