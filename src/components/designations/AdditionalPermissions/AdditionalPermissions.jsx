
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
  const [showAddForm, setShowAddForm] =
    useState(false);

  const [moduleKey, setModuleKey] =
    useState("");

  const [action, setAction] =
    useState("");

  const [scope, setScope] =
    useState("all");

  /*
   * Permissions already granted by the
   * selected Access Profile.
   */
  const profilePermissions = useMemo(
    () =>
      getAccessProfilePermissions(
        profileKey,
      ),
    [profileKey],
  );

  /*
   * Return true if this module/action
   * is already granted by the profile
   * OR already added manually.
   */
  const isPermissionSelected = (
    currentModule,
    currentAction,
  ) => {
    const profileAction =
      profilePermissions?.[
        currentModule
      ]?.[currentAction];

    if (profileAction?.enabled) {
      return true;
    }

    return value.some(
      (permission) =>
        permission.module ===
          currentModule &&
        permission.action ===
          currentAction,
    );
  };

  /*
   * Only show modules/actions that are
   * NOT already provided by the profile
   * and NOT already added manually.
   */
  const availablePermissions =
    useMemo(() => {
      return PERMISSION_CATALOGUE.map(
        (module) => {
          const availableActions =
            Object.entries(
              module.actions,
            ).filter(
              ([currentAction]) =>
                !isPermissionSelected(
                  module.key,
                  currentAction,
                ),
            );

          if (
            availableActions.length === 0
          ) {
            return null;
          }

          return {
            ...module,
            actions: availableActions,
          };
        },
      ).filter(Boolean);
    }, [
      profilePermissions,
      value,
    ]);

  const selectedModule =
    PERMISSION_CATALOGUE.find(
      (module) =>
        module.key === moduleKey,
    );

  const availableActions =
    selectedModule
      ? Object.entries(
          selectedModule.actions,
        ).filter(
          ([currentAction]) =>
            !isPermissionSelected(
              moduleKey,
              currentAction,
            ),
        )
      : [];

  const handleModuleChange = (
    selectedModuleKey,
  ) => {
    setModuleKey(
      selectedModuleKey,
    );
    setAction("");
  };

  const handleAddPermission = () => {
    if (!moduleKey || !action) {
      return;
    }

    const module =
      PERMISSION_CATALOGUE.find(
        (item) =>
          item.key === moduleKey,
      );

    if (!module) {
      return;
    }

    const actionConfig =
      module.actions[action];

    const newPermission = {
      module: moduleKey,
      moduleName: module.name,
      action,
      actionName:
        actionConfig?.label ||
        action,
      scope:
        actionConfig?.scope
          ? scope
          : null,
    };

    onChange?.([
      ...value,
      newPermission,
    ]);

    setModuleKey("");
    setAction("");
    setScope("all");
    setShowAddForm(false);
  };

  const handleRemovePermission = (
    index,
  ) => {
    onChange?.(
      value.filter(
        (_, itemIndex) =>
          itemIndex !== index,
      ),
    );
  };

  const handleCancel = () => {
    setModuleKey("");
    setAction("");
    setScope("all");
    setShowAddForm(false);
  };

  return (
    <div className="additional-permissions">
      <div className="additional-permissions__header">
        <div>
          <h5>
            Additional Permissions
          </h5>

          <p>
            Add permissions that are not already
            included in the selected access profile.
          </p>
        </div>

        {!showAddForm &&
          availablePermissions.length >
            0 && (
            <button
              type="button"
              className="additional-permissions__add-button"
              onClick={() =>
                setShowAddForm(true)
              }
              disabled={disabled}
            >
              + Add Permission
            </button>
          )}
      </div>

      {/* Existing additional permissions */}
      {value.length > 0 && (
        <div className="additional-permissions__selected">
          {value.map(
            (permission, index) => (
              <div
                className="additional-permissions__selected-item"
                key={`${permission.module}-${permission.action}-${index}`}
              >
                <div className="additional-permissions__selected-content">
                  <span className="additional-permissions__check">
                    ✓
                  </span>

                  <div>
                    <span className="additional-permissions__selected-name">
                      {permission.moduleName}
                    </span>

                    <span className="additional-permissions__selected-action">
                      {permission.actionName}

                      {permission.scope &&
                        ` — ${
                          PERMISSION_SCOPES.find(
                            (item) =>
                              item.value ===
                              permission.scope,
                          )?.label ||
                          permission.scope
                        }`}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className="additional-permissions__remove"
                  onClick={() =>
                    handleRemovePermission(
                      index,
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
      )}

      {/* Add permission form */}
      {showAddForm && (
        <div className="additional-permissions__form">
          <div className="additional-permissions__form-header">
            <strong>
              Add Additional Permission
            </strong>

            <button
              type="button"
              onClick={handleCancel}
              className="additional-permissions__close"
            >
              ×
            </button>
          </div>

          <div className="additional-permissions__fields">
            <div className="additional-permissions__field">
              <label htmlFor="additional-permission-module">
                Module
              </label>

              <select
                id="additional-permission-module"
                value={moduleKey}
                onChange={(event) =>
                  handleModuleChange(
                    event.target.value,
                  )
                }
                disabled={disabled}
              >
                <option value="">
                  Select module
                </option>

                {availablePermissions.map(
                  (module) => (
                    <option
                      key={module.key}
                      value={module.key}
                    >
                      {module.name}
                    </option>
                  ),
                )}
              </select>
            </div>

            <div className="additional-permissions__field">
              <label htmlFor="additional-permission-action">
                Permission
              </label>

              <select
                id="additional-permission-action"
                value={action}
                onChange={(event) =>
                  setAction(
                    event.target.value,
                  )
                }
                disabled={
                  disabled ||
                  !moduleKey
                }
              >
                <option value="">
                  Select permission
                </option>

                {availableActions.map(
                  ([
                    actionKey,
                    actionConfig,
                  ]) => (
                    <option
                      key={actionKey}
                      value={actionKey}
                    >
                      {actionConfig.label}
                    </option>
                  ),
                )}
              </select>
            </div>

            {selectedModule
              ?.actions[action]
              ?.scope && (
              <div className="additional-permissions__field">
                <label htmlFor="additional-permission-scope">
                  Scope
                </label>

                <select
                  id="additional-permission-scope"
                  value={scope}
                  onChange={(event) =>
                    setScope(
                      event.target.value,
                    )
                  }
                  disabled={disabled}
                >
                  {PERMISSION_SCOPES.map(
                    (item) => (
                      <option
                        key={item.value}
                        value={item.value}
                      >
                        {item.label}
                      </option>
                    ),
                  )}
                </select>
              </div>
            )}
          </div>

          <div className="additional-permissions__form-footer">
            <button
              type="button"
              className="additional-permissions__cancel"
              onClick={handleCancel}
            >
              Cancel
            </button>

            <button
              type="button"
              className="additional-permissions__confirm"
              onClick={
                handleAddPermission
              }
              disabled={
                disabled ||
                !moduleKey ||
                !action
              }
            >
              Add Permission
            </button>
          </div>
        </div>
      )}

      {/* No permissions available */}
      {!showAddForm &&
        value.length === 0 &&
        availablePermissions.length ===
          0 && (
          <div className="additional-permissions__empty">
            All available permissions are already
            included in this access profile.
          </div>
        )}

      {!showAddForm &&
        value.length === 0 &&
        availablePermissions.length >
          0 && (
          <div className="additional-permissions__empty">
            No additional permissions have been
            added.
          </div>
        )}
    </div>
  );
};

export default AdditionalPermissions;

