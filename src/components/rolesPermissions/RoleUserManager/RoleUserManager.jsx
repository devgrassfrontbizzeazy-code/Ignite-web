import { useMemo, useState } from "react";

import Button from "../../common/Button/Button";
import ConfirmModal from "../../common/ConfirmModal/ConfirmModal";
import employeeService from "../../../services/employeeService";

import "./RoleUserManager.css";

const RoleUserManager = ({
    role,
    onAssignUser,
    onRemoveUser,
}) => {
    const [showAssign, setShowAssign] = useState(false);
    const [search, setSearch] = useState("");
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [removingUserId, setRemovingUserId] = useState(null);
    const [employees, setEmployees] = useState([]);
    const [employeesLoading, setEmployeesLoading] = useState(false);
    const [employeesError, setEmployeesError] = useState("");

    if (!role) {
        return null;
    }

    const assignedUsers = role.assignedUsers || [];

    /*
     * Employees who are already assigned to this role
     * should not appear as selectable users.
     */
    const availableUsers = useMemo(() => {
        const assignedIds = new Set(
            assignedUsers.map((user) => user.id),
        );

        return employees.filter(
            (user) => !assignedIds.has(user.id),
        );
    }, [assignedUsers, employees]);

    /*
     * Search available employees.
     */
    const filteredUsers = useMemo(() => {
        const searchValue = search.trim().toLowerCase();

        if (!searchValue) {
            return availableUsers;
        }

        return availableUsers.filter(
            (user) =>
                user.name
                    ?.toLowerCase()
                    .includes(searchValue) ||
                [user.first_name, user.middle_name, user.last_name]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase()
                    .includes(searchValue) ||
                user.email
                    ?.toLowerCase()
                    .includes(searchValue) ||
                user.employee_code
                    ?.toLowerCase()
                    .includes(searchValue) ||
                user.department_name
                    ?.toLowerCase()
                    .includes(searchValue) ||
                user.designation_name
                    ?.toLowerCase()
                    .includes(searchValue),
        );
    }, [availableUsers, search]);

    /*
     * Open assign employee section.
     */
    const handleOpenAssign = async () => {
        setSearch("");
        setSelectedUserId(null);
        setShowAssign(true);
        setEmployeesLoading(true);
        setEmployeesError("");

        try {
            const data = await employeeService.getAll();
            setEmployees(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Failed to load employees:", error);
            setEmployees([]);
            setEmployeesError("Failed to load employees from the server.");
        } finally {
            setEmployeesLoading(false);
        }
    };

    /*
     * Close assign employee section.
     */
    const handleCloseAssign = () => {
        setSearch("");
        setSelectedUserId(null);
        setShowAssign(false);
    };

    /*
     * Assign selected employee to role.
     */
    const handleAssign = () => {
        if (!selectedUserId) {
            return;
        }

        const selectedUser = employees.find(
            (user) => user.id === selectedUserId,
        );

        if (!selectedUser) {
            return;
        }

        onAssignUser?.(selectedUser);

        handleCloseAssign();
    };

    const [removeModal, setRemoveModal] = useState({ open: false, user: null });

    /*
     * Remove employee from role.
     */
    const handleRemoveClick = (user) => {
        setRemoveModal({ open: true, user });
    };

    const handleConfirmRemove = () => {
        const user = removeModal.user;
        if (!user) return;

        setRemovingUserId(user.id);
        onRemoveUser?.(user.id);
        setRemoveModal({ open: false, user: null });

        setTimeout(() => {
            setRemovingUserId(null);
        }, 300);
    };

    return (
        <div className="role-user-manager">
            <div className="role-user-manager__header">
                <div>
                    <h3>Assigned Employees</h3>

                    <p>
                        Employees currently assigned to this
                        role.
                    </p>
                </div>

                {!showAssign && (
                    <Button
                        type="button"
                        variant="primary"
                        onClick={handleOpenAssign}
                    >
                        + Assign Employee
                    </Button>
                )}
            </div>

            {/* Assign Employee */}
            {showAssign && (
                <div className="role-user-manager__assign">
                    <div className="role-user-manager__assign-header">
                        <div>
                            <h4>Assign Employee</h4>

                            <p>
                                Select an employee to assign
                                the <strong>{role.roleName}</strong>{" "}
                                role.
                            </p>
                        </div>

                        <button
                            type="button"
                            className="role-user-manager__close"
                            onClick={handleCloseAssign}
                            aria-label="Close employee selection"
                        >
                            ×
                        </button>
                    </div>

                    <div className="role-user-manager__search">
                        <input
                            type="text"
                            value={search}
                            onChange={(event) =>
                                setSearch(event.target.value)
                            }
                            placeholder="Search employee by name, code, email..."
                        />
                    </div>

                    <div className="role-user-manager__available">
                        {employeesLoading ? (
                            <div className="role-user-manager__empty">
                                <strong>Loading employees...</strong>
                            </div>
                        ) : employeesError ? (
                            <div className="role-user-manager__empty">
                                <strong>{employeesError}</strong>
                            </div>
                        ) : filteredUsers.length > 0 ? (
                            filteredUsers.map((user) => {
                                const isSelected =
                                    selectedUserId === user.id;
                                const userName =
                                    [user.first_name, user.middle_name, user.last_name]
                                        .filter(Boolean)
                                        .join(" ") ||
                                    user.full_name ||
                                    user.name ||
                                    "Employee";

                                return (
                                    <button
                                        key={user.id}
                                        type="button"
                                        className={`role-user-manager__user-option ${isSelected
                                                ? "is-selected"
                                                : ""
                                            }`}
                                        onClick={() =>
                                            setSelectedUserId(
                                                user.id,
                                            )
                                        }
                                    >
                                        <span className="role-user-manager__radio">
                                            <span />
                                        </span>

                                        <span className="role-user-manager__user-info">
                                            <strong>
                                                {userName}
                                            </strong>

                                            <span>
                                                {user.employee_code || user.id}{" "}
                                                ·{" "}
                                                {user.department_name || "No department"}
                                                {" · "}
                                                {user.designation_name || "No designation"}
                                            </span>

                                            <small>
                                                {user.email}
                                            </small>
                                        </span>
                                    </button>
                                );
                            })
                        ) : (
                            <div className="role-user-manager__empty">
                                <strong>
                                    No employees available
                                </strong>

                                <span>
                                    {search.trim()
                                        ? "Try a different search."
                                        : "All available employees are already assigned to this role."}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="role-user-manager__assign-footer">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={handleCloseAssign}
                        >
                            Cancel
                        </Button>

                        <Button
                            type="button"
                            variant="primary"
                            onClick={handleAssign}
                            disabled={!selectedUserId}
                        >
                            Assign Employee
                        </Button>
                    </div>
                </div>
            )}

            {/* Assigned Employees List */}
            {!showAssign && (
                <div className="role-user-manager__list">
                    {assignedUsers.length > 0 ? (
                        assignedUsers.map((user) => (
                            <div
                                className="role-user-manager__assigned-user"
                                key={user.id}
                            >
                                <div className="role-user-manager__avatar">
                                    {([user.first_name, user.middle_name, user.last_name]
                                        .filter(Boolean)
                                        .join(" ") || user.name || "E")
                                        ?.charAt(0)
                                        .toUpperCase()}
                                </div>

                                <div className="role-user-manager__assigned-info">
                                    <strong>
                                        {[user.first_name, user.middle_name, user.last_name]
                                            .filter(Boolean)
                                            .join(" ") || user.full_name || user.name || "Employee"}
                                    </strong>

                                    <span>
                                        {user.employee_code || user.employeeCode || user.id}{" "}
                                        ·{" "}
                                        {user.department_name || user.department || "No department"}
                                        {" · "}
                                        {user.designation_name || user.designation || "No designation"}
                                    </span>

                                    <small>
                                        {user.email}
                                    </small>
                                </div>

                                <button
                                    type="button"
                                    className="role-user-manager__remove"
                                    onClick={() =>
                                        handleRemoveClick(user)
                                    }
                                    disabled={
                                        removingUserId ===
                                        user.id
                                    }
                                >
                                    {removingUserId ===
                                        user.id
                                        ? "Removing..."
                                        : "Remove"}
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="role-user-manager__empty">
                            <strong>
                                No employees assigned
                            </strong>

                            <span>
                                Assign an employee to give
                                them this role.
                            </span>
                        </div>
                    )}
                </div>
            )}

            {removeModal.open && (
                <ConfirmModal
                    open={removeModal.open}
                    onClose={() => setRemoveModal({ open: false, user: null })}
                    onConfirm={handleConfirmRemove}
                    title="Remove Employee from Role?"
                    description={`Are you sure you want to remove "${removeModal.user?.name}" from the "${role.roleName}" role?`}
                    confirmText="Remove"
                />
            )}
        </div>
    );
};

export default RoleUserManager;
