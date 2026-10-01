import { Phone, MessageSquare, CheckCircle2 } from "lucide-react";
import DashboardWidget from "../../../../dashboard/DashboardWidget/DashboardWidget";
import "./FollowUps.css";

const FollowUps = ({
  followups = [],
  isManager = false,
  onLogOutcome,
}) => {
  const title = isManager
    ? `Follow-ups Requiring Attention (${followups.length})`
    : `My Follow-ups (${followups.length})`;

  const handleViewAllRedirect = () => {
    window.location.href = "/field-sales/leads";
  };

  return (
    <div className="dashboard-grid__item" style={{ gridColumn: isManager ? "span 5" : "span 4" }}>
      <DashboardWidget
        title={title}
        action="View All"
        onAction={handleViewAllRedirect}
      >
        {followups.length === 0 ? (
          <div className="followups-widget-empty">
            <CheckCircle2 size={24} color="#0ba37f" />
            <p>No pending follow-ups due.</p>
          </div>
        ) : (
          <div className="followups-widget-scroll">
            {followups.map((fu) => {
              const isOverdue =
                fu.is_overdue || (fu.due_date && new Date(fu.due_date) < new Date());

              return (
                <div key={fu.id} className="followup-widget-card">
                  <div className="followup-card-header">
                    <span className="followup-type-chip">
                      {fu.follow_up_type === "Call"
                        ? "Phone Call"
                        : fu.follow_up_type === "WhatsApp"
                        ? "WhatsApp"
                        : "Demo"}
                    </span>
                    {isOverdue ? (
                      <span className="followup-overdue-chip">Overdue</span>
                    ) : (
                      <span className="followup-due-text">Due: {fu.due_date || "Today"}</span>
                    )}
                  </div>

                  <strong className="followup-client-name">
                    {fu.lead_company_name || fu.lead_title || "Client"}
                  </strong>

                  <p className="followup-reason">{fu.reason || "Discussion follow-up"}</p>

                  <div className="followup-actions-bar">
                    {!isManager && fu.lead_phone && (
                      <a href={`tel:${fu.lead_phone}`} className="btn-call-link">
                        <Phone size={11} /> Call
                      </a>
                    )}
                    {!isManager && fu.lead_phone && (
                      <a
                        href={`https://wa.me/${fu.lead_phone.replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-wa-link"
                      >
                        <MessageSquare size={11} /> WA
                      </a>
                    )}
                    <button
                      type="button"
                      className="btn-outcome-action"
                      onClick={() => onLogOutcome(fu)}
                    >
                      Log Outcome
                    </button>
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

export default FollowUps;
