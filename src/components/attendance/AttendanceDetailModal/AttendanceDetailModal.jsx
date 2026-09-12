import { useEffect, useState } from "react";
import Modal from "../../common/Modal/Modal";
import Button from "../../common/Button/Button";
import { FiClock, FiCoffee, FiCheckCircle } from "react-icons/fi";
import { attendanceAPI } from "../../../services/api/attendanceAPI";
import "./AttendanceDetailModal.css";

const formatTime = (date) => {
  if (!date) return "--:--";
  try {
    return new Intl.DateTimeFormat("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(date));
  } catch (e) {
    return "--:--";
  }
};

const formatSeconds = (sec = 0) => {
  const safe = Math.max(0, parseInt(sec, 10) || 0);
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  return `${h}h ${m}m`;
};

const AttendanceDetailModal = ({ open, attendanceId, initialData, onClose }) => {
  const [details, setDetails] = useState(initialData || null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && attendanceId) {
      setLoading(true);
      attendanceAPI
        .getAttendanceDetails(attendanceId)
        .then((res) => {
          if (res?.data) {
            setDetails(res.data);
          }
        })
        .catch((err) => {
          console.error("Failed to load attendance details", err);
        })
        .finally(() => {
          setLoading(false);
        });
    } else if (initialData) {
      setDetails(initialData);
    }
  }, [open, attendanceId, initialData]);

  if (!open) return null;

  const breaks = details?.breaks || [];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Attendance Details"
      description="Detailed session activity, breaks, and approval status."
      size="medium"
      footer={
        <div style={{ display: "flex", justifyContent: "flex-end", width: "100%" }}>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      }
    >
      <div className="attendance-detail-modal">
        {loading ? (
          <div style={{ padding: "30px", textAlign: "center", color: "var(--color-text-muted)" }}>
            Loading attendance details...
          </div>
        ) : details ? (
          <>
            <div className="attendance-detail-modal__header">
              <span className="attendance-detail-modal__date">
                {details.attendance_date || details.attendanceDate || details.date}
              </span>
              <span
                className={`attendance-history__status attendance-history__status--${(
                  details.status || "present"
                ).toLowerCase()}`}
              >
                {details.status}
              </span>
            </div>

            <div className="attendance-detail-modal__grid">
              <div className="attendance-detail-modal__card">
                <div className="attendance-detail-modal__card-label">Check In</div>
                <div className="attendance-detail-modal__card-value">
                  {details.checkIn || formatTime(details.check_in_at)}
                </div>
              </div>

              <div className="attendance-detail-modal__card">
                <div className="attendance-detail-modal__card-label">Check Out</div>
                <div className="attendance-detail-modal__card-value">
                  {details.checkOut || formatTime(details.check_out_at) || "Active"}
                </div>
              </div>

              <div className="attendance-detail-modal__card">
                <div className="attendance-detail-modal__card-label">Working Hours</div>
                <div className="attendance-detail-modal__card-value">
                  {details.hours || formatSeconds(details.total_working_duration || details.workingSeconds)}
                </div>
              </div>

              <div className="attendance-detail-modal__card">
                <div className="attendance-detail-modal__card-label">Total Break Time</div>
                <div className="attendance-detail-modal__card-value">
                  {formatSeconds(details.total_break_duration || details.breakSeconds)}
                </div>
              </div>
            </div>

            <div>
              <div className="attendance-detail-modal__section-title">
                <FiCoffee /> Break History ({breaks.length})
              </div>

              {breaks.length === 0 ? (
                <div className="attendance-detail-modal__empty-breaks">
                  No break taken during this session.
                </div>
              ) : (
                <div className="attendance-detail-modal__breaks-list">
                  {breaks.map((b, idx) => (
                    <div className="attendance-detail-modal__break-item" key={b.id || idx}>
                      <span className="attendance-detail-modal__break-times">
                        Break {idx + 1}: {formatTime(b.break_start_at)} —{" "}
                        {b.break_end_at ? formatTime(b.break_end_at) : "Active"}
                      </span>
                      <span className="attendance-detail-modal__break-duration">
                        {b.duration ? `${Math.round(b.duration / 60)} mins` : "In Progress"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {details.approval_status && (
              <div style={{ marginTop: "10px", fontSize: "12px", color: "var(--color-text-secondary)" }}>
                <strong>Approval Status:</strong> {details.approval_status}
                {details.rejection_reason && (
                  <div style={{ color: "#b91c1c", marginTop: "4px" }}>
                    <strong>Reason:</strong> {details.rejection_reason}
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div style={{ padding: "20px", textAlign: "center" }}>No details available.</div>
        )}
      </div>
    </Modal>
  );
};

export default AttendanceDetailModal;
