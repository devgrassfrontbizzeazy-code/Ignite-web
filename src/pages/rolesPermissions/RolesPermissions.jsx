import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader/PageHeader";
import Button from "../../components/common/Button/Button";
import EmptyState from "../../components/common/EmptyState/EmptyState";
import Modal from "../../components/common/Modal/Modal";

import RoleStats from "../../components/rolesPermissions/RoleStats/RoleStats";
import RoleFilters from "../../components/rolesPermissions/RoleFilters/RoleFilters";
import RoleTable from "../../components/rolesPermissions/RoleTable/RoleTable";
import RoleDetails from "../../components/rolesPermissions/RoleDetails/RoleDetails";
import roleService from "../../services/roleService";
import "./RolesPermissions.css";

const RolesPermissions = () => {
  const navigate = useNavigate();
  const [roles, setRoles] = useState(() => roleService.getRoles());
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [showDetails, setShowDetails] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);

  // Sync state with roleService updates
  useEffect(() => {
    const handleRolesUpdated = (event) => {
      if (event.detail && Array.isArray(event.detail)) {
        setRoles(event.detail);
      } else {
        setRoles(roleService.getRoles());
      }
    };

    window.addEventListener("ignite:roles-updated", handleRolesUpdated);
    window.addEventListener("storage", handleRolesUpdated);

    return () => {
      window.removeEventListener("ignite:roles-updated", handleRolesUpdated);
      window.removeEventListener("storage", handleRolesUpdated);
    };
  }, []);

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
    const active = activeRoles.filter((role) => role.status === "active").length;
    const permissions = activeRoles.reduce(
      (totalPermissions, role) =>
        totalPermissions + (role.permissionCount || role.permissions?.length || 0),
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
          role.roleCode?.toLowerCase().includes(searchValue) ||
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
          return (
            (b.permissionCount || b.permissions?.length || 0) -
            (a.permissionCount || a.permissions?.length || 0)
          );

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
   * Navigate to dedicated Create Role page.
   */
  const handleAddRole = () => {
    navigate("/roles-permissions/add");
  };

  /*
   * Navigate to dedicated Edit Role page.
   */
  const handleEditRole = (role) => {
    setShowDetails(false);
    setSelectedRole(null);
    navigate(`/roles-permissions/${role.id}/edit`);
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

    roleService.deleteRole(role.id);
    setRoles(roleService.getRoles());

    if (selectedRole?.id === role.id) {
      setSelectedRole(null);
      setShowDetails(false);
    }
  };

  /*
   * Toggle role active/inactive status.
   */
  const handleToggleRoleStatus = (role) => {
    const updated = roleService.toggleRoleStatus(role.id);
    setRoles(roleService.getRoles());

    if (selectedRole?.id === role.id && updated) {
      setSelectedRole(updated);
    }
  };

  /*
   * Assign employee to role.
   */
  const handleAssignUserToRole = (role, user) => {
    if (role.status !== "active") {
      alert("Inactive roles cannot be assigned to employees.");
      return;
    }

    const assignedUsers = role.assignedUsers || [];
    if (assignedUsers.some((u) => u.id === user.id)) {
      return;
    }

    const updatedUsers = [...assignedUsers, user];
    const updatedRole = roleService.updateRole(role.id, {
      assignedUsers: updatedUsers,
      employeeCount: updatedUsers.length,
    });

    setRoles(roleService.getRoles());
    if (selectedRole?.id === role.id) {
      setSelectedRole(updatedRole);
    }
  };

  /*
   * Remove employee from role.
   */
  const handleRemoveUserFromRole = (role, userId) => {
    const assignedUsers = role.assignedUsers || [];
    const updatedUsers = assignedUsers.filter((u) => u.id !== userId);
    const updatedRole = roleService.updateRole(role.id, {
      assignedUsers: updatedUsers,
      employeeCount: updatedUsers.length,
    });

    setRoles(roleService.getRoles());
    if (selectedRole?.id === role.id) {
      setSelectedRole(updatedRole);
    }
  };

  /*
   * Clone role.
   */
  const handleCloneRole = (role) => {
    const shouldClone = window.confirm(
      `Are you sure you want to clone "${role.roleName}"?`,
    );

    if (!shouldClone) {
      return;
    }

    const cloned = roleService.cloneRole(role.id);
    setRoles(roleService.getRoles());
    setSelectedRole(cloned);
    setShowDetails(true);
  };

  /*
   * Close role details modal.
   */
  const handleCloseDetails = () => {
    setShowDetails(false);
    setSelectedRole(null);
  };

  return (
    <div className="roles-permissions-page">
      <PageHeader
        eyebrow="Organization"
        title="Roles & Permissions"
        description="Manage user roles and access levels across your organization."
        action={
          <Button variant="primary" onClick={handleAddRole}>
            + Add Role
          </Button>
        }
      />

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
                  + Add Role
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

      {/* Role Details Modal (View Only) */}
      <Modal
        open={showDetails && !!selectedRole}
        onClose={handleCloseDetails}
        size="medium"
        title="Role Details"
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
    </div>
  );
};

export default RolesPermissions;
