import { CalendarDays, ClipboardList, Clock3, FilePlus2 } from "lucide-react";
import ActionWidget from "../../../../dashboard/widgets/generic/ActionWidget/ActionWidget";
import "./QuickActions.css";

const QuickActions = ({ onApplyLeave }) => (
  <div className="dashboard-grid__item field-sales-quick-actions-widget">
    <ActionWidget
      title="Quick Actions"
      columns={1}
      actions={[
        { key: "apply-leave", label: "Apply Leave", icon: FilePlus2, onClick: onApplyLeave },
        {
          key: "attendance",
          label: "View Attendance",
          icon: Clock3,
          onClick: () => {
            window.location.href = "/attendance";
          },
        },
        {
          key: "tasks",
          label: "View Tasks",
          icon: ClipboardList,
          onClick: () => {
            window.location.href = "/tasks";
          },
        },
        {
          key: "holidays",
          label: "View Holidays",
          icon: CalendarDays,
          onClick: () => {
            window.location.href = "/holidays";
          },
        },
      ]}
    />
  </div>
);

export default QuickActions;