import { ArrowRight, CheckCircle2, Circle, Clock3 } from "lucide-react";

import DashboardWidget from "../../../DashboardWidget/DashboardWidget";
import "./TeamTaskWidget.css";

const formatDueDate = (date) => {
  if (!date) return "No deadline";

  const taskDate = new Date(date);
  const today = new Date();

  const isToday =
    taskDate.getFullYear() === today.getFullYear() &&
    taskDate.getMonth() === today.getMonth() &&
    taskDate.getDate() === today.getDate();

  if (isToday) {
    return "Today";
  }

  return taskDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
};

const getTasksByStatus = (tasks, status) =>
  tasks.filter((task) => task?.status === status);

const TaskRow = ({ task }) => {
  const isCompleted = task?.status === "Completed";

  return (
    <div className="team-tasks__row">
      <div className="team-tasks__task-icon">
        {isCompleted ? (
          <CheckCircle2 size={16} />
        ) : (
          <Circle size={16} />
        )}
      </div>

      <div className="team-tasks__task-info">
        <strong>{task?.title || "Untitled task"}</strong>

        <span>
          {task?.team_name ||
            task?.teamName ||
            "Team task"}
        </span>
      </div>

      <div className="team-tasks__deadline">
        <Clock3 size={13} />
        <span>{formatDueDate(task?.due_date)}</span>
      </div>
    </div>
  );
};

const EmptyState = ({ children }) => (
  <div className="team-tasks__empty">
    <CheckCircle2 size={16} />
    <span>{children}</span>
  </div>
);

const TeamTasksWidget = ({ data, loading }) => {
  const tasks = Array.isArray(data?.tasks) ? data.tasks : [];

  const inProgressTasks = getTasksByStatus(tasks, "In Progress");
  const todoTasks = getTasksByStatus(tasks, "To Do");

  return (
    <DashboardWidget
      title="Team Tasks"
      action="View All"
      onAction={() => {
        window.location.href = "/tasks";
      }}
      loading={loading}
      className="team-tasks-widget"
    >
      <div className="team-tasks">
  {/* In Progress */}
  {inProgressTasks.length > 0 && (
    <div className="team-tasks__section">
      <div className="team-tasks__section-header">
        <div>
          <span className="team-tasks__section-dot team-tasks__section-dot--progress" />
          <strong>In Progress</strong>
        </div>

        <span className="team-tasks__count">
          {inProgressTasks.length}
        </span>
      </div>

      <div className="team-tasks__list">
        {inProgressTasks.slice(0, 3).map((task) => (
          <TaskRow
            key={`progress-${task.id}`}
            task={task}
          />
        ))}
      </div>
    </div>
  )}

  {/* To Do */}
  {todoTasks.length > 0 && (
    <div className="team-tasks__section">
      <div className="team-tasks__section-header">
        <div>
          <span className="team-tasks__section-dot team-tasks__section-dot--todo" />
          <strong>To Do</strong>
        </div>

        <span className="team-tasks__count">
          {todoTasks.length}
        </span>
      </div>

      <div className="team-tasks__list">
        {todoTasks.slice(0, 3).map((task) => (
          <TaskRow
            key={`todo-${task.id}`}
            task={task}
          />
        ))}
      </div>
    </div>
  )}

  {/* No tasks at all */}
  {inProgressTasks.length === 0 && todoTasks.length === 0 && (
    <div className="team-tasks__empty">
      <CheckCircle2 size={18} />
      <span>No team tasks assigned to you.</span>
    </div>
  )}

  <button
    type="button"
    className="team-tasks__footer-action"
    onClick={() => {
      window.location.href = "/tasks";
    }}
  >
    View all tasks
    <ArrowRight size={14} />
  </button>
</div>
    </DashboardWidget>
  );
};

export default TeamTasksWidget;