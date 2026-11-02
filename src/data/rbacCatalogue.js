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
        key: "teams",
        name: "Teams",
        description: "Department and cross-functional teams, team lead assignments, and member management.",
        actions: {
          view: { label: "View", supportsScope: true, defaultScope: "Department", codename: "view_team", dotNotation: "teams.view" },
          create: { label: "Create", supportsScope: true, defaultScope: "Company", codename: "add_team", dotNotation: "teams.create" },
          edit: { label: "Edit / Update", supportsScope: true, defaultScope: "Company", codename: "change_team", dotNotation: "teams.update" },
          delete: { label: "Delete", supportsScope: false, codename: "delete_team", dotNotation: "teams.delete" },
          manage: { label: "Manage (Admin)", supportsScope: true, defaultScope: "Company", codename: "change_team", dotNotation: "teams.manage" },
        },
      },
      {
        key: "tasks",
        name: "Tasks",
        description: "Personal and team tasks, assignment, due dates, and status lifecycle.",
        actions: {
          view: { label: "View", supportsScope: true, defaultScope: "Department", codename: "view_task", dotNotation: "tasks.view" },
          create: { label: "Create", supportsScope: true, defaultScope: "Team", codename: "add_task", dotNotation: "tasks.create" },
          edit: { label: "Edit / Update", supportsScope: true, defaultScope: "Team", codename: "change_task", dotNotation: "tasks.update" },
          delete: { label: "Delete", supportsScope: false, codename: "delete_task", dotNotation: "tasks.delete" },
          assign: { label: "Assign", supportsScope: true, defaultScope: "Team", codename: "change_task", dotNotation: "tasks.assign" },
          manage: { label: "Manage (Admin)", supportsScope: true, defaultScope: "Company", codename: "change_task", dotNotation: "tasks.manage" },
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
    key: "account",
    aliases: ["accounts"],
    name: "Account",
    description: "Payroll processing, salary structures, templates, calculations, draft runs, payslips and settings.",
    functionalities: [
      {
        key: "payroll",
        name: "Payroll",
        description: "Payroll dashboard, history, salary structures & draft view karne ke liye",
        actions: {
          view: {
            label: "View",
            codename: "view_payroll",
            dotNotation: "payroll.view",
            description: "Payroll dashboard, history, salary structures & draft view karne ke liye",
            supportsScope: true,
            defaultScope: "Department",
          },
          create: {
            label: "Create",
            codename: "add_payroll",
            dotNotation: "payroll.create",
            description: "Naya payroll run generate / calculate karna aur salary templates create karna",
            supportsScope: true,
            defaultScope: "Company",
          },
          edit: {
            label: "Edit / Update",
            codename: "change_payroll",
            dotNotation: "payroll.update / payroll.edit",
            description: "Draft payroll me manual adjustments karna, recalculate karna, payroll settings update karna",
            supportsScope: true,
            defaultScope: "Company",
          },
          approve: {
            label: "Approve",
            codename: "approve_payroll",
            dotNotation: "payroll.approve",
            description: "Draft payroll run ko approve karna aur finalize/lock karna",
            supportsScope: true,
            defaultScope: "Company",
          },
          delete: {
            label: "Delete",
            codename: "delete_payroll",
            dotNotation: "payroll.delete",
            description: "Draft payroll run cancel ya delete karna",
            supportsScope: false,
          },
          export: {
            label: "Export",
            codename: "export_payroll",
            dotNotation: "payroll.export",
            description: "Payroll summary CSV export aur payslip PDFs download karna",
            supportsScope: true,
            defaultScope: "Company",
          },
          manage: {
            label: "Manage (Admin)",
            codename: "change_payroll",
            dotNotation: "payroll.manage",
            description: "Full administrative payroll access",
            supportsScope: true,
            defaultScope: "Company",
          },
        },
      },
    ],
  },
  {
    key: "field_sales",
    aliases: ["sales"],
    name: "Field Sales",
    description: "Field sales operations, live location tracking, lead pipelines, client visits, and customer directory.",
    functionalities: [
      {
        key: "dashboard",
        name: "Dashboard",
        description: "Field sales performance summary, sales statistics, and executive overview.",
        actions: {
          view: { label: "View", supportsScope: true, defaultScope: "Company", codename: "field_sales.view", dotNotation: "field_sales.view" },
          manage: { label: "Manage (Admin)", supportsScope: true, defaultScope: "Company", codename: "field_sales.manage", dotNotation: "field_sales.manage" },
        },
      },
      {
        key: "employees",
        name: "Field Employees",
        description: "Field sales representative roster, manager assignments, and invitations.",
        actions: {
          view: { label: "View", supportsScope: true, defaultScope: "Department", codename: "field_sales.view", dotNotation: "field_sales.view" },
          create: { label: "Create", supportsScope: true, defaultScope: "Company", codename: "field_sales.employees_manage", dotNotation: "field_sales.employees_manage" },
          edit: { label: "Edit / Update", supportsScope: true, defaultScope: "Company", codename: "field_sales.employees_manage", dotNotation: "field_sales.employees_manage" },
          delete: { label: "Delete", supportsScope: false, codename: "field_sales.employees_manage", dotNotation: "field_sales.employees_manage" },
          manage: { label: "Manage (Admin)", supportsScope: true, defaultScope: "Company", codename: "field_sales.employees_manage", dotNotation: "field_sales.employees_manage" },
        },
      },
      {
        key: "leads",
        name: "Leads",
        description: "Inbound prospects, pipeline qualification, duplicate checks, timeline, and reassignment.",
        actions: {
          view: { label: "View", supportsScope: true, defaultScope: "Team", codename: "field_sales.leads_view", dotNotation: "field_sales.leads_view" },
          create: { label: "Create", supportsScope: true, defaultScope: "Team", codename: "field_sales.leads_create", dotNotation: "field_sales.leads_create" },
          edit: { label: "Edit / Update", supportsScope: true, defaultScope: "Team", codename: "field_sales.leads_manage", dotNotation: "field_sales.leads_manage" },
          delete: { label: "Delete", supportsScope: false, codename: "field_sales.leads_manage", dotNotation: "field_sales.leads_manage" },
          assign: { label: "Assign", supportsScope: true, defaultScope: "Team", codename: "field_sales.leads_manage", dotNotation: "field_sales.leads_manage" },
        },
      },
      {
        key: "customers",
        name: "Customers",
        description: "Client accounts, customer locations, and contact directory.",
        actions: {
          view: { label: "View", supportsScope: true, defaultScope: "Company", codename: "field_sales.customers_view", dotNotation: "field_sales.customers_view" },
          create: { label: "Create", supportsScope: true, defaultScope: "Company", codename: "field_sales.customers_create", dotNotation: "field_sales.customers_create" },
          edit: { label: "Edit / Update", supportsScope: true, defaultScope: "Company", codename: "field_sales.customers_manage", dotNotation: "field_sales.customers_manage" },
          delete: { label: "Delete", supportsScope: false, codename: "field_sales.customers_manage", dotNotation: "field_sales.customers_manage" },
        },
      },
      {
        key: "visits",
        name: "Visits & Schedules",
        description: "Client visits, today schedule, check-in, visit reports, and outcome logging.",
        actions: {
          view: { label: "View", supportsScope: true, defaultScope: "Team", codename: "field_sales.visits_view", dotNotation: "field_sales.visits_view" },
          create: { label: "Create", supportsScope: true, defaultScope: "Team", codename: "field_sales.visits_create", dotNotation: "field_sales.visits_create" },
          edit: { label: "Edit / Update", supportsScope: true, defaultScope: "Team", codename: "field_sales.visits_manage", dotNotation: "field_sales.visits_manage" },
          delete: { label: "Delete", supportsScope: false, codename: "field_sales.visits_manage", dotNotation: "field_sales.visits_manage" },
          approve: { label: "Check-in / Complete", supportsScope: false, codename: "field_sales.today_visits", dotNotation: "field_sales.today_visits" },
        },
      },
      {
        key: "tracking",
        name: "GPS Tracking & Routes",
        description: "Real-time field representative map locations, active status, daily route breadcrumbs and history.",
        actions: {
          view: { label: "View", supportsScope: true, defaultScope: "Team", codename: "tracking.view_team", dotNotation: "tracking.view_team" },
          manage: { label: "Manage / All", supportsScope: true, defaultScope: "Company", codename: "tracking.view_all", dotNotation: "tracking.view_all" },
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

// Standard actions order for matrix headers matching reference structure
export const ALL_ACTIONS = [
  { key: "view", label: "View" },
  { key: "create", label: "Create" },
  { key: "edit", label: "Edit / Update" },
  { key: "approve", label: "Approve" },
  { key: "delete", label: "Delete" },
  { key: "export", label: "Export" },
  { key: "manage", label: "Manage (Admin)" },
  { key: "reject", label: "Reject" },
  { key: "assign", label: "Assign" },
  { key: "import", label: "Import" },
  { key: "configure", label: "Configure" },
];

/**
 * Generates a unique permission key for code reference.
 */
export const buildPermissionKey = (moduleKey, funcKey, actionKey) =>
  `${moduleKey}.${funcKey}.${actionKey}`.toLowerCase();
