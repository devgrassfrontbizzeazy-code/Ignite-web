import { Users } from "lucide-react";

import TeamRowActions from "../TeamRowActions/TeamRowActions";

import "./TeamTable.css";

const TeamTable = ({
  teams,
  onView,
  onEdit,
  onDelete,
  canEdit = Boolean(onEdit),
  canDelete = Boolean(onDelete),
}) => {
  return (
    <div className="team-table-card">
      <div className="team-table-card__header">
        <div>
          <h3>Team Directory</h3>

          <p>
            {teams.length}{" "}
            {teams.length === 1 ? "team" : "teams"} found
          </p>
        </div>
      </div>

      {teams.length === 0 ? (
        <div className="team-table-empty">
          <div className="team-table-empty__icon">
            <Users size={24} />
          </div>

          <h4>No teams found</h4>

          <p>
            Create a team to start organizing employees
            across departments.
          </p>
        </div>
      ) : (
        <div className="team-table-wrapper">
          <table className="team-table">
            <thead>
              <tr>
                <th>Team</th>
                <th>Description</th>
                <th>Members</th>
                <th>Status</th>
                <th>Created</th>
                <th className="team-table__actions-header">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {teams.map((team) => (
                <tr key={team.id}>
                  <td>
                    <div className="team-table__team">
                      <div className="team-table__icon">
                        <Users size={16} />
                      </div>

                      <div className="team-table__team-info">
                        <div className="team-table__name">
                          {team.name}
                        </div>

                        <div className="team-table__member-summary">
                          {team.memberNames?.slice(0, 2).join(", ") ||
                            "No members"}
                          {team.memberNames?.length > 2
                            ? ` +${
                                team.memberNames.length - 2
                              } more`
                            : ""}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td>
                    <span className="team-table__description">
                      {team.description || "—"}
                    </span>
                  </td>

                  <td>
                    <span className="team-table__member-count">
                      {team.memberIds?.length || 0}
                    </span>
                  </td>

                  <td>
                    <span
                      className={`team-status team-status--${String(
                        team.status || ""
                      ).toLowerCase()}`}
                    >
                      {team.status === "active"
                        ? "Active"
                        : "Inactive"}
                    </span>
                  </td>

                  <td>
                    {team.createdAt
                      ? new Date(
                          team.createdAt
                        ).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "—"}
                  </td>

                  <td className="team-table__actions-cell">
                    <TeamRowActions
                      team={team}
                      onView={onView}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      canEdit={canEdit}
                      canDelete={canDelete}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TeamTable;