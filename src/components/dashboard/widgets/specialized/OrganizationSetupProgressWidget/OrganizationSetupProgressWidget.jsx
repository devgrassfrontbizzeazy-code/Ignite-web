import { useState } from "react";
import {
  CheckCircle2,
  Circle,
  ArrowRight,
  Building2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

import DashboardWidget from "../../../DashboardWidget/DashboardWidget";
import "./OrganizationSetupProgressWidget.css";

const OrganizationSetupProgressWidget = ({ data, loading }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const setup = data?.setupProgress || {
    percentage: 0,
    completed: 0,
    total: 0,
    items: [],
  };

  const items = Array.isArray(setup.items) ? setup.items : [];

  return (
    <DashboardWidget
      title="Organization Setup Progress"
      action="View Overview"
      onAction={() => {
        window.location.href = "/organization-overview";
      }}
      loading={loading}
      className="org-setup-progress-widget"
    >
      <div className="org-setup-widget">
        {/* Progress Summary */}
        <div className="org-setup-widget__summary">
          <div className="org-setup-widget__summary-top">
            <div className="org-setup-widget__summary-text">
              <span className="org-setup-widget__summary-label">
                Overall Progress
              </span>

              <strong className="org-setup-widget__summary-count">
                {setup.completed} of {setup.total} completed
              </strong>
            </div>

            <div className="org-setup-widget__summary-actions">
              <div className="org-setup-widget__summary-badge">
                {setup.percentage}%
              </div>

              <button
                type="button"
                className="org-setup-widget__expand-button"
                onClick={() => setIsExpanded((prev) => !prev)}
                aria-label={
                  isExpanded
                    ? "Collapse setup checklist"
                    : "Expand setup checklist"
                }
                aria-expanded={isExpanded}
              >
                {isExpanded ? (
                  <ChevronUp size={18} />
                ) : (
                  <ChevronDown size={18} />
                )}
              </button>
            </div>
          </div>

          <div className="org-setup-widget__progress-track">
            <div
              className="org-setup-widget__progress-fill"
              style={{
                width: `${setup.percentage}%`,
              }}
            />
          </div>
        </div>

        {/* Checklist */}
        {isExpanded && (
          <>
            {items.length > 0 ? (
              <div className="org-setup-widget__list">
                {items.map((item) => (
                  <div
                    className={`org-setup-widget__item ${item.complete ? "is-complete" : "is-pending"
                      }`}
                    key={item.key || item.label}
                  >
                    <div className="org-setup-widget__item-status">
                      {item.complete ? (
                        <CheckCircle2
                          size={17}
                          className="org-setup-widget__icon-complete"
                        />
                      ) : (
                        <Circle
                          size={17}
                          className="org-setup-widget__icon-pending"
                        />
                      )}
                    </div>

                    <div className="org-setup-widget__item-info">
                      <strong>{item.label}</strong>
                      <span>{item.description}</span>
                    </div>

                    <button
                      type="button"
                      className="org-setup-widget__item-action"
                      onClick={() => {
                        if (item.path) {
                          window.location.href = item.path;
                        }
                      }}
                    >
                      {item.action || "Configure"}
                      <ArrowRight size={13} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="org-setup-widget__empty">
                <Building2 size={20} />
                <span>No setup items available.</span>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardWidget>
  );
};

export default OrganizationSetupProgressWidget;