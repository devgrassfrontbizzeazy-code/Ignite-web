import { useState } from "react";
import {
  Camera,
  MapPin,
  Calendar,
  DollarSign,
  Package,
  CheckCircle,
  ArrowRight,
  XCircle,
} from "lucide-react";
import Button from "../../../common/Button/Button";
import DatePicker from "../../../common/DatePicker/DatePicker";
import TimePicker from "../../../common/TimePicker/TimePicker";
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
const RESPONSE_ICONS = {
  Interested: ArrowRight,
  "Follow-up Required": Calendar,
  "Demo Required": Package,
  Negotiation: DollarSign,
  Converted: CheckCircle,
  "Meeting Rescheduled": Calendar,
  "Not Interested": XCircle,
};

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
        <label className="visit-checkout__label">
          Client Response <span className="visit-checkout__required">*</span>
        </label>
        <div className="visit-checkout__responses-grid">
          {CLIENT_RESPONSES.map((res) => {
            const isSelected = clientResponse === res.id;
            const ResponseIcon = RESPONSE_ICONS[res.id];

            return (
              <button
                key={res.id}
                type="button"
                onClick={() => setClientResponse(res.id)}
                className={`visit-checkout__response-btn ${isSelected ? "visit-checkout__response-btn--selected" : ""
                  }`}
                style={{
                  "--response-color": res.color,
                  "--response-bg": res.bg,
                }}
              >
                <span className="visit-checkout__response-icon">
                  <ResponseIcon size={15} />
                </span>

                <span className="visit-checkout__response-content">
                  <span className="visit-checkout__response-label">
                    {res.label}
                  </span>
                </span>

                {isSelected && (
                  <CheckCircle
                    className="visit-checkout__response-check"
                    size={15}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. CLIENT FEEDBACK / NOTES */}
      <div className="visit-checkout__field">
        <label htmlFor="visit-feedback" className="visit-checkout__label">
          Client Feedback & Meeting Summary
        </label>
        <textarea
          id="visit-feedback"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Client feedback, requirements discussed, pain points and key takeaways..."
          rows={3}
          className="visit-checkout__textarea"
        />
      </div>

      {/* 3. TAKE PHOTO (PROOF + GPS AUTO-CAPTURED - MANDATORY) */}
      <div className="visit-checkout__field">
        <label className="visit-checkout__label">
          Photo Proof <span className="visit-checkout__required">* (Mandatory)</span>
        </label>
        <div className="visit-checkout__photo-upload-row">
          <label className={`visit-checkout__photo-upload-label ${photoError ? "visit-checkout__photo-upload-label--error" : ""}`}>
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
          <span className={`visit-checkout__photo-status ${photos.length > 0 ? "visit-checkout__photo-status--attached" : ""}`}>
            {photos.length > 0 ? `${photos.length} photo attached` : "At least 1 photo required"}
          </span>
        </div>

        {photoError && (
          <div className="visit-checkout__photo-error">
            {photoError}
          </div>
        )}

        {photos.length > 0 && (
          <div className="visit-checkout__photos-preview">
            {photos.map((p, idx) => (
              <div key={idx} className="visit-checkout__photo-thumb">
                <img src={p.photo_url} alt="Captured preview" />
                <button
                  type="button"
                  onClick={() => setPhotos((prev) => prev.filter((_, i) => i !== idx))}
                  className="visit-checkout__photo-remove-btn"
                >
                  <XCircle size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4A. SUB-FORM: SCHEDULE NEXT FOLLOW-UP */}
      {isFollowUp && (
        <div className="visit-checkout__subform">
          <div className="visit-checkout__subform-title">
            <Calendar size={16} color="var(--color-secondary, #0BA37F)" /> SCHEDULE NEXT FOLLOW-UP
          </div>

          <div className="visit-checkout__subform-grid">
            <div>
              <label className="visit-checkout__subform-label">Follow-up Date</label>
              <DatePicker
                value={followUpDate}
                onChange={(d) => setFollowUpDate(d)}
                placeholder="Select date"
              />
            </div>

            <div>
              <label className="visit-checkout__subform-label">Time</label>
              <TimePicker
                value={followUpTime}
                onChange={(t) => setFollowUpTime(t)}
              />
            </div>
          </div>

          <div className="visit-checkout__subform-field">
            <label className="visit-checkout__subform-label">Follow-up Mode</label>
            <div className="visit-checkout__modes-group">
              {FOLLOWUP_TYPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setFollowUpType(t.id)}
                  className={`visit-checkout__mode-btn ${followUpType === t.id ? "visit-checkout__mode-btn--active" : ""}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="visit-checkout__subform-field">
            <label className="visit-checkout__subform-label">Follow-up Reason / Notes</label>
            <input
              type="text"
              value={followUpNote}
              onChange={(e) => setFollowUpNote(e.target.value)}
              placeholder="e.g. Final pricing discussion with HR Head"
              className="visit-checkout__subform-input"
            />
          </div>
        </div>
      )}

      {/* 4B. SUB-FORM: DEMO REQUIRED */}
      {isDemo && (
        <div className="visit-checkout__subform">
          <div className="visit-checkout__subform-title">
            <Package size={16} color="var(--color-secondary, #0BA37F)" /> SCHEDULE PRODUCT DEMO SESSION
          </div>

          <div className="visit-checkout__subform-grid">
            <div>
              <label className="visit-checkout__subform-label">Demo Date</label>
              <DatePicker
                value={demoDate}
                onChange={(d) => setDemoDate(d)}
                placeholder="Select date"
              />
            </div>

            <div>
              <label className="visit-checkout__subform-label">Demo Time</label>
              <TimePicker
                value={demoTime}
                onChange={(t) => setDemoTime(t)}
              />
            </div>
          </div>

          <div className="visit-checkout__subform-field">
            <label className="visit-checkout__subform-label">Demo Format / Type</label>
            <div className="visit-checkout__modes-group">
              {["Online (Google Meet/Zoom)", "On-Site / In-Person Demo"].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setDemoType(type)}
                  className={`visit-checkout__mode-btn ${demoType === type ? "visit-checkout__mode-btn--active" : ""}`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="visit-checkout__subform-field">
            <label className="visit-checkout__subform-label">Key Attendees / Stakeholders</label>
            <input
              type="text"
              value={demoParticipants}
              onChange={(e) => setDemoParticipants(e.target.value)}
              placeholder="e.g. CTO, Product Manager & HR Team"
              className="visit-checkout__subform-input"
            />
          </div>
        </div>
      )}

      {/* 4C. SUB-FORM: NEGOTIATION */}
      {isNegotiation && (
        <div className="visit-checkout__subform">
          <div className="visit-checkout__subform-title">
            <DollarSign size={16} color="var(--color-accent-gold, #D4AF37)" /> COMMERCIAL & DEAL NEGOTIATION
          </div>

          <div className="visit-checkout__subform-grid">
            <div>
              <label className="visit-checkout__subform-label">Expected Deal Value (₹)</label>
              <input
                type="number"
                value={expectedDealValue}
                onChange={(e) => setExpectedDealValue(e.target.value)}
                placeholder="e.g. 75000"
                className="visit-checkout__subform-input"
              />
            </div>

            <div>
              <label className="visit-checkout__subform-label">Discount / Terms Requested</label>
              <input
                type="text"
                value={discountRequested}
                onChange={(e) => setDiscountRequested(e.target.value)}
                placeholder="e.g. 15% discount or quarterly payment terms"
                className="visit-checkout__subform-input"
              />
            </div>
          </div>

          <div className="visit-checkout__subform-field">
            <label className="visit-checkout__subform-label">Negotiation Details / Next Review Date</label>
            <input
              type="text"
              value={negotiationNotes}
              onChange={(e) => setNegotiationNotes(e.target.value)}
              placeholder="e.g. Sent revised commercial proposal, follow-up call on Friday"
              className="visit-checkout__subform-input"
            />
          </div>
        </div>
      )}

      {/* 4D. SUB-FORM: INTERESTED */}
      {isInterested && (
        <div className="visit-checkout__subform">
          <div className="visit-checkout__subform-title">
            <CheckCircle size={16} color="var(--color-secondary, #0BA37F)" /> CLIENT INTEREST & OPPORTUNITY DETAILS
          </div>

          <div className="visit-checkout__subform-grid">
            <div>
              <label className="visit-checkout__subform-label">Interested Product / Service</label>
              <input
                type="text"
                value={interestedProduct}
                onChange={(e) => setInterestedProduct(e.target.value)}
                placeholder="e.g. Ignite HRMS Suite"
                className="visit-checkout__subform-input"
              />
            </div>

            <div>
              <label className="visit-checkout__subform-label">Pipeline Stage</label>
              <select
                value={leadStage}
                onChange={(e) => setLeadStage(e.target.value)}
                className="visit-checkout__subform-select"
              >
                <option value="Decision Pending">Decision Pending (Internal Approval)</option>
                <option value="Budget Allocation">Budget Allocation In Progress</option>
                <option value="Contract Review">Contract / Agreement Review</option>
                <option value="Warm Opportunity">Warm Opportunity</option>
              </select>
            </div>
          </div>

          <div className="visit-checkout__subform-field">
            <label className="visit-checkout__subform-label">Tentative Decision / Closure Date</label>
            <DatePicker
              value={tentativeClosureDate}
              onChange={(d) => setTentativeClosureDate(d)}
              placeholder="Select date"
            />
          </div>
        </div>
      )}

      {/* 5. SUB-FORM: CONVERTED / DEAL WON */}
      {isConverted && (
        <div className="visit-checkout__subform visit-checkout__subform--converted">
          <div className="visit-checkout__subform-title" style={{ color: "#047857" }}>
            <DollarSign size={16} /> CONVERSION / DEAL WON DETAILS
          </div>

          <div className="visit-checkout__subform-grid">
            <div>
              <label className="visit-checkout__subform-label" style={{ color: "#065f46" }}>Deal Value (₹)</label>
              <input
                type="number"
                value={conversionValue}
                onChange={(e) => setConversionValue(e.target.value)}
                placeholder="50000"
                className="visit-checkout__subform-input"
                style={{ borderColor: "#34d399" }}
              />
            </div>

            <div>
              <label className="visit-checkout__subform-label" style={{ color: "#065f46" }}>Product Sold</label>
              <input
                type="text"
                value={wonProduct}
                onChange={(e) => setWonProduct(e.target.value)}
                placeholder="Ignite HRMS"
                className="visit-checkout__subform-input"
                style={{ borderColor: "#34d399" }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ACTIONS */}
      <div className="visit-checkout__actions">
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