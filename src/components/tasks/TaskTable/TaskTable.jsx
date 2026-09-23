import { FiEye, FiEdit2, FiTrash2, FiChevronDown } from "react-icons/fi";
import { useState } from "react";
import RowActions from "../../common/RowActions/RowActions";
import "./TaskTable.css";

const STATUS_OPTIONS = ["To Do", "In Progress", "Completed"];

const TaskTable = ({
  tasks = [],
  onView,
  onEdit,
  onDelete,
  onStatusChange,
  canEdit = () => true,
  canDelete = () => true,
}) => {
  const [openStatusId, setOpenStatusId] = useState(null);

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getPriorityClass = (priority) =>
    priority?.toLowerCase() || "medium";

  const getStatusClass = (status) =>
    status?.toLowerCase().replace(/\s+/g, "-") || "to-do";

  const getUserPermissions = (task) =>
    task?.userPermissions ||
    task?.user_permissions ||
    null;

  const canUpdateStatus = (task) => {
    const permissions = getUserPermissions(task);

    if (permissions && typeof permissions.can_update_status === "boolean") {
      return permissions.can_update_status;
    }

    return canEdit(task);
  };

  const handleStatusChange = async (task, nextStatus) => {
    if (!nextStatus || nextStatus === task.status) {
      setOpenStatusId(null);
      return;
    }

    setOpenStatusId(null);

    await onStatusChange?.(task, nextStatus);
  };

  if (tasks.length === 0) {
    return (
      <div className="task-table-card">
        <div className="task-table__empty">
          <div className="task-table__empty-icon">
            <span>✓</span>
          </div>

          <h3>No tasks found</h3>

          <p>
            Try changing your search or status filter.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="task-table-card">
      <div className="task-table__header">
        <div>
          <h2>Task List</h2>

          <span>
            {tasks.length}{" "}
            {tasks.length === 1 ? "task" : "tasks"}
          </span>
        </div>
      </div>

      <div className="task-table__wrapper">
        <table className="task-table">
          <thead>
            <tr>
              <th>Task</th>
              <th>Team</th>
              <th>Assigned To</th>
              <th>Priority</th>
              <th>Due Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {tasks.map((task) => {
              const status = task.status || "To Do";
              const statusEditable = canUpdateStatus(task);

              return (
                <tr key={task.id}>
                  {/* Task */}
                  <td>
                    <div className="task-table__task">
                      <strong>{task.title}</strong>

                      {task.description && (
                        <span>{task.description}</span>
                      )}
                    </div>
                  </td>

                  {/* Team */}
                  <td>
                    <span className="task-table__team">
                      {task.teamName || "—"}
                    </span>
                  </td>

                  {/* Assignee */}
                  <td>
                    <div className="task-table__assignee">
                      <div className="task-table__avatar">
                        {(task.assignedToName || "E")
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <span>
                        {task.assignedToName || "—"}
                      </span>
                    </div>
                  </td>

                  {/* Priority */}
                  <td>
                    <span
                      className={`task-table__badge task-table__priority--${getPriorityClass(
                        task.priority
                      )}`}
                    >
                      {task.priority || "Medium"}
                    </span>
                  </td>

                  {/* Due date */}
                  <td>
                    <span className="task-table__date">
                      {formatDate(task.dueDate)}
                    </span>
                  </td>

                  {/* Status */}
                  <td>
                    {statusEditable ? (
                      <div className="task-table__status-control">
                        <button
                          type="button"
                          className={`task-table__status-button task-table__status--${getStatusClass(
                            status
                          )}`}
                          onClick={() =>
                            setOpenStatusId(
                              openStatusId === task.id ? null : task.id
                            )
                          }
                          aria-expanded={openStatusId === task.id}
                          aria-haspopup="listbox"
                        >
                          <span>{status}</span>
                          <FiChevronDown size={13} />
                        </button>

                        {openStatusId === task.id && (
                          <div
                            className="task-table__status-menu"
                            role="listbox"
                          >
                            {STATUS_OPTIONS.map((option) => (
                              <button
                                type="button"
                                key={option}
                                className={
                                  option === status
                                    ? "is-selected"
                                    : ""
                                }
                                onClick={() =>
                                  handleStatusChange(task, option)
                                }
                              >
                                <span>{option}</span>

                                {option === status && (
                                  <span className="task-table__status-check">
                                    ✓
                                  </span>
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span
                        className={`task-table__badge task-table__status--${getStatusClass(
                          status
                        )}`}
                      >
                        {status}
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td>
                    <RowActions
                      actions={[
                        {
                          key: "view",
                          label: "View",
                          icon: FiEye,
                          onClick: () => onView?.(task),
                        },
                        canEdit(task) && {
                          key: "edit",
                          label: "Edit",
                          icon: FiEdit2,
                          onClick: () => onEdit?.(task),
                        },
                        canDelete(task) && {
                          key: "divider-1",
                          isDivider: true,
                        },
                        canDelete(task) && {
                          key: "delete",
                          label: "Delete",
                          icon: FiTrash2,
                          isDanger: true,
                          onClick: () => onDelete?.(task.id),
                        },
                      ].filter(Boolean)}
                      title={`Actions for ${task.title}`}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TaskTable;