import RoleRowActions from "../RoleRowActions/RoleRowActions";
import { formatDate } from "../../../utils/dateUtils";

import "./RoleTable.css";

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
                        const isActive =
                            role.status === "active";

                        return (
                            <tr key={role.id}>
                                <td>
                                    <div className="role-table__name">
                                        

                                        <span className="role-table__name-text">
                                            {role.roleName || "—"}
                                        </span>
                                    </div>
                                </td>

                                <td>
                                    <span className="role-table__description">
                                        {role.description || "—"}
                                    </span>
                                </td>

                                <td>
                                    {role.employeeCount ?? 0}
                                </td>

                                <td>
                                    <span className="role-table__permission-count">
                                        {role.permissionCount ?? 0}
                                    </span>
                                </td>

                                <td>
                                    <span
                                        className={`role-table__status role-table__status--${isActive
                                                ? "active"
                                                : "inactive"
                                            }`}
                                    >
                                        <span className="role-table__status-dot" />

                                        {isActive
                                            ? "Active"
                                            : "Inactive"}
                                    </span>
                                </td>

                                <td>
                                    {formatDate(role.createdAt)}
                                </td>

                                <td>
                                    <RoleRowActions
                                        role={role}
                                        onView={onView}
                                        onEdit={onEdit}
                                        onDelete={onDelete}
                                        onToggleStatus={
                                            onToggleStatus
                                        }
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