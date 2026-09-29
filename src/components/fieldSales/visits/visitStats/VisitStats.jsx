import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  RotateCcw,
} from "lucide-react";

import StatCard from "../../../common/StatCard/StatCard";
import "./VisitStats.css";

const VisitStats = ({ stats }) => {
  return (
    <div className="stats-grid stats-grid--4 visits__stats">
      <StatCard
        title="Today's Visits"
        value={stats.today}
        description="Scheduled for today"
        icon={CalendarDays}
        variant="teal"
      />

      <StatCard
        title="In Progress"
        value={stats.inProgress}
        description="Currently being visited"
        icon={Clock3}
        variant="warning"
      />

      <StatCard
        title="Completed"
        value={stats.completed}
        description="Successfully completed"
        icon={CheckCircle2}
        variant="emerald"
      />

      <StatCard
        title="Follow-ups"
        value={stats.followUps}
        description="Require further action"
        icon={RotateCcw}
        variant="blue"
      />
    </div>
  );
};

export default VisitStats;