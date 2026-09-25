import { CheckCircle2, Users, ClipboardList } from "lucide-react";

import DashboardWidget from "../../../DashboardWidget/DashboardWidget";
import "./TeamTaskOverviewWidget.css";

const getTaskCompletion = (tasks = [], teamId) => {
  const teamTasks = tasks.filter(
    (task) => String(task?.teamId) === String(teamId),
  );

  const total = teamTasks.length;

  const completed = teamTasks.filter(
    (task) =>
      String(task?.status || "").toLowerCase() === "completed",
  ).length;

  const percentage =
    total > 0 ? Math.round((completed / total) * 100) : 0;

  return {
    total,
    completed,
    percentage,
  };
};

const TeamTaskOverviewWidget = ({ data, loading }) => {
  const teams = Array.isArray(data?.teams) ? data.teams : [];
  const tasks = Array.isArray(data?.tasks) ? data.tasks : [];

  const totalTeams = teams.length;
  const totalTasks = tasks.length;

  const teamTaskData = teams
    .map((team) => {
      const taskStats = getTaskCompletion(tasks, team.id);

      return {
        id: team.id,
        name: team.teamName || team.name || "Unnamed Team",
        ...taskStats,
      };
    })
    .filter((team) => team.total > 0);

  return (
    <DashboardWidget
      title="Team & Task Overview"
      action="View All"
      onAction={() => {
        window.location.href = "/tasks";
      }}
      loading={loading}
      className="team-task-overview-widget"
    >
      <div className="team-task-overview">
        {/* Summary */}
        <div className="team-task-overview__summary">
          <div className="team-task-overview__summary-card">
            <div className="team-task-overview__summary-icon">
              <Users size={16} />
            </div>

            <div>
              <span>Total Teams</span>
              <strong>{totalTeams}</strong>
            </div>
          </div>

          <div className="team-task-overview__summary-card">
            <div className="team-task-overview__summary-icon team-task-overview__summary-icon--tasks">
              <ClipboardList size={16} />
            </div>

            <div>
              <span>Total Tasks</span>
              <strong>{totalTasks}</strong>
            </div>
          </div>
        </div>

        {/* Team breakdown */}
        {teamTaskData.length > 0 ? (
          <div className="team-task-overview__teams">
            {teamTaskData.map((team) => (
              <div
                className="team-task-overview__team"
                key={team.id}
              >
                <div className="team-task-overview__team-header">
                  <span className="team-task-overview__team-name">
                    {team.name}
                  </span>

                  <span className="team-task-overview__team-count">
                    {team.completed}/{team.total}
                  </span>
                </div>

                <div className="team-task-overview__progress">
                  <div
                    className="team-task-overview__progress-fill"
                    style={{
                      width: `${team.percentage}%`,
                    }}
                  />
                </div>

                <div className="team-task-overview__team-footer">
                  <span>
                    {team.completed} completed
                  </span>

                  <span>
                    {team.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="team-task-overview__empty">
            <CheckCircle2 size={18} />
            <span>No team tasks available.</span>
          </div>
        )}
      </div>
    </DashboardWidget>
  );
};

export default TeamTaskOverviewWidget;