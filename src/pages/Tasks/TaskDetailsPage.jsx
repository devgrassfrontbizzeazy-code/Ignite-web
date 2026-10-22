import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import BackButton from "../../components/common/BackButton/BackButton";
import Modal from "../../components/common/Modal/Modal";
import TaskDetails from "../../components/tasks/TaskDetails/TaskDetails";
import { useNotification } from "../../context/NotificationContext";
import { useTeamsTasks } from "../../context/TeamsTasksContext";

import "./Tasks.css";

const getCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
};

const TaskDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { notify } = useNotification();
  const { teams, tasks, fetchTask, updateTaskStatus } = useTeamsTasks();

  const [task, setTask] = useState(() => {
    if (id && Array.isArray(tasks) && tasks.length > 0) {
      return tasks.find((t) => String(t.id) === String(id)) || null;
    }
    return null;
  });
  const [loading, setLoading] = useState(!task);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    if (!id || id === "null" || id === "undefined") {
      setError("Invalid task ID.");
      setLoading(false);
      return;
    }

    const loadTask = async () => {
      if (!task) {
        setLoading(true);
      }
      setError("");

      try {
        const taskData = await fetchTask(id);
        if (mounted && taskData && taskData.id) {
          setTask(taskData);
        }
      } catch (requestError) {
        if (mounted) {
          if (!task) {
            const errMsg =
              requestError?.response?.data?.message ||
              requestError?.response?.data?.detail ||
              requestError?.message ||
              "Failed to load task details.";
            setError(errMsg);
          }
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadTask();

    return () => {
      mounted = false;
    };
  }, [fetchTask, id]);

  const currentUser = useMemo(getCurrentUser, []);
  const currentEmployeeId = currentUser.employee_id ?? currentUser.employeeId ?? currentUser.employee?.id ?? currentUser.id;
  const rawRole = String(currentUser.role || currentUser.user_type || "").toUpperCase();
  const isAdmin = currentUser.is_superuser === true || ["OWNER", "ADMIN", "ADMINISTRATOR"].includes(rawRole);

  const canEdit = Boolean(
    task && (
      task.user_permissions?.can_edit === true ||
      isAdmin ||
      String(task.assignedTo) === String(currentEmployeeId) ||
      (task.created_by_id && String(task.created_by_id) === String(currentUser.id)) ||
      teams.some((team) => String(team.id) === String(task.teamId) && String(team.teamLeadId) === String(currentEmployeeId))
    )
  );

  const handleStatusChange = async (selectedTask, status) => {
    try {
      const updatedTask = await updateTaskStatus(selectedTask.id, status);
      setTask((current) => ({ ...current, ...updatedTask, status }));
      notify.success("Task status updated successfully.");
    } catch (requestError) {
      const errMsg =
        requestError?.response?.data?.message ||
        requestError?.response?.data?.detail ||
        "Failed to update task status.";
      notify.error(errMsg);
    }
  };

  if (loading) {
    return (
      <main className="tasks-page">
        <BackButton label="Back to Tasks" onClick={() => navigate("/tasks")} />
        <p>Loading task details...</p>
      </main>
    );
  }

  if (error || !task) {
    return (
      <main className="tasks-page">
        <BackButton label="Back to Tasks" onClick={() => navigate("/tasks")} />
        <h1>{error || "Task not found"}</h1>
      </main>
    );
  }

  return (
    <main className="tasks-page">
      <BackButton label="Back to Tasks" onClick={() => navigate("/tasks")} />
      <Modal open onClose={() => navigate("/tasks")} title={task.title || "Task Details"} size="medium">
        <TaskDetails
          task={task}
          onClose={() => navigate("/tasks")}
          onEdit={(selectedTask) => navigate("/tasks", { state: { editTaskId: selectedTask.id } })}
          onViewTeam={(selectedTask) => navigate(`/teams/${selectedTask.teamId}`)}
          canEdit={canEdit}
          onStatusChange={handleStatusChange}
        />
      </Modal>
    </main>
  );
};

export default TaskDetailsPage;
