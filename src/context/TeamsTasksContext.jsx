import { createContext, useContext, useMemo, useState } from "react";
import { enrichTask, enrichTeam, getMockEmployees, initialTasks, initialTeams } from "../data/teamsTasksMock";

const TeamsTasksContext = createContext(null);

export const teamsTasksViewers = [
  { id: "admin", name: "HR Admin", role: "HR/Admin" },
  { id: "emp-001", name: "Rahul Sharma", role: "Team Lead" },
  { id: "emp-002", name: "Priya Verma", role: "Member" },
];

export const TeamsTasksProvider = ({ children }) => {
  const [employees] = useState(getMockEmployees);
  const [teams, setTeams] = useState(initialTeams);
  const [tasks, setTasks] = useState(initialTasks);
  const [viewerId, setViewerId] = useState(() => {
    try { return localStorage.getItem("ignite:teams-viewer") || "admin"; } catch { return "admin"; }
  });

  const currentViewer = teamsTasksViewers.find((viewer) => viewer.id === viewerId) || teamsTasksViewers[0];
  const value = useMemo(() => ({
    employees,
    teams,
    tasks,
    currentViewer,
    viewers: teamsTasksViewers,
    enrichedTeams: teams.map((team) => enrichTeam(team, employees)),
    enrichedTasks: tasks.map((task) => enrichTask(task, teams, employees)),
    changeViewer: (id) => {
      setViewerId(id);
      try { localStorage.setItem("ignite:teams-viewer", id); } catch { /* preview state remains available */ }
    },
    createTeam: (team) => setTeams((current) => [{ ...team, id: `team-${Date.now()}`, createdAt: new Date().toISOString() }, ...current]),
    updateTeam: (id, updates) => setTeams((current) => current.map((team) => team.id === id ? { ...team, ...updates } : team)),
    deleteTeam: (id) => {
      setTeams((current) => current.filter((team) => team.id !== id));
      setTasks((current) => current.filter((task) => task.teamId !== id));
    },
    createTask: (task) => setTasks((current) => [{ ...task, id: `task-${Date.now()}` }, ...current]),
    updateTask: (id, updates) => setTasks((current) => current.map((task) => task.id === id ? { ...task, ...updates } : task)),
    deleteTask: (id) => setTasks((current) => current.filter((task) => task.id !== id)),
  }), [employees, teams, tasks, currentViewer]);

  return <TeamsTasksContext.Provider value={value}>{children}</TeamsTasksContext.Provider>;
};

export const useTeamsTasks = () => {
  const context = useContext(TeamsTasksContext);
  if (!context) throw new Error("useTeamsTasks must be used inside TeamsTasksProvider");
  return context;
};
