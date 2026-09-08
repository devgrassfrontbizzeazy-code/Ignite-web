const initialRoles = [
  {
    id: 1,
    roleName: "Super Admin",
    description: "Full access to all organization features and settings.",
    employeeCount: 2,
    permissionCount: 32,
    status: "active",
    createdAt: "2026-01-10T10:00:00.000Z",
    assignedUsers: [],
    permissions: [
      {
        code: "employee.view",
        name: "View Employees",
      },
      {
        code: "employee.create",
        name: "Create Employees",
      },
      {
        code: "employee.update",
        name: "Update Employees",
      },
      {
        code: "employee.delete",
        name: "Delete Employees",
      },
    ],
  },

  {
    id: 2,
    roleName: "HR Manager",
    description: "Manages employees, attendance, leave and HR operations.",
    employeeCount: 23,
    permissionCount: 18,
    status: "active",
    createdAt: "2026-01-18T10:00:00.000Z",
    assignedUsers: [],
    permissions: [
      {
        code: "employee.view",
        name: "View Employees",
      },
      {
        code: "employee.create",
        name: "Create Employees",
      },
      {
        code: "employee.update",
        name: "Update Employees",
      },
    ],
  },

  {
    id: 3,
    roleName: "HR Executive",
    description: "Handles day-to-day HR administration and employee records.",
    employeeCount: 14,
    permissionCount: 12,
    status: "active",
    createdAt: "2026-02-02T10:00:00.000Z",
    assignedUsers: [],
    permissions: [
      {
        code: "employee.view",
        name: "View Employees",
      },
      {
        code: "employee.create",
        name: "Create Employees",
      },
    ],
  },

  {
    id: 4,
    roleName: "Department Head",
    description:
      "Manages employees and activities within assigned departments.",
    employeeCount: 8,
    permissionCount: 10,
    status: "active",
    createdAt: "2026-02-14T10:00:00.000Z",
    assignedUsers: [],
    permissions: [
      {
        code: "employee.view",
        name: "View Employees",
      },
      {
        code: "employee.update",
        name: "Update Employees",
      },
    ],
  },

  {
    id: 5,
    roleName: "Team Lead",
    description: "Manages team-level employee activities and access.",
    employeeCount: 31,
    permissionCount: 8,
    status: "active",
    createdAt: "2026-03-01T10:00:00.000Z",
    assignedUsers: [],
    permissions: [
      {
        code: "employee.view",
        name: "View Employees",
      },
      {
        code: "employee.update",
        name: "Update Employees",
      },
    ],
  },

  {
    id: 6,
    roleName: "Employee",
    description: "Standard employee access.",
    employeeCount: 72,
    permissionCount: 4,
    status: "active",
    createdAt: "2026-03-12T10:00:00.000Z",
    assignedUsers: [],
    permissions: [
      {
        code: "employee.view",
        name: "View Employees",
      },
    ],
  },

  {
    id: 7,
    roleName: "Recruiter",
    description: "Manages recruitment and candidate-related operations.",
    employeeCount: 4,
    permissionCount: 9,
    status: "active",
    createdAt: "2026-04-04T10:00:00.000Z",
    assignedUsers: [],
    permissions: [
      {
        code: "employee.view",
        name: "View Employees",
      },
    ],
  },

  {
    id: 8,
    roleName: "Finance Manager",
    description: "Manages payroll and finance-related operations.",
    employeeCount: 2,
    permissionCount: 11,
    status: "inactive",
    createdAt: "2026-04-18T10:00:00.000Z",
    assignedUsers: [],
    permissions: [
      {
        code: "employee.view",
        name: "View Employees",
      },
    ],
  },
];

export default initialRoles;