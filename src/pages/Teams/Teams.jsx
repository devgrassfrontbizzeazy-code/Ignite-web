import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/common/Button/Button";
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
  const { employees, enrichedTeams, currentViewer, viewers, changeViewer, createTeam, updateTeam, deleteTeam } = useTeamsTasks();
  const isAdmin = currentViewer.id === "admin";
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const visibleTeams = useMemo(() => {
    const accessible = isAdmin ? enrichedTeams : enrichedTeams.filter((team) => team.memberIds.includes(currentViewer.id));
    const query = search.trim().toLowerCase();
    return accessible.filter((team) => {
      const matchesSearch = !query || [team.name, team.description, team.teamLeadName, ...team.memberNames].some((value) => value?.toLowerCase().includes(query));
      return matchesSearch && (status === "all" || team.status === status);
    });
  }, [enrichedTeams, currentViewer.id, isAdmin, search, status]);

  const submitTeam = (formData) => {
    const data = { name: formData.teamName, description: formData.description, teamLeadId: formData.teamLeadId, memberIds: formData.memberIds, status: formData.status };
    if (selectedTeam) { updateTeam(selectedTeam.id, data); notify.success("Team updated in local workspace."); }
    else { createTeam(data); notify.success("Team created in local workspace."); }
    setFormOpen(false);
    setSelectedTeam(null);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteTeam(deleteTarget.id);
    notify.success(`Team "${deleteTarget.name}" deleted from local workspace.`);
    setDeleteTarget(null);
  };

  return (
    <main className="teams-page">
      <PageHeader eyebrow="Organization" title="Teams" description="Teams are the context for people, membership, and work." action={isAdmin ? <Button variant="primary" onClick={() => { setSelectedTeam(null); setFormOpen(true); }}>+ Create Team</Button> : null} />
      <div className="teams-page__preview"><span>Preview as</span><select value={currentViewer.id} onChange={(event) => changeViewer(event.target.value)}>{viewers.map((viewer) => <option key={viewer.id} value={viewer.id}>{viewer.name} · {viewer.role}</option>)}</select></div>
      <section className="teams-page__toolbar"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search teams, leads, or members..." /><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></select><span>{visibleTeams.length} {visibleTeams.length === 1 ? "team" : "teams"}</span></section>
      <TeamTable teams={visibleTeams} onView={(team) => navigate(`/teams/${team.id}`)} onEdit={isAdmin ? (team) => { setSelectedTeam(team); setFormOpen(true); } : undefined} onDelete={isAdmin ? setDeleteTarget : undefined} />
      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={selectedTeam ? "Edit Team" : "Create Team"} description="Teams can include employees from different departments." size="medium"><TeamForm initialData={selectedTeam || { teamName: "", description: "", teamLeadId: "", memberIds: [], status: "active" }} employees={employees} onSubmit={submitTeam} onCancel={() => setFormOpen(false)} /></Modal>
      <ConfirmModal open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} onConfirm={confirmDelete} title="Delete Team?" itemName={deleteTarget?.name} confirmText="Delete" />
    </main>
  );
};

export default Teams;
