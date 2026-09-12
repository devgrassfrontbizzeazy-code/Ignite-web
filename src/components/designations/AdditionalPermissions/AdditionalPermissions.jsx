
import { useMemo, useState } from "react";

import {
  PERMISSION_CATALOGUE,
  PERMISSION_SCOPES,
} from "../../../data/permissionCatalogue";

import {
  getAccessProfilePermissions,
} from "../../../data/accessProfiles";

import "./AdditionalPermissions.css";

const AdditionalPermissions = ({
  profileKey = "employee",
  value = [],
  onChange,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const profilePermissions = useMemo(
    () => getAccessProfilePermissions(profileKey),
    [profileKey],
  );

  const actionColumns = useMemo(() => {
    const actions = [];

    PERMISSION_CATALOGUE.forEach((module) => {
      Object.entries(module.actions).forEach(
        ([actionKey, actionConfig]) => {
          if (
            !actions.some(
              (item) => item.key === actionKey,
            )
          ) {
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

  const isInheritedPermission = (
    moduleKey,
    actionKey,
  ) => {
    return Boolean(
      profilePermissions?.[moduleKey]?.[actionKey]
        ?.enabled,
    );
  };

  const getSelectedPermission = (
    moduleKey,
    actionKey,
  ) => {
    return value.find(
      (permission) =>
        permission.module === moduleKey &&
        permission.action === actionKey,
    );
  };

  const handlePermissionToggle = (
    module,
    actionKey,
  ) => {
    if (disabled) {
      return;
    }

    if (
      isInheritedPermission(
        module.key,
        actionKey,
      )
    ) {
      return;
    }

    const existingPermission =
      getSelectedPermission(
        module.key,
        actionKey,
      );

    if (existingPermission) {
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

    const actionConfig =
      module.actions[actionKey];

    const newPermission = {
      module: module.key,
      moduleName: module.name,
      action: actionKey,
      actionName:
        actionConfig?.label || actionKey,
      scope: actionConfig?.scope
        ? "all"
        : null,
    };

    onChange?.([...value, newPermission]);
  };

  const handleScopeChange = (
    moduleKey,
    actionKey,
    selectedScope,
  ) => {
    if (disabled) {
      return;
    }

    onChange?.(
      value.map((permission) =>
        permission.module === moduleKey &&
        permission.action === actionKey
          ? {
              ...permission,
              scope: selectedScope,
            }
          : permission,
      ),
    );
  };

  const handleRemovePermission = (
    moduleKey,
    actionKey,
  ) => {
    if (disabled) {
      return;
    }

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
    <div className="additional-permissions">
      <button
        type="button"
        className={`additional-permissions__header ${
          isOpen
            ? "additional-permissions__header--open"
            : ""
        }`}
        onClick={() => setIsOpen((current) => !current)}
        disabled={disabled}
      >
        <div className="additional-permissions__header-content">
          <h5>Additional Permissions</h5>

          <p>
            Grant permissions beyond those inherited
            from the selected access profile.
          </p>
        </div>

        <span className="additional-permissions__chevron">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </button>

      {isOpen && (
        <div className="additional-permissions__content">
          <div className="additional-permissions__table-wrapper">
            <table className="additional-permissions__table">
              <thead>
                <tr>
                  <th className="additional-permissions__module-column">
                    Module
                  </th>

                  {actionColumns.map(
                    (action) => (
                      <th
                        key={action.key}
                        className="additional-permissions__action-column"
                      >
                        {action.label}
                      </th>
                    ),
                  )}
                </tr>
              </thead>

              <tbody>
                {PERMISSION_CATALOGUE.map(
                  (module) => (
                    <tr key={module.key}>
                      <td className="additional-permissions__module">
                        {module.name}
                      </td>

                      {actionColumns.map(
                        (action) => {
                          const actionConfig =
                            module.actions[
                              action.key
                            ];

                          if (!actionConfig) {
                            return (
                              <td
                                key={
                                  action.key
                                }
                                className="additional-permissions__cell additional-permissions__cell--not-applicable"
                              >
                                —
                              </td>
                            );
                          }

                          if (
                            isInheritedPermission(
                              module.key,
                              action.key,
                            )
                          ) {
                            return (
                              <td
                                key={
                                  action.key
                                }
                                className="additional-permissions__cell additional-permissions__cell--inherited"
                              >
                                —
                              </td>
                            );
                          }

                          const selectedPermission =
                            getSelectedPermission(
                              module.key,
                              action.key,
                            );

                          return (
                            <td
                              key={action.key}
                              className={`additional-permissions__cell ${
                                selectedPermission
                                  ? "additional-permissions__cell--selected"
                                  : ""
                              }`}
                            >
                              <label className="additional-permissions__checkbox">
                                <input
                                  type="checkbox"
                                  checked={Boolean(
                                    selectedPermission,
                                  )}
                                  onChange={() =>
                                    handlePermissionToggle(
                                      module,
                                      action.key,
                                    )
                                  }
                                  disabled={
                                    disabled
                                  }
                                />

                                <span className="additional-permissions__checkbox-box">
                                  {selectedPermission
                                    ? "✓"
                                    : ""}
                                </span>
                              </label>

                              {selectedPermission &&
                                actionConfig.scope && (
                                  <div className="additional-permissions__scope">
                                    <select
                                      value={
                                        selectedPermission.scope ||
                                        "all"
                                      }
                                      onChange={(
                                        event,
                                      ) =>
                                        handleScopeChange(
                                          module.key,
                                          action.key,
                                          event.target
                                            .value,
                                        )
                                      }
                                      disabled={
                                        disabled
                                      }
                                    >
                                      {PERMISSION_SCOPES.map(
                                        (
                                          scope,
                                        ) => (
                                          <option
                                            key={
                                              scope.value
                                            }
                                            value={
                                              scope.value
                                            }
                                          >
                                            {
                                              scope.label
                                            }
                                          </option>
                                        ),
                                      )}
                                    </select>
                                  </div>
                                )}
                            </td>
                          );
                        },
                      )}
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>

          {value.length > 0 && (
            <div className="additional-permissions__summary">
              <div className="additional-permissions__summary-header">
                <span>
                  Additional permissions
                </span>

                <span>
                  {value.length} selected
                </span>
              </div>

              <div className="additional-permissions__selected">
                {value.map(
                  (permission) => (
                    <div
                      className="additional-permissions__selected-item"
                      key={`${permission.module}-${permission.action}`}
                    >
                      <div className="additional-permissions__selected-content">
                        <span className="additional-permissions__selected-name">
                          {permission.moduleName}
                        </span>

                        <span className="additional-permissions__selected-action">
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
                        className="additional-permissions__remove"
                        onClick={() =>
                          handleRemovePermission(
                            permission.module,
                            permission.action,
                          )
                        }
                        disabled={disabled}
                      >
                        Remove
                      </button>
                    </div>
                  ),
                )}
              </div>
            </div>
          )}

          {value.length === 0 && (
            <div className="additional-permissions__empty">
              <strong>
                No additional permissions selected
              </strong>

              <span>
                Select permissions from the matrix
                above to give this designation
                additional access.
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdditionalPermissions;

