import {
  FiCheck,
  FiCoffee,
  FiMapPin,
  FiLogOut,
} from "react-icons/fi";

import "./TodayPunchLog.css";

const formatTime = (date) => {
  if (!date) return "Not yet";

  try {
    return new Intl.DateTimeFormat("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(date));
  } catch (e) {
    return "Not yet";
  }
};

const TodayPunchLog = ({
  status = "NOT_STARTED",
  checkInTime = null,
  checkOutTime = null,
  timeline = [],
  shiftEnd = "07:30 PM",
  location = "Office HQ",
}) => {
  // If backend provided rich dynamic timeline events
  const hasTimeline = Array.isArray(timeline) && timeline.length > 0;

  return (
    <section className="today-punch-log">
      {/* Header */}
      <div className="today-punch-log__header">
        <div>
          <span className="today-punch-log__eyebrow">
            TODAY'S PUNCH LOG
          </span>

          <h2>Today's Activity</h2>
        </div>

        <div className="today-punch-log__location">
          <FiMapPin />
          <span>{location}</span>
        </div>
      </div>

      {/* Timeline */}
      <div className="today-punch-log__timeline">
        {hasTimeline ? (
          timeline.map((event, idx) => {
            const isLast = idx === timeline.length - 1;
            const isCompleted = event.status === "completed";
            const isActive = event.status === "active";

            let icon = <FiCheck />;
            if (event.type.includes("BREAK")) {
              icon = <FiCoffee />;
            } else if (event.type === "CHECK_OUT") {
              icon = <FiLogOut />;
            }

            return (
              <div
                key={`${event.type}-${idx}`}
                className={`punch-event ${
                  isCompleted ? "punch-event--completed" : ""
                } ${isActive ? "punch-event--active" : ""} ${
                  isLast ? "punch-event--last" : ""
                }`}
              >
                <div className="punch-event__marker">{icon}</div>

                {!isLast && <div className="punch-event__line" />}

                <div className="punch-event__body">
                  <div>
                    <strong>{event.title}</strong>
                    <span>{event.subtitle}</span>
                  </div>

                  <time>{event.time}</time>
                </div>
              </div>
            );
          })
        ) : (
          <>
            {/* Fallback default events when not started */}
            <div
              className={`punch-event ${
                checkInTime ? "punch-event--completed" : ""
              }`}
            >
              <div className="punch-event__marker">
                <FiCheck />
              </div>

              <div className="punch-event__line" />

              <div className="punch-event__body">
                <div>
                  <strong>Check In</strong>
                  <span>
                    {checkInTime ? "Check-in recorded" : "Pending punch in"}
                  </span>
                </div>

                <time>
                  {checkInTime ? formatTime(checkInTime) : "Not yet"}
                </time>
              </div>
            </div>

            <div
              className={`punch-event ${
                status === "ON_BREAK" ? "punch-event--active" : ""
              }`}
            >
              <div className="punch-event__marker">
                <FiCoffee />
              </div>

              <div className="punch-event__line" />

              <div className="punch-event__body">
                <div>
                  <strong>Break</strong>
                  <span>Standard lunch/refreshment</span>
                </div>

                <time>Not yet</time>
              </div>
            </div>

            <div className="punch-event punch-event--last">
              <div className="punch-event__marker">
                <FiLogOut />
              </div>

              <div className="punch-event__body">
                <div>
                  <strong>Check Out</strong>
                  <span>
                    {checkOutTime
                      ? "Session ended"
                      : status === "WORKING"
                      ? "Active ongoing session"
                      : "Not yet"}
                  </span>
                </div>

                <time>
                  {checkOutTime ? formatTime(checkOutTime) : "Not yet"}
                </time>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="today-punch-log__footer">
        <FiLogOut />
        <span>Next scheduled punch-out before {shiftEnd}</span>
      </div>
    </section>
  );
};

export default TodayPunchLog;