import { useState } from "react";
import { Calendar, Clock, CheckCircle } from "lucide-react";
import Button from "../../../common/Button/Button";
import DatePicker from "../../../common/DatePicker/DatePicker";
import TimePicker from "../../../common/TimePicker/TimePicker";

const OUTCOMES = [
  { id: "Interested", label: "Interested", color: "var(--ignite-emerald)" },
  { id: "Negotiation", label: "Negotiation (Agreement / Pricing)", color: "var(--ignite-gold)" },
  { id: "Demo Required", label: "Demo Required", color: "var(--ignite-deep-teal)" },
  { id: "Converted", label: "Converted / Deal Won", color: "var(--ignite-emerald)" },
  { id: "Reschedule", label: "Reschedule Call", color: "var(--ignite-deep-teal)" },
  { id: "No Response", label: "No Response (Attempt Logged)", color: "var(--color-text-muted)" },
  { id: "Not Interested", label: "Not Interested / Lost", color: "var(--color-danger)" },
];

const FollowUpOutcomeModal = ({
  followup,
  onLogOutcome,
  onCancel,
  submitting = false,
}) => {
  if (!followup) return null;

  const [callStatus, setCallStatus] = useState("Connected");
  const [outcome, setOutcome] = useState("Negotiation");
  const [notes, setNotes] = useState("");
  const [nextAction, setNextAction] = useState("");

  // Next follow-up (optional, controlled strictly by schedule_next_follow_up)
  const [scheduleNext, setScheduleNext] = useState(false);
  const [nextDate, setNextDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split("T")[0];
  });
  const [nextTime, setNextTime] = useState("11:00");
  const [nextType, setNextType] = useState("Call");
  const [nextReason, setNextReason] = useState("");

  // Converted fields
  const isConverted = outcome === "Converted";
  const [conversionValue, setConversionValue] = useState("50000");
  const [wonProduct, setWonProduct] = useState("Ignite HRMS");
  // Lost fields
  const isLost = outcome === "Not Interested";
  const [lostReason, setLostReason] = useState("Budget issue");

  const handleSubmit = (e) => {
    e.preventDefault();
    const shouldSchedule = Boolean(scheduleNext && !isConverted && !isLost);

    onLogOutcome?.({
      call_status: callStatus,
      outcome,
      notes,
      next_action: nextAction || (isConverted ? "Send Agreement & Onboard" : "Follow-up"),
      schedule_next_follow_up: shouldSchedule,
      next_due_date: shouldSchedule ? nextDate : null,
      next_due_time: shouldSchedule ? nextTime : null,
      next_follow_up_type: shouldSchedule ? nextType : null,
      next_reason: shouldSchedule ? (nextReason || notes || "Follow-up") : null,
      conversion_value: isConverted ? parseFloat(conversionValue || 0) : 0,
      won_product: isConverted ? wonProduct : "",
      lost_reason: isLost ? lostReason : "",
    });
  };

  const attemptsCount = (followup.call_attempts?.length || 0) + 1;

  return (
    <form onSubmit={handleSubmit} style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-family-base)" }}>
      {/* HEADER */}
      <div style={{ backgroundColor: "var(--color-bg-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "14px", marginBottom: "16px" }}>
        <div style={{ fontSize: "11px", fontWeight: "700", color: "var(--ignite-emerald)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          FOLLOW-UP LOG • ATTEMPT #{attemptsCount}
        </div>
        <h3 style={{ margin: "4px 0 2px", fontSize: "16px", fontWeight: "700", color: "var(--ignite-deep-teal)" }}>
          {followup.lead_company_name || followup.lead_title || "Client"}
        </h3>
        <p style={{ margin: 0, fontSize: "12px", color: "var(--color-text-secondary)" }}>
          Contact: <strong>{followup.lead_contact_name || "Contact Person"}</strong> • {followup.lead_phone || "No phone"}
        </p>
      </div>

      {/* CALL ATTEMPT STATUS */}
      <div style={{ marginBottom: "16px" }}>
        <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "var(--color-text-primary)", marginBottom: "6px" }}>
          Call Status
        </label>
        <div style={{ display: "flex", gap: "8px" }}>
          {["Connected", "No Response", "Busy", "Wrong Number"].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => {
                setCallStatus(st);
                if (st === "No Response") setOutcome("No Response");
              }}
              style={{
                flex: 1,
                padding: "8px 10px",
                borderRadius: "var(--radius-sm)",
                fontSize: "12px",
                fontWeight: "600",
                border: callStatus === st ? "2px solid var(--ignite-emerald)" : "1px solid var(--color-border)",
                backgroundColor: callStatus === st ? "var(--ignite-emerald-050)" : "var(--color-bg-surface)",
                color: callStatus === st ? "var(--ignite-deep-teal)" : "var(--color-text-secondary)",
                cursor: "pointer",
              }}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* OUTCOME SELECTION */}
      <div style={{ marginBottom: "16px" }}>
        <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "var(--color-text-primary)", marginBottom: "6px" }}>
          Follow-up Outcome
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
          {OUTCOMES.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setOutcome(opt.id)}
              style={{
                padding: "8px 10px",
                borderRadius: "var(--radius-sm)",
                textAlign: "left",
                fontSize: "12px",
                fontWeight: outcome === opt.id ? "700" : "500",
                border: outcome === opt.id ? `2px solid ${opt.color}` : "1px solid var(--color-border)",
                backgroundColor: outcome === opt.id ? "var(--color-bg-surface)" : "var(--color-bg-surface)",
                color: outcome === opt.id ? opt.color : "var(--color-text-secondary)",
                cursor: "pointer",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* NOTES */}
      <div style={{ marginBottom: "14px" }}>
        <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "var(--color-text-primary)", marginBottom: "4px" }}>
          Discussion Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Client requested agreement / discussed pricing..."
          rows={2}
          style={{ width: "100%", padding: "8px 10px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", fontSize: "13px", boxSizing: "border-box" }}
        />
      </div>

      {/* CONVERTED FIELDS */}
      {isConverted && (
        <div style={{ backgroundColor: "var(--ignite-emerald-050)", border: "1px solid var(--ignite-emerald-100)", borderRadius: "var(--radius-md)", padding: "14px", marginBottom: "14px" }}>
          <div style={{ color: "var(--ignite-emerald-600)", fontWeight: "700", fontSize: "12px", marginBottom: "8px" }}>
            WON DEAL INFORMATION
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div>
              <small style={{ color: "var(--color-text-secondary)", display: "block", marginBottom: "4px" }}>Deal Value (₹)</small>
              <input
                type="number"
                value={conversionValue}
                onChange={(e) => setConversionValue(e.target.value)}
                style={{ width: "100%", padding: "8px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", fontSize: "13px", boxSizing: "border-box" }}
              />
            </div>
            <div>
              <small style={{ color: "var(--color-text-secondary)", display: "block", marginBottom: "4px" }}>Product</small>
              <input
                type="text"
                value={wonProduct}
                onChange={(e) => setWonProduct(e.target.value)}
                style={{ width: "100%", padding: "8px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", fontSize: "13px", boxSizing: "border-box" }}
              />
            </div>
          </div>
        </div>
      )}

      {/* NEXT FOLLOW-UP AUTO-CHAIN */}
      {!isConverted && !isLost && (
        <div style={{ backgroundColor: "var(--color-bg-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "14px", marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
            <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--ignite-deep-teal)", display: "flex", alignItems: "center", gap: "6px" }}>
              <Calendar size={15} color="var(--ignite-emerald)" /> Schedule New Follow-up
            </span>
            <input
              type="checkbox"
              checked={scheduleNext}
              onChange={(e) => setScheduleNext(e.target.checked)}
              style={{ width: "16px", height: "16px", cursor: "pointer" }}
            />
          </div>

          {scheduleNext && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "8px" }}>
              <div>
                <small style={{ color: "var(--color-text-secondary)", display: "block", marginBottom: "4px" }}>Next Date</small>
                <DatePicker
                  value={nextDate}
                  onChange={(d) => setNextDate(d)}
                  placeholder="Select next date"
                />
              </div>
              <div>
                <small style={{ color: "var(--color-text-secondary)", display: "block", marginBottom: "4px" }}>Next Time</small>
                <TimePicker
                  value={nextTime}
                  onChange={(t) => setNextTime(t)}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* BUTTONS */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "16px" }}>
        <Button variant="secondary" type="button" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button variant="primary" type="submit" disabled={submitting}>
          {submitting ? "Saving Outcome..." : "Log Outcome & Update"}
        </Button>
      </div>
    </form>
  );
};

export default FollowUpOutcomeModal;
