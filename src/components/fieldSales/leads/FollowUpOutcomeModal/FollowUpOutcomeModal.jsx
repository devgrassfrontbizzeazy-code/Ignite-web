import { useState } from "react";
import { Phone, MessageSquare, CheckCircle, RefreshCw, Calendar, Clock, ArrowRight, DollarSign, XCircle, AlertCircle } from "lucide-react";
import Button from "../../../common/Button/Button";

const OUTCOMES = [
  { id: "Interested", label: "Interested", color: "#10b981" },
  { id: "Negotiation", label: "Negotiation (Agreement / Pricing)", color: "#f59e0b" },
  { id: "Demo Required", label: "Demo Required", color: "#8b5cf6" },
  { id: "Converted", label: "Converted / Deal Won ✅", color: "#059669" },
  { id: "Reschedule", label: "Reschedule Call", color: "#6366f1" },
  { id: "No Response", label: "No Response (Attempt Logged)", color: "#64748b" },
  { id: "Not Interested", label: "Not Interested / Lost ❌", color: "#ef4444" },
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

  // Next follow-up
  const [scheduleNext, setScheduleNext] = useState(true);
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
    onLogOutcome?.({
      call_status: callStatus,
      outcome,
      notes,
      next_action: nextAction || (isConverted ? "Send Agreement & Onboard" : "Follow-up"),
      schedule_next_follow_up: scheduleNext && !isConverted && !isLost,
      next_due_date: (scheduleNext && !isConverted && !isLost) ? nextDate : null,
      next_due_time: (scheduleNext && !isConverted && !isLost) ? nextTime : null,
      next_follow_up_type: nextType,
      next_reason: nextReason || notes,
      conversion_value: isConverted ? parseFloat(conversionValue || 0) : 0,
      won_product: isConverted ? wonProduct : "",
      lost_reason: isLost ? lostReason : "",
    });
  };

  const attemptsCount = (followup.call_attempts?.length || 0) + 1;

  return (
    <form onSubmit={handleSubmit} style={{ padding: "4px", color: "#0f172a" }}>
      {/* HEADER */}
      <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "14px", marginBottom: "16px" }}>
        <div style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          FOLLOW-UP LOG • ATTEMPT #{attemptsCount}
        </div>
        <h3 style={{ margin: "4px 0 2px", fontSize: "17px", fontWeight: "800", color: "#0f172a" }}>
          {followup.lead_company_name || followup.lead_title || "Client"}
        </h3>
        <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>
          Contact: <strong>{followup.lead_contact_name || "Contact Person"}</strong> • {followup.lead_phone || "No phone"}
        </p>
      </div>

      {/* CALL ATTEMPT STATUS */}
      <div style={{ marginBottom: "16px" }}>
        <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "6px" }}>
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
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: "600",
                border: callStatus === st ? "2px solid #0284c7" : "1px solid #cbd5e1",
                background: callStatus === st ? "#f0f9ff" : "#ffffff",
                color: callStatus === st ? "#0284c7" : "#475569",
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
        <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "6px" }}>
          Follow-up Outcome
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
          {OUTCOMES.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setOutcome(opt.id)}
              style={{
                padding: "8px 10px",
                borderRadius: "8px",
                textAlign: "left",
                fontSize: "11px",
                fontWeight: outcome === opt.id ? "700" : "500",
                border: outcome === opt.id ? `2px solid ${opt.color}` : "1px solid #e2e8f0",
                background: outcome === opt.id ? `${opt.color}14` : "#ffffff",
                color: outcome === opt.id ? opt.color : "#334155",
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
        <label style={{ display: "block", fontSize: "12px", fontWeight: "700", marginBottom: "4px" }}>
          Discussion Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Client requested agreement / discussed pricing..."
          rows={2}
          style={{ width: "100%", padding: "8px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px" }}
        />
      </div>

      {/* CONVERTED FIELDS */}
      {isConverted && (
        <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: "10px", padding: "12px", marginBottom: "14px" }}>
          <div style={{ color: "#059669", fontWeight: "700", fontSize: "12px", marginBottom: "8px" }}>
            🎉 WON DEAL INFORMATION
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            <div>
              <small style={{ color: "#065f46" }}>Deal Value (₹)</small>
              <input
                type="number"
                value={conversionValue}
                onChange={(e) => setConversionValue(e.target.value)}
                style={{ width: "100%", padding: "6px", borderRadius: "6px", border: "1px solid #6ee7b7", fontSize: "12px" }}
              />
            </div>
            <div>
              <small style={{ color: "#065f46" }}>Product</small>
              <input
                type="text"
                value={wonProduct}
                onChange={(e) => setWonProduct(e.target.value)}
                style={{ width: "100%", padding: "6px", borderRadius: "6px", border: "1px solid #6ee7b7", fontSize: "12px" }}
              />
            </div>
          </div>
        </div>
      )}

      {/* NEXT FOLLOW-UP AUTO-CHAIN */}
      {!isConverted && !isLost && (
        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "12px", marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ fontSize: "12px", fontWeight: "700", color: "#0f172a" }}>
              🗓️ Auto-Schedule Next Follow-up
            </span>
            <input
              type="checkbox"
              checked={scheduleNext}
              onChange={(e) => setScheduleNext(e.target.checked)}
              style={{ width: "16px", height: "16px", cursor: "pointer" }}
            />
          </div>

          {scheduleNext && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "6px" }}>
              <div>
                <small style={{ color: "#64748b" }}>Next Date</small>
                <input
                  type="date"
                  value={nextDate}
                  onChange={(e) => setNextDate(e.target.value)}
                  style={{ width: "100%", padding: "6px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }}
                />
              </div>
              <div>
                <small style={{ color: "#64748b" }}>Next Time</small>
                <input
                  type="time"
                  value={nextTime}
                  onChange={(e) => setNextTime(e.target.value)}
                  style={{ width: "100%", padding: "6px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* BUTTONS */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "16px" }}>
        <Button variant="outline" type="button" onClick={onCancel} disabled={submitting}>
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
