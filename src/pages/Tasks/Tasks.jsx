import { useEffect, useMemo, useState } from "react";
import { ListTodo, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

import Button from "../../components/common/Button/Button";
import BackButton from "../../components/common/BackButton/BackButton";
import ConfirmModal from "../../components/common/ConfirmModal/ConfirmModal";
import Drawer from "../../components/common/Drawer/Drawer";
import Modal from "../../components/common/Modal/Modal";
import PageHeader from "../../components/common/PageHeader/PageHeader";
import Select from "../../components/common/Select/Select";
import TaskDetails from "../../components/tasks/TaskDetails/TaskDetails";
import TaskForm from "../../components/tasks/TaskForm/TaskForm";
import TaskTable from "../../components/tasks/TaskTable/TaskTable";
import { useTeamsTasks } from "../../context/TeamsTasksContext";
import { useNotification } from "../../context/NotificationContext";
import "./Tasks.css";

const STATUS_OPTIONS = ["All", "To Do", "In Progress", "Completed"];

const getCurrentEmployeeId = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return user.employee_id ?? user.employeeId ?? user.employee?.id ?? user.id ?? "";
  } catch {
    return "";
  }
};

const Tasks = () => {
  const navigate = useNavigate();
  const { notify } = useNotification();
  const { employees, teams, tasks, fetchTasks, fetchTeamMembers, createTask, updateTask, updateTaskStatus, deleteTask } = useTeamsTasks();

  const currentEmployeeId = getCurrentEmployeeId();
  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  }, []);
  const rawRole = String(currentUser.role || currentUser.user_type || "").toUpperCase();
  const isAdmin = currentUser.is_superuser === true || ["OWNER", "ADMIN", "ADMINISTRATOR"].includes(rawRole);
  const [scope, setScope] = useState("team");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [teamId, setTeamId] = useState("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const accessibleTeams = teams;

  const canAssign = isAdmin || teams.some((team) => String(team.teamLeadId ?? "") === String(currentEmployeeId));

  const canEdit = (task) => {
    if (!task) return false;
    return isAdmin || String(task.assignedTo ?? "") === String(currentEmployeeId) || teams.some((team) => String(team.teamLeadId ?? "") === String(currentEmployeeId) && String(team.id) === String(task.teamId));
  };

  const visibleTasks = useMemo(() => {
    const query = search.trim().toLowerCase();

    return tasks.filter((task) => {
      const teamMatches = isAdmin || accessibleTeams.some((team) => String(team.id) === String(task.teamId));
      const scopeMatch = scope === "mine"
        ? String(task.assignedTo ?? "") === String(currentEmployeeId)
        : scope === "team"
          ? accessibleTeams.some((team) => String(team.id) === String(task.teamId))
          : isAdmin;

      const searchMatch =
        !query ||
        [task.title, task.description, task.teamName, task.assignedToName].some((value) =>
          String(value || "").toLowerCase().includes(query)
        );

      const statusMatch = status === "All" || task.status === status;
      const teamFilterMatch = teamId === "all" || String(task.teamId) === String(teamId);

      return teamMatches && scopeMatch && searchMatch && statusMatch && teamFilterMatch;
    });
  }, [tasks, accessibleTeams, currentEmployeeId, isAdmin, scope, search, status, teamId]);

  const submitTask = async (data) => {
    try {
      if (selectedTask) {
        await updateTask(selectedTask.id, {
          ...data,
          teamId: data.teamId,
          assignedTo: data.assignedTo,
        });
        notify.success("Task updated successfully.");
      } else {
        await createTask({
          ...data,
          teamId: data.teamId,
          assignedTo: canAssign ? data.assignedTo : currentEmployeeId,
        });
        notify.success("Task created successfully.");
      }

      await fetchTasks();
      setDrawerOpen(false);
      setSelectedTask(null);
    } catch (error) {
      notify.error(error?.response?.data?.detail || "Failed to save task.");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      await deleteTask(deleteTarget.id);
      notify.success("Task deleted successfully.");
      setDeleteTarget(null);
      await fetchTasks();
    } catch (error) {
      notify.error(error?.response?.data?.detail || "Failed to delete task.");
    }
  };

  const updateStatus = async (task, nextStatus) => {
    try {
      await updateTaskStatus(task.id, nextStatus);
      setSelectedTask((current) => (current ? { ...current, status: nextStatus } : current));
      await fetchTasks();
      notify.success("Task status updated successfully.");
    } catch (error) {
      notify.error(error?.response?.data?.detail || "Failed to update task status.");
    }
  };

  return (
    <main className="tasks-page">
      <BackButton label="Back to Work Management" onClick={() => navigate("/work-management")} />
      <PageHeader
        eyebrow="Work Management"
        title="Tasks"
        description="Manage team work, assignments and progress."
        action={
          <Button variant="primary" onClick={() => { setSelectedTask(null); setDrawerOpen(true); }}>
            <Plus size={16} /> Create Task
          </Button>
        }
      />

      <section className="tasks-page__toolbar">
        <div className="tasks-page__search">
          <ListTodo size={17} />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search tasks, teams, or assignees..." />
        </div>

        <Select
          value={teamId}
          onChange={setTeamId}
          options={[{ value: "all", label: "All teams" }, ...accessibleTeams.map((team) => ({ value: team.id, label: team.teamName || team.name }))]}
          placeholder="Team"
        />

        <div className="tasks-page__filters">
          {STATUS_OPTIONS.map((item) => (
            <button type="button" key={item} className={status === item ? "is-active" : ""} onClick={() => setStatus(item)}>
              {item}
            </button>
          ))}
        </div>
      </section>

      <TaskTable
        tasks={visibleTasks}
        onView={(task) => navigate(`/tasks/${task.id}`)}
        onEdit={(task) => {
          if (canEdit(task)) {
            setSelectedTask(task);
            setDrawerOpen(true);
          } else {
            notify.error("You can only edit your own tasks or tasks assigned to your team.");
          }
        }}
        onDelete={(taskId) => {
          const task = tasks.find((item) => item.id === taskId);
          if (task && canEdit(task)) {
            setDeleteTarget(task);
          } else {
            notify.error("You can only delete tasks you can manage.");
          }
        }}
        canEdit={canEdit}
        canDelete={canEdit}
      />

      <Drawer
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setSelectedTask(null); }}
        title={selectedTask ? "Edit Task" : "Create Task"}
        description={canAssign ? "Assign work within your team." : "Create a task assigned to you."}
        width="520px"
      >
        <TaskForm
          teams={accessibleTeams}
          employees={employees}
          fetchTeamMembers={fetchTeamMembers}
          initialData={selectedTask || {}}
          restrictAssignee={!canAssign}
          currentEmployeeId={currentEmployeeId}
          onSubmit={submitTask}
          onCancel={() => { setDrawerOpen(false); setSelectedTask(null); }}
        />
      </Drawer>

      <Modal open={Boolean(selectedTask) && !drawerOpen} onClose={() => setSelectedTask(null)} title={selectedTask?.title || "Task Details"} size="medium">
        <TaskDetails
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onEdit={(task) => { setSelectedTask(task); setDrawerOpen(true); }}
          onViewTeam={(task) => navigate(`/teams/${task.teamId}`)}
          canEdit={selectedTask ? canEdit(selectedTask) : false}
          onStatusChange={updateStatus}
        />
      </Modal>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Task?"
        itemName={deleteTarget?.title}
        confirmText="Delete"
      />
    </main>
  );
};

export default Tasks;
