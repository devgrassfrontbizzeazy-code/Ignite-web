import { useEffect, useMemo, useState } from "react";
import { Users } from "lucide-react";

import Button from "../../components/common/Button/Button";
import Modal from "../../components/common/Modal/Modal";
import IgniteLoader from "../../components/common/IgniteLoader/IgniteLoader";

import TeamForm from "../../components/teams/TeamForm/TeamForm";
import TeamTable from "../../components/teams/TeamTable/TeamTable";
import ConfirmModal from "../../components/common/ConfirmModal/ConfirmModal";

import employeeService from "../../services/employeeService";
import { useNotification } from "../../context/NotificationContext";

import "./Teams.css";

const getEmployeeName = (employee) =>
  [
    employee.first_name,
    employee.middle_name,
    employee.last_name,
  ]
    .filter(Boolean)
    .join(" ") ||
  employee.full_name ||
  employee.email ||
  "Employee";

const Teams = () => {
  /*
   * =========================
   * EMPLOYEES
   * =========================
   */

  const [employees, setEmployees] = useState([]);
  const [employeesLoading, setEmployeesLoading] =
    useState(true);

  /*
   * =========================
   * TEAMS
   * =========================
   */

  const [teams, setTeams] = useState([]);

  /*
   * =========================
   * UI
   * =========================
   */

  const [showCreateModal, setShowCreateModal] =
    useState(false);

  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
 /*
   * =========================
   * NOTIFICATION
   * =========================
   */

  const { showNotification } = useNotification();
  /*
   * =========================
   * LOAD EMPLOYEES
   * =========================
   */

  useEffect(() => {
    const loadEmployees = async () => {
      try {
        setEmployeesLoading(true);

        const data =
          await employeeService.getAll();

        setEmployees(
          Array.isArray(data) ? data : []
        );
      } catch (error) {
        console.error(
          "Failed to load employees:",
          error
        );

        setEmployees([]);

        showNotification(
          "error",
          "Failed to load employees."
        );
      } finally {
        setEmployeesLoading(false);
      }
    };

    loadEmployees();
  }, []);

 

  /*
   * =========================
   * FILTER TEAMS
   * =========================
   */

  const filteredTeams = useMemo(() => {
    const searchValue =
      search.trim().toLowerCase();

    if (!searchValue) {
      return teams;
    }

    return teams.filter((team) => {
      return (
        team.name
          ?.toLowerCase()
          .includes(searchValue) ||
        team.description
          ?.toLowerCase()
          .includes(searchValue) ||
        team.memberNames?.some((name) =>
          name.toLowerCase().includes(searchValue)
        )
      );
    });
  }, [teams, search]);

  /*
   * =========================
   * CREATE TEAM
   * =========================
   */

  const handleCreateTeam = async (formData) => {
    try {
      setLoading(true);

      const selectedEmployees =
        employees.filter((employee) =>
          formData.memberIds.some(
            (id) =>
              String(id) ===
              String(employee.id)
          )
        );

      const newTeam = {
        id: `team-${Date.now()}`,
        name: formData.teamName,
        description: formData.description,
        memberIds: formData.memberIds,
        memberNames: selectedEmployees.map(
          getEmployeeName
        ),
        status: formData.status,
        createdAt: new Date().toISOString(),
      };

      setTeams((previous) => [
        newTeam,
        ...previous,
      ]);

      setShowCreateModal(false);

      showNotification(
        "success",
        "Team created successfully."
      );
    } catch (error) {
      console.error(
        "Failed to create team:",
        error
      );

      showNotification(
        "error",
        "Unable to create team."
      );
    } finally {
      setLoading(false);
    }
  };

  /*
   * =========================
   * VIEW TEAM
   * =========================
   */

  const handleViewTeam = (team) => {
    console.log("View team:", team);
  };

  /*
   * =========================
   * EDIT TEAM
   * =========================
   */

  const handleEditTeam = (team) => {
    console.log("Edit team:", team);

    showNotification(
      "success",
      "Team editing will be connected in the next step."
    );
  };

  const [deleteModal, setDeleteModal] = useState({
    open: false,
    team: null,
  });

  const handleDeleteTeam = (team) => {
    setDeleteModal({
      open: true,
      team,
    });
  };

  const handleConfirmDeleteTeam = () => {
    const team = deleteModal.team;
    if (!team) return;

    setTeams((previous) =>
      previous.filter((item) => item.id !== team.id)
    );

    setDeleteModal({ open: false, team: null });
    showNotification("success", `Team "${team.name}" deleted successfully.`);
  };

  /*
   * =========================
   * DATE
   * =========================
   */

  const formattedDate =
    new Intl.DateTimeFormat("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date());

  /*
   * =========================
   * LOADING
   * =========================
   */

  if (employeesLoading) {
    return (
      <main className="teams-page">
        <header className="teams-page__header">
          <div>
            <span className="teams-page__eyebrow">
              TEAMS
            </span>

            <h1>Teams</h1>

            <p>
              Organize employees into collaborative
              teams across departments.
            </p>
          </div>

          <div className="teams-page__header-actions">
            <div className="teams-page__date">
              <Users size={15} />
              <span>{formattedDate}</span>
            </div>
          </div>
        </header>

        <IgniteLoader text="Loading employees..." />
      </main>
    );
  }

  /*
   * =========================
   * PAGE
   * =========================
   */

  return (
    <main className="teams-page">
      {/* HEADER */}
      <header className="teams-page__header">
        <div>
          <span className="teams-page__eyebrow">
            TEAMS
          </span>

          <h1>Teams</h1>

          <p>
            Organize employees into collaborative
            teams across departments.
          </p>
        </div>

        <div className="teams-page__header-actions">
          <div className="teams-page__date">
            <Users size={15} />
            <span>{formattedDate}</span>
          </div>

          <Button
            variant="primary"
            onClick={() =>
              setShowCreateModal(true)
            }
          >
            + Create Team
          </Button>
        </div>
      </header>

      {/* SEARCH */}
      <section className="teams-page__toolbar">
        <div className="teams-page__search">
          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search teams or members..."
          />
        </div>

        <div className="teams-page__count">
          {filteredTeams.length}{" "}
          {filteredTeams.length === 1
            ? "team"
            : "teams"}
        </div>
      </section>

      {/* TABLE */}
      <TeamTable
        teams={filteredTeams}
        onView={handleViewTeam}
        onEdit={handleEditTeam}
        onDelete={handleDeleteTeam}
      />

      {/* CREATE MODAL */}
      <Modal
        open={showCreateModal}
        onClose={() =>
          !loading &&
          setShowCreateModal(false)
        }
        title="Create Team"
        description="Create a team and select the employees who will be part of it."
        size="medium"
        closeOnBackdrop={!loading}
        closeOnEscape={!loading}
      >
        <TeamForm
  initialData={{
    teamName: "",
    description: "",
    memberIds: [],
    status: "active",
  }}
  employees={employees}
  onSubmit={handleCreateTeam}
  onCancel={() =>
    !loading &&
    setShowCreateModal(false)
  }
  loading={loading}
/>
      </Modal>

      {deleteModal.open && (
        <ConfirmModal
          open={deleteModal.open}
          onClose={() => setDeleteModal({ open: false, team: null })}
          onConfirm={handleConfirmDeleteTeam}
          title="Delete Team?"
          itemName={deleteModal.team?.name}
          confirmText="Delete"
        />
      )}
    </main>
  );
};

export default Teams;