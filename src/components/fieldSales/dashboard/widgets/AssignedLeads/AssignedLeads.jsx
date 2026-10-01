import { Building2, Layers } from "lucide-react";
import DashboardWidget from "../../../../dashboard/DashboardWidget/DashboardWidget";
import "./AssignedLeads.css";

const AssignedLeads = ({ leads = [], onViewTimeline }) => (
  <div className="dashboard-grid__item field-sales-assigned-leads-widget">
    <DashboardWidget title={`My Assigned Leads (${leads.length})`}>
      {leads.length === 0 ? (
        <div className="assigned-leads-empty">
          <Building2 size={24} color="#94a3b8" />
          <p>No active leads assigned.</p>
        </div>
      ) : (
        <div className="assigned-leads-scroll">
          <table className="assigned-leads-table">
            <thead>
              <tr>
                <th>Company / Lead</th>
                <th>Contact Person</th>
                <th>Stage / Status</th>
                <th>Est. Value</th>
                <th className="assigned-leads-action-heading">Action</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id}>
                  <td>
                    <strong className="assigned-lead-title">{lead.company_name || lead.title || "Lead"}</strong>
                  </td>
                  <td>
                    <span className="assigned-lead-contact">{lead.contact_name || lead.name || "Contact"}</span>
                    {lead.phone && <small className="assigned-lead-contact">{lead.phone}</small>}
                  </td>
                  <td>
                    <span className="assigned-lead-stage">{lead.status || "New"}</span>
                  </td>
                  <td>
                    <span className="assigned-lead-value">
                      {lead.conversion_value
                        ? `₹${Number(lead.conversion_value).toLocaleString("en-IN")}`
                        : "—"}
                    </span>
                  </td>
                  <td className="assigned-leads-action-cell">
                    <button
                      type="button"
                      className="assigned-lead-timeline-button"
                      onClick={() => onViewTimeline(lead.id)}
                    >
                      <Layers size={12} /> Timeline
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardWidget>
  </div>
);

export default AssignedLeads;