import { CheckCircle } from "lucide-react";
import Button from "../../../../common/Button/Button";
import "./ActiveVisit.css";

const ActiveVisit = ({ activeVisit, onReportClick }) => {
  if (!activeVisit) return null;

  const clientName = activeVisit.company_name || activeVisit.lead_title || activeVisit.lead_name || "Client Visit";
  const location = activeVisit.location || activeVisit.lead_address || "Client Location";
  const checkInTime = activeVisit.check_in_time;

  return (
    <div className="dashboard-grid__item" style={{ gridColumn: "span 12" }}>
      <div className="active-visit-banner-compact">
        <div className="active-visit-info-col">
          <div className="active-visit-status-tag">
            <span className="active-visit-dot" /> ACTIVE VISIT IN PROGRESS
          </div>
          <strong className="active-visit-client-name">{clientName}</strong>
          <span className="active-visit-sub-details">
             {location} {checkInTime ? `• Checked in at ${checkInTime}` : ""}
          </span>
        </div>

        <div className="active-visit-action-col">
          <Button
            variant="primary"
            onClick={() => onReportClick(activeVisit)}
          >
             Submit Report & Check Out
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ActiveVisit;
