import { Calendar, Play, CheckCircle2, Clock3, Trophy } from "lucide-react";
import SummaryWidget from "../../../../dashboard/widgets/generic/SummaryWidget/SummaryWidget";
import "./SalesSummaryCards.css";

const SalesSummaryCards = ({
  isManager,
  stats = {},
  todayVisitsCount = 0,
  activeVisitsCount = 0,
  completedTodayCount = 0,
  pendingFollowupsCount = 0,
  convertedLeadsCount = 0,
}) => {
  if (isManager) {
    return (
      <>
        <div className="dashboard-grid__item" style={{ gridColumn: "span 2" }}>
          <SummaryWidget
            title="Today's Visits"
            value={stats.today_visits_count ?? todayVisitsCount}
            subtitle="Scheduled for team"
            icon={Calendar}
          />
        </div>

        <div className="dashboard-grid__item" style={{ gridColumn: "span 2" }}>
          <SummaryWidget
            title="Active Visits"
            value={stats.active_visits_count ?? activeVisitsCount}
            subtitle="Visits in progress"
            icon={Play}
          />
        </div>

        <div className="dashboard-grid__item" style={{ gridColumn: "span 2" }}>
          <SummaryWidget
            title="Completed Visits"
            value={stats.completed_today_count ?? completedTodayCount}
            subtitle="Checked out today"
            icon={CheckCircle2}
          />
        </div>

        <div className="dashboard-grid__item" style={{ gridColumn: "span 3" }}>
          <SummaryWidget
            title="Pending Follow-ups"
            value={stats.pending_followups_count ?? pendingFollowupsCount}
            subtitle="Requires action"
            icon={Clock3}
          />
        </div>

        <div className="dashboard-grid__item" style={{ gridColumn: "span 3" }}>
          <SummaryWidget
            title="Deals Won"
            value={stats.converted_leads_count ?? convertedLeadsCount}
            subtitle="Converted leads"
            icon={Trophy}
          />
        </div>
      </>
    );
  }

  return (
    <>
      <div className="dashboard-grid__item" style={{ gridColumn: "span 3" }}>
        <SummaryWidget
          title="Today's Visits"
          value={todayVisitsCount}
          subtitle="Scheduled for today"
          icon={Calendar}
        />
      </div>

      <div className="dashboard-grid__item" style={{ gridColumn: "span 3" }}>
        <SummaryWidget
          title="Active Visit"
          value={activeVisitsCount > 0 ? 1 : 0}
          subtitle={activeVisitsCount > 0 ? "Visit in progress" : "None active"}
          icon={Play}
        />
      </div>

      <div className="dashboard-grid__item" style={{ gridColumn: "span 3" }}>
        <SummaryWidget
          title="Completed Visits"
          value={completedTodayCount}
          subtitle="Checked out today"
          icon={CheckCircle2}
        />
      </div>

      <div className="dashboard-grid__item" style={{ gridColumn: "span 3" }}>
        <SummaryWidget
          title="My Follow-ups"
          value={pendingFollowupsCount}
          subtitle="Pending action"
          icon={Clock3}
        />
      </div>
    </>
  );
};

export default SalesSummaryCards;
