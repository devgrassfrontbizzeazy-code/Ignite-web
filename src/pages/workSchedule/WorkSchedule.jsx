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

const DEFAULT_SCHEDULE = {
  shifts: [],
  weekly_schedule: [
    { day: "Monday", pattern: "non_working", custom_occurrences: [], shift_id: null },
    { day: "Tuesday", pattern: "non_working", custom_occurrences: [], shift_id: null },
    { day: "Wednesday", pattern: "non_working", custom_occurrences: [], shift_id: null },
    { day: "Thursday", pattern: "non_working", custom_occurrences: [], shift_id: null },
    { day: "Friday", pattern: "non_working", custom_occurrences: [], shift_id: null },
    { day: "Saturday", pattern: "non_working", custom_occurrences: [], shift_id: null },
    { day: "Sunday", pattern: "non_working", custom_occurrences: [], shift_id: null },
  ],
};

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

      if (response?.data) {
        setSchedule({
          ...DEFAULT_SCHEDULE,
          ...response.data,
          shifts: response.data.shifts || [],
          weekly_schedule:
            response.data.weekly_schedule ||
            DEFAULT_SCHEDULE.weekly_schedule,
        });
      }
    } catch (error) {
      console.error("Failed to load work schedule:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaveMessage("");

      await updateWorkSchedule(schedule);

      setSaveMessage("Changes saved successfully.");

      setTimeout(() => {
        setSaveMessage("");
      }, 3000);
    } catch (error) {
      console.error("Failed to save work schedule:", error);
      setSaveMessage("Unable to save changes. Please try again.");

      setTimeout(() => {
        setSaveMessage("");
      }, 3000);
    } finally {
      setSaving(false);
    }
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

  const workingDays = schedule.weekly_schedule.filter(
    (item) => item.pattern !== "non_working"
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
      onClick={() => navigate("/organization-overview")}
    >
      <ArrowLeft size={15} />
      Organization Overview
    </button>

    <div className="work-schedule-title-row">
      <div>
        <h1>Work Schedule</h1>

        <p>
          Configure your organization's working days, recurring patterns,
          shifts and break timings.
        </p>
      </div>

      <div className="work-schedule-header-actions">
        {saveMessage && (
          <span
            className={`save-message ${
              saveMessage.includes("Unable") ? "error" : ""
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
          {saving ? "Saving..." : "Save Changes"}
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
              <strong>{workingDays} / 7</strong>
            </div>
          </div>

          <div className="summary-divider" />

          <div className="summary-item">
            <div className="summary-icon">
              <Clock size={18} />
            </div>

            <div>
              <span>Shift Definitions</span>
              <strong>{schedule.shifts.length}</strong>
            </div>
          </div>
        </div>

        <main className="work-schedule-content">
          <section className="schedule-section">
            <div className="section-heading">
              <div>
                <h2>Shift Definitions</h2>
                <p>
                  Create reusable shifts and assign them to your working days.
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
                  Configure how your organization operates throughout the
                  week.
                </p>
              </div>
            </div>

            <WeeklySchedule
              schedule={schedule.weekly_schedule}
              shifts={schedule.shifts}
              onChange={updateWeeklySchedule}
            />
          </section>

          <section className="schedule-section preview-section">
            <div className="section-heading">
              <div>
                <h2>Schedule Preview</h2>
                <p>
                  Preview the recurring schedule before saving your changes.
                </p>
              </div>
            </div>

            <SchedulePreview
              weeklySchedule={schedule.weekly_schedule}
              shifts={schedule.shifts}
            />
          </section>
        </main>
      </div>
    </div>
  );
}

export default WorkSchedule;