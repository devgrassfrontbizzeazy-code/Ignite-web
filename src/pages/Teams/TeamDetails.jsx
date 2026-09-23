import { useEffect, useMemo, useState } from "react";
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
import { useNotification } from "../../context/NotificationContext";

import "./TeamDetails.css";

const getEmployeeName = (employee) =>
  [
    employee?.first_name || employee?.firstName,
    employee?.middle_name || employee?.middleName,
    employee?.last_name || employee?.lastName,
  ]
    .filter(Boolean)
    .join(" ") ||
  employee?.full_name ||
  employee?.fullName ||
  employee?.email ||
  "Employee";



const TeamDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { notify } = useNotification();

  const {
    teams,
    fetchTeam,
    fetchTeamMembers,
    fetchTeamTasks,
    createTask,
    updateTaskStatus,
  } = useTeamsTasks();

  const [team, setTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [teamTasks, setTeamTasks] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [tab, setTab] = useState("overview");
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  /*
   * =========================
   * LOAD TEAM DETAILS
   * =========================
   */

  useEffect(() => {
    let mounted = true;

    const loadTeamDetails = async () => {
      setLoading(true);
      setError("");

      try {
        const [teamData, membersData, tasksData] = await Promise.all([
          fetchTeam(id),
          fetchTeamMembers(id),
          fetchTeamTasks(id),
        ]);

        if (!mounted) return;

        setTeam(teamData);
        setMembers(Array.isArray(membersData) ? membersData : []);
        setTeamTasks(Array.isArray(tasksData) ? tasksData : []);
      } catch (err) {
        console.error("Failed to load team details:", err);

        if (!mounted) return;

        setError(err?.response?.data?.detail || "Failed to load team details.");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    if (id) {
      loadTeamDetails();
    }

    return () => {
      mounted = false;
    };
  }, [id, fetchTeam, fetchTeamMembers, fetchTeamTasks]);

  /*
   * =========================
   * FALLBACK FROM CONTEXT
   * =========================
   */

  const contextTeam = useMemo(
    () => teams.find((item) => String(item.id) === String(id)),
    [teams, id],
  );

  const displayedTeam = team || contextTeam;

  /*
   * =========================
   * CURRENT USER
   * =========================
   *
   * Backend permissions remain authoritative for task assignment.
   */

  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);

  const currentEmployeeId =
    currentUser?.employee_id ||
    currentUser?.employeeId ||
    currentUser?.employee?.id ||
    currentUser?.id;

  const teamLeadId =
    displayedTeam?.teamLeadId ??
    displayedTeam?.team_lead ??
    displayedTeam?.teamLead?.id;

  const isLead =
    currentEmployeeId &&
    teamLeadId &&
    String(currentEmployeeId) === String(teamLeadId);

  const isMember = members.some(
    (member) => String(member.id) === String(currentEmployeeId),
  );

  /*
   * NOTE:
   * This is only UI behavior.
   * Backend permissions must remain the source of truth.
   */

  const rawRole = String(
    currentUser?.role || currentUser?.user_type || "",
  ).toUpperCase();
  const isAdmin =
    currentUser?.is_superuser === true ||
    ["OWNER", "ADMIN", "ADMINISTRATOR"].includes(rawRole);
  const canAssign = Boolean(isAdmin || isLead);

  /*
   * =========================
   * TASK COUNTS
   * =========================
   */

  const activeTasks = teamTasks.filter((task) => task.status !== "Completed");

  const completedTasks = teamTasks.filter(
    (task) => task.status === "Completed",
  );

  /*
   * =========================
   * TASK CREATE
   * =========================
   */

  const handleTaskSubmit = async (data) => {
    try {
      await createTask({
        ...data,
        teamId: displayedTeam.id,
        assignedTo: canAssign ? data.assignedTo : currentEmployeeId,
      });

      const refreshedTasks = await fetchTeamTasks(displayedTeam.id);

      setTeamTasks(Array.isArray(refreshedTasks) ? refreshedTasks : []);

      setTaskFormOpen(false);

      notify.success("Task created successfully.");
    } catch (err) {
      console.error("Failed to create task:", err);

      notify.error(err?.response?.data?.detail || "Failed to create task.");
    }
  };

  /*
   * =========================
   * TASK STATUS
   * =========================
   */

  const handleStatusChange = async (task, status) => {
    try {
      const updatedTask = await updateTaskStatus(task.id, status);

      setSelectedTask(
        updatedTask || {
          ...task,
          status,
        },
      );

      const refreshedTasks = await fetchTeamTasks(displayedTeam.id);

      setTeamTasks(Array.isArray(refreshedTasks) ? refreshedTasks : []);

      notify.success("Task status updated successfully.");
    } catch (err) {
      console.error("Failed to update task status:", err);

      notify.error(
        err?.response?.data?.detail || "Failed to update task status.",
      );
    }
  };

  /*
   * =========================
   * LOADING
   * =========================
   */

  if (loading) {
    return (
      <main className="team-details-page">
        <BackButton label="Back to Work Management" onClick={() => navigate("/teams")} />

        <div className="team-details-page__loading">
          Loading team details...
        </div>
      </main>
    );
  }

  /*
   * =========================
   * ERROR / NOT FOUND
   * =========================
   */

  if (error || !displayedTeam) {
    return (
      <main className="team-details-page">
        <BackButton label="Back to Teams" onClick={() => navigate("/teams")} />

        <h1>{error || "Team not found"}</h1>
      </main>
    );
  }

  const teamName = displayedTeam.teamName || displayedTeam.name || "Team";

  const teamDescription = displayedTeam.description || "No description added.";

  const teamStatus = displayedTeam.status || "active";

  const teamLeadMember = members.find(
  (member) => member.teamPosition === "Team Lead"
);

const teamLeadName =
  displayedTeam?.team_lead_name ||
  displayedTeam?.teamLeadName ||
  displayedTeam?.team_lead_details?.full_name ||
  teamLeadMember?.fullName ||
  teamLeadMember?.full_name ||
  getEmployeeName(teamLeadMember) ||
  "Not assigned";

  return (
    <main className="team-details-page">
      <BackButton label="Back to Teams" onClick={() => navigate("/teams")} />

      {/* HEADER */}

      <header className="team-details-page__header">
        <div>
          <span className="team-details-page__eyebrow">TEAM WORKSPACE</span>

          <div className="team-details-page__title">
            <h1>{teamName}</h1>

            <span
              className={`team-details-page__status team-details-page__status--${teamStatus}`}
            >
              <span />
              {teamStatus === "active" ? "Active" : "Inactive"}
            </span>
          </div>

          <p>{teamDescription}</p>

          <div className="team-details-page__meta">
            <span>
              Team Lead: <strong>{teamLeadName}</strong>
            </span>

            <span>
              Members: <strong>{members.length}</strong>
            </span>
          </div>
        </div>

        {(canAssign || isMember) && (
          <Button variant="primary" onClick={() => setTaskFormOpen(true)}>
            <Plus size={16} />
            Create Task
          </Button>
        )}
      </header>

      {/* TABS */}

      <nav className="team-details-page__tabs" aria-label="Team sections">
        {["overview", "members", "tasks"].map((item) => (
          <button
            type="button"
            key={item}
            className={tab === item ? "is-active" : ""}
            onClick={() => setTab(item)}
          >
            {item[0].toUpperCase() + item.slice(1)}
          </button>
        ))}
      </nav>

      {/* OVERVIEW */}

      {tab === "overview" && (
        <section className="team-details-page__panel">
          <div className="team-details-page__stats">
            <StatCard
              title="Total Members"
              value={members.length}
              icon={<Users size={18} />}
              variant="blue"
            />

            <StatCard
              title="Active Tasks"
              value={activeTasks.length}
              icon={<ListTodo size={18} />}
              variant="teal"
            />

            <StatCard
              title="Completed Tasks"
              value={completedTasks.length}
              icon={<CheckCircle2 size={18} />}
              variant="green"
            />
          </div>

          <h2>Overview</h2>

          <p>{teamDescription}</p>

          <div className="team-details-page__panel-heading">
            <h3>Recent Tasks</h3>

            <button type="button" onClick={() => setTab("tasks")}>
              View all tasks
            </button>
          </div>

          <TaskTable
            tasks={teamTasks.slice(0, 3)}
            onView={(task) => navigate(`/tasks/${task.id}`)}
            canEdit={() => false}
            canDelete={() => false}
          />
        </section>
      )}

      {/* MEMBERS */}

      {tab === "members" && (
        <section className="team-details-page__panel">
          <h2>Members</h2>

          <div className="team-details-page__table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Department</th>
                  <th>Designation</th>
                  <th>Team Position</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {members.length === 0 ? (
                  <tr>
                    <td colSpan="5">No members found.</td>
                  </tr>
                ) : (
                  members.map((employee) => {
                    const employeeName = getEmployeeName(employee);

                    const department =
                      employee.department?.name ||
                      employee.department_name ||
                      employee.departmentName ||
                      "—";

                    const designation =
                      employee.designation?.name ||
                      employee.designation_name ||
                      employee.designationName ||
                      "—";

                    const memberTeamLeadId =
                      employee.teamPosition === "Team Lead";
                    const isActive =
                      employee.is_active ??
                      employee.isActive ??
                      employee.employment_status?.toUpperCase() !== "INACTIVE";
                    

                    return (
                      <tr key={employee.id}>
                        <td>
                          <span>{employeeName}</span>
                        </td>

                        <td>{department}</td>

                        <td>{designation}</td>

                        <td>
                          {memberTeamLeadId ||
                          String(employee.id) === String(teamLeadId)
                            ? "Team Lead"
                            : "Member"}
                        </td>

                        <td>{isActive ? "Active" : "Inactive"}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* TASKS */}

      {tab === "tasks" && (
        <section className="team-details-page__panel">
          <div className="team-details-page__panel-heading">
            <div>
              <h2>Tasks</h2>

              <p>Work belonging to {teamName}.</p>
            </div>

            {(canAssign || isMember) && (
              <Button variant="primary" onClick={() => setTaskFormOpen(true)}>
                <Plus size={16} />
                Create Task
              </Button>
            )}
          </div>

          <TaskTable
            tasks={teamTasks}
            onView={(task) => navigate(`/tasks/${task.id}`)}
            onEdit={(task) => setSelectedTask(task)}
            onDelete={() => {}}
            canEdit={(task) =>
              canAssign || String(task.assignedTo) === String(currentEmployeeId)
            }
            canDelete={(task) =>
              canAssign || String(task.assignedTo) === String(currentEmployeeId)
            }
          />
        </section>
      )}

      {/* CREATE TASK */}

      <Drawer
        open={taskFormOpen}
        onClose={() => setTaskFormOpen(false)}
        title="Create Task"
        description={
          canAssign
            ? `Assign work to members of ${teamName}.`
            : "Create a task assigned to you."
        }
        width="520px"
      >
        <TaskForm
          teams={[displayedTeam]}
          employees={members}
          fetchTeamMembers={fetchTeamMembers}
          initialData={{
            teamId: displayedTeam.id,
            assignedTo: canAssign ? "" : currentEmployeeId,
          }}
          fixedTeamId={displayedTeam.id}
          restrictAssignee={!canAssign}
          currentEmployeeId={currentEmployeeId}
          onSubmit={handleTaskSubmit}
          onCancel={() => setTaskFormOpen(false)}
        />
      </Drawer>

      {/* TASK DETAILS */}

      <Modal
        open={Boolean(selectedTask)}
        onClose={() => setSelectedTask(null)}
        title={selectedTask?.title || "Task Details"}
        size="medium"
      >
        <TaskDetails
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onViewTeam={() => navigate(`/teams/${displayedTeam.id}`)}
          canEdit={
            canAssign ||
            String(selectedTask?.assignedTo) === String(currentEmployeeId)
          }
          onStatusChange={handleStatusChange}
        />
      </Modal>
    </main>
  );
};

export default TeamDetails;
