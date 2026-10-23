import { FiEye, FiEdit2, FiTrash2, FiChevronDown } from "react-icons/fi";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  const [statusMenuPosition, setStatusMenuPosition] = useState({
    top: 0,
    left: 0,
    maxHeight: null,
  });
  const statusButtonRef = useRef(null);
  const statusMenuRef = useRef(null);
  const openStatusTask = tasks.find((task) => task.id === openStatusId);

  const calculateStatusMenuPosition = () => {
    const button = statusButtonRef.current;
    if (!button) return;

    const buttonRect = button.getBoundingClientRect();
    const menu = statusMenuRef.current;
    const menuWidth = menu?.offsetWidth || 145;
    const menuHeight = menu?.offsetHeight || STATUS_OPTIONS.length * 32 + 12;
    const gap = 6;
    const viewportPadding = 8;
    const spaceAbove = buttonRect.top - viewportPadding;
    const spaceBelow = window.innerHeight - buttonRect.bottom - viewportPadding;
    const opensAbove =
      spaceBelow < menuHeight && spaceAbove > spaceBelow;
    const availableHeight = Math.max(
      (opensAbove ? spaceAbove : spaceBelow) - gap,
      0,
    );

    const top = opensAbove
      ? Math.max(viewportPadding, buttonRect.top - Math.min(menuHeight, availableHeight) - gap)
      : Math.min(
          buttonRect.bottom + gap,
          window.innerHeight - viewportPadding - Math.min(menuHeight, availableHeight),
        );
    const maxLeft = Math.max(
      viewportPadding,
      window.innerWidth - menuWidth - viewportPadding,
    );
    const left = Math.min(Math.max(buttonRect.left, viewportPadding), maxLeft);

    setStatusMenuPosition({
      top: Math.round(top),
      left: Math.round(left),
      maxHeight: Math.floor(availableHeight),
    });
  };

  useLayoutEffect(() => {
    if (openStatusId === null) return undefined;

    calculateStatusMenuPosition();
    const frame = requestAnimationFrame(calculateStatusMenuPosition);
    window.addEventListener("resize", calculateStatusMenuPosition);
    window.addEventListener("scroll", calculateStatusMenuPosition, true);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", calculateStatusMenuPosition);
      window.removeEventListener("scroll", calculateStatusMenuPosition, true);
    };
  }, [openStatusId]);

  useEffect(() => {
    if (openStatusId === null) return undefined;

    const handleOutsideClick = (event) => {
      const clickedButton = statusButtonRef.current?.contains(event.target);
      const clickedMenu = statusMenuRef.current?.contains(event.target);

      if (!clickedButton && !clickedMenu) {
        setOpenStatusId(null);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpenStatusId(null);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openStatusId]);

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
                    {task.teamName && task.teamName !== "Personal" ? (
                      <span className="task-table__team">
                        {task.teamName}
                      </span>
                    ) : (
                      <span
                        className="task-table__team task-table__team--personal"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          padding: "2px 8px",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: 500,
                          backgroundColor: "#f3f4f6",
                          color: "#4b5563",
                        }}
                      >
                        Personal
                      </span>
                    )}
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
                          ref={openStatusId === task.id ? statusButtonRef : null}
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
      {openStatusId !== null &&
        createPortal(
          <div
            ref={statusMenuRef}
            className="task-table__status-menu"
            role="listbox"
            style={{
              top: `${statusMenuPosition.top}px`,
              left: `${statusMenuPosition.left}px`,
              maxHeight:
                statusMenuPosition.maxHeight === null
                  ? undefined
                  : `${statusMenuPosition.maxHeight}px`,
            }}
          >
            {openStatusTask &&
              STATUS_OPTIONS.map((option) => (
                  <button
                    type="button"
                    key={option}
                    className={
                      option === (openStatusTask.status || "To Do")
                        ? "is-selected"
                        : ""
                    }
                    onClick={() =>
                      handleStatusChange(openStatusTask, option)
                    }
                  >
                    <span>{option}</span>

                    {option === (openStatusTask.status || "To Do") && (
                      <span className="task-table__status-check">✓</span>
                    )}
                  </button>
                ))}
          </div>,
          document.body,
        )}
    </div>
  );
};

export default TaskTable;