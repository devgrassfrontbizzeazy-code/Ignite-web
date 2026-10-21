import RoleRowActions from "../RoleRowActions/RoleRowActions";
import { formatDate } from "../../../utils/dateUtils";
import { RBAC_MODULES } from "../../../data/rbacCatalogue";
import "./RoleTable.css";

const getRoleModules = (role) => {
  if (!role.permissions || !Array.isArray(role.permissions)) return [];
  const moduleKeys = new Set();

  role.permissions.forEach((p) => {
    if (typeof p === "string") {
      if (p.endsWith("_payroll") || p.startsWith("payroll.")) {
        moduleKeys.add("account");
      } else {
        const parts = p.split(".");
        if (parts.length >= 2) {
          const mod = parts[0] === "payroll" ? "account" : parts[0].toLowerCase();
          moduleKeys.add(mod === "accounts" ? "account" : mod);
        }
      }
    } else if (p && typeof p === "object") {
      if (p.module) {
        const mod = p.module.toLowerCase() === "accounts" ? "account" : p.module.toLowerCase();
        moduleKeys.add(mod);
      } else if (p.functionality === "payroll") {
        moduleKeys.add("account");
      }
    }
  });

  return RBAC_MODULES.filter(
    (m) =>
      moduleKeys.has(m.key) ||
      (m.aliases && m.aliases.some((a) => moduleKeys.has(a)))
  );
};

const RoleTable = ({
  roles = [],
  onView,
  onEdit,
  onDelete,
  onToggleStatus,
}) => {
  if (!roles.length) {
    return null;
  }

  return (
    <div className="role-table-wrapper">
      <table className="role-table">
        <thead>
          <tr>
            <th>Role</th>
            <th>Modules</th>
            <th>Description</th>
            <th>Employees</th>
            <th>Permissions</th>
            <th>Status</th>
            <th>Created At</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {roles.map((role) => {
            const isActive = role.status === "active";
            const modules = getRoleModules(role);

            return (
              <tr key={role.id}>
                <td>
                  <div className="role-table__name">
                    <span className="role-table__name-text">
                      {role.roleName || "—"}
                    </span>
                    {role.roleCode && (
                      <span className="role-table__code-text">
                        {role.roleCode}
                      </span>
                    )}
                  </div>
                </td>

                <td>
                  <div className="role-table__modules">
                    {modules.length > 0 ? (
                      modules.map((m) => (
                        <span key={m.key} className="role-table__module-badge">
                          {m.name}
                        </span>
                      ))
                    ) : (
                      <span className="role-table__module-empty">—</span>
                    )}
                  </div>
                </td>

                <td>
                  <span className="role-table__description">
                    {role.description || "—"}
                  </span>
                </td>

                <td>{role.employeeCount ?? 0}</td>

                <td>
                  <span className="role-table__permission-count">
                    {role.permissionCount ?? role.permissions?.length ?? 0}
                  </span>
                </td>

                <td>
                  <span
                    className={`role-table__status role-table__status--${
                      isActive ? "active" : "inactive"
                    }`}
                  >
                    <span className="role-table__status-dot" />
                    {isActive ? "Active" : "Inactive"}
                  </span>
                </td>

                <td>{formatDate(role.createdAt)}</td>

                <td>
                  <RoleRowActions
                    role={role}
                    onView={onView}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onToggleStatus={onToggleStatus}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default RoleTable;