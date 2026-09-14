import api from "./axios";

const WORK_SCHEDULE_ENDPOINT = "/work-schedule/";

export const getWorkSchedule = async () => {
  const response = await api.get(WORK_SCHEDULE_ENDPOINT);
  return response;
};

export const updateWorkSchedule = async (schedule) => {
  const response = await api.put(
    WORK_SCHEDULE_ENDPOINT,
    schedule
  );
  return response;
};