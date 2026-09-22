import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import Button from "../../components/common/Button/Button";
import EmptyState from "../../components/common/EmptyState/EmptyState";
import Modal from "../../components/common/Modal/Modal";
import PageHeader from "../../components/common/PageHeader/PageHeader";
import ConfirmModal from "../../components/common/ConfirmModal/ConfirmModal";

import RoleStats from "../../components/rolesPermissions/RoleStats/RoleStats";
import RoleFilters from "../../components/rolesPermissions/RoleFilters/RoleFilters";
import RoleTable from "../../components/rolesPermissions/RoleTable/RoleTable";
import RoleDetails from "../../components/rolesPermissions/RoleDetails/RoleDetails";

import roleService from "../../services/roleService";
import { useNotification } from "../../context/NotificationContext";

import "./RolesPermissions.css";

const RolesPermissions = () => {
  const navigate = useNavigate();
  const { notify } = useNotification();

  const [roles, setRoles] = useState(() =>
    roleService.getRoles(),
  );

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [sortBy, setSortBy] = useState("name");

  const [selectedRole, setSelectedRole] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const [deleteModal, setDeleteModal] = useState({
    open: false,
    role: null,
    loading: false,
  });
  const [cloneModal, setCloneModal] = useState({
    open: false,
    role: null,
    loading: false,
  });

  /*
   * Sync role state with roleService updates.
   */
  useEffect(() => {
    const handleRolesUpdated = (event) => {
      if (event.detail && Array.isArray(event.detail)) {
        setRoles(event.detail);
      } else {
        setRoles(roleService.getRoles());
      }
    };

    window.addEventListener(
      "ignite:roles-updated",
      handleRolesUpdated,
    );

    window.addEventListener(
      "storage",
      handleRolesUpdated,
    );

    return () => {
      window.removeEventListener(
        "ignite:roles-updated",
        handleRolesUpdated,
      );

      window.removeEventListener(
        "storage",
        handleRolesUpdated,
      );
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

    const active = activeRoles.filter(
      (role) => role.status === "active",
    ).length;

    const permissions = activeRoles.reduce(
      (totalPermissions, role) =>
        totalPermissions +
        (role.permissionCount ||
          role.permissions?.length ||
          0),
      0,
    );

    const employees = activeRoles.reduce(
      (totalEmployees, role) =>
        totalEmployees +
        (role.employeeCount ||
          role.assignedUsers?.length ||
          0),
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
      const searchValue = search
        .toLowerCase()
        .trim();

      result = result.filter(
        (role) =>
          role.roleName
            ?.toLowerCase()
            .includes(searchValue) ||
          role.roleCode
            ?.toLowerCase()
            .includes(searchValue) ||
          role.description
            ?.toLowerCase()
            .includes(searchValue),
      );
    }

    if (status !== "all") {
      result = result.filter(
        (role) => role.status === status,
      );
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case "employees":
          return (
            (b.employeeCount || 0) -
            (a.employeeCount || 0)
          );

        case "permissions":
          return (
            (b.permissionCount ||
              b.permissions?.length ||
              0) -
            (a.permissionCount ||
              a.permissions?.length ||
              0)
          );

        case "newest":
          return (
            new Date(b.createdAt) -
            new Date(a.createdAt)
          );

        case "oldest":
          return (
            new Date(a.createdAt) -
            new Date(b.createdAt)
          );

        case "name":
        default:
          return (
            (a.roleName || "").localeCompare(
              b.roleName || "",
            )
          );
      }
    });

    return result;
  }, [
    activeRoles,
    search,
    status,
    sortBy,
  ]);

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
   * Close role details modal.
   */
  const handleCloseDetails = () => {
    setShowDetails(false);
    setSelectedRole(null);
  };

  /*
   * Open branded delete confirmation modal.
   *
   * The actual deletion only happens after
   * the user confirms.
   */
  const handleDeleteClick = (role) => {
    if (!role?.id) {
      notify.error(
        "Unable to delete role: role ID is missing.",
      );
      return;
    }

    setDeleteModal({
      open: true,
      role,
      loading: false,
    });
  };

  /*
   * Confirm and delete role.
   *
   * Existing roleService delete logic is preserved.
   * Only the browser confirm is replaced by ConfirmModal.
   */
  const handleConfirmDelete = async () => {
    const role = deleteModal.role;

    if (!role) {
      return;
    }

    try {
      setDeleteModal((previous) => ({
        ...previous,
        loading: true,
      }));

      roleService.deleteRole(role.id);

      setRoles(roleService.getRoles());

      if (selectedRole?.id === role.id) {
        handleCloseDetails();
      }

      setDeleteModal({
        open: false,
        role: null,
        loading: false,
      });

      notify.success(
        `Role "${role.roleName}" deleted successfully.`,
      );
    } catch (error) {
      console.error(
        "Failed to delete role:",
        error,
      );

      setDeleteModal((previous) => ({
        ...previous,
        loading: false,
      }));

      notify.error(
        "Failed to delete role. Please try again.",
      );
    }
  };

  /*
   * Toggle role active/inactive status.
   *
   * Existing roleService logic is preserved.
   * Notification is added for success/failure.
   */
  const handleToggleRoleStatus = (role) => {
    try {
      const updated = roleService.toggleRoleStatus(
        role.id,
      );

      setRoles(roleService.getRoles());

      if (
        selectedRole?.id === role.id &&
        updated
      ) {
        setSelectedRole(updated);
      }

      notify.success(
        `Role "${role.roleName}" ${updated.status === "active"
          ? "activated"
          : "deactivated"
        } successfully.`,
      );
    } catch (error) {
      console.error(
        "Failed to toggle role status:",
        error,
      );

      notify.error(
        "Failed to update role status.",
      );
    }
  };

  /*
   * Assign employee to role.
   *
   * Original business logic is preserved:
   * - Inactive roles cannot receive employees.
   * - Duplicate employees are ignored.
   * - Complete user object is stored.
   */
  const handleAssignUserToRole = (role, user) => {
    if (role.status !== "active") {
      notify.error(
        "Inactive roles cannot be assigned to employees.",
      );
      return;
    }

    const assignedUsers =
      role.assignedUsers || [];

    if (
      assignedUsers.some(
        (assignedUser) =>
          assignedUser.id === user.id,
      )
    ) {
      return;
    }

    try {
      const updatedUsers = [
        ...assignedUsers,
        user,
      ];

      const updatedRole =
        roleService.updateRole(role.id, {
          assignedUsers: updatedUsers,
          employeeCount:
            updatedUsers.length,
        });

      setRoles(roleService.getRoles());

      if (selectedRole?.id === role.id) {
        setSelectedRole(updatedRole);
      }

      notify.success(
        "Employee assigned to role successfully.",
      );
    } catch (error) {
      console.error(
        "Failed to assign employee to role:",
        error,
      );

      notify.error(
        "Failed to assign employee to role.",
      );
    }
  };

  /*
   * Remove employee from role.
   *
   * Original roleService/updateRole logic is preserved.
   */
  const handleRemoveUserFromRole = (
    role,
    userId,
  ) => {
    try {
      const assignedUsers =
        role.assignedUsers || [];

      const updatedUsers =
        assignedUsers.filter(
          (user) => user.id !== userId,
        );

      const updatedRole =
        roleService.updateRole(role.id, {
          assignedUsers: updatedUsers,
          employeeCount:
            updatedUsers.length,
        });

      setRoles(roleService.getRoles());

      if (selectedRole?.id === role.id) {
        setSelectedRole(updatedRole);
      }

      notify.success(
        "Employee removed from role successfully.",
      );
    } catch (error) {
      console.error(
        "Failed to remove employee from role:",
        error,
      );

      notify.error(
        "Failed to remove employee from role.",
      );
    }
  };

  /*
 * Open branded clone confirmation modal.
 *
 * Clone business logic remains unchanged.
 * Only the browser confirm is replaced by ConfirmModal.
 */
  const handleCloneClick = (role) => {
    if (!role?.id) {
      notify.error(
        "Unable to clone role: role ID is missing.",
      );
      return;
    }

    setCloneModal({
      open: true,
      role,
      loading: false,
    });
  };

  /*
   * Confirm and clone role.
   */
  const handleConfirmClone = async () => {
    const role = cloneModal.role;

    if (!role) {
      return;
    }

    try {
      setCloneModal((previous) => ({
        ...previous,
        loading: true,
      }));

      const cloned = roleService.cloneRole(
        role.id,
      );

      setRoles(roleService.getRoles());
      setSelectedRole(cloned);
      setShowDetails(true);

      setCloneModal({
        open: false,
        role: null,
        loading: false,
      });

      notify.success(
        `Role "${role.roleName}" cloned successfully.`,
      );
    } catch (error) {
      console.error(
        "Failed to clone role:",
        error,
      );

      setCloneModal((previous) => ({
        ...previous,
        loading: false,
      }));

      notify.error(
        "Failed to clone role. Please try again.",
      );
    }
  };

  return (
    <div className="roles-permissions-page">
      <PageHeader
        eyebrow="Organization"
        title="Roles & Permissions"
        description="Manage user roles and access levels across your organization."
        action={
          <Button
            variant="primary"
            onClick={handleAddRole}
          >
            + Add Role
          </Button>
        }
      />

      <RoleStats
        total={stats.total}
        active={stats.active}
        permissions={stats.permissions}
        employees={stats.employees}
      />

      <div className="roles-permissions-page__content">
        {activeRoles.length > 0 && (
          <RoleFilters
            search={search}
            onSearch={(value) =>
              setSearch(
                value?.target?.value ??
                value ??
                "",
              )
            }
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
                <Button
                  variant="primary"
                  onClick={handleAddRole}
                >
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
              onDelete={handleDeleteClick}
              onToggleStatus={
                handleToggleRoleStatus
              }
            />
          </div>
        )}
      </div>

      {/* Role Details Modal */}
      <Modal
        open={
          showDetails && !!selectedRole
        }
        onClose={handleCloseDetails}
        size="medium"
        title="Role Details"
      >
        <RoleDetails
          role={selectedRole}
          onClose={handleCloseDetails}
          onEdit={handleEditRole}
          onAssignUser={
            handleAssignUserToRole
          }
          onRemoveUser={
            handleRemoveUserFromRole
          }
          onClone={handleCloneClick}
        />
      </Modal>

      {/* Branded delete confirmation */}
      <ConfirmModal
        open={deleteModal.open}
        onClose={() =>
          setDeleteModal({
            open: false,
            role: null,
            loading: false,
          })
        }
        onConfirm={handleConfirmDelete}
        title="Delete Role?"
        itemName={
          deleteModal.role?.roleName
        }
        confirmText="Delete"
        loading={deleteModal.loading}
      />
      {/* Branded clone confirmation */}
      <ConfirmModal
        open={cloneModal.open}
        onClose={() =>
          setCloneModal({
            open: false,
            role: null,
            loading: false,
          })
        }
        onConfirm={handleConfirmClone}
        title="Clone Role?"
        itemName={
          cloneModal.role?.roleName
        }
        confirmText="Clone"
        loading={cloneModal.loading}
      />
    </div>
  );
};

export default RolesPermissions;