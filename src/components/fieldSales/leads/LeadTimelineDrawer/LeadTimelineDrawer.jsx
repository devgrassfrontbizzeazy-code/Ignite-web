import { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  User,
  CheckCircle,
  Phone,
  MessageSquare,
  DollarSign,
  AlertCircle,
  Camera,
  Layers,
  ArrowRight,
} from "lucide-react";
import { getLeadTimelineHistory } from "../../../../services/api/fieldSalesAPI";
import IgniteLoader from "../../../common/IgniteLoader/IgniteLoader";



const LeadTimelineDrawer = ({ leadId, onClose }) => {
  const [timelineData, setTimelineData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!leadId) return;

    let isMounted = true;
    const fetchTimeline = async () => {
      try {
        setLoading(true);
        const res = await getLeadTimelineHistory(leadId);
        if (isMounted && res?.data) {
          setTimelineData(res.data);
        }
      } catch (err) {
        console.error("Error fetching lead timeline:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchTimeline();
    return () => {
      isMounted = false;
    };
  }, [leadId]);

  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <IgniteLoader size={36} />
        <p style={{ marginTop: "12px", color: "#64748b", fontSize: "13px" }}>
          Loading Lead 360° History...
        </p>
      </div>
    );
  }

  if (!timelineData) {
    return (
      <div style={{ padding: "30px", textAlign: "center", color: "#64748b" }}>
        No timeline details found.
      </div>
    );
  }

  const { lead, visits = [], followups = [], activities = [] } = timelineData;

  const getStatusBadgeColor = (status) => {
    switch (String(status).toLowerCase()) {
      case "converted":
      case "won":
        return { bg: "#ecfdf5", text: "#059669", border: "#a7f3d0" };
      case "lost":
      case "not interested":
        return { bg: "#fef2f2", text: "#dc2626", border: "#fecaca" };
      case "negotiation":
        return { bg: "#fffbeb", text: "#d97706", border: "#fde68a" };
      case "follow-up required":
      case "demo required":
        return { bg: "#eff6ff", text: "#2563eb", border: "#bfdbfe" };
      default:
        return { bg: "#f1f5f9", text: "#475569", border: "#cbd5e1" };
    }
  };

  const badge = getStatusBadgeColor(lead.status);

  return (
    <div style={{ padding: "6px", color: "#0f172a", fontFamily: "inherit" }}>
      {/* 1. LEAD SUMMARY HERO CARD */}
      <div
        style={{
          background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
          border: "1px solid #e2e8f0",
          borderRadius: "14px",
          padding: "16px",
          marginBottom: "20px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
          <div>
            <span style={{ fontSize: "10px", fontWeight: "700", color: "#64748b", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              LEAD 360° PROFILE
            </span>
            <h2 style={{ margin: "2px 0 4px", fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>
              {lead.company_name || lead.title}
            </h2>
            <p style={{ margin: 0, fontSize: "12px", color: "#475569" }}>
              👤 Contact: <strong>{lead.contact_name || `${lead.first_name} ${lead.last_name}`}</strong>
              {lead.phone && ` • 📞 ${lead.phone}`}
            </p>
          </div>

          <span
            style={{
              padding: "4px 10px",
              borderRadius: "16px",
              fontSize: "11px",
              fontWeight: "700",
              background: badge.bg,
              color: badge.text,
              border: `1px solid ${badge.border}`,
              textTransform: "uppercase",
            }}
          >
            ● {lead.status}
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", marginTop: "14px", borderTop: "1px solid #e2e8f0", paddingTop: "12px" }}>
          <div>
            <small style={{ color: "#64748b", fontSize: "10px", display: "block" }}>Assigned Sales Rep</small>
            <strong style={{ fontSize: "12px", color: "#0f172a" }}>{lead.assigned_to_name || "Unassigned"}</strong>
          </div>
          <div>
            <small style={{ color: "#64748b", fontSize: "10px", display: "block" }}>Priority</small>
            <strong style={{ fontSize: "12px", color: lead.priority === "High" ? "#ef4444" : "#0f172a" }}>
              {lead.priority || "High"}
            </strong>
          </div>
          <div>
            <small style={{ color: "#64748b", fontSize: "10px", display: "block" }}>
              {lead.status === "Converted" ? "Deal Value" : "Estimated Value"}
            </small>
            <strong style={{ fontSize: "12px", color: lead.status === "Converted" ? "#059669" : "#0f172a" }}>
              ₹{Number(lead.conversion_value || lead.estimated_value || 0).toLocaleString()}
            </strong>
          </div>
        </div>

        {lead.address && (
          <div style={{ marginTop: "10px", fontSize: "11px", color: "#64748b", display: "flex", alignItems: "center", gap: "4px" }}>
            <MapPin size={13} color="#0284c7" /> {lead.address}
          </div>
        )}
      </div>

      {/* 2. CHRONOLOGICAL UNIFIED TIMELINE */}
      <h3 style={{ fontSize: "14px", fontWeight: "800", color: "#1e293b", marginBottom: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
        <Layers size={16} color="#0284c7" /> ACTIVITY & ENGAGEMENT HISTORY
      </h3>

      <div style={{ position: "relative", paddingLeft: "24px" }}>
        {/* Continuous timeline line */}
        <div
          style={{
            position: "absolute",
            left: "8px",
            top: "8px",
            bottom: "8px",
            width: "2px",
            background: "#cbd5e1",
          }}
        />

        {/* Loop all activities */}
        {activities.length > 0 ? (
          activities.map((act, index) => {
            const isVisit = act.activity_type.includes("VISIT");
            const isFollowUp = act.activity_type.includes("FOLLOW_UP");
            const isWon = act.activity_type === "DEAL_CONVERTED";
            const isLost = act.activity_type === "DEAL_LOST";

            const dotColor = isWon
              ? "#10b981"
              : isLost
              ? "#ef4444"
              : isVisit
              ? "#0284c7"
              : isFollowUp
              ? "#f59e0b"
              : "#64748b";

            return (
              <div
                key={act.id || index}
                style={{
                  position: "relative",
                  marginBottom: "20px",
                }}
              >
                {/* Milestone Node */}
                <div
                  style={{
                    position: "absolute",
                    left: "-20px",
                    top: "3px",
                    width: "12px",
                    height: "12px",
                    borderRadius: "50%",
                    background: dotColor,
                    border: "2px solid #ffffff",
                    boxShadow: `0 0 0 2px ${dotColor}33`,
                  }}
                />

                <div
                  style={{
                    background: isWon
                      ? "#ecfdf5"
                      : isLost
                      ? "#fef2f2"
                      : "#ffffff",
                    border: `1px solid ${
                      isWon
                        ? "#a7f3d0"
                        : isLost
                        ? "#fecaca"
                        : "#e2e8f0"
                    }`,
                    borderRadius: "10px",
                    padding: "12px 14px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                    <strong style={{ fontSize: "13px", color: isWon ? "#065f46" : isLost ? "#991b1b" : "#0f172a" }}>
                      {act.title}
                    </strong>
                    <span style={{ fontSize: "10px", color: "#64748b" }}>
                      {new Date(act.performed_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}{" "}
                      •{" "}
                      {new Date(act.performed_at).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#334155", lineHeight: 1.45 }}>
                    {act.description}
                  </p>

                  {act.employee_name && (
                    <div style={{ marginTop: "6px", fontSize: "10px", color: "#64748b", display: "flex", alignItems: "center", gap: "4px" }}>
                      <User size={11} /> Logged by {act.employee_name}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <p style={{ color: "#94a3b8", fontSize: "12px" }}>No activity records found yet.</p>
        )}
      </div>

      {/* 3. VISITS SNAPSHOT */}
      {visits.length > 0 && (
        <div style={{ marginTop: "24px", borderTop: "1px solid #e2e8f0", paddingTop: "16px" }}>
          <h4 style={{ fontSize: "13px", fontWeight: "700", color: "#1e293b", marginBottom: "10px" }}>
            📍 Completed Field Visits ({visits.length})
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {visits.map((v) => (
              <div
                key={v.id}
                style={{
                  padding: "10px 12px",
                  borderRadius: "8px",
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  fontSize: "12px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <strong>{v.visit_code} • {v.visit_date}</strong>
                  <span style={{ color: "#059669", fontWeight: "600" }}>✓ {v.status}</span>
                </div>
                <div style={{ color: "#64748b", fontSize: "11px", marginTop: "2px" }}>
                  Check-in: {v.check_in_time ? new Date(v.check_in_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "N/A"} • Check-out: {v.check_out_time ? new Date(v.check_out_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "N/A"}
                </div>
                {v.feedback && (
                  <div style={{ marginTop: "4px", color: "#334155", fontStyle: "italic", fontSize: "11px" }}>
                    "{v.feedback}"
                  </div>
                )}
                {v.photos && v.photos.length > 0 && (
                  <div style={{ display: "flex", gap: "6px", marginTop: "6px" }}>
                    {v.photos.map((p, idx) => (
                      <img
                        key={idx}
                        src={p.photo_url || p.photo}
                        alt="Visit photo"
                        style={{ width: "40px", height: "40px", borderRadius: "4px", objectFit: "cover" }}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadTimelineDrawer;
