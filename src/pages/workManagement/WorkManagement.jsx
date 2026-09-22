import { useMemo } from "react";
import { ArrowRight, BriefcaseBusiness, CheckCheck, FolderKanban, Users } from "lucide-react";
import { Link } from "react-router-dom";

import Button from "../../components/common/Button/Button";
import PageHeader from "../../components/common/PageHeader/PageHeader";
import StatCard from "../../components/common/StatCard/StatCard";
import { useTeamsTasks } from "../../context/TeamsTasksContext";

const WorkManagement = () => {
  const { teams, tasks, loading, teamsLoading, tasksLoading } = useTeamsTasks();

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

  if (loading || teamsLoading || tasksLoading) {
    return (
      <main className="work-management-page" style={{ padding: "32px" }}>
        <PageHeader
          eyebrow="Work Management"
          title="Overview"
          description="Teams and tasks are being loaded from the live workspace."
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
        description="Coordinate teams, manage shared work, and keep work moving across your organization."
        
      />

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "20px", marginTop: "28px" }}>
        <StatCard title="Total Teams" value={stats.totalTeams} icon={<Users size={18} />} variant="blue" />
        <StatCard title="Active Teams" value={stats.activeTeams} icon={<BriefcaseBusiness size={18} />} variant="teal" />
        <StatCard title="Total Tasks" value={stats.totalTasks} icon={<FolderKanban size={18} />} variant="primary" />
        <StatCard title="Active Tasks" value={stats.activeTasks} icon={<ArrowRight size={18} />} variant="gold" />
        <StatCard title="Completed Tasks" value={stats.completedTasks} icon={<CheckCheck size={18} />} variant="green" />
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px", marginTop: "28px" }}>
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "18px", padding: "24px" }}>
          <h3 style={{ margin: "0 0 12px", fontSize: "20px" }}>Teams</h3>
          <p style={{ margin: "0 0 18px", color: "#4b5563" }}>View team structure, leadership, members, and team-level work.</p>
          <Link to="/teams">
            <Button variant="primary">Open Teams</Button>
          </Link>
        </div>

        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "18px", padding: "24px" }}>
          <h3 style={{ margin: "0 0 12px", fontSize: "20px" }}>Tasks</h3>
          <p style={{ margin: "0 0 18px", color: "#4b5563" }}>Track progress, priorities, owners, and due dates across all work streams.</p>
          <Link to="/tasks">
            <Button variant="primary">Open Tasks</Button>
          </Link>
        </div>
      </section>
    </main>
  );
};

export default WorkManagement;
