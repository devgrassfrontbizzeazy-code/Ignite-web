// RBAC Permission Catalogue for Ignite HRMS
// Organizes permissions by Module -> Functionality -> Actions -> Scope Support

export const RBAC_MODULES = [
  {
    key: "hrms",
    name: "HRMS",
    description: "Core HR, employee lifecycle, attendance, leaves and organizational structure.",
    functionalities: [
      {
        key: "employees",
        name: "Employees",
        description: "Employee records, profile details, and personal data.",
        actions: {
          view: { label: "View", supportsScope: true, defaultScope: "Department" },
          create: { label: "Create", supportsScope: true, defaultScope: "Department" },
          edit: { label: "Edit", supportsScope: true, defaultScope: "Department" },
          delete: { label: "Delete", supportsScope: false },
          export: { label: "Export", supportsScope: true, defaultScope: "Department" },
          import: { label: "Import", supportsScope: false },
        },
      },
      {
        key: "leave_requests",
        name: "Leave Requests",
        description: "Employee leave applications and balance management.",
        actions: {
          view: { label: "View", supportsScope: true, defaultScope: "Department" },
          create: { label: "Create", supportsScope: true, defaultScope: "Own" },
          edit: { label: "Edit", supportsScope: true, defaultScope: "Own" },
          delete: { label: "Delete", supportsScope: false },
          approve: { label: "Approve", supportsScope: true, defaultScope: "Department" },
          reject: { label: "Reject", supportsScope: true, defaultScope: "Department" },
        },
      },
      {
        key: "attendance",
        name: "Attendance",
        description: "Daily attendance logs, time tracking and regularizations.",
        actions: {
          view: { label: "View", supportsScope: true, defaultScope: "Department" },
          create: { label: "Create", supportsScope: false },
          edit: { label: "Edit", supportsScope: true, defaultScope: "Department" },
          approve: { label: "Approve", supportsScope: true, defaultScope: "Department" },
          export: { label: "Export", supportsScope: true, defaultScope: "Department" },
        },
      },
      {
        key: "departments",
        name: "Departments",
        description: "Department organization units and hierarchy.",
        actions: {
          view: { label: "View", supportsScope: false },
          create: { label: "Create", supportsScope: false },
          edit: { label: "Edit", supportsScope: false },
          delete: { label: "Delete", supportsScope: false },
        },
      },
      {
        key: "designations",
        name: "Designations",
        description: "Job positions, titles and default role assignments.",
        actions: {
          view: { label: "View", supportsScope: false },
          create: { label: "Create", supportsScope: false },
          edit: { label: "Edit", supportsScope: false },
          delete: { label: "Delete", supportsScope: false },
        },
      },
      {
        key: "holidays",
        name: "Holidays",
        description: "Company-wide and regional holiday calendars.",
        actions: {
          view: { label: "View", supportsScope: false },
          create: { label: "Create", supportsScope: false },
          edit: { label: "Edit", supportsScope: false },
          delete: { label: "Delete", supportsScope: false },
        },
      },
      {
        key: "work_schedule",
        name: "Work Schedule",
        description: "Shift patterns, working hours and employee scheduling.",
        actions: {
          view: { label: "View", supportsScope: false },
          edit: { label: "Edit", supportsScope: false },
          assign: { label: "Assign", supportsScope: true, defaultScope: "Department" },
        },
      },
    ],
  },
  {
    key: "accounts",
    name: "Accounts",
    description: "Invoicing, financial transactions, expenses, payments and payroll.",
    functionalities: [
      {
        key: "invoices",
        name: "Invoices",
        description: "Customer billings, invoices and credit notes.",
        actions: {
          view: { label: "View", supportsScope: true, defaultScope: "Company" },
          create: { label: "Create", supportsScope: true, defaultScope: "Company" },
          edit: { label: "Edit", supportsScope: true, defaultScope: "Company" },
          delete: { label: "Delete", supportsScope: false },
          approve: { label: "Approve", supportsScope: true, defaultScope: "Company" },
          reject: { label: "Reject", supportsScope: true, defaultScope: "Company" },
          export: { label: "Export", supportsScope: true, defaultScope: "Company" },
        },
      },
      {
        key: "expenses",
        name: "Expenses",
        description: "Operational expenditure and employee claims.",
        actions: {
          view: { label: "View", supportsScope: true, defaultScope: "Department" },
          create: { label: "Create", supportsScope: true, defaultScope: "Own" },
          edit: { label: "Edit", supportsScope: true, defaultScope: "Own" },
          delete: { label: "Delete", supportsScope: false },
          approve: { label: "Approve", supportsScope: true, defaultScope: "Department" },
          reject: { label: "Reject", supportsScope: true, defaultScope: "Department" },
        },
      },
      {
        key: "payments",
        name: "Payments",
        description: "Incoming and outgoing payment disbursement records.",
        actions: {
          view: { label: "View", supportsScope: true, defaultScope: "Company" },
          create: { label: "Create", supportsScope: true, defaultScope: "Company" },
          edit: { label: "Edit", supportsScope: true, defaultScope: "Company" },
          approve: { label: "Approve", supportsScope: true, defaultScope: "Company" },
          export: { label: "Export", supportsScope: true, defaultScope: "Company" },
        },
      },
      {
        key: "payroll",
        name: "Payroll",
        description: "Salary processing, pay slips and statutory deductions.",
        actions: {
          view: { label: "View", supportsScope: true, defaultScope: "Department" },
          create: { label: "Create", supportsScope: true, defaultScope: "Company" },
          edit: { label: "Edit", supportsScope: true, defaultScope: "Company" },
          approve: { label: "Approve", supportsScope: true, defaultScope: "Company" },
          export: { label: "Export", supportsScope: true, defaultScope: "Company" },
        },
      },
      {
        key: "financial_reports",
        name: "Financial Reports",
        description: "P&L, balance sheets and audit statements.",
        actions: {
          view: { label: "View", supportsScope: true, defaultScope: "Company" },
          export: { label: "Export", supportsScope: true, defaultScope: "Company" },
          configure: { label: "Configure", supportsScope: false },
        },
      },
    ],
  },
  {
    key: "sales",
    name: "Sales",
    description: "Lead pipelines, deals, customer relations, orders and sales targets.",
    functionalities: [
      {
        key: "leads",
        name: "Leads",
        description: "Inbound prospects and lead qualification.",
        actions: {
          view: { label: "View", supportsScope: true, defaultScope: "Team" },
          create: { label: "Create", supportsScope: true, defaultScope: "Team" },
          edit: { label: "Edit", supportsScope: true, defaultScope: "Team" },
          delete: { label: "Delete", supportsScope: false },
          assign: { label: "Assign", supportsScope: true, defaultScope: "Team" },
          export: { label: "Export", supportsScope: true, defaultScope: "Team" },
        },
      },
      {
        key: "deals",
        name: "Deals",
        description: "Sales opportunities, stages and expected revenue.",
        actions: {
          view: { label: "View", supportsScope: true, defaultScope: "Team" },
          create: { label: "Create", supportsScope: true, defaultScope: "Team" },
          edit: { label: "Edit", supportsScope: true, defaultScope: "Team" },
          delete: { label: "Delete", supportsScope: false },
          approve: { label: "Approve", supportsScope: true, defaultScope: "Department" },
          export: { label: "Export", supportsScope: true, defaultScope: "Team" },
        },
      },
      {
        key: "customers",
        name: "Customers",
        description: "Client accounts and contact directory.",
        actions: {
          view: { label: "View", supportsScope: true, defaultScope: "Company" },
          create: { label: "Create", supportsScope: true, defaultScope: "Company" },
          edit: { label: "Edit", supportsScope: true, defaultScope: "Company" },
          delete: { label: "Delete", supportsScope: false },
          export: { label: "Export", supportsScope: true, defaultScope: "Company" },
        },
      },
      {
        key: "orders",
        name: "Orders",
        description: "Sales orders, fulfillment and delivery records.",
        actions: {
          view: { label: "View", supportsScope: true, defaultScope: "Department" },
          create: { label: "Create", supportsScope: true, defaultScope: "Department" },
          edit: { label: "Edit", supportsScope: true, defaultScope: "Department" },
          approve: { label: "Approve", supportsScope: true, defaultScope: "Department" },
          export: { label: "Export", supportsScope: true, defaultScope: "Department" },
        },
      },
      {
        key: "sales_targets",
        name: "Sales Targets",
        description: "Quarterly and annual quotas per team and representative.",
        actions: {
          view: { label: "View", supportsScope: true, defaultScope: "Team" },
          edit: { label: "Edit", supportsScope: true, defaultScope: "Department" },
          assign: { label: "Assign", supportsScope: true, defaultScope: "Department" },
          configure: { label: "Configure", supportsScope: false },
        },
      },
    ],
  },
];

// All supported scope levels
export const SCOPE_OPTIONS = [
  { value: "Own", label: "Own" },
  { value: "Team", label: "Team" },
  { value: "Department", label: "Department" },
  { value: "Location", label: "Location" },
  { value: "Territory", label: "Territory" },
  { value: "Company", label: "Company" },
  { value: "Custom", label: "Custom" },
];

// Standard actions order for matrix headers
export const ALL_ACTIONS = [
  { key: "view", label: "View" },
  { key: "create", label: "Create" },
  { key: "edit", label: "Edit" },
  { key: "delete", label: "Delete" },
  { key: "approve", label: "Approve" },
  { key: "reject", label: "Reject" },
  { key: "assign", label: "Assign" },
  { key: "export", label: "Export" },
  { key: "import", label: "Import" },
  { key: "configure", label: "Configure" },
];

/**
 * Generates a unique permission key for code reference.
 */
export const buildPermissionKey = (moduleKey, funcKey, actionKey) =>
  `${moduleKey}.${funcKey}.${actionKey}`.toLowerCase();
