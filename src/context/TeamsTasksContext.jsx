import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import teamAPI from "../services/api/teamAPI";
import taskAPI from "../services/api/taskAPI";
import { getEmployees } from "../services/api/employeeAPI";

const TeamsTasksContext = createContext(null);

const getResponseData = (response) => {
  const data = response?.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.data)) return data.data;

  return data ?? [];
};

const getEmployeeName = (employee = {}) => {
  const first = employee.first_name || employee.firstName || "";
  const middle = employee.middle_name || employee.middleName || "";
  const last = employee.last_name || employee.lastName || "";

  return (
    [first, middle, last].filter(Boolean).join(" ") ||
    employee.full_name ||
    employee.fullName ||
    employee.email ||
    "Employee"
  );
};

const normalizeEmployee = (employee = {}) => ({
  ...employee,
  id:
    employee.id ??
    employee.employee_id ??
    employee.employeeId ??
    employee.pk ??
    null,
  name: getEmployeeName(employee),
  firstName: employee.first_name || employee.firstName || "",
  lastName: employee.last_name || employee.lastName || "",
  fullName:
    employee.full_name || employee.fullName || getEmployeeName(employee),
  department: employee.department || {
    id: employee.department_id ?? employee.departmentId,
    name:
      employee.department_name ||
      employee.departmentName ||
      employee.department?.name ||
      "",
  },
  designation: employee.designation || {
    id: employee.designation_id ?? employee.designationId,
    name:
      employee.designation_name ||
      employee.designationName ||
      employee.designation?.name ||
      "",
  },
  profilePhotoUrl: employee.profile_photo_url || employee.profilePhotoUrl || "",
});

const normalizeTeam = (team = {}) => ({
  ...team,

  id: team.id ?? team.team_id ?? team.teamId ?? null,

  teamName: team.teamName || team.name || "",
  name: team.name || team.teamName || "",

  description: team.description || "",

  teamLeadId:
    team.teamLeadId ??
    (typeof team.team_lead === "object" ? team.team_lead.id : team.team_lead) ??
    team.teamLead?.id ??
    null,

  memberIds: Array.isArray(team.memberIds)
    ? team.memberIds
    : Array.isArray(team.members)
      ? team.members.map((member) =>
          typeof member === "object" ? member.id : member,
        )
      : Array.isArray(team.employeeIds)
        ? team.employeeIds
        : [],

  memberNames: Array.isArray(team.members_details)
    ? team.members_details
        .map(
          (member) =>
            member.full_name ||
            member.fullName ||
            [member.first_name, member.last_name].filter(Boolean).join(" "),
        )
        .filter(Boolean)
    : [],

  memberCount:
    team.memberCount ??
    team.member_count ??
    team.members_count ??
    team.total_members ??
    (Array.isArray(team.members) ? team.members.length : 0),
    
  teamLeadName:
    team.teamLeadName ||
    team.team_lead_name ||
    team.teamLead?.name ||
    team.teamLead?.full_name ||
    team.team_lead_details?.full_name ||
    team.team_lead_details?.fullName ||
    "",

  status:
    team.status === "Inactive" ||
    team.status === "inactive" ||
    team.is_active === false
      ? "inactive"
      : "active",

  isActive: team.isActive ?? team.is_active ?? true,

  createdAt: team.createdAt || team.created_at || "",

  updatedAt: team.updatedAt || team.updated_at || "",
});

const normalizeTask = (task = {}) => ({
  ...task,
  id: task.id ?? task.task_id ?? task.taskId ?? null,
  teamId:
    task.teamId ??
    task.team_id ??
    (typeof task.team === "object" ? task.team.id : task.team) ??
    null,
  teamName: task.teamName || task.team_name || task.team?.name || "",
  assignedTo: task.assignedTo ?? task.assigned_to ?? task.assignee?.id ?? null,
  assignedToName:
    task.assignedToName ||
    task.assigned_to_name ||
    task.assignee?.full_name ||
    task.assignee?.name ||
    task.assigned_to_details?.full_name ||
    task.assigned_to_details?.fullName ||
    "",
  dueDate: task.dueDate || task.due_date || "",
  priority: task.priority || "Medium",
  status: task.status || "To Do",
  isActive: task.isActive ?? task.is_active ?? true,
});

export const TeamsTasksProvider = ({ children }) => {
  const [employees, setEmployees] = useState([]);
  const [teams, setTeams] = useState([]);
  const [tasks, setTasks] = useState([]);

  const [loading, setLoading] = useState(true);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [tasksLoading, setTasksLoading] = useState(false);

  const [error, setError] = useState(null);

  /*
   * ==========================================
   * EMPLOYEES
   * ==========================================
   */

  const fetchEmployees = useCallback(async () => {
    try {
      const response = await getEmployees();
      const payload = response?.data ?? response;
      const rawEmployees = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.results)
          ? payload.results
          : Array.isArray(payload?.data)
            ? payload.data
            : [];

      setEmployees(rawEmployees.map(normalizeEmployee));
      return rawEmployees.map(normalizeEmployee);
    } catch (err) {
      console.error("Failed to fetch employees:", err);
      throw err;
    }
  }, []);
  /*
   * ==========================================
   * TEAMS
   * ==========================================
   */

  const fetchTeams = useCallback(async (params = {}) => {
    setTeamsLoading(true);

    try {
      const response = await teamAPI.getTeams(params);

      const data = getResponseData(response);

      const normalizedTeams = Array.isArray(data)
        ? data.map(normalizeTeam)
        : [];

      setTeams(normalizedTeams);

      return normalizedTeams;
    } catch (err) {
      console.error("Failed to fetch teams:", err);
      setError(err);
      throw err;
    } finally {
      setTeamsLoading(false);
    }
  }, []);

  const fetchTeam = useCallback(async (id) => {
    const response = await teamAPI.getTeam(id);

    return normalizeTeam(getResponseData(response));
  }, []);

  const fetchTeamMembers = useCallback(async (id) => {
    const response = await teamAPI.getTeamMembers(id);
    const data = getResponseData(response);
    const normalized = Array.isArray(data) ? data.map(normalizeEmployee) : [];
    return normalized;
  }, []);

  /*
   * ==========================================
   * TASKS
   * ==========================================
   */

  const fetchTasks = useCallback(async (params = {}) => {
    setTasksLoading(true);

    try {
      const response = await taskAPI.getTasks(params);

      const data = getResponseData(response);

      const normalizedTasks = Array.isArray(data)
        ? data.map(normalizeTask)
        : [];

      setTasks(normalizedTasks);

      return normalizedTasks;
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
      setError(err);
      throw err;
    } finally {
      setTasksLoading(false);
    }
  }, []);

  const fetchTask = useCallback(async (id) => {
    const response = await taskAPI.getTask(id);

    return normalizeTask(getResponseData(response));
  }, []);

  const fetchTeamTasks = useCallback(async (id, params = {}) => {
    const response = await teamAPI.getTeamTasks(id, params);

    const data = getResponseData(response);

    return Array.isArray(data) ? data.map(normalizeTask) : [];
  }, []);

  /*
   * ==========================================
   * INITIAL LOAD
   * ==========================================
   */

  useEffect(() => {
    let mounted = true;

    const loadInitialData = async () => {
      setLoading(true);
      setError(null);

      try {
        await Promise.all([fetchEmployees(), fetchTeams(), fetchTasks()]);
      } catch (err) {
        if (mounted) {
          setError(err);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadInitialData();

    return () => {
      mounted = false;
    };
  }, [fetchEmployees, fetchTeams, fetchTasks]);

  /*
   * ==========================================
   * TEAM CRUD
   * ==========================================
   */

  const createTeam = useCallback(async (teamData) => {
    const response = await teamAPI.createTeam(teamData);

    const createdTeam = normalizeTeam(getResponseData(response));

    setTeams((current) => [createdTeam, ...current]);

    return createdTeam;
  }, []);

  const updateTeam = useCallback(async (id, teamData) => {
    const response = await teamAPI.updateTeam(id, teamData);

    const updatedTeam = normalizeTeam(getResponseData(response));

    setTeams((current) =>
      current.map((team) =>
        String(team.id) === String(id) ? updatedTeam : team,
      ),
    );

    return updatedTeam;
  }, []);

  const deleteTeam = useCallback(async (id) => {
    await teamAPI.deleteTeam(id);

    /*
     * Backend performs a soft delete.
     * Remove it from the currently displayed list,
     * but do NOT delete tasks locally.
     */
    setTeams((current) =>
      current.filter((team) => String(team.id) !== String(id)),
    );
  }, []);

  /*
   * ==========================================
   * TASK CRUD
   * ==========================================
   */

  const createTask = useCallback(async (taskData) => {
    const response = await taskAPI.createTask(taskData);

    const createdTask = normalizeTask(getResponseData(response));

    setTasks((current) => [createdTask, ...current]);

    return createdTask;
  }, []);

  const updateTask = useCallback(async (id, taskData) => {
    const response = await taskAPI.updateTask(id, taskData);

    const updatedTask = normalizeTask(getResponseData(response));

    setTasks((current) =>
      current.map((task) =>
        String(task.id) === String(id) ? updatedTask : task,
      ),
    );

    return updatedTask;
  }, []);

  const updateTaskStatus = useCallback(async (id, status) => {
    const response = await taskAPI.updateTaskStatus(id, status);

    const updatedTask = normalizeTask(getResponseData(response));

    setTasks((current) =>
      current.map((task) =>
        String(task.id) === String(id)
          ? {
              ...task,
              ...updatedTask,
              status,
            }
          : task,
      ),
    );

    return updatedTask;
  }, []);

  const deleteTask = useCallback(async (id) => {
    await taskAPI.deleteTask(id);

    setTasks((current) =>
      current.filter((task) => String(task.id) !== String(id)),
    );
  }, []);

  /*
   * ==========================================
   * CONTEXT VALUE
   * ==========================================
   */

  const value = useMemo(
    () => ({
      employees,
      teams,
      tasks,

      loading,
      teamsLoading,
      tasksLoading,
      error,

      fetchEmployees,
      fetchTeams,
      fetchTeam,
      fetchTeamMembers,

      fetchTasks,
      fetchTask,
      fetchTeamTasks,

      createTeam,
      updateTeam,
      deleteTeam,

      createTask,
      updateTask,
      updateTaskStatus,
      deleteTask,
    }),
    [
      employees,
      teams,
      tasks,
      loading,
      teamsLoading,
      tasksLoading,
      error,
      fetchEmployees,
      fetchTeams,
      fetchTeam,
      fetchTeamMembers,
      fetchTasks,
      fetchTask,
      fetchTeamTasks,
      createTeam,
      updateTeam,
      deleteTeam,
      createTask,
      updateTask,
      updateTaskStatus,
      deleteTask,
    ],
  );

  return (
    <TeamsTasksContext.Provider value={value}>
      {children}
    </TeamsTasksContext.Provider>
  );
};

export const useTeamsTasks = () => {
  const context = useContext(TeamsTasksContext);

  if (!context) {
    throw new Error("useTeamsTasks must be used inside TeamsTasksProvider");
  }

  return context;
};
