import { useMemo, useState } from "react";
import {
  Search,
  UserPlus,
  UserMinus,
  X,
} from "lucide-react";

import Button from "../../common/Button/Button";
import ConfirmModal from "../../common/ConfirmModal/ConfirmModal";

import { useTeamsTasks } from "../../../context/TeamsTasksContext";
import { useNotification } from "../../../context/NotificationContext";

import "./TeamMemberManager.css";
const getTeamId = (team = {}) => {
  if (!team) return null;

  return (
    team.id ??
    team.team_id ??
    team.teamId ??
    null
  );
};
const getEmployeeId = (employee) => {
  if (!employee) return null;

  if (
    typeof employee === "number" ||
    typeof employee === "string"
  ) {
    return employee;
  }

  return (
    employee.id ??
    employee.employee_id ??
    employee.employeeId ??
    employee.pk ??
    null
  );
};

const getEmployeeName = (employee = {}) =>
  [
    employee.first_name || employee.firstName,
    employee.middle_name || employee.middleName,
    employee.last_name || employee.lastName,
  ]
    .filter(Boolean)
    .join(" ") ||
  employee.full_name ||
  employee.fullName ||
  employee.email ||
  "Employee";

const getEmployeeEmail = (employee = {}) =>
  employee.email ||
  employee.work_email ||
  employee.official_email ||
  "";

const getEmployeeCode = (employee = {}) =>
  employee.employee_code ||
  employee.employeeCode ||
  employee.employee_id_code ||
  employee.code ||
  "";

const TeamMemberManager = ({
  team,
  members = [],
  employees = [],
  onMembersUpdated,
}) => {
  const { updateTeam } = useTeamsTasks();
  const { notify } = useNotification();

  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [removeTarget, setRemoveTarget] =
    useState(null);

  const currentMemberIds = useMemo(
    () =>
      members
        .map(getEmployeeId)
        .filter(
          (id) =>
            id !== null &&
            id !== undefined,
        ),
    [members],
  );

  const availableEmployees = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return [];

    return employees
      .filter((employee) => {
        const employeeId =
          getEmployeeId(employee);

        // Do not show employees already in this team
        if (
          currentMemberIds.some(
            (id) =>
              String(id) ===
              String(employeeId),
          )
        ) {
          return false;
        }

        const name =
          getEmployeeName(employee).toLowerCase();

        const email =
          getEmployeeEmail(employee).toLowerCase();

        const code =
          getEmployeeCode(employee).toLowerCase();

        return (
          name.includes(query) ||
          email.includes(query) ||
          code.includes(query)
        );
      })
      .slice(0, 8);
  }, [
    employees,
    currentMemberIds,
    search,
  ]);

  const handleAddMember = async (employee) => {
    if (!team) return;

    const employeeId =
      getEmployeeId(employee);

    if (
      employeeId === null ||
      employeeId === undefined
    ) {
      notify.error(
        "Unable to identify this employee.",
      );
      return;
    }

    if (
      currentMemberIds.some(
        (id) =>
          String(id) ===
          String(employeeId),
      )
    ) {
      notify.error(
        "This employee is already a team member.",
      );
      return;
    }

    setSaving(true);
    

    try {
        const teamId = getTeamId(team);

if (teamId === null || teamId === undefined) {
  notify.error("Unable to identify this team.");
  return;
}

await updateTeam(teamId, {
        teamName:
          team.teamName ||
          team.team_name ||
          team.name ||
          "",

        description:
          team.description || "",

        teamLeadId:
          team.teamLeadId ??
          team.team_lead_id ??
          team.team_lead?.id ??
          team.teamLead?.id ??
          team.team_lead ??
          "",

        memberIds: [
          ...currentMemberIds,
          employeeId,
        ],

        status:
          team.status === "Inactive" ||
          team.status === "inactive" ||
          team.is_active === false
            ? "inactive"
            : "active",
      });

      setSearch("");

      await onMembersUpdated?.();

      notify.success(
        `${getEmployeeName(employee)} added to the team.`,
      );
    } catch (err) {
      console.error(
        "Failed to add team member:",
        err,
      );

      notify.error(
        err?.response?.data?.detail ||
          "Failed to add team member.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveClick = (employee) => {
    const employeeId =
      getEmployeeId(employee);

    const teamLeadId =
      team.teamLeadId ??
      team.team_lead_id ??
      team.team_lead?.id ??
      team.teamLead?.id ??
      team.team_lead ??
      "";

    if (
      String(employeeId) ===
      String(teamLeadId)
    ) {
      notify.error(
        "You cannot remove the team lead. Assign another team lead first.",
      );
      return;
    }

    setRemoveTarget({
      employee,
      employeeId,
      name: getEmployeeName(employee),
    });
  };

  const handleConfirmRemove = async () => {
    if (!team || !removeTarget) return;

    setSaving(true);

    try {
      const updatedMemberIds =
        currentMemberIds.filter(
          (id) =>
            String(id) !==
            String(removeTarget.employeeId),
        );

      const teamId = getTeamId(team);

if (teamId === null || teamId === undefined) {
  notify.error("Unable to identify this team.");
  return;
}

await updateTeam(teamId, {
        teamName:
          team.teamName ||
          team.team_name ||
          team.name ||
          "",

        description:
          team.description || "",

        teamLeadId:
          team.teamLeadId ??
          team.team_lead_id ??
          team.team_lead?.id ??
          team.teamLead?.id ??
          team.team_lead ??
          "",

        memberIds: updatedMemberIds,

        status:
          team.status === "Inactive" ||
          team.status === "inactive" ||
          team.is_active === false
            ? "inactive"
            : "active",
      });

      await onMembersUpdated?.();

      notify.success(
        `${removeTarget.name} removed from the team.`,
      );

      setRemoveTarget(null);
    } catch (err) {
      console.error(
        "Failed to remove team member:",
        err,
      );

      notify.error(
        err?.response?.data?.detail ||
          "Failed to remove team member.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="team-member-manager">
      {/* CURRENT MEMBERS */}

      <section className="team-member-manager__section">
        <div className="team-member-manager__section-header">
          <div>
            <h3>Current Members</h3>
            <p>
              {members.length}{" "}
              {members.length === 1
                ? "member"
                : "members"}{" "}
              in this team.
            </p>
          </div>
        </div>

        <div className="team-member-manager__members">
          {members.length === 0 ? (
            <div className="team-member-manager__empty">
              <UserPlus size={20} />
              <p>
                No members have been added
                yet.
              </p>
            </div>
          ) : (
            members.map((employee) => {
              const employeeId =
                getEmployeeId(employee);

              const employeeName =
                getEmployeeName(employee);

              const email =
                getEmployeeEmail(employee);

              const designation =
                employee.designation?.name ||
                employee.designation_name ||
                employee.designationName ||
                "";

              const teamLeadId =
                team.teamLeadId ??
                team.team_lead_id ??
                team.team_lead?.id ??
                team.teamLead?.id ??
                team.team_lead ??
                "";

              const isTeamLead =
                String(employeeId) ===
                String(teamLeadId);

              return (
                <div
                  className="team-member-manager__member"
                  key={employeeId}
                >
                  <div className="team-member-manager__avatar">
                    {employeeName
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div className="team-member-manager__member-info">
                    <div className="team-member-manager__member-name">
                      {employeeName}

                      {isTeamLead && (
                        <span className="team-member-manager__lead-badge">
                          Team Lead
                        </span>
                      )}
                    </div>

                    <div className="team-member-manager__member-meta">
                      {designation ||
                        email ||
                        "Employee"}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="team-member-manager__remove"
                    onClick={() =>
                      handleRemoveClick(
                        employee,
                      )
                    }
                    disabled={saving || isTeamLead}
                    title={
                      isTeamLead
                        ? "Assign another team lead first"
                        : `Remove ${employeeName}`
                    }
                  >
                    <UserMinus size={16} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* ADD MEMBER */}

      <section className="team-member-manager__section">
        <div className="team-member-manager__section-header">
          <div>
            <h3>Add Member</h3>
            <p>
              Search by employee name,
              email, or employee code.
            </p>
          </div>
        </div>

        <div className="team-member-manager__search">
          <Search size={18} />

          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search employee..."
            autoComplete="off"
          />

          {search && (
            <button
              type="button"
              className="team-member-manager__clear"
              onClick={() => setSearch("")}
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {search.trim() && (
          <div className="team-member-manager__results">
            {availableEmployees.length === 0 ? (
              <div className="team-member-manager__no-results">
                No available employees found.
              </div>
            ) : (
              availableEmployees.map(
                (employee) => {
                  const employeeId =
                    getEmployeeId(
                      employee,
                    );

                  const employeeName =
                    getEmployeeName(
                      employee,
                    );

                  const email =
                    getEmployeeEmail(
                      employee,
                    );

                  const code =
                    getEmployeeCode(
                      employee,
                    );

                  return (
                    <button
                      type="button"
                      key={employeeId}
                      className="team-member-manager__result"
                      onClick={() =>
                        handleAddMember(
                          employee,
                        )
                      }
                      disabled={saving}
                    >
                      <div className="team-member-manager__avatar">
                        {employeeName
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div className="team-member-manager__result-info">
                        <strong>
                          {employeeName}
                        </strong>

                        <span>
                          {email ||
                            code ||
                            "Employee"}
                        </span>
                      </div>

                      <UserPlus size={17} />
                    </button>
                  );
                },
              )
            )}
          </div>
        )}

        {!search.trim() && (
          <div className="team-member-manager__search-hint">
            Start typing to search for an
            employee.
          </div>
        )}
      </section>

      {/* CONFIRM REMOVE */}

      <ConfirmModal
        open={Boolean(removeTarget)}
        onClose={() => {
          if (!saving) {
            setRemoveTarget(null);
          }
        }}
        onConfirm={handleConfirmRemove}
        title="Remove Team Member"
        description={
          removeTarget
            ? `Are you sure you want to remove "${removeTarget.name}" from this team? They will no longer be a member of the team.`
            : ""
        }
        confirmText="Remove Member"
        cancelText="Cancel"
        variant="danger"
        loading={saving}
      />
    </div>
  );
};

export default TeamMemberManager;