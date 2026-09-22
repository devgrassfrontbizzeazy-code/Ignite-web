import api from "./axios";

const normalizeStatus = (status) => {
  if (status === "inactive" || status === "Inactive") {
    return "Inactive";
  }

  return "Active";
};

export const getTeams = (params = {}) => api.get("/teams/", { params });

export const getTeam = (id) => api.get(`/teams/${id}/`);

export const createTeam = (data) =>
  api.post("/teams/", {
    name: data.teamName || data.name,
    description: data.description || "",
    team_lead: data.teamLeadId,
    members: data.memberIds || [],
    status: normalizeStatus(data.status),
    is_active: normalizeStatus(data.status) === "Active",
  });

export const updateTeam = (id, data) =>
  api.put(`/teams/${id}/`, {
    name: data.teamName || data.name,
    description: data.description || "",
    team_lead: data.teamLeadId,
    members: data.memberIds || [],
    status: normalizeStatus(data.status),
    is_active: normalizeStatus(data.status) === "Active",
  });

export const deleteTeam = (id) => api.delete(`/teams/${id}/`);

export const getTeamMembers = (id) => api.get(`/teams/${id}/members/`);

export const getTeamTasks = (id, params = {}) =>
  api.get(`/teams/${id}/tasks/`, { params });

const teamAPI = {
  getTeams,
  getTeam,
  createTeam,
  updateTeam,
  deleteTeam,
  getTeamMembers,
  getTeamTasks,
};

export default teamAPI;