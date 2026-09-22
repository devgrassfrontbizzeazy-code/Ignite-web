import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, ListTodo, Plus, Users } from "lucide-react";
import BackButton from "../../components/common/BackButton/BackButton";
import Button from "../../components/common/Button/Button";
import Drawer from "../../components/common/Drawer/Drawer";
import Modal from "../../components/common/Modal/Modal";
import StatCard from "../../components/common/StatCard/StatCard";
import TaskDetails from "../../components/tasks/TaskDetails/TaskDetails";
import TaskForm from "../../components/tasks/TaskForm/TaskForm";
import TaskTable from "../../components/tasks/TaskTable/TaskTable";
import { useTeamsTasks } from "../../context/TeamsTasksContext";
import { getEmployeeName } from "../../data/teamsTasksMock";
import { useNotification } from "../../context/NotificationContext";
import "./TeamDetails.css";

const TeamDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { notify } = useNotification();
  const { employees, enrichedTeams, enrichedTasks, currentViewer, createTask, updateTask } = useTeamsTasks();
  const team = enrichedTeams.find((item) => String(item.id) === String(id));
  const [tab, setTab] = useState("overview");
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const currentEmployeeId = currentViewer.id === "admin" ? team?.teamLeadId : currentViewer.id;
  const isAdmin = currentViewer.id === "admin";
  const isLead = String(currentEmployeeId) === String(team?.teamLeadId);
  const canAssign = isAdmin || isLead;
  const isMember = Boolean(team?.memberIds.includes(currentEmployeeId));
  const teamTasks = useMemo(() => enrichedTasks.filter((task) => String(task.teamId) === String(id)), [enrichedTasks, id]);
  const members = useMemo(() => employees.filter((employee) => team?.memberIds.includes(employee.id)), [employees, team]);

  if (!team) return <main className="team-details-page"><BackButton label="Back to Teams" onClick={() => navigate("/teams")} /><h1>Team not found</h1></main>;

  const handleTaskSubmit = (data) => {
    createTask({ ...data, teamId: team.id, assignedTo: canAssign ? data.assignedTo : currentEmployeeId });
    setTaskFormOpen(false);
    notify.success("Task created in local workspace.");
  };

  const handleStatusChange = (task, status) => {
    updateTask(task.id, { status });
    setSelectedTask({ ...task, status });
    notify.success("Task status updated in local workspace.");
  };

  return (
    <main className="team-details-page">
      <BackButton label="Back to Teams" onClick={() => navigate("/teams")} />
      <header className="team-details-page__header"><div><span className="team-details-page__eyebrow">TEAM WORKSPACE</span><div className="team-details-page__title"><h1>{team.name}</h1><span className={`team-details-page__status team-details-page__status--${team.status}`}><span />{team.status === "active" ? "Active" : "Inactive"}</span></div><p>{team.description || "No description added."}</p><div className="team-details-page__meta"><span>Team Lead: <strong>{team.teamLeadName}</strong></span><span>Members: <strong>{team.memberIds.length}</strong></span></div></div>{(canAssign || isMember) && <Button variant="primary" onClick={() => setTaskFormOpen(true)}><Plus size={16} /> Create Task</Button>}</header>
      <nav className="team-details-page__tabs" aria-label="Team sections">{["overview", "members", "tasks"].map((item) => <button type="button" key={item} className={tab === item ? "is-active" : ""} onClick={() => setTab(item)}>{item[0].toUpperCase() + item.slice(1)}</button>)}</nav>

      {tab === "overview" && <section className="team-details-page__panel"><div className="team-details-page__stats"><StatCard title="Total Members" value={team.memberIds.length} icon={<Users size={18} />} variant="blue" /><StatCard title="Active Tasks" value={teamTasks.filter((task) => task.status !== "Completed").length} icon={<ListTodo size={18} />} variant="teal" /><StatCard title="Completed Tasks" value={teamTasks.filter((task) => task.status === "Completed").length} icon={<CheckCircle2 size={18} />} variant="green" /></div><h2>Overview</h2><p>{team.description || "No description added."}</p><div className="team-details-page__panel-heading"><h3>Recent Tasks</h3><button type="button" onClick={() => setTab("tasks")}>View all tasks</button></div><TaskTable tasks={teamTasks.slice(0, 3)} onView={setSelectedTask} canEdit={() => false} canDelete={() => false} /></section>}
      {tab === "members" && <section className="team-details-page__panel"><h2>Members</h2><div className="team-details-page__table-wrap"><table><thead><tr><th>Name</th><th>Global Role</th><th>Team Position</th><th>Status</th></tr></thead><tbody>{members.map((employee) => <tr key={employee.id}><td>{getEmployeeName(employee)}</td><td>{employee.designation_name || "Employee"}</td><td>{String(employee.id) === String(team.teamLeadId) ? "Team Lead" : "Member"}</td><td>{employee.is_active ? "Active" : "Inactive"}</td></tr>)}</tbody></table></div></section>}
      {tab === "tasks" && <section className="team-details-page__panel"><div className="team-details-page__panel-heading"><div><h2>Tasks</h2><p>Work belonging to {team.name}.</p></div>{(canAssign || isMember) && <Button variant="primary" onClick={() => setTaskFormOpen(true)}><Plus size={16} /> Create Task</Button>}</div><TaskTable tasks={teamTasks} onView={setSelectedTask} onEdit={(task) => setSelectedTask(task)} onDelete={() => {}} /></section>}

      <Drawer open={taskFormOpen} onClose={() => setTaskFormOpen(false)} title="Create Task" description={canAssign ? `Assign work to members of ${team.name}.` : "Create a task assigned to you."} width="520px"><TaskForm teams={[team]} employees={employees} initialData={{ teamId: team.id, assignedTo: canAssign ? "" : currentEmployeeId }} fixedTeamId={team.id} restrictAssignee={!canAssign} currentEmployeeId={currentEmployeeId} onSubmit={handleTaskSubmit} onCancel={() => setTaskFormOpen(false)} /></Drawer>
      <Modal open={Boolean(selectedTask)} onClose={() => setSelectedTask(null)} title={selectedTask?.title || "Task Details"} size="medium"><TaskDetails task={selectedTask} onClose={() => setSelectedTask(null)} onViewTeam={() => navigate(`/teams/${team.id}`)} canEdit={canAssign || String(selectedTask?.assignedTo) === String(currentEmployeeId)} onStatusChange={handleStatusChange} /></Modal>
    </main>
  );
};

export default TeamDetails;
