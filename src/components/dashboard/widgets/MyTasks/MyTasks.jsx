import { CheckCircle2, Circle, Clock3 } from "lucide-react";

import DashboardWidget from "../../DashboardWidget/DashboardWidget";
import "./MyTasks.css";

const getStatusLabel = (status) => {
  const labels = {
    "To Do": "To Do",
    "In Progress": "In Progress",
    Completed: "Completed",
    Cancelled: "Cancelled",
  };

  return labels[status] || status || "Unknown";
};

const getStatusClass = (status) => {
  if (status === "Completed") {
    return "my-tasks__status--completed";
  }

  if (status === "In Progress") {
    return "my-tasks__status--progress";
  }

  return "my-tasks__status--pending";
};

const formatDueDate = (date) => {
  if (!date) return "No due date";

  const taskDate = new Date(date);
  const today = new Date();

  const isToday =
    taskDate.getFullYear() === today.getFullYear() &&
    taskDate.getMonth() === today.getMonth() &&
    taskDate.getDate() === today.getDate();

  if (isToday) return "Today";

  return taskDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
};

const MyTasks = ({ data, loading }) => {
  const tasks = data?.tasks || [];

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(
    (task) => task.status === "Completed",
  ).length;

  const pendingTasks = tasks.filter(
    (task) => task.status !== "Completed",
  ).length;

  return (
    <DashboardWidget
      title="My Tasks"
      action="View All"
      onAction={() => {
        window.location.href = "/tasks";
      }}
      loading={loading}
      className="my-tasks-widget"
    >
      <div className="my-tasks">
        {/* Summary */}
        <div className="my-tasks__summary">
          <div className="my-tasks__summary-item">
            <strong>{totalTasks}</strong>
            <span>Total Tasks</span>
          </div>

          <div className="my-tasks__summary-divider" />

          <div className="my-tasks__summary-item">
            <strong>{pendingTasks}</strong>
            <span>Pending</span>
          </div>

          <div className="my-tasks__summary-divider" />

          <div className="my-tasks__summary-item">
            <strong>{completedTasks}</strong>
            <span>Completed</span>
          </div>
        </div>

        {/* Tasks */}
        <div className="my-tasks__list">
          {tasks.length === 0 ? (
            <div className="my-tasks__empty">
              <CheckCircle2 size={20} />
              <span>No tasks assigned to you.</span>
            </div>
          ) : (
            tasks.slice(0, 4).map((task) => {
              const isCompleted = task.status === "Completed";

              return (
                <div className="my-tasks__row" key={task.id}>
                  <div className="my-tasks__task-icon">
                    {isCompleted ? (
                      <CheckCircle2 size={18} />
                    ) : (
                      <Circle size={18} />
                    )}
                  </div>

                  <div className="my-tasks__task-info">
                    <strong>{task.title}</strong>

                    <span>{task.team_name || "No team"}</span>
                  </div>

                  <div className="my-tasks__due-date">
                    <Clock3 size={14} />
                    {formatDueDate(task.due_date)}
                  </div>

                  <span
                    className={`my-tasks__status ${getStatusClass(
                      task.status,
                    )}`}
                  >
                    {getStatusLabel(task.status)}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </DashboardWidget>
  );
};

export default MyTasks;
