import {
  createContext,
  useContext,
  useState,
} from "react";

const OrganizationContext = createContext(null);

export const OrganizationProvider = ({
  children,
}) => {
  const [departments, setDepartments] =
    useState([]);

  return (
    <OrganizationContext.Provider
      value={{
        departments,
        setDepartments,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
};

export const useOrganization = () => {
  const context = useContext(
    OrganizationContext,
  );

  if (!context) {
    throw new Error(
      "useOrganization must be used inside OrganizationProvider",
    );
  }

  return context;
};