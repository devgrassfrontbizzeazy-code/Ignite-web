import { employeeMockData } from "./employeeMockData";

export const getEmployeeName = (employee) =>
  [employee?.first_name, employee?.middle_name, employee?.last_name]
    .filter(Boolean)
    .join(" ") || employee?.full_name || employee?.name || employee?.email || "Employee";

export const getMockEmployees = () => employeeMockData.map((employee) => ({
  ...employee,
  is_active: employee.is_active ?? employee.employment_status !== "INACTIVE",
}));

export const initialTeams = [
  {
    id: "team-website",
    name: "Website Revamp",
    description: "Build and launch the new company website.",
    teamLeadId: "emp-001",
    memberIds: ["emp-001", "emp-002", "emp-003", "emp-004"],
    status: "active",
    createdAt: "2026-08-15T10:00:00.000Z",
  },
  {
    id: "team-operations",
    name: "People Operations",
    description: "Coordinate employee experience and HR operations.",
    teamLeadId: "emp-003",
    memberIds: ["emp-002", "emp-003", "emp-004"],
    status: "active",
    createdAt: "2026-08-20T10:00:00.000Z",
  },
];

export const initialTasks = [
  { id: "task-login", teamId: "team-website", title: "Build Login Page", description: "Create the responsive login page for the website.", assignedTo: "emp-002", priority: "High", status: "In Progress", dueDate: "2026-09-25" },
  { id: "task-api", teamId: "team-website", title: "API Integration", description: "Connect the website forms to the application services.", assignedTo: "emp-003", priority: "Medium", status: "To Do", dueDate: "2026-09-27" },
  { id: "task-testing", teamId: "team-website", title: "Testing", description: "Run responsive and accessibility checks before launch.", assignedTo: "emp-004", priority: "Medium", status: "Completed", dueDate: "2026-09-30" },
];

export const enrichTeam = (team, employees) => {
  const memberIds = Array.isArray(team.memberIds) ? team.memberIds : [];
  const members = employees.filter((employee) => memberIds.some((id) => String(id) === String(employee.id)));
  const lead = members.find((employee) => String(employee.id) === String(team.teamLeadId));
  return { ...team, memberIds, memberNames: members.map(getEmployeeName), teamLeadName: lead ? getEmployeeName(lead) : "Unassigned" };
};

export const enrichTask = (task, teams, employees) => {
  const team = teams.find((item) => String(item.id) === String(task.teamId));
  const assignee = employees.find((employee) => String(employee.id) === String(task.assignedTo));
  return { ...task, teamName: team?.name || "Unknown team", assignedToName: assignee ? getEmployeeName(assignee) : "Unassigned" };
};
