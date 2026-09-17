import { useMemo, useState } from "react";
import FormField from "../../common/FormField/FormField";
import Toggle from "../../common/Toggle/Toggle";
import Button from "../../common/Button/Button";
import {
  RBAC_MODULES,
  SCOPE_OPTIONS,
  ALL_ACTIONS,
  buildPermissionKey,
} from "../../../data/rbacCatalogue";
import "./RoleForm.css";

const RoleForm = ({
  initialData = null,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const isEditMode = Boolean(initialData);

  // Parse initial permissions into a map: key -> { module, functionality, action, scope }
  const initialPermissionsMap = useMemo(() => {
    if (!initialData?.permissions) return {};
    const map = {};

    initialData.permissions.forEach((p) => {
      if (typeof p === "string") {
        // e.g. "hrms.employees.view" or "employee.view"
        const parts = p.split(".");
        let mod = "hrms";
        let func = "employees";
        let act = "view";
        if (parts.length === 3) {
          [mod, func, act] = parts;
        } else if (parts.length === 2) {
          func = parts[0];
          act = parts[1];
        }
        const key = buildPermissionKey(mod, func, act);
        map[key] = {
          module: mod,
          functionality: func,
          action: act,
          scope: "Department",
        };
      } else if (p && typeof p === "object") {
        const mod = p.module || "hrms";
        const func = p.functionality || p.resource || "employees";
        const act = p.action || "view";
        const key = buildPermissionKey(mod, func, act);
        map[key] = {
          module: mod,
          functionality: func,
          action: act,
          scope: p.scope || "Department",
        };
      }
    });

    return map;
  }, [initialData]);

  const [roleName, setRoleName] = useState(initialData?.roleName || "");
  const [roleCode, setRoleCode] = useState(initialData?.roleCode || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [status, setStatus] = useState(initialData?.status !== "inactive");
  const [activeModuleKey, setActiveModuleKey] = useState(RBAC_MODULES[0]?.key || "hrms");

  // Selected permissions map: key -> { module, functionality, action, scope }
  const [selectedPermissions, setSelectedPermissions] = useState(initialPermissionsMap);
  const [errors, setErrors] = useState({});

  // Active module object
  const activeModule = useMemo(() => {
    return (
      RBAC_MODULES.find((m) => m.key === activeModuleKey) || RBAC_MODULES[0]
    );
  }, [activeModuleKey]);

  // Actions applicable to the active module
  const activeModuleActions = useMemo(() => {
    const actionSet = new Set();
    activeModule.functionalities.forEach((func) => {
      Object.keys(func.actions || {}).forEach((actKey) => actionSet.add(actKey));
    });
    return ALL_ACTIONS.filter((act) => actionSet.has(act.key));
  }, [activeModule]);

  // Count of selected permissions per module
  const moduleCounts = useMemo(() => {
    const counts = {};
    RBAC_MODULES.forEach((mod) => {
      counts[mod.key] = 0;
    });

    Object.values(selectedPermissions).forEach((p) => {
      if (counts[p.module] !== undefined) {
        counts[p.module]++;
      }
    });

    return counts;
  }, [selectedPermissions]);

  const totalSelectedCount = Object.keys(selectedPermissions).length;

  // Handle Role Name Change
  const handleRoleNameChange = (e) => {
    const val = e.target.value;
    setRoleName(val);

    // Auto-generate role code if creating new role and code hasn't been manually diverged
    if (!isEditMode && (!roleCode || roleCode === roleName.toUpperCase().replace(/[^A-Z0-9]/g, "_"))) {
      setRoleCode(val.toUpperCase().replace(/\s+/g, "_").replace(/[^A-Z0-9_]/g, ""));
    }

    if (errors.roleName) {
      setErrors((prev) => ({ ...prev, roleName: "" }));
    }
  };

  const handleRoleCodeChange = (e) => {
    const val = e.target.value.toUpperCase().replace(/\s+/g, "_").replace(/[^A-Z0-9_]/g, "");
    setRoleCode(val);
    if (errors.roleCode) {
      setErrors((prev) => ({ ...prev, roleCode: "" }));
    }
  };

  // Toggle single action permission
  const handleToggleAction = (moduleKey, func, actKey, actionConfig) => {
    const permKey = buildPermissionKey(moduleKey, func.key, actKey);

    setSelectedPermissions((prev) => {
      const next = { ...prev };
      if (next[permKey]) {
        delete next[permKey];
      } else {
        next[permKey] = {
          module: moduleKey,
          functionality: func.key,
          action: actKey,
          ...(actionConfig.supportsScope
            ? { scope: actionConfig.defaultScope || "Department" }
            : {}),
        };
      }
      return next;
    });

    if (errors.permissions) {
      setErrors((prev) => ({ ...prev, permissions: "" }));
    }
  };

  // Update scope for an already checked action
  const handleScopeChange = (moduleKey, funcKey, actKey, newScope) => {
    const permKey = buildPermissionKey(moduleKey, funcKey, actKey);

    setSelectedPermissions((prev) => {
      if (!prev[permKey]) return prev;
      return {
        ...prev,
        [permKey]: {
          ...prev[permKey],
          scope: newScope,
        },
      };
    });
  };

  // Toggle all actions for a functionality
  const handleToggleFunctionality = (moduleKey, func) => {
    const funcPermKeys = Object.keys(func.actions || {}).map((actKey) =>
      buildPermissionKey(moduleKey, func.key, actKey)
    );

    const allSelected = funcPermKeys.every((key) => Boolean(selectedPermissions[key]));

    setSelectedPermissions((prev) => {
      const next = { ...prev };
      if (allSelected) {
        funcPermKeys.forEach((key) => delete next[key]);
      } else {
        Object.entries(func.actions || {}).forEach(([actKey, actionConfig]) => {
          const key = buildPermissionKey(moduleKey, func.key, actKey);
          next[key] = {
            module: moduleKey,
            functionality: func.key,
            action: actKey,
            ...(actionConfig.supportsScope
              ? { scope: actionConfig.defaultScope || "Department" }
              : {}),
          };
        });
      }
      return next;
    });

    if (errors.permissions) {
      setErrors((prev) => ({ ...prev, permissions: "" }));
    }
  };

  // Toggle all permissions in the current module
  const handleToggleCurrentModule = () => {
    const modulePerms = [];
    activeModule.functionalities.forEach((func) => {
      Object.entries(func.actions || {}).forEach(([actKey, actionConfig]) => {
        modulePerms.push({
          key: buildPermissionKey(activeModule.key, func.key, actKey),
          module: activeModule.key,
          functionality: func.key,
          action: actKey,
          actionConfig,
        });
      });
    });

    const allSelected = modulePerms.every((p) => Boolean(selectedPermissions[p.key]));

    setSelectedPermissions((prev) => {
      const next = { ...prev };
      if (allSelected) {
        modulePerms.forEach((p) => delete next[p.key]);
      } else {
        modulePerms.forEach((p) => {
          next[p.key] = {
            module: p.module,
            functionality: p.functionality,
            action: p.action,
            ...(p.actionConfig.supportsScope
              ? { scope: p.actionConfig.defaultScope || "Department" }
              : {}),
          };
        });
      }
      return next;
    });

    if (errors.permissions) {
      setErrors((prev) => ({ ...prev, permissions: "" }));
    }
  };

  // Toggle all permissions across all modules
  const handleToggleAllPermissions = () => {
    const allPerms = [];
    RBAC_MODULES.forEach((mod) => {
      mod.functionalities.forEach((func) => {
        Object.entries(func.actions || {}).forEach(([actKey, actionConfig]) => {
          allPerms.push({
            key: buildPermissionKey(mod.key, func.key, actKey),
            module: mod.key,
            functionality: func.key,
            action: actKey,
            actionConfig,
          });
        });
      });
    });

    const isAllSelected = allPerms.every((p) => Boolean(selectedPermissions[p.key]));

    if (isAllSelected) {
      setSelectedPermissions({});
    } else {
      const next = {};
      allPerms.forEach((p) => {
        next[p.key] = {
          module: p.module,
          functionality: p.functionality,
          action: p.action,
          ...(p.actionConfig.supportsScope
            ? { scope: p.actionConfig.defaultScope || "Department" }
            : {}),
        };
      });
      setSelectedPermissions(next);
    }

    if (errors.permissions) {
      setErrors((prev) => ({ ...prev, permissions: "" }));
    }
  };

  // Validation
  const validate = () => {
    const newErrors = {};

    if (!roleName.trim()) {
      newErrors.roleName = "Role name is required.";
    }

    if (!roleCode.trim()) {
      newErrors.roleCode = "Role code is required.";
    } else if (!/^[A-Z0-9_]+$/.test(roleCode)) {
      newErrors.roleCode = "Use only uppercase letters, numbers and underscores.";
    }

    if (totalSelectedCount === 0) {
      newErrors.permissions = "Select at least one permission across the modules.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const permissionsList = Object.values(selectedPermissions);

    onSubmit({
      roleName: roleName.trim(),
      roleCode: roleCode.trim().toUpperCase(),
      description: description.trim(),
      status: status ? "active" : "inactive",
      permissions: permissionsList,
      permissionCount: permissionsList.length,
    });
  };

  return (
    <form className="role-form" onSubmit={handleSubmit} noValidate>
      {/* SECTION 1: ROLE INFORMATION */}
      <div className="role-form-section">
        <div className="role-form-section-header">
          <div>
            <h3>Role Information</h3>
            <p>Define the identity and assignment rules for this reusable role.</p>
          </div>
        </div>

        <div className="role-form-grid">
          <FormField label="Role Name" htmlFor="roleName" required error={errors.roleName}>
            <input
              id="roleName"
              name="roleName"
              type="text"
              value={roleName}
              onChange={handleRoleNameChange}
              placeholder="e.g. Sales Manager"
              className="role-form__input"
            />
          </FormField>

          <FormField
            label="Role Code"
            htmlFor="roleCode"
            required
            error={errors.roleCode}
            hint="Uppercase identifier used for internal system checks."
          >
            <input
              id="roleCode"
              name="roleCode"
              type="text"
              value={roleCode}
              onChange={handleRoleCodeChange}
              placeholder="e.g. SALES_MANAGER"
              className="role-form__input"
            />
          </FormField>

          <div className="role-form-field-full">
            <FormField label="Description" htmlFor="description">
              <textarea
                id="description"
                name="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the responsibilities and scope granted by this role..."
                rows={3}
                className="role-form__textarea"
              />
            </FormField>
          </div>

          <div className="role-form-status">
            <Toggle
              checked={status}
              onChange={setStatus}
              label="Active Role"
            />
            <span className="role-form-status-help">
              Inactive roles cannot be assigned to designations or employees.
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 2: MODULE-BASED PERMISSION MATRIX */}
      <div className="role-form-section">
        <div className="role-form-permissions-header">
          <div>
            <h3>Permission Matrix</h3>
            <p>
              Configure permissions by application module. A role can include access across multiple modules.
            </p>
          </div>

          <button
            type="button"
            className="role-form-select-all"
            onClick={handleToggleAllPermissions}
          >
            {totalSelectedCount > 0 ? "Clear All Permissions" : "Select All Permissions"}
          </button>
        </div>

        {errors.permissions && (
          <div className="role-form-permission-error" role="alert">
            {errors.permissions}
          </div>
        )}

        {/* Module Navigation Tabs */}
        <div className="rbac-module-tabs">
          {RBAC_MODULES.map((mod) => {
            const isCurrent = mod.key === activeModuleKey;
            const count = moduleCounts[mod.key] || 0;

            return (
              <button
                key={mod.key}
                type="button"
                className={`rbac-module-tab ${isCurrent ? "is-active" : ""}`}
                onClick={() => setActiveModuleKey(mod.key)}
              >
                <span className="rbac-module-tab__name">{mod.name}</span>
                {count > 0 && (
                  <span className="rbac-module-tab__badge">{count}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Active Module Matrix Card */}
        <div className="rbac-matrix-card">
          <div className="rbac-matrix-card__header">
            <div>
              <h4>{activeModule.name} Module Permissions</h4>
              <p>{activeModule.description}</p>
            </div>

            <button
              type="button"
              className="role-permission-module-select"
              onClick={handleToggleCurrentModule}
            >
              Toggle All in {activeModule.name}
            </button>
          </div>

          {/* Matrix Table */}
          <div className="rbac-matrix-table-wrapper">
            <table className="rbac-matrix-table">
              <thead>
                <tr>
                  <th className="rbac-matrix-th__functionality">Functionality</th>
                  {activeModuleActions.map((act) => (
                    <th key={act.key} className="rbac-matrix-th__action">
                      {act.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activeModule.functionalities.map((func) => {
                  const funcPermKeys = Object.keys(func.actions || {}).map((actKey) =>
                    buildPermissionKey(activeModule.key, func.key, actKey)
                  );
                  const isFuncAllSelected =
                    funcPermKeys.length > 0 &&
                    funcPermKeys.every((key) => Boolean(selectedPermissions[key]));

                  return (
                    <tr key={func.key}>
                      {/* Functionality Name & Quick Select */}
                      <td className="rbac-matrix-td__functionality">
                        <div className="rbac-matrix-func-cell">
                          <button
                            type="button"
                            className={`rbac-matrix-func-btn ${
                              isFuncAllSelected ? "is-all-selected" : ""
                            }`}
                            onClick={() =>
                              handleToggleFunctionality(activeModule.key, func)
                            }
                            title="Toggle all actions for this functionality"
                          >
                            <span className="rbac-matrix-func-title">{func.name}</span>
                            <span className="rbac-matrix-func-desc">{func.description}</span>
                          </button>
                        </div>
                      </td>

                      {/* Action Cells */}
                      {activeModuleActions.map((act) => {
                        const actionConfig = func.actions?.[act.key];
                        if (!actionConfig) {
                          return (
                            <td key={act.key} className="rbac-matrix-td__empty">
                              <span className="rbac-matrix-dash">—</span>
                            </td>
                          );
                        }

                        const permKey = buildPermissionKey(
                          activeModule.key,
                          func.key,
                          act.key
                        );
                        const isChecked = Boolean(selectedPermissions[permKey]);
                        const currentScope =
                          selectedPermissions[permKey]?.scope ||
                          actionConfig.defaultScope ||
                          "Department";

                        return (
                          <td
                            key={act.key}
                            className={`rbac-matrix-td__action ${
                              isChecked ? "is-checked" : ""
                            }`}
                          >
                            <div className="rbac-action-cell">
                              <label className="rbac-action-checkbox-label">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() =>
                                    handleToggleAction(
                                      activeModule.key,
                                      func,
                                      act.key,
                                      actionConfig
                                    )
                                  }
                                />
                                <span className="rbac-action-name">{act.label}</span>
                              </label>

                              {/* Scope dropdown appears ONLY if checked AND supportsScope */}
                              {isChecked && actionConfig.supportsScope && (
                                <div className="rbac-scope-selector">
                                  <select
                                    value={currentScope}
                                    onChange={(e) =>
                                      handleScopeChange(
                                        activeModule.key,
                                        func.key,
                                        act.key,
                                        e.target.value
                                      )
                                    }
                                    className="rbac-scope-select"
                                    title="Select scope for this action"
                                  >
                                    {SCOPE_OPTIONS.map((opt) => (
                                      <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Global summary badge */}
        <div className="role-form-permission-summary">
          <strong>{totalSelectedCount}</strong>
          <span>
            total permission{totalSelectedCount === 1 ? "" : "s"} selected across all modules
          </span>
        </div>
      </div>

      {/* FOOTER ACTIONS */}
      <div className="role-form-footer">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>

        <Button type="submit" variant="primary" disabled={loading}>
          {loading
            ? isEditMode
              ? "Saving..."
              : "Creating..."
            : isEditMode
            ? "Save Role Changes"
            : "Save Role"}
        </Button>
      </div>
    </form>
  );
};

export default RoleForm;