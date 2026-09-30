import { useState } from "react";
import { Camera, MapPin, Calendar, Clock, DollarSign, Package, CheckCircle, ArrowRight } from "lucide-react";
import Button from "../../../common/Button/Button";
import "./VisitCheckOut.css";

const CLIENT_RESPONSES = [
  { id: "Interested", label: "Interested", color: "#10b981", bg: "#ecfdf5" },
  { id: "Follow-up Required", label: "Follow-up Required", color: "#3b82f6", bg: "#eff6ff" },
  { id: "Demo Required", label: "Demo Required", color: "#8b5cf6", bg: "#f5f3ff" },
  { id: "Negotiation", label: "Negotiation", color: "#f59e0b", bg: "#fffbeb" },
  { id: "Converted", label: "Converted / Deal Won", color: "#059669", bg: "#d1fae5" },
  { id: "Meeting Rescheduled", label: "Meeting Rescheduled", color: "#6366f1", bg: "#eef2ff" },
  { id: "Not Interested", label: "Not Interested", color: "#ef4444", bg: "#fef2f2" },
];

const FOLLOWUP_TYPES = [
  { id: "Call", label: "Phone Call" },
  { id: "Meeting", label: "In-Person Meeting" },
  { id: "Demo", label: "Product Demo" },
  { id: "WhatsApp", label: "WhatsApp Message" },
];

const VisitCheckout = ({
  visit,
  onComplete,
  onCancel,
  submitting = false,
}) => {
  const [clientResponse, setClientResponse] = useState("Follow-up Required");
  const [feedback, setFeedback] = useState("");
  const [photos, setPhotos] = useState([]);
  
  // Distinct subform triggers for each response type
  const isFollowUp = clientResponse === "Follow-up Required" || clientResponse === "Meeting Rescheduled";
  const isDemo = clientResponse === "Demo Required";
  const isNegotiation = clientResponse === "Negotiation";
  const isInterested = clientResponse === "Interested";
  const isConverted = clientResponse === "Converted";

  // Follow-up specific fields
  const [followUpDate, setFollowUpDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split("T")[0];
  });
  const [followUpTime, setFollowUpTime] = useState("11:00");
  const [followUpType, setFollowUpType] = useState("Call");
  const [followUpNote, setFollowUpNote] = useState("");

  // Demo Required specific fields
  const [demoDate, setDemoDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split("T")[0];
  });
  const [demoTime, setDemoTime] = useState("14:00");
  const [demoType, setDemoType] = useState("Online (Google Meet/Zoom)");
  const [demoParticipants, setDemoParticipants] = useState("");

  // Negotiation specific fields
  const [expectedDealValue, setExpectedDealValue] = useState("");
  const [discountRequested, setDiscountRequested] = useState("");
  const [negotiationNotes, setNegotiationNotes] = useState("");

  // Interested specific fields
  const [interestedProduct, setInterestedProduct] = useState("Ignite HRMS");
  const [leadStage, setLeadStage] = useState("Decision Pending");
  const [tentativeClosureDate, setTentativeClosureDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split("T")[0];
  });

  // Converted subform
  const [conversionValue, setConversionValue] = useState("50000");
  const [wonProduct, setWonProduct] = useState("Ignite HRMS");

  const [photoError, setPhotoError] = useState("");

  const handlePhotoCapture = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotos((prev) => [
        ...prev,
        {
          photo_url: reader.result,
          caption: `Photo proof - ${new Date().toLocaleTimeString()}`,
          captured_at: new Date().toISOString(),
        },
      ]);
      setPhotoError("");
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!clientResponse) return;

    if (!photos || photos.length === 0) {
      setPhotoError("Photo proof is mandatory. Please capture or upload at least 1 photo.");
      return;
    }

    setPhotoError("");

    let scheduleFollowUp = false;
    let computedFollowUpDate = null;
    let computedFollowUpTime = null;
    let computedFollowUpType = null;
    let computedFollowUpNote = null;

    if (isFollowUp) {
      scheduleFollowUp = true;
      computedFollowUpDate = followUpDate;
      computedFollowUpTime = followUpTime;
      computedFollowUpType = followUpType;
      computedFollowUpNote = followUpNote || feedback;
    } else if (isDemo) {
      scheduleFollowUp = true;
      computedFollowUpDate = demoDate;
      computedFollowUpTime = demoTime;
      computedFollowUpType = "Demo";
      computedFollowUpNote = `[Demo Request: ${demoType}] Participants: ${demoParticipants || "Key Stakeholders"}. Notes: ${feedback}`;
    } else if (isNegotiation) {
      scheduleFollowUp = true;
      computedFollowUpDate = followUpDate;
      computedFollowUpTime = followUpTime;
      computedFollowUpType = "Meeting";
      computedFollowUpNote = `[Negotiation Details] Expected Value: ₹${expectedDealValue || "TBD"}, Discount/Terms: ${discountRequested || "Standard"}. Notes: ${negotiationNotes || feedback}`;
    } else if (isInterested) {
      scheduleFollowUp = true;
      computedFollowUpDate = tentativeClosureDate;
      computedFollowUpTime = "11:00";
      computedFollowUpType = "Call";
      computedFollowUpNote = `[High Interest] Product: ${interestedProduct}, Stage: ${leadStage}. Tentative closure: ${tentativeClosureDate}. Notes: ${feedback}`;
    }

    onComplete?.({
      client_response: clientResponse,
      feedback,
      meeting_notes: feedback,
      photos,
      schedule_follow_up: scheduleFollowUp,
      follow_up_date: computedFollowUpDate,
      follow_up_time: computedFollowUpTime,
      follow_up_type: computedFollowUpType,
      follow_up_note: computedFollowUpNote,
      conversion_value: isConverted ? parseFloat(conversionValue || 0) : (parseFloat(expectedDealValue || 0)),
      won_product: isConverted ? wonProduct : (interestedProduct || ""),
    });
  };

  return (
    <form className="visit-checkout" onSubmit={handleSubmit}>
      {/* HEADER */}
      <div className="visit-checkout__lead">
        <div className="visit-checkout__icon">
          <MapPin size={18} />
        </div>
        <div>
          <span>VISIT REPORT & OUTCOME</span>
          <h3>{visit?.companyName || "Client"}</h3>
          <p>{visit?.leadName || "Lead Contact"}</p>
        </div>
      </div>

      {/* 1. CLIENT RESPONSE SELECTION */}
      <div className="visit-checkout__field">
        <label style={{ fontWeight: "700", fontSize: "13px" }}>
          Client Response <span style={{ color: "#ef4444" }}>*</span>
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px", marginTop: "6px" }}>
          {CLIENT_RESPONSES.map((res) => {
            const isSelected = clientResponse === res.id;
            return (
              <button
                key={res.id}
                type="button"
                onClick={() => setClientResponse(res.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  border: isSelected ? `2px solid ${res.color}` : "1px solid #e2e8f0",
                  background: isSelected ? res.bg : "#ffffff",
                  color: isSelected ? res.color : "#334155",
                  fontWeight: isSelected ? "700" : "500",
                  fontSize: "12px",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.15s ease",
                }}
              >
                <span
                  style={{
                    width: "12px",
                    height: "12px",
                    borderRadius: "50%",
                    border: `2px solid ${res.color}`,
                    background: isSelected ? res.color : "transparent",
                  }}
                />
                {res.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. CLIENT FEEDBACK / NOTES */}
      <div className="visit-checkout__field">
        <label htmlFor="visit-feedback" style={{ fontWeight: "700", fontSize: "13px" }}>
          Client Feedback & Meeting Summary
        </label>
        <textarea
          id="visit-feedback"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Client feedback, requirements discussed, pain points and key takeaways..."
          rows={3}
          style={{
            width: "100%",
            borderRadius: "10px",
            border: "1px solid #cbd5e1",
            padding: "10px",
            fontSize: "12px",
            marginTop: "6px",
          }}
        />
      </div>

      {/* 3. TAKE PHOTO (PROOF + GPS AUTO-CAPTURED - MANDATORY) */}
      <div className="visit-checkout__field">
        <label style={{ fontWeight: "700", fontSize: "13px" }}>
          📷 Photo Proof (Auto GPS & Timestamp Stamped) <span style={{ color: "#ef4444" }}>* (Mandatory)</span>
        </label>
        <div style={{ display: "flex", gap: "10px", alignItems: "center", marginTop: "6px" }}>
          <label
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 16px",
              borderRadius: "10px",
              background: photoError ? "#fef2f2" : "#f1f5f9",
              border: photoError ? "1px dashed #ef4444" : "1px dashed #94a3b8",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: "600",
              color: photoError ? "#b91c1c" : "#334155",
            }}
          >
            <Camera size={18} color={photoError ? "#ef4444" : "#0284c7"} />
            <span>Take / Upload Photo</span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoCapture}
              style={{ display: "none" }}
            />
          </label>
          <span style={{ fontSize: "11px", color: photos.length > 0 ? "#059669" : "#64748b", fontWeight: photos.length > 0 ? "700" : "500" }}>
            {photos.length > 0 ? `✓ ${photos.length} photo attached` : "At least 1 photo required"}
          </span>
        </div>

        {photoError && (
          <div style={{ color: "#dc2626", fontSize: "11px", fontWeight: "600", marginTop: "4px" }}>
            ⚠️ {photoError}
          </div>
        )}

        {photos.length > 0 && (
          <div style={{ display: "flex", gap: "8px", marginTop: "10px", flexWrap: "wrap" }}>
            {photos.map((p, idx) => (
              <div
                key={idx}
                style={{
                  position: "relative",
                  width: "70px",
                  height: "70px",
                  borderRadius: "8px",
                  overflow: "hidden",
                  border: "1px solid #cbd5e1",
                }}
              >
                <img
                  src={p.photo_url}
                  alt="Captured preview"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
                <button
                  type="button"
                  onClick={() => setPhotos((prev) => prev.filter((_, i) => i !== idx))}
                  style={{
                    position: "absolute",
                    top: "2px",
                    right: "2px",
                    background: "rgba(0,0,0,0.6)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "50%",
                    width: "16px",
                    height: "16px",
                    fontSize: "10px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    lineHeight: "1",
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4A. SUB-FORM: SCHEDULE NEXT FOLLOW-UP (Only for Follow-up Required / Rescheduled) */}
      {isFollowUp && (
        <div
          style={{
            background: "#eff6ff",
            border: "1px solid #bfdbfe",
            borderRadius: "12px",
            padding: "14px",
            marginTop: "10px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#2563eb", fontWeight: "700", fontSize: "12px", marginBottom: "10px" }}>
            <Calendar size={16} /> SCHEDULE NEXT FOLLOW-UP
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div>
              <label style={{ fontSize: "11px", fontWeight: "600", color: "#475569" }}>Follow-up Date</label>
              <input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                style={{ width: "100%", padding: "8px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px", marginTop: "4px" }}
              />
            </div>

            <div>
              <label style={{ fontSize: "11px", fontWeight: "600", color: "#475569" }}>Time</label>
              <input
                type="time"
                value={followUpTime}
                onChange={(e) => setFollowUpTime(e.target.value)}
                style={{ width: "100%", padding: "8px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px", marginTop: "4px" }}
              />
            </div>
          </div>

          <div style={{ marginTop: "10px" }}>
            <label style={{ fontSize: "11px", fontWeight: "600", color: "#475569" }}>Follow-up Mode</label>
            <div style={{ display: "flex", gap: "6px", marginTop: "4px", flexWrap: "wrap" }}>
              {FOLLOWUP_TYPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setFollowUpType(t.id)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "6px",
                    fontSize: "11px",
                    fontWeight: "600",
                    border: followUpType === t.id ? "1px solid #2563eb" : "1px solid #cbd5e1",
                    background: followUpType === t.id ? "#2563eb" : "#ffffff",
                    color: followUpType === t.id ? "#ffffff" : "#475569",
                    cursor: "pointer",
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginTop: "10px" }}>
            <label style={{ fontSize: "11px", fontWeight: "600", color: "#475569" }}>Follow-up Reason / Notes</label>
            <input
              type="text"
              value={followUpNote}
              onChange={(e) => setFollowUpNote(e.target.value)}
              placeholder="e.g. Final pricing discussion with HR Head"
              style={{ width: "100%", padding: "8px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px", marginTop: "4px" }}
            />
          </div>
        </div>
      )}

      {/* 4B. SUB-FORM: DEMO REQUIRED */}
      {isDemo && (
        <div
          style={{
            background: "#f5f3ff",
            border: "1px solid #ddd6fe",
            borderRadius: "12px",
            padding: "14px",
            marginTop: "10px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#7c3aed", fontWeight: "700", fontSize: "12px", marginBottom: "10px" }}>
            <Package size={16} /> SCHEDULE PRODUCT DEMO SESSION
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div>
              <label style={{ fontSize: "11px", fontWeight: "600", color: "#5b21b6" }}>Demo Date</label>
              <input
                type="date"
                value={demoDate}
                onChange={(e) => setDemoDate(e.target.value)}
                style={{ width: "100%", padding: "8px", borderRadius: "8px", border: "1px solid #c4b5fd", fontSize: "12px", marginTop: "4px" }}
              />
            </div>

            <div>
              <label style={{ fontSize: "11px", fontWeight: "600", color: "#5b21b6" }}>Demo Time</label>
              <input
                type="time"
                value={demoTime}
                onChange={(e) => setDemoTime(e.target.value)}
                style={{ width: "100%", padding: "8px", borderRadius: "8px", border: "1px solid #c4b5fd", fontSize: "12px", marginTop: "4px" }}
              />
            </div>
          </div>

          <div style={{ marginTop: "10px" }}>
            <label style={{ fontSize: "11px", fontWeight: "600", color: "#5b21b6" }}>Demo Format / Type</label>
            <div style={{ display: "flex", gap: "6px", marginTop: "4px" }}>
              {["Online (Google Meet/Zoom)", "On-Site / In-Person Demo"].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setDemoType(type)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "6px",
                    fontSize: "11px",
                    fontWeight: "600",
                    border: demoType === type ? "1px solid #7c3aed" : "1px solid #cbd5e1",
                    background: demoType === type ? "#7c3aed" : "#ffffff",
                    color: demoType === type ? "#ffffff" : "#475569",
                    cursor: "pointer",
                  }}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginTop: "10px" }}>
            <label style={{ fontSize: "11px", fontWeight: "600", color: "#5b21b6" }}>Key Attendees / Stakeholders</label>
            <input
              type="text"
              value={demoParticipants}
              onChange={(e) => setDemoParticipants(e.target.value)}
              placeholder="e.g. CTO, Product Manager & HR Team"
              style={{ width: "100%", padding: "8px", borderRadius: "8px", border: "1px solid #c4b5fd", fontSize: "12px", marginTop: "4px" }}
            />
          </div>
        </div>
      )}

      {/* 4C. SUB-FORM: NEGOTIATION */}
      {isNegotiation && (
        <div
          style={{
            background: "#fffbeb",
            border: "1px solid #fde68a",
            borderRadius: "12px",
            padding: "14px",
            marginTop: "10px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#d97706", fontWeight: "700", fontSize: "12px", marginBottom: "10px" }}>
            <DollarSign size={16} /> COMMERCIAL & DEAL NEGOTIATION
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div>
              <label style={{ fontSize: "11px", fontWeight: "600", color: "#92400e" }}>Expected Deal Value (₹)</label>
              <input
                type="number"
                value={expectedDealValue}
                onChange={(e) => setExpectedDealValue(e.target.value)}
                placeholder="e.g. 75000"
                style={{ width: "100%", padding: "8px", borderRadius: "8px", border: "1px solid #fcd34d", fontSize: "12px", marginTop: "4px" }}
              />
            </div>

            <div>
              <label style={{ fontSize: "11px", fontWeight: "600", color: "#92400e" }}>Discount / Terms Requested</label>
              <input
                type="text"
                value={discountRequested}
                onChange={(e) => setDiscountRequested(e.target.value)}
                placeholder="e.g. 15% discount or quarterly payment terms"
                style={{ width: "100%", padding: "8px", borderRadius: "8px", border: "1px solid #fcd34d", fontSize: "12px", marginTop: "4px" }}
              />
            </div>
          </div>

          <div style={{ marginTop: "10px" }}>
            <label style={{ fontSize: "11px", fontWeight: "600", color: "#92400e" }}>Negotiation Details / Next Review Date</label>
            <input
              type="text"
              value={negotiationNotes}
              onChange={(e) => setNegotiationNotes(e.target.value)}
              placeholder="e.g. Sent revised commercial proposal, follow-up call on Friday"
              style={{ width: "100%", padding: "8px", borderRadius: "8px", border: "1px solid #fcd34d", fontSize: "12px", marginTop: "4px" }}
            />
          </div>
        </div>
      )}

      {/* 4D. SUB-FORM: INTERESTED */}
      {isInterested && (
        <div
          style={{
            background: "#ecfdf5",
            border: "1px solid #a7f3d0",
            borderRadius: "12px",
            padding: "14px",
            marginTop: "10px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#059669", fontWeight: "700", fontSize: "12px", marginBottom: "10px" }}>
            <CheckCircle size={16} /> CLIENT INTEREST & OPPORTUNITY DETAILS
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div>
              <label style={{ fontSize: "11px", fontWeight: "600", color: "#065f46" }}>Interested Product / Service</label>
              <input
                type="text"
                value={interestedProduct}
                onChange={(e) => setInterestedProduct(e.target.value)}
                placeholder="e.g. Ignite HRMS Suite"
                style={{ width: "100%", padding: "8px", borderRadius: "8px", border: "1px solid #6ee7b7", fontSize: "12px", marginTop: "4px" }}
              />
            </div>

            <div>
              <label style={{ fontSize: "11px", fontWeight: "600", color: "#065f46" }}>Pipeline Stage</label>
              <select
                value={leadStage}
                onChange={(e) => setLeadStage(e.target.value)}
                style={{ width: "100%", padding: "8px", borderRadius: "8px", border: "1px solid #6ee7b7", fontSize: "12px", marginTop: "4px", background: "#fff" }}
              >
                <option value="Decision Pending">Decision Pending (Internal Approval)</option>
                <option value="Budget Allocation">Budget Allocation In Progress</option>
                <option value="Contract Review">Contract / Agreement Review</option>
                <option value="Warm Opportunity">Warm Opportunity</option>
              </select>
            </div>
          </div>

          <div style={{ marginTop: "10px" }}>
            <label style={{ fontSize: "11px", fontWeight: "600", color: "#065f46" }}>Tentative Decision / Closure Date</label>
            <input
              type="date"
              value={tentativeClosureDate}
              onChange={(e) => setTentativeClosureDate(e.target.value)}
              style={{ width: "100%", padding: "8px", borderRadius: "8px", border: "1px solid #6ee7b7", fontSize: "12px", marginTop: "4px" }}
            />
          </div>
        </div>
      )}

      {/* 5. SUB-FORM: CONVERTED / DEAL WON */}
      {isConverted && (
        <div
          style={{
            background: "#d1fae5",
            border: "1px solid #6ee7b7",
            borderRadius: "12px",
            padding: "14px",
            marginTop: "10px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#047857", fontWeight: "700", fontSize: "12px", marginBottom: "10px" }}>
            <DollarSign size={16} /> CONVERSION / DEAL WON DETAILS
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div>
              <label style={{ fontSize: "11px", fontWeight: "600", color: "#065f46" }}>Deal Value (₹)</label>
              <input
                type="number"
                value={conversionValue}
                onChange={(e) => setConversionValue(e.target.value)}
                placeholder="50000"
                style={{ width: "100%", padding: "8px", borderRadius: "8px", border: "1px solid #34d399", fontSize: "12px", marginTop: "4px" }}
              />
            </div>

            <div>
              <label style={{ fontSize: "11px", fontWeight: "600", color: "#065f46" }}>Product Sold</label>
              <input
                type="text"
                value={wonProduct}
                onChange={(e) => setWonProduct(e.target.value)}
                placeholder="Ignite HRMS"
                style={{ width: "100%", padding: "8px", borderRadius: "8px", border: "1px solid #34d399", fontSize: "12px", marginTop: "4px" }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ACTIONS */}
      <div className="visit-checkout__actions" style={{ marginTop: "18px" }}>
        <Button variant="outline" type="button" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button variant="primary" type="submit" disabled={submitting}>
          {submitting ? "Submitting Report..." : "Submit Visit Report"}
        </Button>
      </div>
    </form>
  );
};

export default VisitCheckout;