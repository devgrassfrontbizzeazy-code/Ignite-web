import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import { CompanySetupProvider } from "./CompanySetupContext";

import CompanyDetails from "./CompanyDetails/CompanyDetails";
import Address from "./Address/Address";
import BusinessSettings from "./BusinessSettings/BusinessSettings";
import Review from "./Review/Review";
import AccountCreated from "./AccountCreated/AccountCreated";

function CompanySetupRoutes() {
  return (
    <CompanySetupProvider>
      <Routes>

        <Route
          index
          element={
            <Navigate
              to="/company-setup/company-details"
              replace
            />
          }
        />

        <Route
          path="company-details"
          element={<CompanyDetails />}
        />

        <Route
          path="address"
          element={<Address />}
        />

        <Route
          path="business-settings"
          element={<BusinessSettings />}
        />

        <Route
          path="review"
          element={<Review />}
        />

        <Route
          path="account-created"
          element={<AccountCreated />}
        />

      </Routes>
    </CompanySetupProvider>
  );
}

export default CompanySetupRoutes;

