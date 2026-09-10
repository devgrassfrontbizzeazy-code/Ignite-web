// Permission catalogue used by Access Profiles
// This defines which elevated permissions are available in Ignite.

export const PERMISSION_CATALOGUE = [
  {
    key: "employees",
    name: "Employees",
    actions: {
      view: {
        label: "View",
        scope: true,
      },
      create: {
        label: "Create",
        scope: false,
      },
      update: {
        label: "Update",
        scope: true,
      },
      delete: {
        label: "Delete",
        scope: false,
      },
      export: {
        label: "Export",
        scope: true,
      },
    },
  },

  {
    key: "departments",
    name: "Departments",
    actions: {
      view: {
        label: "View",
        scope: false,
      },
      create: {
        label: "Create",
        scope: false,
      },
      update: {
        label: "Update",
        scope: false,
      },
      delete: {
        label: "Delete",
        scope: false,
      },
    },
  },

  {
    key: "designations",
    name: "Designations",
    actions: {
      view: {
        label: "View",
        scope: false,
      },
      create: {
        label: "Create",
        scope: false,
      },
      update: {
        label: "Update",
        scope: false,
      },
      delete: {
        label: "Delete",
        scope: false,
      },
    },
  },

  {
    key: "teams",
    name: "Teams",
    actions: {
      view: {
        label: "View",
        scope: true,
      },
      create: {
        label: "Create",
        scope: false,
      },
      update: {
        label: "Update",
        scope: true,
      },
      delete: {
        label: "Delete",
        scope: false,
      },
    },
  },

  {
    key: "attendance",
    name: "Attendance",
    actions: {
      view: {
        label: "View",
        scope: true,
      },
      create: {
        label: "Create",
        scope: false,
      },
      update: {
        label: "Update",
        scope: true,
      },
      delete: {
        label: "Delete",
        scope: false,
      },
      export: {
        label: "Export",
        scope: true,
      },
      approve: {
        label: "Approve",
        scope: true,
      },
    },
  },

  {
    key: "leaves",
    name: "Leaves",
    actions: {
      view: {
        label: "View",
        scope: true,
      },
      create: {
        label: "Create",
        scope: false,
      },
      update: {
        label: "Update",
        scope: true,
      },
      delete: {
        label: "Delete",
        scope: false,
      },
      approve: {
        label: "Approve",
        scope: true,
      },
    },
  },

  {
    key: "holidays",
    name: "Holidays",
    actions: {
      view: {
        label: "View",
        scope: false,
      },
      create: {
        label: "Create",
        scope: false,
      },
      update: {
        label: "Update",
        scope: false,
      },
      delete: {
        label: "Delete",
        scope: false,
      },
    },
  },

  {
    key: "organization",
    name: "Organization Setup",
    actions: {
      view: {
        label: "View",
        scope: false,
      },
      update: {
        label: "Update",
        scope: false,
      },
    },
  },
];

export const PERMISSION_SCOPES = [
  {
    value: "own",
    label: "Own",
  },
  {
    value: "team",
    label: "Own Team",
  },
  {
    value: "department",
    label: "Own Department",
  },
  {
    value: "all",
    label: "All",
  },
];