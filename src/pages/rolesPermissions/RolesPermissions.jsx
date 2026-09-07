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

import "./RolesPermissions.css";

const initialRoles = [
    {
        id: 1,
        roleName: "Super Admin",
        description:
            "Full access to all organization features and settings.",
        employeeCount: 2,
        permissionCount: 32,
        status: "active",
        createdAt: "2026-01-10T10:00:00.000Z",
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
        description:
            "Manages employees, attendance, leave and HR operations.",
        employeeCount: 23,
        permissionCount: 18,
        status: "active",
        createdAt: "2026-01-18T10:00:00.000Z",
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
        description:
            "Handles day-to-day HR administration and employee records.",
        employeeCount: 14,
        permissionCount: 12,
        status: "active",
        createdAt: "2026-02-02T10:00:00.000Z",
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
        description:
            "Manages team-level employee activities and access.",
        employeeCount: 31,
        permissionCount: 8,
        status: "active",
        createdAt: "2026-03-01T10:00:00.000Z",
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
        description:
            "Manages recruitment and candidate-related operations.",
        employeeCount: 4,
        permissionCount: 9,
        status: "active",
        createdAt: "2026-04-04T10:00:00.000Z",
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
        description:
            "Manages payroll and finance-related operations.",
        employeeCount: 2,
        permissionCount: 11,
        status: "inactive",
        createdAt: "2026-04-18T10:00:00.000Z",
        permissions: [
            {
                code: "employee.view",
                name: "View Employees",
            },
        ],
    },
];

const RolesPermissions = () => {
    const [roles, setRoles] = useState(initialRoles);

    const [search, setSearch] = useState("");

    const [status, setStatus] = useState("all");

    const [sortBy, setSortBy] = useState("name");

    const [showDetails, setShowDetails] = useState(false);

    const [selectedRole, setSelectedRole] = useState(null);

    const [showCreateForm, setShowCreateForm] =
        useState(false);

    const [createLoading, setCreateLoading] =
        useState(false);

    /*
     * Only non-deleted roles are displayed.
     */
    const activeRoles = useMemo(() => {
        return roles.filter(
            (role) => !role.deletedAt,
        );
    }, [roles]);

    /*
     * Role statistics.
     */
    const stats = useMemo(() => {
        const total = activeRoles.length;

        const active = activeRoles.filter(
            (role) =>
                role.status === "active",
        ).length;

        const permissions =
            activeRoles.reduce(
                (
                    totalPermissions,
                    role,
                ) =>
                    totalPermissions +
                    (role.permissionCount || 0),
                0,
            );

        const employees =
            activeRoles.reduce(
                (
                    totalEmployees,
                    role,
                ) =>
                    totalEmployees +
                    (role.employeeCount || 0),
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
            const searchValue =
                search.toLowerCase().trim();

            result = result.filter(
                (role) =>
                    role.roleName
                        ?.toLowerCase()
                        .includes(searchValue) ||
                    role.description
                        ?.toLowerCase()
                        .includes(searchValue),
            );
        }

        if (status !== "all") {
            result = result.filter(
                (role) =>
                    role.status === status,
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
                        (b.permissionCount || 0) -
                        (a.permissionCount || 0)
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
                        a.roleName || ""
                    ).localeCompare(
                        b.roleName || "",
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
        console.log(
            "Edit role:",
            role,
        );
    };

    /*
     * Soft delete role.
     */
    const handleDeleteRole = (role) => {
        const confirmed =
            window.confirm(
                `Are you sure you want to delete "${role.roleName}"?`,
            );

        if (!confirmed) {
            return;
        }

        const deletedAt =
            new Date().toISOString();

        setRoles((previousRoles) =>
            previousRoles.map(
                (item) =>
                    item.id === role.id
                        ? {
                            ...item,
                            deletedAt,
                        }
                        : item,
            ),
        );

        if (
            selectedRole?.id ===
            role.id
        ) {
            setSelectedRole(null);
            setShowDetails(false);
        }
    };

    /*
     * Toggle role active/inactive status.
     */
    const handleToggleRoleStatus = (
        role,
    ) => {
        setRoles((previousRoles) =>
            previousRoles.map(
                (item) =>
                    item.id === role.id
                        ? {
                            ...item,
                            status:
                                item.status ===
                                    "active"
                                    ? "inactive"
                                    : "active",
                            updatedAt:
                                new Date().toISOString(),
                        }
                        : item,
            ),
        );

        setSelectedRole((previous) => {
            if (
                previous?.id !==
                role.id
            ) {
                return previous;
            }

            return {
                ...previous,
                status:
                    previous.status ===
                        "active"
                        ? "inactive"
                        : "active",
            };
        });
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
    const handleCreateRole = (
        roleData,
    ) => {
        setCreateLoading(true);

        setTimeout(() => {
            const permissions =
                Array.isArray(
                    roleData?.permissions,
                )
                    ? roleData.permissions
                    : [];

            const newRole = {
                id: Date.now(),

                roleName:
                    (
                        roleData?.roleName ||
                        ""
                    ).trim(),

                description:
                    (
                        roleData?.description ||
                        ""
                    ).trim(),

                employeeCount: 0,

                permissionCount:
                    permissions.length,

                status:
                    roleData?.status ||
                    "active",

                createdAt:
                    new Date().toISOString(),

                permissions:
                    permissions.map(
                        (permission) => {
                            const parts =
                                permission.split(
                                    ".",
                                );

                            const module =
                                parts[0] || "";

                            const action =
                                parts[1] || "";

                            const moduleName =
                                module
                                    .charAt(0)
                                    .toUpperCase() +
                                module.slice(1);

                            const actionName =
                                action
                                    .charAt(0)
                                    .toUpperCase() +
                                action.slice(1);

                            return {
                                code: permission,
                                name: `${actionName} ${moduleName}`,
                            };
                        },
                    ),
            };

            setRoles(
                (previousRoles) => [
                    newRole,
                    ...previousRoles,
                ],
            );

            setCreateLoading(false);
            setShowCreateForm(false);
        }, 500);
    };

    return (
        <div className="roles-permissions-page">
            <div className="roles-permissions-page__header">
                <PageHeader
                    title="Roles & Permissions"
                    description="Manage user roles and access levels across your organization."
                />

                <Button
                    variant="primary"
                    onClick={
                        handleAddRole
                    }
                >
                    + Create Role
                </Button>
            </div>

            <div className="roles-permissions-page__content">
                <RoleStats
                    total={stats.total}
                    active={stats.active}
                    permissions={
                        stats.permissions
                    }
                    employees={
                        stats.employees
                    }
                />

                {activeRoles.length >
                    0 && (
                        <RoleFilters
                            search={search}
                            onSearch={(value) =>
                                setSearch(
                                    value?.target
                                        ?.value ??
                                    value ??
                                    "",
                                )
                            }
                            status={status}
                            onStatusChange={
                                setStatus
                            }
                            sortBy={sortBy}
                            onSortChange={
                                setSortBy
                            }
                        />
                    )}

                {activeRoles.length ===
                    0 ? (
                    <div className="roles-permissions-page__empty">
                        <EmptyState
                            title="No roles yet"
                            description="Create your first role to start managing access across your organization."
                            action={
                                <Button
                                    variant="primary"
                                    onClick={
                                        handleAddRole
                                    }
                                >
                                    + Create Role
                                </Button>
                            }
                        />
                    </div>
                ) : filteredRoles.length ===
                    0 ? (
                    <div className="roles-permissions-page__empty">
                        <EmptyState
                            title="No roles found"
                            description="Try changing your search or status filter."
                        />
                    </div>
                ) : (
                    <div className="roles-permissions-page__table">
                        <RoleTable
                            roles={
                                filteredRoles
                            }
                            onView={
                                handleViewRole
                            }
                            onEdit={
                                handleEditRole
                            }
                            onDelete={
                                handleDeleteRole
                            }
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
                    showDetails &&
                    !!selectedRole
                }
                onClose={
                    handleCloseDetails
                }
                size="medium"
            >
                <RoleDetails
                    role={
                        selectedRole
                    }
                    onClose={
                        handleCloseDetails
                    }
                    onEdit={
                        handleEditRole
                    }
                />
            </Modal>

            {/* Create Role Modal */}
            <Modal
                open={
                    showCreateForm
                }
                onClose={() => {
                    if (
                        !createLoading
                    ) {
                        setShowCreateForm(
                            false,
                        );
                    }
                }}
                title="Create New Role"
            >
                <RoleForm
                    onSubmit={
                        handleCreateRole
                    }
                    onCancel={() =>
                        setShowCreateForm(
                            false,
                        )
                    }
                    loading={
                        createLoading
                    }
                />
            </Modal>
        </div>
    );
};

export default RolesPermissions;