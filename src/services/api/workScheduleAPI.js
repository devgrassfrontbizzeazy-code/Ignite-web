import api from "./axios";

const WORK_SCHEDULE_ENDPOINT = "/work-schedules/";
const SHIFTS_ENDPOINT = "/work-schedules/shifts/";
const CUSTOM_SCHEDULE_ENDPOINT = "/work-schedules/custom/";
const PREVIEW_ENDPOINT = "/work-schedules/preview";

export const getWorkSchedule = () =>
  api.get(WORK_SCHEDULE_ENDPOINT);

export const updateWorkSchedule = (payload) =>
  api.put(WORK_SCHEDULE_ENDPOINT, payload);

// Shifts
export const getShifts = () =>
  api.get(SHIFTS_ENDPOINT);

export const createShift = (payload) =>
  api.post(SHIFTS_ENDPOINT, payload);

export const updateShift = (id, payload) =>
  api.patch(`${SHIFTS_ENDPOINT}${id}/`, payload);

export const deleteShift = (id) =>
  api.delete(`${SHIFTS_ENDPOINT}${id}/`);

// Custom schedules
export const getCustomSchedules = () =>
  api.get(CUSTOM_SCHEDULE_ENDPOINT);

export const createCustomSchedule = (payload) =>
  api.post(CUSTOM_SCHEDULE_ENDPOINT, payload);

export const updateCustomSchedule = (id, payload) =>
  api.patch(`${CUSTOM_SCHEDULE_ENDPOINT}${id}/`, payload);

export const deleteCustomSchedule = (id) =>
  api.delete(`${CUSTOM_SCHEDULE_ENDPOINT}${id}/`);

// Preview
export const getSchedulePreview = (month) =>
  api.get(PREVIEW_ENDPOINT, {
    params: month ? { month } : {},
  });