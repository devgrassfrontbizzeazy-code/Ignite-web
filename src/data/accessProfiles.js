import { PERMISSION_SCOPES } from "./permissionCatalogue";

export const ACCESS_PROFILES = [
  {
    key: "employee",
    name: "Employee",
    description: "Basic self-service access.",
  },

  {
    key: "team_member",
    name: "Team Member",
    description: "Self-service access with assigned team visibility.",
  },

  {
    key: "team_lead",
    name: "Team Lead",
    description: "Team-level access with attendance and leave approvals.",
  },

  {
    key: "manager",
    name: "Manager",
    description: "Team and department-level management access.",
  },

  {
    key: "hr_admin",
    name: "HR Admin",
    description: "HR operations and employee management access.",
  },

  {
    key: "organization_admin",
    name: "Organization Admin",
    description: "Full organization management access.",
  },

  {
    key: "custom",
    name: "Custom",
    description: "Configure permissions manually.",
  },
];

export const ACCESS_PROFILE_PERMISSIONS = {
  employee: {},

  team_member: {
    employees: {
      view: {
        enabled: true,
        scope: "team",
      },
    },

    teams: {
      view: {
        enabled: true,
        scope: "team",
      },
    },
  },

  team_lead: {
    employees: {
      view: {
        enabled: true,
        scope: "team",
      },
    },

    teams: {
      view: {
        enabled: true,
        scope: "team",
      },
      update: {
        enabled: true,
        scope: "team",
      },
    },

    attendance: {
      view: {
        enabled: true,
        scope: "team",
      },
      approve: {
        enabled: true,
        scope: "team",
      },
    },

    leaves: {
      view: {
        enabled: true,
        scope: "team",
      },
      approve: {
        enabled: true,
        scope: "team",
      },
    },
  },

  manager: {
    employees: {
      view: {
        enabled: true,
        scope: "department",
      },
    },

    teams: {
      view: {
        enabled: true,
        scope: "department",
      },
      update: {
        enabled: true,
        scope: "department",
      },
    },

    attendance: {
      view: {
        enabled: true,
        scope: "department",
      },
      approve: {
        enabled: true,
        scope: "department",
      },
      export: {
        enabled: true,
        scope: "department",
      },
    },

    leaves: {
      view: {
        enabled: true,
        scope: "department",
      },
      approve: {
        enabled: true,
        scope: "department",
      },
    },

    holidays: {
      view: {
        enabled: true,
      },
    },
  },

  hr_admin: {
    employees: {
      view: {
        enabled: true,
        scope: "all",
      },
      create: {
        enabled: true,
      },
      update: {
        enabled: true,
        scope: "all",
      },
      delete: {
        enabled: true,
      },
      export: {
        enabled: true,
        scope: "all",
      },
    },

    departments: {
      view: {
        enabled: true,
      },
      create: {
        enabled: true,
      },
      update: {
        enabled: true,
      },
      delete: {
        enabled: true,
      },
    },

    designations: {
      view: {
        enabled: true,
      },
      create: {
        enabled: true,
      },
      update: {
        enabled: true,
      },
      delete: {
        enabled: true,
      },
    },

    attendance: {
      view: {
        enabled: true,
        scope: "all",
      },
      create: {
        enabled: true,
      },
      update: {
        enabled: true,
        scope: "all",
      },
      delete: {
        enabled: true,
      },
      export: {
        enabled: true,
        scope: "all",
      },
      approve: {
        enabled: true,
        scope: "all",
      },
    },

    leaves: {
      view: {
        enabled: true,
        scope: "all",
      },
      create: {
        enabled: true,
      },
      update: {
        enabled: true,
        scope: "all",
      },
      delete: {
        enabled: true,
      },
      approve: {
        enabled: true,
        scope: "all",
      },
    },

    holidays: {
      view: {
        enabled: true,
      },
      create: {
        enabled: true,
      },
      update: {
        enabled: true,
      },
      delete: {
        enabled: true,
      },
    },

    organization: {
      view: {
        enabled: true,
      },
    },
  },

  organization_admin: {
    employees: {
      view: {
        enabled: true,
        scope: "all",
      },
      create: {
        enabled: true,
      },
      update: {
        enabled: true,
        scope: "all",
      },
      delete: {
        enabled: true,
      },
      export: {
        enabled: true,
        scope: "all",
      },
    },

    departments: {
      view: {
        enabled: true,
      },
      create: {
        enabled: true,
      },
      update: {
        enabled: true,
      },
      delete: {
        enabled: true,
      },
    },

    designations: {
      view: {
        enabled: true,
      },
      create: {
        enabled: true,
      },
      update: {
        enabled: true,
      },
      delete: {
        enabled: true,
      },
    },

    teams: {
      view: {
        enabled: true,
        scope: "all",
      },
      create: {
        enabled: true,
      },
      update: {
        enabled: true,
        scope: "all",
      },
      delete: {
        enabled: true,
      },
    },

    attendance: {
      view: {
        enabled: true,
        scope: "all",
      },
      create: {
        enabled: true,
      },
      update: {
        enabled: true,
        scope: "all",
      },
      delete: {
        enabled: true,
      },
      export: {
        enabled: true,
        scope: "all",
      },
      approve: {
        enabled: true,
        scope: "all",
      },
    },

    leaves: {
      view: {
        enabled: true,
        scope: "all",
      },
      create: {
        enabled: true,
      },
      update: {
        enabled: true,
        scope: "all",
      },
      delete: {
        enabled: true,
      },
      approve: {
        enabled: true,
        scope: "all",
      },
    },

    holidays: {
      view: {
        enabled: true,
      },
      create: {
        enabled: true,
      },
      update: {
        enabled: true,
      },
      delete: {
        enabled: true,
      },
    },

    organization: {
      view: {
        enabled: true,
      },
      update: {
        enabled: true,
      },
    },
  },
};

export const getAccessProfile = (profileKey) => {
  return (
    ACCESS_PROFILES.find(
      (profile) => profile.key === profileKey,
    ) || null
  );
};

export const getAccessProfilePermissions = (profileKey) => {
  return ACCESS_PROFILE_PERMISSIONS[profileKey] || {};
};

export const getScopeLabel = (scopeValue) => {
  return (
    PERMISSION_SCOPES.find(
      (scope) => scope.value === scopeValue,
    )?.label || scopeValue
  );
};