import { useMemo, useState } from "react";

import PageHeader from "../../components/common/PageHeader/PageHeader";
import Button from "../../components/common/Button/Button";
import EmptyState from "../../components/common/EmptyState/EmptyState";
import Modal from "../../components/common/Modal/Modal";

import RoleStats from "../../components/rolesPermissions/RoleStats/RoleStats";
import RoleFilters from "../../components/rolesPermissions/RoleFilters/RoleFilters";
import RoleTable from "../../components/rolesPermissions/RoleTable/RoleTable";
import RoleDetails from "../../components/rolesPermissions/RoleDetails/RoleDetails";
import RoleForm from "../../components/rolesPermissions/RoleForm/RoleForm";
import initialRoles from "../../data/roles";
import "./RolesPermissions.css";


const RolesPermissions = () => {
  const [roles, setRoles] = useState(initialRoles);

  const [search, setSearch] = useState("");

  const [status, setStatus] = useState("all");

  const [sortBy, setSortBy] = useState("name");

  const [showDetails, setShowDetails] = useState(false);

  const [selectedRole, setSelectedRole] = useState(null);

  const [showCreateForm, setShowCreateForm] = useState(false);

  const [showEditForm, setShowEditForm] = useState(false);

  const [editRole, setEditRole] = useState(null);

  const [createLoading, setCreateLoading] = useState(false);

  const [editLoading, setEditLoading] = useState(false);

  /*
   * Only non-deleted roles are displayed.
   */
  const activeRoles = useMemo(() => {
    return roles.filter((role) => !role.deletedAt);
  }, [roles]);

  /*
   * Role statistics.
   */
  const stats = useMemo(() => {
    const total = activeRoles.length;

    const active = activeRoles.filter(
      (role) => role.status === "active",
    ).length;

    const permissions = activeRoles.reduce(
      (totalPermissions, role) =>
        totalPermissions + (role.permissionCount || 0),
      0,
    );

    const employees = activeRoles.reduce(
      (totalEmployees, role) => totalEmployees + (role.employeeCount || 0),
      0,
    );

    return {
      total,
      active,
      permissions,
      employees,
    };
  }, [activeRoles]);

  /*
   * Search, status and sorting.
   */
  const filteredRoles = useMemo(() => {
    let result = [...activeRoles];

    if (search.trim()) {
      const searchValue = search.toLowerCase().trim();

      result = result.filter(
        (role) =>
          role.roleName?.toLowerCase().includes(searchValue) ||
          role.description?.toLowerCase().includes(searchValue),
      );
    }

    if (status !== "all") {
      result = result.filter((role) => role.status === status);
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case "employees":
          return (b.employeeCount || 0) - (a.employeeCount || 0);

        case "permissions":
          return (b.permissionCount || 0) - (a.permissionCount || 0);

        case "newest":
          return new Date(b.createdAt) - new Date(a.createdAt);

        case "oldest":
          return new Date(a.createdAt) - new Date(b.createdAt);

        case "name":
        default:
          return (a.roleName || "").localeCompare(b.roleName || "");
      }
    });

    return result;
  }, [activeRoles, search, status, sortBy]);

  /*
   * Open role details.
   */
  const handleViewRole = (role) => {
    setSelectedRole(role);
    setShowDetails(true);
  };

  /*
   * Open Create Role form.
   */
  const handleAddRole = () => {
    setShowCreateForm(true);
  };

  /*
   * Edit role.
   *
   * Actual edit functionality will be added
   * after the Create Role flow is complete.
   */
  const handleEditRole = (role) => {
    setShowDetails(false);
    setSelectedRole(null);

    setEditRole(role);
    setShowEditForm(true);
  };

  /*
   * Soft delete role.
   */
  const handleDeleteRole = (role) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${role.roleName}"?`,
    );

    if (!confirmed) {
      return;
    }

    const deletedAt = new Date().toISOString();

    setRoles((previousRoles) =>
      previousRoles.map((item) =>
        item.id === role.id
          ? {
              ...item,
              deletedAt,
            }
          : item,
      ),
    );

    if (selectedRole?.id === role.id) {
      setSelectedRole(null);
      setShowDetails(false);
    }
  };

  /*
   * Toggle role active/inactive status.
   */
  const handleToggleRoleStatus = (role) => {
    const newStatus = role.status === "active" ? "inactive" : "active";

    setRoles((previousRoles) =>
      previousRoles.map((item) =>
        item.id === role.id
          ? {
              ...item,
              status: newStatus,
              updatedAt: new Date().toISOString(),
            }
          : item,
      ),
    );

    setSelectedRole((previous) => {
      if (previous?.id !== role.id) {
        return previous;
      }

      return {
        ...previous,
        status: newStatus,
      };
    });
  };
  const handleAssignUserToRole = (role, user) => {
  const roleStatus = role.status?.toString().trim().toLowerCase();

  if (roleStatus !== "active") {
    alert("Inactive roles cannot be assigned to employees.");
    return;
  }

  setRoles((prevRoles) =>
    prevRoles.map((item) => {
      if (item.id !== role.id) {
        return item;
      }

      const assignedUsers = item.assignedUsers || [];

      const alreadyAssigned = assignedUsers.some(
        (assignedUser) => assignedUser.id === user.id,
      );

      if (alreadyAssigned) {
        return item;
      }

      const updatedUsers = [...assignedUsers, user];

      return {
        ...item,
        assignedUsers: updatedUsers,
        employeeCount: updatedUsers.length,
      };
    }),
  );

  setSelectedRole((prevRole) => {
    if (!prevRole || prevRole.id !== role.id) {
      return prevRole;
    }

    const assignedUsers = prevRole.assignedUsers || [];

    if (
      assignedUsers.some(
        (assignedUser) => assignedUser.id === user.id,
      )
    ) {
      return prevRole;
    }

    const updatedUsers = [...assignedUsers, user];

    return {
      ...prevRole,
      assignedUsers: updatedUsers,
      employeeCount: updatedUsers.length,
    };
  });
};
  const handleRemoveUserFromRole = (role, userId) => {
    setRoles((prevRoles) =>
      prevRoles.map((item) => {
        if (item.id !== role.id) {
          return item;
        }

        const assignedUsers = item.assignedUsers || [];

        const updatedUsers = assignedUsers.filter((user) => user.id !== userId);

        return {
          ...item,
          assignedUsers: updatedUsers,
          employeeCount: updatedUsers.length,
        };
      }),
    );

    setSelectedRole((prevRole) => {
      if (!prevRole || prevRole.id !== role.id) {
        return prevRole;
      }

      const assignedUsers = prevRole.assignedUsers || [];

      const updatedUsers = assignedUsers.filter((user) => user.id !== userId);

      return {
        ...prevRole,
        assignedUsers: updatedUsers,
        employeeCount: updatedUsers.length,
      };
    });
  };
  const handleCloneRole = (role) => {
    const shouldClone = window.confirm(
      `Are you sure you want to clone "${role.roleName}"?`,
    );

    if (!shouldClone) {
      return;
    }

    const baseName = `${role.roleName} Copy`;

    let clonedName = baseName;
    let counter = 2;

    while (
      roles.some(
        (item) =>
          !item.deletedAt &&
          item.roleName.toLowerCase() === clonedName.toLowerCase(),
      )
    ) {
      clonedName = `${role.roleName} Copy ${counter}`;
      counter++;
    }

    const baseCode =
      role.roleCode ||
      role.roleName.replace(/[^a-zA-Z0-9]/g, "_").toUpperCase();

    let clonedCode = `${baseCode}_COPY`;
    counter = 2;

    while (
      roles.some(
        (item) =>
          !item.deletedAt &&
          item.roleCode?.toLowerCase() === clonedCode.toLowerCase(),
      )
    ) {
      clonedCode = `${baseCode}_COPY_${counter}`;
      counter++;
    }

    const clonedRole = {
      ...role,

      id: Date.now(),

      roleName: clonedName,
      roleCode: clonedCode,

      employeeCount: 0,

      assignedUsers: [],

      permissions: role.permissions
        ? role.permissions.map((permission) => ({
            ...permission,
          }))
        : [],

      permissionCount: role.permissions?.length || role.permissionCount || 0,

      createdAt: new Date().toISOString(),

      deletedAt: null,
    };

    setRoles((prevRoles) => [clonedRole, ...prevRoles]);

    setSelectedRole(clonedRole);
    setShowDetails(true);
  };

  /*
   * Close role details modal.
   */
  const handleCloseDetails = () => {
    setShowDetails(false);
    setSelectedRole(null);
  };

  /*
   * Create a new role.
   */
  const handleCreateRole = (roleData) => {
    setCreateLoading(true);

    setTimeout(() => {
      const permissions = Array.isArray(roleData?.permissions)
        ? roleData.permissions
        : [];

      const newRole = {
        id: Date.now(),

        roleName: (roleData?.roleName || "").trim(),
        roleCode: (roleData?.roleCode || "").trim(),

        description: (roleData?.description || "").trim(),

        employeeCount: 0,

        permissionCount: permissions.length,

        status: roleData?.status || "active",

        createdAt: new Date().toISOString(),

        permissions: permissions.map((permission) => {
          const parts = permission.split(".");

          const module = parts[0] || "";

          const action = parts[1] || "";

          const moduleName = module.charAt(0).toUpperCase() + module.slice(1);

          const actionName = action.charAt(0).toUpperCase() + action.slice(1);

          return {
            code: permission,
            name: `${actionName} ${moduleName}`,
          };
        }),
      };

      setRoles((previousRoles) => [newRole, ...previousRoles]);

      setCreateLoading(false);
      setShowCreateForm(false);
    }, 500);
  };
  const handleUpdateRole = (roleData) => {
    if (!editRole) {
      return;
    }

    setEditLoading(true);

    setTimeout(() => {
      const permissions = Array.isArray(roleData?.permissions)
        ? roleData.permissions
        : [];

      const updatedRole = {
        ...editRole,

        roleName: (roleData?.roleName || "").trim(),

        roleCode: (roleData?.roleCode || "").trim(),

        description: (roleData?.description || "").trim(),

        status: roleData?.status || "active",

        permissionCount: permissions.length,

        permissions: permissions.map((permission) => {
          const parts = permission.split(".");

          const module = parts[0] || "";

          const action = parts[1] || "";

          const moduleName = module.charAt(0).toUpperCase() + module.slice(1);

          const actionName = action.charAt(0).toUpperCase() + action.slice(1);

          return {
            code: permission,
            name: `${actionName} ${moduleName}`,
          };
        }),

        updatedAt: new Date().toISOString(),
      };

      setRoles((previousRoles) =>
        previousRoles.map((role) =>
          role.id === editRole.id ? updatedRole : role,
        ),
      );

      setSelectedRole((previous) => {
        if (previous?.id !== editRole.id) {
          return previous;
        }

        return updatedRole;
      });

      setEditLoading(false);
      setShowEditForm(false);
      setEditRole(null);
    }, 500);
  };

  return (
    <div className="roles-permissions-page">
      <div className="roles-permissions-page__header">
        <PageHeader
          title="Roles & Permissions"
          description="Manage user roles and access levels across your organization."
        />

        <Button variant="primary" onClick={handleAddRole}>
          + Create Role
        </Button>
      </div>

      <div className="roles-permissions-page__content">
        <RoleStats
          total={stats.total}
          active={stats.active}
          permissions={stats.permissions}
          employees={stats.employees}
        />

        {activeRoles.length > 0 && (
          <RoleFilters
            search={search}
            onSearch={(value) => setSearch(value?.target?.value ?? value ?? "")}
            status={status}
            onStatusChange={setStatus}
            sortBy={sortBy}
            onSortChange={setSortBy}
          />
        )}

        {activeRoles.length === 0 ? (
          <div className="roles-permissions-page__empty">
            <EmptyState
              title="No roles yet"
              description="Create your first role to start managing access across your organization."
              action={
                <Button variant="primary" onClick={handleAddRole}>
                  + Create Role
                </Button>
              }
            />
          </div>
        ) : filteredRoles.length === 0 ? (
          <div className="roles-permissions-page__empty">
            <EmptyState
              title="No roles found"
              description="Try changing your search or status filter."
            />
          </div>
        ) : (
          <div className="roles-permissions-page__table">
            <RoleTable
              roles={filteredRoles}
              onView={handleViewRole}
              onEdit={handleEditRole}
              onDelete={handleDeleteRole}
              onToggleStatus={handleToggleRoleStatus}
            />
          </div>
        )}
      </div>

      {/* Role Details Modal */}
      <Modal
        open={showDetails && !!selectedRole}
        onClose={handleCloseDetails}
        size="medium"
      >
        <RoleDetails
          role={selectedRole}
          onClose={handleCloseDetails}
          onEdit={handleEditRole}
          onAssignUser={handleAssignUserToRole}
          onRemoveUser={handleRemoveUserFromRole}
          onClone={handleCloneRole}
        />
      </Modal>

      {/* Create Role Modal */}
      <Modal
        open={showCreateForm}
        onClose={() => {
          if (!createLoading) {
            setShowCreateForm(false);
          }
        }}
        title="Create New Role"
      >
        <RoleForm
          onSubmit={handleCreateRole}
          onCancel={() => setShowCreateForm(false)}
          loading={createLoading}
        />
      </Modal>

      {/* Edit Role Modal */}
      <Modal
        open={showEditForm && !!editRole}
        onClose={() => {
          if (!editLoading) {
            setShowEditForm(false);
            setEditRole(null);
          }
        }}
        title="Edit Role"
      >
        <RoleForm
          key={editRole?.id}
          initialData={editRole}
          onSubmit={handleUpdateRole}
          onCancel={() => {
            if (!editLoading) {
              setShowEditForm(false);
              setEditRole(null);
            }
          }}
          loading={editLoading}
        />
      </Modal>
    </div>
  );
};

export default RolesPermissions;
