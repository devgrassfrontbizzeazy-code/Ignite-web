import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BriefcaseBusiness, CheckCheck, FolderKanban, Users } from "lucide-react";
import { Link } from "react-router-dom";

import Button from "../../components/common/Button/Button";
import PageHeader from "../../components/common/PageHeader/PageHeader";
import StatCard from "../../components/common/StatCard/StatCard";
import { useTeamsTasks } from "../../context/TeamsTasksContext";

const WorkManagement = () => {
  const {
    teams,
    tasks,
    loading,
    workManagementAccess,
    fetchTeams,
    fetchTasks,
  } = useTeamsTasks();

  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    fetchTeams().catch(() => {});
    fetchTasks().catch(() => {});

    // Safety timeout to ensure user is never trapped indefinitely
    const timer = setTimeout(() => {
      setTimedOut(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, [fetchTeams, fetchTasks]);

  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  }, []);
  const rawRole = String(currentUser?.role || currentUser?.user_type || "").toUpperCase();
  const isAdminOrOwner =
    currentUser?.is_superuser === true ||
    ["OWNER", "ADMIN", "ADMINISTRATOR", "HR"].includes(rawRole);

  const canSeeTeams =
    isAdminOrOwner || workManagementAccess?.canViewTeams === true || teams.length > 0;

  const stats = useMemo(() => {
    const totalTeams = teams.length;
    const activeTeams = teams.filter((team) => String(team.status || "active").toLowerCase() !== "inactive").length;
    const totalTasks = tasks.length;
    const activeTasks = tasks.filter((task) => String(task.status || "").toLowerCase() !== "completed").length;
    const completedTasks = tasks.filter((task) => String(task.status || "").toLowerCase() === "completed").length;

    return {
      totalTeams,
      activeTeams,
      totalTasks,
      activeTasks,
      completedTasks,
    };
  }, [teams, tasks]);

  const isInitialLoading = !timedOut && loading && teams.length === 0 && tasks.length === 0;

  if (isInitialLoading) {
    return (
      <main className="work-management-page" style={{ padding: "32px" }}>
        <PageHeader
          eyebrow="Work Management"
          title="Overview"
          description="Tasks and workspace are being loaded."
        />
        <div style={{ marginTop: "24px", color: "#4b5563" }}>Loading work management data...</div>
      </main>
    );
  }

  return (
    <main className="work-management-page" style={{ padding: "32px" }}>
      <PageHeader
        eyebrow="Work Management"
        title="Overview"
        description="Coordinate tasks, manage personal work, and keep work moving across your organization."
      />

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "20px", marginTop: "28px" }}>
        {canSeeTeams && (
          <>
            <StatCard title="Total Teams" value={stats.totalTeams} icon={<Users size={18} />} variant="blue" />
            <StatCard title="Active Teams" value={stats.activeTeams} icon={<BriefcaseBusiness size={18} />} variant="teal" />
          </>
        )}
        <StatCard title="Total Tasks" value={stats.totalTasks} icon={<FolderKanban size={18} />} variant="primary" />
        <StatCard title="Active Tasks" value={stats.activeTasks} icon={<ArrowRight size={18} />} variant="gold" />
        <StatCard title="Completed Tasks" value={stats.completedTasks} icon={<CheckCheck size={18} />} variant="green" />
      </section>

      <section style={{ display: "grid", gridTemplateColumns: canSeeTeams ? "repeat(auto-fit, minmax(280px, 1fr))" : "1fr", gap: "20px", marginTop: "28px" }}>
        {canSeeTeams && (
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "18px", padding: "24px" }}>
            <h3 style={{ margin: "0 0 12px", fontSize: "20px" }}>Teams</h3>
            <p style={{ margin: "0 0 18px", color: "#4b5563" }}>View team structure, leadership, members, and team-level work.</p>
            <Link to="/teams">
              <Button variant="primary">Open Teams</Button>
            </Link>
          </div>
        )}

        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "18px", padding: "24px" }}>
          <h3 style={{ margin: "0 0 12px", fontSize: "20px" }}>Tasks</h3>
          <p style={{ margin: "0 0 18px", color: "#4b5563" }}>Track progress, priorities, personal tasks, and due dates across your work.</p>
          <Link to="/tasks">
            <Button variant="primary">Open Tasks</Button>
          </Link>
        </div>
      </section>
    </main>
  );
};

export default WorkManagement;
