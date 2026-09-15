import { useMemo, useState } from "react";
import {
    FiChevronDown,
    FiLock,
    FiShield,
    FiX,
} from "react-icons/fi";

import {
    PERMISSION_CATALOGUE,
    PERMISSION_SCOPES,
} from "../../../../data/permissionCatalogue";

import "./AdditionalPermissions.css";

const AdditionalPermissions = ({
    value = [],
    onChange,
    inheritedPermissions = {},
    disabled = false,
}) => {
    const [isOpen, setIsOpen] = useState(false);

    const actionColumns = useMemo(() => {
        const actions = [];

        PERMISSION_CATALOGUE.forEach((module) => {
            Object.entries(module.actions).forEach(
                ([actionKey, actionConfig]) => {
                    if (!actions.some((item) => item.key === actionKey)) {
                        actions.push({
                            key: actionKey,
                            label: actionConfig.label,
                        });
                    }
                },
            );
        });

        return actions;
    }, []);

    const getSelectedPermission = (moduleKey, actionKey) => {
        return value.find(
            (permission) =>
                permission.module === moduleKey &&
                permission.action === actionKey,
        );
    };

    const isInheritedPermission = (moduleKey, actionKey) => {
        return Boolean(
            inheritedPermissions?.[moduleKey]?.[actionKey]?.enabled,
        );
    };

    const getInheritedScope = (moduleKey, actionKey) => {
        return (
            inheritedPermissions?.[moduleKey]?.[actionKey]?.scope ||
            "all"
        );
    };

    const handlePermissionToggle = (module, actionKey) => {
        if (disabled) return;

        const existing = getSelectedPermission(
            module.key,
            actionKey,
        );

        if (existing) {
            onChange?.(
                value.filter(
                    (permission) =>
                        !(
                            permission.module === module.key &&
                            permission.action === actionKey
                        ),
                ),
            );

            return;
        }

        const actionConfig = module.actions[actionKey];

        const newPermission = {
            module: module.key,
            moduleName: module.name,
            action: actionKey,
            actionName: actionConfig?.label || actionKey,
            scope: actionConfig?.scope ? "all" : null,
        };

        onChange?.([...value, newPermission]);
    };

    const handleScopeChange = (
        moduleKey,
        actionKey,
        scope,
    ) => {
        if (disabled) return;

        onChange?.(
            value.map((permission) =>
                permission.module === moduleKey &&
                    permission.action === actionKey
                    ? {
                        ...permission,
                        scope,
                    }
                    : permission,
            ),
        );
    };

    const handleRemovePermission = (
        moduleKey,
        actionKey,
    ) => {
        if (disabled) return;

        onChange?.(
            value.filter(
                (permission) =>
                    !(
                        permission.module === moduleKey &&
                        permission.action === actionKey
                    ),
            ),
        );
    };

    return (
        <section className="additional-permissions">
            <button
                type="button"
                className={`additional-permissions__header ${isOpen
                    ? "additional-permissions__header--open"
                    : ""
                    }`}
                onClick={() => setIsOpen((current) => !current)}
                disabled={disabled}
            >
                <div className="additional-permissions__heading">
                    <div className="additional-permissions__icon">
                        <FiShield />
                    </div>

                    <div>
                        <h2>Permission Overrides</h2>

                        <p>
                            Give this employee additional permissions beyond
                            their inherited department or designation access.
                        </p>
                    </div>
                </div>

                <div className="additional-permissions__header-right">
                    {value.length > 0 && (
                        <span className="additional-permissions__count">
                            {value.length} selected
                        </span>
                    )}

                    <FiChevronDown
                        className={
                            isOpen
                                ? "additional-permissions__chevron--open"
                                : ""
                        }
                    />
                </div>
            </button>

            {isOpen && (
                <div className="additional-permissions__content">
                    <div className="additional-permissions__hint">
                        <FiLock />

                        <span>
                            Permissions inherited from the employee's
                            department or designation are shown as locked.
                            Select additional permissions to give this
                            employee extra access.
                        </span>
                    </div>

                    <div className="additional-permissions__table-wrapper">
                        <table className="additional-permissions__table">
                            <thead>
                                <tr>
                                    <th className="additional-permissions__module-column">
                                        Module
                                    </th>

                                    {actionColumns.map((action) => (
                                        <th
                                            key={action.key}
                                            className="additional-permissions__action-column"
                                        >
                                            {action.label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>

                            <tbody>
                                {PERMISSION_CATALOGUE.map((module) => (
                                    <tr key={module.key}>
                                        <td className="additional-permissions__module">
                                            <span>{module.name}</span>
                                        </td>

                                        {actionColumns.map((action) => {
                                            const actionConfig =
                                                module.actions[action.key];

                                            if (!actionConfig) {
                                                return (
                                                    <td
                                                        key={action.key}
                                                        className="additional-permissions__cell additional-permissions__cell--na"
                                                    >
                                                        —
                                                    </td>
                                                );
                                            }

                                            const inherited =
                                                isInheritedPermission(
                                                    module.key,
                                                    action.key,
                                                );

                                            const selected =
                                                getSelectedPermission(
                                                    module.key,
                                                    action.key,
                                                );

                                            if (inherited) {
                                                return (
                                                    <td
                                                        key={action.key}
                                                        className="additional-permissions__cell additional-permissions__cell--inherited"
                                                    >
                                                        <div className="additional-permissions__inherited">
                                                            <FiLock size={11} />

                                                            <span>
                                                                {actionConfig.scope
                                                                    ? getInheritedScope(
                                                                        module.key,
                                                                        action.key,
                                                                    )
                                                                    : "Inherited"}
                                                            </span>
                                                        </div>
                                                    </td>
                                                );
                                            }

                                            return (
                                                <td
                                                    key={action.key}
                                                    className={`additional-permissions__cell ${selected
                                                        ? "additional-permissions__cell--selected"
                                                        : ""
                                                        }`}
                                                >
                                                    <label className="additional-permissions__checkbox">
                                                        <input
                                                            type="checkbox"
                                                            checked={Boolean(selected)}
                                                            onChange={() =>
                                                                handlePermissionToggle(
                                                                    module,
                                                                    action.key,
                                                                )
                                                            }
                                                            disabled={disabled}
                                                        />

                                                        <span className="additional-permissions__checkbox-box">
                                                            {selected ? "✓" : ""}
                                                        </span>
                                                    </label>

                                                    {selected &&
                                                        actionConfig.scope && (
                                                            <select
                                                                className="additional-permissions__scope"
                                                                value={
                                                                    selected.scope || "all"
                                                                }
                                                                onChange={(event) =>
                                                                    handleScopeChange(
                                                                        module.key,
                                                                        action.key,
                                                                        event.target.value,
                                                                    )
                                                                }
                                                                disabled={disabled}
                                                            >
                                                                {PERMISSION_SCOPES.map(
                                                                    (scope) => (
                                                                        <option
                                                                            key={scope.value}
                                                                            value={scope.value}
                                                                        >
                                                                            {scope.label}
                                                                        </option>
                                                                    ),
                                                                )}
                                                            </select>
                                                        )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {value.length > 0 ? (
                        <div className="additional-permissions__summary">
                            <div className="additional-permissions__summary-header">
                                <span>Employee-specific permissions</span>

                                <span>{value.length} selected</span>
                            </div>

                            <div className="additional-permissions__selected">
                                {value.map((permission) => (
                                    <div
                                        key={`${permission.module}-${permission.action}`}
                                        className="additional-permissions__selected-item"
                                    >
                                        <div>
                                            <strong>
                                                {permission.moduleName}
                                            </strong>

                                            <span>
                                                {permission.actionName}

                                                {permission.scope && (
                                                    <>
                                                        {" · "}
                                                        {PERMISSION_SCOPES.find(
                                                            (item) =>
                                                                item.value ===
                                                                permission.scope,
                                                        )?.label ||
                                                            permission.scope}
                                                    </>
                                                )}
                                            </span>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleRemovePermission(
                                                    permission.module,
                                                    permission.action,
                                                )
                                            }
                                            disabled={disabled}
                                            aria-label="Remove permission"
                                        >
                                            <FiX size={13} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="additional-permissions__empty">
                            No employee-specific permissions selected.
                        </div>
                    )}
                </div>
            )}
        </section>
    );
};

export default AdditionalPermissions;