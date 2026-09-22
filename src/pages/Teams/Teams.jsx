import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import Button from "../../components/common/Button/Button";
import BackButton from "../../components/common/BackButton/BackButton";
import ConfirmModal from "../../components/common/ConfirmModal/ConfirmModal";
import Modal from "../../components/common/Modal/Modal";
import PageHeader from "../../components/common/PageHeader/PageHeader";
import TeamForm from "../../components/teams/TeamForm/TeamForm";
import TeamTable from "../../components/teams/TeamTable/TeamTable";

import { useTeamsTasks } from "../../context/TeamsTasksContext";
import { useNotification } from "../../context/NotificationContext";

import "./Teams.css";

const Teams = () => {
  const navigate = useNavigate();
  const { notify } = useNotification();

  const {
    employees,
    teams,
    tasks,
    teamsLoading,
    createTeam,
    updateTeam,
    deleteTeam,
  } = useTeamsTasks();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const [formOpen, setFormOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  /*
   * ==========================================
   * FILTER TEAMS
   * ==========================================
   */

  const visibleTeams = useMemo(() => {
    const query = search.trim().toLowerCase();

    return teams.filter((team) => {
      const teamName =
        team.teamName ||
        team.name ||
        "";

      const description =
        team.description ||
        "";

      const teamLeadName =
        team.teamLeadName ||
        team.team_lead_name ||
        "";

      const matchesSearch =
        !query ||
        [
          teamName,
          description,
          teamLeadName,
        ].some((value) =>
          String(value)
            .toLowerCase()
            .includes(query)
        );

      const teamStatus =
        team.status || "active";

      const matchesStatus =
        status === "all" ||
        teamStatus === status;

      return matchesSearch && matchesStatus;
    });
  }, [teams, search, status]);

  const teamsWithTaskStats = useMemo(
    () => visibleTeams.map((team) => {
      const teamTasks = tasks.filter((task) => String(task.teamId) === String(team.id));
      return {
        ...team,
        activeTaskCount: teamTasks.filter((task) => task.status !== "Completed").length,
        completedTaskCount: teamTasks.filter((task) => task.status === "Completed").length,
      };
    }),
    [visibleTeams, tasks]
  );

  /*
   * ==========================================
   * OPEN CREATE
   * ==========================================
   */

  const handleCreate = () => {
    setSelectedTeam(null);
    setFormOpen(true);
  };

  /*
   * ==========================================
   * OPEN EDIT
   * ==========================================
   */

  const handleEdit = (team) => {
    setSelectedTeam(team);
    setFormOpen(true);
  };

  /*
   * ==========================================
   * SUBMIT TEAM
   * ==========================================
   */

  const submitTeam = async (formData) => {
    setSaving(true);

    try {
      const data = {
        teamName: formData.teamName,
        description: formData.description,
        teamLeadId: formData.teamLeadId,
        memberIds: formData.memberIds,
        status: formData.status,
      };

      if (selectedTeam) {
        await updateTeam(selectedTeam.id, data);

        notify.success("Team updated successfully.");
      } else {
        await createTeam(data);

        notify.success("Team created successfully.");
      }

      setFormOpen(false);
      setSelectedTeam(null);
    } catch (error) {
      console.error("Failed to save team:", error);

      notify.error(
        error?.response?.data?.detail ||
          "Failed to save team. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  /*
   * ==========================================
   * DELETE TEAM
   * ==========================================
   */

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);

    try {
      await deleteTeam(deleteTarget.id);

      notify.success(
        `Team "${deleteTarget.teamName || deleteTarget.name}" deleted successfully.`
      );

      setDeleteTarget(null);
    } catch (error) {
      console.error("Failed to delete team:", error);

      notify.error(
        error?.response?.data?.detail ||
          "Failed to delete team. Please try again."
      );
    } finally {
      setDeleting(false);
    }
  };

  /*
   * ==========================================
   * RENDER
   * ==========================================
   */

  return (
    <main className="teams-page">
      <BackButton label="Back to Work Management" onClick={() => navigate("/work-management")} />
      <PageHeader
        eyebrow="Organization"
        title="Teams"
        description="Teams bring employees together across departments to collaborate and manage work."
        action={
          <Button
            variant="primary"
            onClick={handleCreate}
            disabled={teamsLoading}
          >
            + Create Team
          </Button>
        }
      />

      <section className="teams-page__toolbar">
        <input
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
          placeholder="Search teams or team leads..."
          disabled={teamsLoading}
        />

        <select
          value={status}
          onChange={(event) =>
            setStatus(event.target.value)
          }
          disabled={teamsLoading}
        >
          <option value="all">
            All statuses
          </option>

          <option value="active">
            Active
          </option>

          <option value="inactive">
            Inactive
          </option>
        </select>

        <span>
          {visibleTeams.length}{" "}
          {visibleTeams.length === 1
            ? "team"
            : "teams"}
        </span>
      </section>

      {teamsLoading ? (
        <div className="teams-page__loading">
          Loading teams...
        </div>
      ) : (
        <TeamTable
          teams={teamsWithTaskStats}
          onView={(team) =>
            navigate(`/teams/${team.id}`)
          }
          onEdit={handleEdit}
          onDelete={setDeleteTarget}
        />
      )}

      <Modal
        open={formOpen}
        onClose={() => {
          if (!saving) {
            setFormOpen(false);
            setSelectedTeam(null);
          }
        }}
        title={
          selectedTeam
            ? "Edit Team"
            : "Create Team"
        }
        description="Teams can include employees from different departments."
        size="medium"
      >
        <TeamForm
          initialData={
            selectedTeam || {
              teamName: "",
              description: "",
              teamLeadId: "",
              memberIds: [],
              status: "active",
            }
          }
          employees={employees}
          onSubmit={submitTeam}
          onCancel={() => {
            if (!saving) {
              setFormOpen(false);
              setSelectedTeam(null);
            }
          }}
          loading={saving}
        />
      </Modal>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        onClose={() => {
          if (!deleting) {
            setDeleteTarget(null);
          }
        }}
        onConfirm={confirmDelete}
        title="Delete Team?"
        itemName={
          deleteTarget?.teamName ||
          deleteTarget?.name
        }
        confirmText={
          deleting ? "Deleting..." : "Delete"
        }
      />
    </main>
  );
};

export default Teams;