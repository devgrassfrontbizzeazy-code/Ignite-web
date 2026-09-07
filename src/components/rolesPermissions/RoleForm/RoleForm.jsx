import { useMemo, useState } from "react";

import FormField from "../../common/FormField/FormField";
import Toggle from "../../common/Toggle/Toggle";
import Button from "../../common/Button/Button";

import "./RoleForm.css";

const PERMISSION_MODULES = [
    {
        key: "employee",
        label: "Employees",
        permissions: [
            {
                code: "employee.view",
                label: "View",
            },
            {
                code: "employee.create",
                label: "Create",
            },
            {
                code: "employee.update",
                label: "Update",
            },
            {
                code: "employee.delete",
                label: "Delete",
            },
            {
                code: "employee.export",
                label: "Export",
            },
        ],
    },

    {
        key: "department",
        label: "Departments",
        permissions: [
            {
                code: "department.view",
                label: "View",
            },
            {
                code: "department.create",
                label: "Create",
            },
            {
                code: "department.update",
                label: "Update",
            },
            {
                code: "department.delete",
                label: "Delete",
            },
        ],
    },

    {
        key: "designation",
        label: "Designations",
        permissions: [
            {
                code: "designation.view",
                label: "View",
            },
            {
                code: "designation.create",
                label: "Create",
            },
            {
                code: "designation.update",
                label: "Update",
            },
            {
                code: "designation.delete",
                label: "Delete",
            },
        ],
    },

    {
        key: "attendance",
        label: "Attendance",
        permissions: [
            {
                code: "attendance.view",
                label: "View",
            },
            {
                code: "attendance.create",
                label: "Create",
            },
            {
                code: "attendance.update",
                label: "Update",
            },
            {
                code: "attendance.delete",
                label: "Delete",
            },
            {
                code: "attendance.export",
                label: "Export",
            },
        ],
    },

    {
        key: "leave",
        label: "Leave Management",
        permissions: [
            {
                code: "leave.view",
                label: "View",
            },
            {
                code: "leave.create",
                label: "Create",
            },
            {
                code: "leave.update",
                label: "Update",
            },
            {
                code: "leave.delete",
                label: "Delete",
            },
            {
                code: "leave.approve",
                label: "Approve",
            },
        ],
    },

    {
        key: "payroll",
        label: "Payroll",
        permissions: [
            {
                code: "payroll.view",
                label: "View",
            },
            {
                code: "payroll.create",
                label: "Create",
            },
            {
                code: "payroll.update",
                label: "Update",
            },
            {
                code: "payroll.delete",
                label: "Delete",
            },
            {
                code: "payroll.export",
                label: "Export",
            },
        ],
    },

    {
        key: "recruitment",
        label: "Recruitment",
        permissions: [
            {
                code: "recruitment.view",
                label: "View",
            },
            {
                code: "recruitment.create",
                label: "Create",
            },
            {
                code: "recruitment.update",
                label: "Update",
            },
            {
                code: "recruitment.delete",
                label: "Delete",
            },
        ],
    },

    {
        key: "performance",
        label: "Performance",
        permissions: [
            {
                code: "performance.view",
                label: "View",
            },
            {
                code: "performance.create",
                label: "Create",
            },
            {
                code: "performance.update",
                label: "Update",
            },
            {
                code: "performance.delete",
                label: "Delete",
            },
        ],
    },
];

const RoleForm = ({
    onSubmit,
    onCancel,
    loading = false,
}) => {
    const [roleName, setRoleName] =
        useState("");

    const [roleCode, setRoleCode] =
        useState("");

    const [description, setDescription] =
        useState("");

    const [status, setStatus] =
        useState(true);

    const [permissions, setPermissions] =
        useState([]);

    const [errors, setErrors] =
        useState({});

    const allPermissionCodes = useMemo(
        () =>
            PERMISSION_MODULES.flatMap(
                (module) =>
                    module.permissions.map(
                        (permission) =>
                            permission.code,
                    ),
            ),
        [],
    );

    const handleRoleNameChange = (
        event,
    ) => {
        const value =
            event?.target?.value ??
            event ??
            "";

        setRoleName(value);

        if (errors.roleName) {
            setErrors((previous) => ({
                ...previous,
                roleName: "",
            }));
        }
    };

    const handleRoleCodeChange = (
        event,
    ) => {
        const value =
            event?.target?.value ??
            event ??
            "";

        const formattedValue = value
            .toUpperCase()
            .replace(/\s+/g, "_")
            .replace(
                /[^A-Z0-9_]/g,
                "",
            );

        setRoleCode(formattedValue);

        if (errors.roleCode) {
            setErrors((previous) => ({
                ...previous,
                roleCode: "",
            }));
        }
    };

    const handleDescriptionChange = (
        event,
    ) => {
        const value =
            event?.target?.value ??
            event ??
            "";

        setDescription(value);
    };

    const togglePermission = (
        permissionCode,
    ) => {
        setPermissions((previous) => {
            if (
                previous.includes(
                    permissionCode,
                )
            ) {
                return previous.filter(
                    (code) =>
                        code !==
                        permissionCode,
                );
            }

            return [
                ...previous,
                permissionCode,
            ];
        });

        if (errors.permissions) {
            setErrors((previous) => ({
                ...previous,
                permissions: "",
            }));
        }
    };

    const toggleModulePermissions = (
        module,
    ) => {
        const moduleCodes =
            module.permissions.map(
                (permission) =>
                    permission.code,
            );

        const allSelected =
            moduleCodes.every(
                (code) =>
                    permissions.includes(
                        code,
                    ),
            );

        if (allSelected) {
            setPermissions(
                (previous) =>
                    previous.filter(
                        (code) =>
                            !moduleCodes.includes(
                                code,
                            ),
                    ),
            );
        } else {
            setPermissions(
                (previous) => [
                    ...new Set([
                        ...previous,
                        ...moduleCodes,
                    ]),
                ],
            );
        }

        if (errors.permissions) {
            setErrors((previous) => ({
                ...previous,
                permissions: "",
            }));
        }
    };

    const toggleAllPermissions = () => {
        const allSelected =
            allPermissionCodes.every(
                (code) =>
                    permissions.includes(
                        code,
                    ),
            );

        if (allSelected) {
            setPermissions([]);
        } else {
            setPermissions([
                ...allPermissionCodes,
            ]);
        }

        if (errors.permissions) {
            setErrors((previous) => ({
                ...previous,
                permissions: "",
            }));
        }
    };

    const validate = () => {
        const newErrors = {};

        if (!roleName.trim()) {
            newErrors.roleName =
                "Role name is required.";
        }

        if (!roleCode.trim()) {
            newErrors.roleCode =
                "Role code is required.";
        } else if (
            !/^[A-Z0-9_]+$/.test(
                roleCode,
            )
        ) {
            newErrors.roleCode =
                "Use only letters, numbers and underscores.";
        }

        if (!permissions.length) {
            newErrors.permissions =
                "Select at least one permission.";
        }

        setErrors(newErrors);

        return (
            Object.keys(newErrors)
                .length === 0
        );
    };

    const handleSubmit = (event) => {
        event.preventDefault();

        if (!validate()) {
            return;
        }

        const roleData = {
            roleName: roleName.trim(),
            roleCode: roleCode.trim(),
            description:
                description.trim(),
            status: status
                ? "active"
                : "inactive",
            permissions: [
                ...permissions,
            ],
        };

        onSubmit(roleData);
    };

    const allPermissionsSelected =
        allPermissionCodes.length > 0 &&
        allPermissionCodes.every(
            (code) =>
                permissions.includes(
                    code,
                ),
        );

    return (
        <form
            className="role-form"
            onSubmit={handleSubmit}
            noValidate
        >
            {/* Role Information */}
            <div className="role-form-section">
                <div className="role-form-section-header">
                    <div>
                        <h3>
                            Role Information
                        </h3>

                        <p>
                            Define the basic
                            information for
                            this role.
                        </p>
                    </div>
                </div>

                <div className="role-form-grid">
                    <div className="role-form-field">
                        <FormField
                            label="Role Name"
                            name="roleName"
                            value={
                                roleName
                            }
                            onChange={
                                handleRoleNameChange
                            }
                            placeholder="e.g. HR Manager"
                            required
                        />

                        {errors.roleName && (
                            <span className="role-form-error">
                                {
                                    errors.roleName
                                }
                            </span>
                        )}
                    </div>

                    <div className="role-form-field">
                        <FormField
                            label="Role Code"
                            name="roleCode"
                            value={
                                roleCode
                            }
                            onChange={
                                handleRoleCodeChange
                            }
                            placeholder="e.g. HR_MANAGER"
                            required
                        />

                        {errors.roleCode && (
                            <span className="role-form-error">
                                {
                                    errors.roleCode
                                }
                            </span>
                        )}
                    </div>

                    <div className="role-form-field-full">
                        <FormField
                            label="Description"
                            name="description"
                            value={
                                description
                            }
                            onChange={
                                handleDescriptionChange
                            }
                            placeholder="Describe what this role is responsible for..."
                            textarea
                            rows={4}
                        />
                    </div>

                    <div className="role-form-status">
                        <Toggle
                            checked={
                                status
                            }
                            onChange={
                                setStatus
                            }
                            label="Active Role"
                        />

                        <span className="role-form-status-help">
                            Inactive roles
                            cannot be
                            assigned to
                            employees.
                        </span>
                    </div>
                </div>
            </div>

            {/* Permissions */}
            <div className="role-form-section">
                <div className="role-form-permissions-header">
                    <div>
                        <h3>
                            Permissions
                        </h3>

                        <p>
                            Select the
                            permissions
                            this role
                            should have.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="role-form-select-all"
                        onClick={
                            toggleAllPermissions
                        }
                    >
                        {allPermissionsSelected
                            ? "Clear All"
                            : "Select All Permissions"}
                    </button>
                </div>

                {errors.permissions && (
                    <div className="role-form-permission-error">
                        {
                            errors.permissions
                        }
                    </div>
                )}

                <div className="role-permissions-list">
                    {PERMISSION_MODULES.map(
                        (
                            module,
                        ) => {
                            const moduleCodes =
                                module.permissions.map(
                                    (
                                        permission,
                                    ) =>
                                        permission.code,
                                );

                            const selectedCount =
                                moduleCodes.filter(
                                    (
                                        code,
                                    ) =>
                                        permissions.includes(
                                            code,
                                        ),
                                ).length;

                            const moduleSelected =
                                selectedCount ===
                                moduleCodes.length;

                            return (
                                <div
                                    className="role-permission-module"
                                    key={
                                        module.key
                                    }
                                >
                                    <div className="role-permission-module-header">
                                        <div className="role-permission-module-title">
                                            <div className="role-permission-module-checkbox">
                                                <input
                                                    type="checkbox"
                                                    checked={
                                                        moduleSelected
                                                    }
                                                    onChange={() =>
                                                        toggleModulePermissions(
                                                            module,
                                                        )
                                                    }
                                                />
                                            </div>

                                            <div>
                                                <h4>
                                                    {
                                                        module.label
                                                    }
                                                </h4>

                                                <span>
                                                    {
                                                        selectedCount
                                                    }{" "}
                                                    of{" "}
                                                    {
                                                        moduleCodes.length
                                                    }{" "}
                                                    selected
                                                </span>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            className="role-permission-module-select"
                                            onClick={() =>
                                                toggleModulePermissions(
                                                    module,
                                                )
                                            }
                                        >
                                            {moduleSelected
                                                ? "Clear"
                                                : "Select All"}
                                        </button>
                                    </div>

                                    <div className="role-permission-options">
                                        {module.permissions.map(
                                            (
                                                permission,
                                            ) => {
                                                const selected =
                                                    permissions.includes(
                                                        permission.code,
                                                    );

                                                return (
                                                    <label
                                                        className={`role-permission-option ${selected
                                                                ? "is-selected"
                                                                : ""
                                                            }`}
                                                        key={
                                                            permission.code
                                                        }
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={
                                                                selected
                                                            }
                                                            onChange={() =>
                                                                togglePermission(
                                                                    permission.code,
                                                                )
                                                            }
                                                        />

                                                        <span>
                                                            {
                                                                permission.label
                                                            }
                                                        </span>
                                                    </label>
                                                );
                                            },
                                        )}
                                    </div>
                                </div>
                            );
                        },
                    )}
                </div>

                <div className="role-form-permission-summary">
                    <strong>
                        {
                            permissions.length
                        }
                    </strong>

                    <span>
                        permission
                        {permissions.length ===
                            1
                            ? ""
                            : "s"}{" "}
                        selected
                    </span>
                </div>
            </div>

            {/* Footer */}
            <div className="role-form-footer">
                <Button
                    type="button"
                    variant="secondary"
                    onClick={
                        onCancel
                    }
                    disabled={
                        loading
                    }
                >
                    Cancel
                </Button>

                <Button
                    type="submit"
                    variant="primary"
                    disabled={
                        loading
                    }
                >
                    {loading
                        ? "Creating..."
                        : "Create Role"}
                </Button>
            </div>
        </form>
    );
};

export default RoleForm;