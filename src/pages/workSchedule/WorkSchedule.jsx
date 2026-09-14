
import { useEffect, useState } from "react";
import { ArrowLeft, CalendarDays, Clock, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";

import ShiftList from "../../components/workSchedule/ShiftList/ShiftList";
import WeeklySchedule from "../../components/workSchedule/WeeklySchedule/WeeklySchedule";
import SchedulePreview from "../../components/workSchedule/SchedulePreview/SchedulePreview";

import {
  getWorkSchedule,
  updateWorkSchedule,
} from "../../services/api/workScheduleAPI";

import "./WorkSchedule.css";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const createDefaultWeeklySchedule = () =>
  DAYS.map((day) => ({
    day,
    pattern: "non_working",
    custom_occurrences: [],
    shift_id: null,
  }));

const DEFAULT_SCHEDULE = {
  id: null,
  default_shift_id: null,
  shifts: [],
  weekly_schedule: createDefaultWeeklySchedule(),
  custom_schedules: [],
};

function normalizeShift(shift) {
  if (!shift) return null;

  return {
    ...shift,
    start_time:
      shift.start_time ??
      shift.startTime ??
      "",

    end_time:
      shift.end_time ??
      shift.endTime ??
      "",

    overnight:
      shift.overnight ??
      shift.is_overnight ??
      shift.isOvernight ??
      false,

    break_minutes:
      shift.break_minutes ??
      shift.break_duration_minutes ??
      shift.breakDurationMinutes ??
      0,
  };
}

function normalizeWorkSchedule(data) {
  if (!data) {
    return DEFAULT_SCHEDULE;
  }

  const backendWeekly =
    data.weekly_schedule ||
    data.weeklySchedule ||
    [];

  const backendCustom =
    data.custom_schedules ||
    data.customSchedules ||
    [];

  const weeklyMap = new Map();

  // Always keep all seven days in the frontend state.
  DAYS.forEach((day) => {
    weeklyMap.set(day, {
      day,
      pattern: "non_working",
      custom_occurrences: [],
      shift_id: null,
    });
  });

  /*
   * The backend's `weekly_schedule` already contains
   * the frontend-friendly `pattern` value:
   *
   * every_week
   * non_working
   * custom
   */
  backendWeekly.forEach((item) => {
    const day = item.day || item.day_of_week;

    if (!day || !weeklyMap.has(day)) {
      return;
    }

    weeklyMap.set(day, {
      day,

      pattern:
        item.pattern ||
        (item.is_working_day
          ? "every_week"
          : "non_working"),

      custom_occurrences:
        Array.isArray(item.custom_occurrences)
          ? item.custom_occurrences
          : [],

      shift_id:
        item.shift_id ??
        item.shiftId ??
        null,
    });
  });

  /*
   * Custom schedules are returned separately by the backend.
   * Make sure they are reflected in the weekly frontend state.
   */
  backendCustom.forEach((item) => {
    const day = item.day || item.day_of_week;

    if (!day || !weeklyMap.has(day)) {
      return;
    }

    const occurrences = Array.isArray(item.occurrences)
      ? item.occurrences
      : Array.isArray(item.custom_occurrences)
      ? item.custom_occurrences
      : [];

    const existing = weeklyMap.get(day);

    weeklyMap.set(day, {
      ...existing,
      day,
      pattern: "custom",
      custom_occurrences: occurrences,
      shift_id:
        item.shift_id ??
        item.shiftId ??
        existing.shift_id ??
        null,
    });
  });

  return {
    id: data.id ?? null,

    default_shift_id:
      data.default_shift_id ??
      data.defaultShiftId ??
      data.default_shift?.id ??
      data.defaultShift?.id ??
      null,

    shifts: (data.shifts || [])
      .map(normalizeShift)
      .filter(Boolean),

    weekly_schedule: Array.from(weeklyMap.values()),

    custom_schedules: backendCustom,
  };
}

function WorkSchedule() {
  const navigate = useNavigate();

  const [schedule, setSchedule] = useState(DEFAULT_SCHEDULE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    loadSchedule();
  }, []);

  const loadSchedule = async () => {
    try {
      setLoading(true);

      const response = await getWorkSchedule();

      /*
       * Backend response:
       *
       * {
       *   success: true,
       *   message: "...",
       *   data: {...}
       * }
       */
      const data =
        response?.data?.data ||
        response?.data;

      setSchedule(normalizeWorkSchedule(data));
    } catch (error) {
      console.error(
        "Failed to load work schedule:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  const updateDefaultShift = (default_shift_id) => {
    setSchedule((prev) => ({
      ...prev,
      default_shift_id:
        default_shift_id || null,
    }));
  };

  const updateShifts = (shifts) => {
    setSchedule((prev) => ({
      ...prev,
      shifts,
    }));
  };

  const updateWeeklySchedule = (weekly_schedule) => {
    setSchedule((prev) => ({
      ...prev,
      weekly_schedule,
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaveMessage("");

      /*
       * The backend accepts the complete work schedule
       * in one PUT request.
       */
      const payload = {
        defaultShiftId:
          schedule.default_shift_id || null,

        weeklySchedule:
          schedule.weekly_schedule.map((item) => ({
            day: item.day,
            pattern: item.pattern,
            custom_occurrences:
              item.custom_occurrences || [],
            shift_id:
              item.shift_id ?? null,
          })),

        /*
         * Custom schedules are derived from the
         * weekly schedule so there is only one source
         * of truth in the frontend.
         */
        customSchedules:
          schedule.weekly_schedule
            .filter(
              (item) =>
                item.pattern === "custom"
            )
            .map((item) => ({
              day: item.day,
              occurrences:
                item.custom_occurrences || [],
              shift_id:
                item.shift_id ?? null,
            })),

        /*
         * Existing shifts are sent back so the backend
         * can update/create inline shift definitions.
         */
        shifts: schedule.shifts,

        /*
         * Remove custom rules that no longer exist
         * in the current frontend configuration.
         */
        replaceCustom: true,
      };

      const response =
        await updateWorkSchedule(payload);

      /*
       * Backend again returns:
       * { success, message, data }
       */
      const data =
        response?.data?.data ||
        response?.data;

      /*
       * Re-normalize the backend response.
       * This gives the UI the actual database IDs
       * and latest backend state.
       */
      setSchedule(
        normalizeWorkSchedule(data)
      );

      setSaveMessage(
        "Changes saved successfully."
      );

      setTimeout(() => {
        setSaveMessage("");
      }, 3000);
    } catch (error) {
      console.error(
        "Failed to save work schedule:",
        error
      );

      console.error(
        "Backend response:",
        error?.response?.data
      );

      setSaveMessage(
        error?.response?.data?.message ||
          error?.response?.data?.detail ||
          "Unable to save changes. Please try again."
      );

      setTimeout(() => {
        setSaveMessage("");
      }, 3000);
    } finally {
      setSaving(false);
    }
  };

  const workingDays =
    schedule.weekly_schedule.filter(
      (item) =>
        item.pattern !== "non_working"
    ).length;

  if (loading) {
    return (
      <div className="work-schedule-page">
        <div className="work-schedule-loading">
          <div className="loading-spinner" />
          <p>Loading work schedule...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="work-schedule-page">
      <div className="work-schedule-container">
        <header className="work-schedule-header">
          <div className="work-schedule-header-content">
            <button
              className="back-link"
              onClick={() =>
                navigate(
                  "/organization-overview"
                )
              }
            >
              <ArrowLeft size={15} />
              Organization Overview
            </button>

            <div className="work-schedule-title-row">
              <div>
                <h1>Work Schedule</h1>

                <p>
                  Configure your organization's
                  working days, recurring patterns,
                  shifts and break timings.
                </p>
              </div>

              <div className="work-schedule-header-actions">
                {saveMessage && (
                  <span
                    className={`save-message ${
                      saveMessage.includes(
                        "Unable"
                      )
                        ? "error"
                        : ""
                    }`}
                  >
                    {saveMessage}
                  </span>
                )}

                <button
                  className="save-schedule-button"
                  onClick={handleSave}
                  disabled={saving}
                >
                  <Save size={17} />

                  {saving
                    ? "Saving..."
                    : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="schedule-summary">
          <div className="summary-item">
            <div className="summary-icon">
              <CalendarDays size={18} />
            </div>

            <div>
              <span>Working Days</span>
              <strong>
                {workingDays} / 7
              </strong>
            </div>
          </div>

          <div className="summary-divider" />

          <div className="summary-item">
            <div className="summary-icon">
              <Clock size={18} />
            </div>

            <div>
              <span>Shift Definitions</span>
              <strong>
                {schedule.shifts.length}
              </strong>
            </div>
          </div>
        </div>

        <main className="work-schedule-content">
          <section className="schedule-section">
            <div className="section-heading">
              <div>
                <h2>Shift Definitions</h2>

                <p>
                  Create reusable shifts and
                  assign them to your working
                  days.
                </p>
              </div>
            </div>

            <ShiftList
              shifts={schedule.shifts}
              onChange={updateShifts}
            />
          </section>

          <section className="schedule-section">
            <div className="section-heading">
              <div>
                <h2>Weekly Schedule</h2>

                <p>
                  Configure how your organization
                  operates throughout the week.
                </p>
              </div>
            </div>

            <WeeklySchedule
              schedule={
                schedule.weekly_schedule
              }
              shifts={schedule.shifts}
              defaultShiftId={
                schedule.default_shift_id
              }
              onDefaultShiftChange={
                updateDefaultShift
              }
              onChange={
                updateWeeklySchedule
              }
            />
          </section>

          <section className="schedule-section preview-section">
            <div className="section-heading">
              <div>
                <h2>Schedule Preview</h2>

                <p>
                  Preview the recurring schedule
                  before saving your changes.
                </p>
              </div>
            </div>

            <SchedulePreview
              weeklySchedule={
                schedule.weekly_schedule
              }
              shifts={schedule.shifts}
            />
          </section>
        </main>
      </div>
    </div>
  );
}

export default WorkSchedule;

