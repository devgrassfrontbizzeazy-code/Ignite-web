import api from "./axios";

export const getTasks = (params = {}) =>
  api.get("/tasks/", { params });

export const getTask = (id) => api.get(`/tasks/${id}/`);

export const createTask = (data) =>
  api.post("/tasks/", {
    team: data.teamId ?? data.team,
    title: data.title,
    description: data.description || "",
    priority: data.priority,
    status: data.status,
    due_date: data.dueDate ?? data.due_date,
    assigned_to: data.assignedTo ?? data.assigned_to,
    is_active: data.isActive ?? data.is_active ?? true,
  });

export const updateTask = (id, data) =>
  api.put(`/tasks/${id}/`, {
    team: data.teamId ?? data.team,
    title: data.title,
    description: data.description || "",
    priority: data.priority,
    status: data.status,
    due_date: data.dueDate ?? data.due_date,
    assigned_to: data.assignedTo ?? data.assigned_to,
    is_active: data.isActive ?? data.is_active ?? true,
  });

export const patchTask = (id, data) => api.patch(`/tasks/${id}/`, data);

export const updateTaskStatus = (id, status) =>
  api.patch(`/tasks/${id}/status/`, { status });

export const deleteTask = (id) => api.delete(`/tasks/${id}/`);

export const getTaskStats = () => api.get("/tasks/stats/");

const taskAPI = {
  getTasks,
  getTask,
  createTask,
  updateTask,
  patchTask,
  updateTaskStatus,
  deleteTask,
  getTaskStats,
};

export default taskAPI;