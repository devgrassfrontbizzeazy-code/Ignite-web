import { FiEye, FiEdit2, FiTrash2 } from "react-icons/fi";
import RowActions from "../../common/RowActions/RowActions";
import "./TaskTable.css";

const TaskTable = ({
  tasks = [],
  onView,
  onEdit,
  onDelete,
  canEdit = () => true,
  canDelete = () => true,
}) => {
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
            {tasks.map((task) => (
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
                  <span
                    className={`task-table__badge task-table__status--${getStatusClass(
                      task.status
                    )}`}
                  >
                    {task.status || "To Do"}
                  </span>
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
                      canDelete(task) && { key: "divider-1", isDivider: true },
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TaskTable;