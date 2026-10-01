import AttendanceActionWidget from "../../../../dashboard/widgets/specialized/AttendanceActionWidget/AttendanceActionWidget";
import "./AttendanceWidget.css";

const AttendanceWidget = ({ hrmsData }) => {
  return (
    <div className="dashboard-grid__item field-sales-attendance-widget">
      <AttendanceActionWidget data={hrmsData} loading={hrmsData?.loading} />
    </div>
  );
};

export default AttendanceWidget;
