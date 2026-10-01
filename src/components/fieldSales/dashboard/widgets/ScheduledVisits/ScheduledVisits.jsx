import { CheckCircle2, Compass, Eye, MapPin, Play } from "lucide-react";
import Button from "../../../../common/Button/Button";
import DashboardWidget from "../../../../dashboard/DashboardWidget/DashboardWidget";
import "./ScheduledVisits.css";

const normalizeStatus = (statusStr) => {
  if (!statusStr) return "Scheduled";
  const s = String(statusStr).trim();
  if (s.toLowerCase() === "checked_in" || s.toLowerCase() === "in_progress") return "In Progress";
  if (s.toLowerCase() === "checked_out" || s.toLowerCase() === "completed") return "Completed";
  return s.charAt(0).toUpperCase() + s.slice(1);
};

const ScheduledVisits = ({
  visits = [],
  isManager = false,
  onViewDetails,
  onStartVisit,
  onReportClick,
  onNavigate,
}) => {
  const title = isManager
    ? `Today's Team Visits (${visits.length})`
    : `My Scheduled Visits (${visits.length})`;

  const handleAllVisitsRedirect = () => {
    window.location.href = "/field-sales/visits";
  };

  return (
    <div className="dashboard-grid__item" style={{ gridColumn: isManager ? "span 7" : "span 8" }}>
      <DashboardWidget
        title={title}
        action="View All"
        onAction={handleAllVisitsRedirect}
      >
        {visits.length === 0 ? (
          <div className="scheduled-visits-empty">
            <CheckCircle2 size={16} />
            <p>No scheduled visits for today.</p>
          </div>
        ) : (
          <div className="scheduled-visits-list">
            {visits.map((visit) => {
              const statusLabel = normalizeStatus(visit.status);
              const isCompleted = statusLabel === "Completed";
              const isInProgress = statusLabel === "In Progress";
              const priority = visit.priority || "High";
              const priorityClass = `scheduled-visit-priority--${String(priority).toLowerCase()}`;
              const clientName = visit.company_name || visit.lead_title || "Client";
              const contactName = visit.lead_name || visit.customer_name;
              const locationText = visit.location || visit.lead_address || "Location";
              const visitTime = visit.visit_time || "11:00 AM";

              return (
                <div
                  key={visit.id}
                  className={`scheduled-visit-row${isCompleted ? " scheduled-visit-row--completed" : ""}`}
                >
                  {isManager && (
                    <div className="scheduled-visit-employee" title={visit.assigned_to_name || visit.employee_name}>
                      {visit.assigned_to_name || visit.employee_name || "Sales Rep"}
                    </div>
                  )}
                  <div className="scheduled-visit-client" title={clientName}>
                    <strong>{clientName}</strong>
                    {contactName && <span>{contactName}</span>}
                  </div>
                  <div className="scheduled-visit-location" title={locationText}>
                    <MapPin size={13} aria-hidden="true" />
                    <span>{locationText}</span>
                  </div>
                  <time className="scheduled-visit-time">{visitTime}</time>
                  <div className="scheduled-visit-badges">
                    <span className={`scheduled-visit-priority ${priorityClass}`}>{priority}</span>
                    <span
                      className={`scheduled-visit-status scheduled-visit-status--${
                        isCompleted ? "complete" : isInProgress ? "active" : "scheduled"
                      }`}
                    >
                      {statusLabel}
                    </span>
                  </div>
                  <div className="scheduled-visit-actions">
                    <button
                      type="button"
                      className="scheduled-visit-icon-action"
                      title="View details"
                      aria-label={`View details for ${clientName}`}
                      onClick={() => onViewDetails(visit)}
                    >
                      <Eye size={15} />
                    </button>
                    <button
                      type="button"
                      className="scheduled-visit-icon-action"
                      title="Open directions"
                      aria-label={`Open directions to ${clientName}`}
                      onClick={() => onNavigate(visit)}
                    >
                      <Compass size={15} />
                    </button>
                    {!isManager && !isCompleted && !isInProgress && (
                      <Button
                        variant="primary"
                        size="sm"
                        className="scheduled-visit-start-btn"
                        onClick={() => onStartVisit(visit)}
                      >
                       Start Visit
                      </Button>
                    )}
                    {!isManager && isInProgress && (
                      <Button
                        variant="primary"
                        size="sm"
                        className="scheduled-visit-start-btn"
                        onClick={() => onReportClick(visit)}
                      >
                        Submit Report
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DashboardWidget>
    </div>
  );
};

export default ScheduledVisits;
