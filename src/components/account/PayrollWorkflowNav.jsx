import { NavLink } from "react-router-dom";
import "./PayrollWorkflowNav.css";

const WORKFLOW_PAGES = [
  { path: "/account/payroll-settings", label: "Settings" },
  { path: "/account/salary-structures", label: "Salary Structures" },
  { path: "/account/process-payroll", label: "Process Payroll" },
  { path: "/account/payroll-history", label: "Payroll History" },
  { path: "/account/payslips", label: "Payslips" },
];

export default function PayrollWorkflowNav() {
  return (
    <nav className="payroll-workflow-nav" aria-label="Payroll workflow">
      {WORKFLOW_PAGES.map((page) => (
        <NavLink
          key={page.path}
          to={page.path}
          className={({ isActive }) =>
            `payroll-workflow-nav__link${isActive ? " is-active" : ""}`
          }
        >
          {page.label}
        </NavLink>
      ))}
    </nav>
  );
}
