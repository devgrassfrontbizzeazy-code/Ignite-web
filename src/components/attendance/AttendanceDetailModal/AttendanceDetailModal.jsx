import { useEffect, useState } from "react";
import Modal from "../../common/Modal/Modal";
import Button from "../../common/Button/Button";
import { FiCoffee, FiCheckCircle } from "react-icons/fi";
import { attendanceAPI } from "../../../services/api/attendanceAPI";
import employeeService from "../../../services/employeeService";
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

const formatDateTime = (date) => {
  if (!date) return "--";

  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(date));
  } catch (e) {
    return "--";
  }
};

const formatSeconds = (sec = 0) => {
  const safe = Math.max(0, parseInt(sec, 10) || 0);
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);

  return `${h}h ${m}m`;
};

const getEmployeeName = (employee) => {
  if (!employee) return "";

  return [
    employee.first_name,
    employee.middle_name,
    employee.last_name,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();
};

const AttendanceDetailModal = ({
  open,
  attendanceId,
  initialData,
  onClose,
}) => {
  const [details, setDetails] = useState(initialData || null);
  const [loading, setLoading] = useState(false);
  const [approverName, setApproverName] = useState("");

  useEffect(() => {
    if (!open) return;

    const loadDetails = async () => {
      try {
        setLoading(true);
        setApproverName("");

        let attendanceDetails = initialData || null;

        if (attendanceId) {
          const res = await attendanceAPI.getAttendanceDetails(attendanceId);

          if (res?.data) {
            attendanceDetails = res.data;
            setDetails(res.data);
          }
        } else if (initialData) {
          setDetails(initialData);
        }

        // Resolve the person who approved the attendance.
        if (
          attendanceDetails?.approval_status === "APPROVED" &&
          attendanceDetails?.approved_by
        ) {
          try {
            const employee = await employeeService.getById(
              attendanceDetails.approved_by
            );

            const name = getEmployeeName(employee);

            if (name) {
              setApproverName(name);
            }
          } catch (err) {
            console.error("Failed to load attendance approver", err);
          }
        }
      } catch (err) {
        console.error("Failed to load attendance details", err);
      } finally {
        setLoading(false);
      }
    };

    loadDetails();
  }, [open, attendanceId, initialData]);

  if (!open) return null;

  const breaks = details?.breaks || [];
  const isApproved =
    String(details?.approval_status || details?.status || "").toUpperCase() ===
    "APPROVED";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Attendance Details"
      description="Detailed session activity, breaks, and approval status."
      size="medium"
      footer={
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            width: "100%",
          }}
        >
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      }
    >
      <div className="attendance-detail-modal">
        {loading ? (
          <div
            style={{
              padding: "30px",
              textAlign: "center",
              color: "var(--color-text-muted)",
            }}
          >
            Loading attendance details...
          </div>
        ) : details ? (
          <>
            <div className="attendance-detail-modal__header">
              <span className="attendance-detail-modal__date">
                {details.attendance_date ||
                  details.attendanceDate ||
                  details.date}
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
                <div className="attendance-detail-modal__card-label">
                  Check In
                </div>

                <div className="attendance-detail-modal__card-value">
                  {details.checkIn || formatTime(details.check_in_at)}
                </div>
              </div>

              <div className="attendance-detail-modal__card">
                <div className="attendance-detail-modal__card-label">
                  Check Out
                </div>

                <div className="attendance-detail-modal__card-value">
                  {details.checkOut ||
                    formatTime(details.check_out_at) ||
                    "Active"}
                </div>
              </div>

              <div className="attendance-detail-modal__card">
                <div className="attendance-detail-modal__card-label">
                  Working Hours
                </div>

                <div className="attendance-detail-modal__card-value">
                  {details.hours ||
                    formatSeconds(
                      details.total_working_duration ||
                        details.workingSeconds
                    )}
                </div>
              </div>

              <div className="attendance-detail-modal__card">
                <div className="attendance-detail-modal__card-label">
                  Total Break Time
                </div>

                <div className="attendance-detail-modal__card-value">
                  {formatSeconds(
                    details.total_break_duration || details.breakSeconds
                  )}
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
                    <div
                      className="attendance-detail-modal__break-item"
                      key={b.id || idx}
                    >
                      <span className="attendance-detail-modal__break-times">
                        Break {idx + 1}: {formatTime(b.break_start_at)} —{" "}
                        {b.break_end_at
                          ? formatTime(b.break_end_at)
                          : "Active"}
                      </span>

                      <span className="attendance-detail-modal__break-duration">
                        {b.duration
                          ? `${Math.round(b.duration / 60)} mins`
                          : "In Progress"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* APPROVAL DETAILS */}
            {isApproved && (
              <div
                className="attendance-detail-modal__approval"
                style={{
                  marginTop: "20px",
                  padding: "14px 16px",
                  borderRadius: "12px",
                  border: "1px solid var(--color-border)",
                  background: "var(--color-bg-secondary, #f8fafb)",
                }}
              >
                <div
                  className="attendance-detail-modal__section-title"
                  style={{ marginBottom: "12px" }}
                >
                  <FiCheckCircle /> Approval Details
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "14px",
                  }}
                >
                  <div>
                    <div className="attendance-detail-modal__card-label">
                      Approved By
                    </div>

                    <div className="attendance-detail-modal__card-value">
                      {approverName ||
                        details.approved_by_email ||
                        "Loading..."}
                    </div>
                  </div>

                  <div>
                    <div className="attendance-detail-modal__card-label">
                      Approved At
                    </div>

                    <div className="attendance-detail-modal__card-value">
                      {formatDateTime(details.approved_at)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* REJECTION DETAILS */}
            {String(details?.approval_status || "").toUpperCase() ===
              "REJECTED" && (
              <div
                style={{
                  marginTop: "10px",
                  fontSize: "12px",
                  color: "var(--color-text-secondary)",
                }}
              >
                <strong>Approval Status:</strong>{" "}
                {details.approval_status}

                {details.rejection_reason && (
                  <div
                    style={{
                      color: "#b91c1c",
                      marginTop: "4px",
                    }}
                  >
                    <strong>Reason:</strong> {details.rejection_reason}
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div
            style={{
              padding: "20px",
              textAlign: "center",
            }}
          >
            No details available.
          </div>
        )}
      </div>
    </Modal>
  );
};

export default AttendanceDetailModal;