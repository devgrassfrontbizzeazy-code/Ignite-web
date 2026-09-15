import api from "./axios";

/**
 * Dashboard API
 *
 * The backend dashboard response will eventually determine:
 * - which widgets are available
 * - widget data
 * - widget configuration/layout
 *
 * Do not add role-specific logic here.
 */

export const getDashboard = async () => {
  const response = await api.get("/dashboard/");
  return response.data;
};