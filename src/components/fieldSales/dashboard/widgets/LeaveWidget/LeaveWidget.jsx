import { Umbrella } from "lucide-react";
import SummaryWidget from "../../../../dashboard/widgets/generic/SummaryWidget/SummaryWidget";
import "./LeaveWidget.css";

const LeaveWidget = ({ loading, total, used, remaining }) => {
  return (
    <div className="dashboard-grid__item field-sales-leave-widget">
      <SummaryWidget
        title="Leave Balance"
        value={remaining}
        subtitle="Days remaining"
        icon={Umbrella}
        action="View Leaves"
        onAction={() => {
          window.location.href = "/leaves";
        }}
        stats={[
          { key: "total", label: "Total", value: total },
          { key: "used", label: "Used", value: used },
          { key: "remaining", label: "Remaining", value: remaining },
        ]}
        loading={loading}
      />
    </div>
  );
};

export default LeaveWidget;