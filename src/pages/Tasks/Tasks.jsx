import { useMemo, useState } from "react";
import { ListTodo, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/common/Button/Button";
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

const Tasks = () => {
  const navigate = useNavigate();
  const { notify } = useNotification();
  const { employees, enrichedTeams, enrichedTasks, currentViewer, viewers, changeViewer, createTask, updateTask, deleteTask } = useTeamsTasks();
  const isAdmin = currentViewer.id === "admin";
  const [scope, setScope] = useState("team");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [teamId, setTeamId] = useState("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const accessibleTeams = useMemo(() => isAdmin ? enrichedTeams : enrichedTeams.filter((team) => team.memberIds.includes(currentViewer.id)), [enrichedTeams, currentViewer.id, isAdmin]);
  const accessibleTeamIds = accessibleTeams.map((team) => team.id);
  const canAssign = isAdmin || enrichedTeams.some((team) => String(team.teamLeadId) === String(currentViewer.id));
  const canEdit = (task) => canAssign || String(task.assignedTo) === String(currentViewer.id);

  const visibleTasks = useMemo(() => {
    const query = search.trim().toLowerCase();
    return enrichedTasks.filter((task) => {
      const inScope = isAdmin || accessibleTeamIds.includes(task.teamId);
      const scopeMatch = scope === "mine" ? String(task.assignedTo) === String(currentViewer.id) : scope === "team" ? accessibleTeamIds.includes(task.teamId) : isAdmin;
      const searchMatch = !query || [task.title, task.description, task.teamName, task.assignedToName].some((value) => value?.toLowerCase().includes(query));
      return inScope && scopeMatch && searchMatch && (status === "All" || task.status === status) && (teamId === "all" || String(task.teamId) === String(teamId));
    });
  }, [enrichedTasks, accessibleTeamIds, currentViewer.id, isAdmin, scope, search, status, teamId]);

  const submitTask = (data) => {
    if (selectedTask) { updateTask(selectedTask.id, data); notify.success("Task updated in local workspace."); }
    else { createTask(data); notify.success("Task created in local workspace."); }
    setDrawerOpen(false);
    setSelectedTask(null);
  };

  const updateStatus = (task, nextStatus) => {
    updateTask(task.id, { status: nextStatus });
    setSelectedTask((current) => current ? { ...current, status: nextStatus } : current);
    notify.success("Task status updated in local workspace.");
  };

  return (
    <main className="tasks-page">
      <PageHeader eyebrow="Work Management" title="Tasks" description="A broader workspace for work inside your teams." action={<Button variant="primary" onClick={() => { setSelectedTask(null); setDrawerOpen(true); }}><Plus size={16} /> Create Task</Button>} />
      <div className="tasks-page__preview"><span>Preview as</span><select value={currentViewer.id} onChange={(event) => changeViewer(event.target.value)}>{viewers.map((viewer) => <option key={viewer.id} value={viewer.id}>{viewer.name} · {viewer.role}</option>)}</select></div>
      <nav className="tasks-page__tabs"><button type="button" className={scope === "mine" ? "is-active" : ""} onClick={() => setScope("mine")}>My Tasks</button><button type="button" className={scope === "team" ? "is-active" : ""} onClick={() => setScope("team")}>Team Tasks</button>{isAdmin && <button type="button" className={scope === "all" ? "is-active" : ""} onClick={() => setScope("all")}>All Tasks</button>}</nav>
      <section className="tasks-page__toolbar"><div className="tasks-page__search"><ListTodo size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search tasks, teams, or assignees..." /></div><Select value={teamId} onChange={setTeamId} options={[{ value: "all", label: "All teams" }, ...accessibleTeams.map((team) => ({ value: team.id, label: team.name }))]} placeholder="Team" /><div className="tasks-page__filters">{STATUS_OPTIONS.map((item) => <button type="button" key={item} className={status === item ? "is-active" : ""} onClick={() => setStatus(item)}>{item}</button>)}</div></section>
      <TaskTable tasks={visibleTasks} onView={setSelectedTask} onEdit={(task) => { if (canEdit(task)) { setSelectedTask(task); setDrawerOpen(true); } else notify.error("You can only edit your own tasks."); }} onDelete={(taskId) => { const task = enrichedTasks.find((item) => item.id === taskId); if (task && canEdit(task)) setDeleteTarget(task); else notify.error("You can only delete your own tasks."); }} canEdit={canEdit} canDelete={canEdit} />
      <Drawer open={drawerOpen} onClose={() => { setDrawerOpen(false); setSelectedTask(null); }} title={selectedTask ? "Edit Task" : "Create Task"} description={canAssign ? "Assign work only within a selected team." : "Create a task assigned to you."} width="520px"><TaskForm teams={accessibleTeams} employees={employees} initialData={selectedTask || {}} restrictAssignee={!canAssign} currentEmployeeId={currentViewer.id} onSubmit={submitTask} onCancel={() => { setDrawerOpen(false); setSelectedTask(null); }} /></Drawer>
      <Modal open={Boolean(selectedTask) && !drawerOpen} onClose={() => setSelectedTask(null)} title={selectedTask?.title || "Task Details"} size="medium"><TaskDetails task={selectedTask} onClose={() => setSelectedTask(null)} onEdit={(task) => { setDrawerOpen(true); setSelectedTask(task); }} onViewTeam={(task) => navigate(`/teams/${task.teamId}`)} canEdit={selectedTask ? canEdit(selectedTask) : false} onStatusChange={updateStatus} /></Modal>
      <ConfirmModal open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} onConfirm={() => { deleteTask(deleteTarget.id); setDeleteTarget(null); notify.success("Task deleted from local workspace."); }} title="Delete Task?" itemName={deleteTarget?.title} confirmText="Delete" />
    </main>
  );
};

export default Tasks;
