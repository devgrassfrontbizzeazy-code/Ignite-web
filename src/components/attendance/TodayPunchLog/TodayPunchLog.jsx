import {
  FiCheck,
  FiCoffee,
  FiMapPin,
  FiLogOut,
} from "react-icons/fi";

import "./TodayPunchLog.css";

const formatTime = (date) => {
  if (!date) return "Not yet";

  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(date));
};

const TodayPunchLog = ({
  status = "checked_out",
  checkInTime = null,
}) => {
  const isCheckedIn =
    status === "checked_in";

  const isOnBreak =
    status === "on_break";

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
          <span>Office HQ</span>
        </div>
      </div>

      {/* Timeline */}

      <div className="today-punch-log__timeline">
        {/* Check In */}

        <div className="punch-event punch-event--completed">
          <div className="punch-event__marker">
            <FiCheck />
          </div>

          <div className="punch-event__line" />

          <div className="punch-event__body">
            <div>
              <strong>Check In</strong>

              <span>
                Early check-in recorded
              </span>
            </div>

            <time>
              {checkInTime
                ? formatTime(checkInTime)
                : "Not yet"}
            </time>
          </div>
        </div>

        {/* Break Start */}

        <div
          className={`punch-event ${
            isOnBreak
              ? "punch-event--active"
              : ""
          }`}
        >
          <div className="punch-event__marker">
            <FiCoffee />
          </div>

          <div className="punch-event__line" />

          <div className="punch-event__body">
            <div>
              <strong>Break Start</strong>

              <span>Lunch break</span>
            </div>

            <time>01:15 PM</time>
          </div>
        </div>

        {/* Break End */}

        <div
          className={`punch-event ${
            !isOnBreak && isCheckedIn
              ? "punch-event--completed"
              : ""
          }`}
        >
          <div className="punch-event__marker">
            <FiCoffee />
          </div>

          <div className="punch-event__line" />

          <div className="punch-event__body">
            <div>
              <strong>Break End</strong>

              <span>45 minutes</span>
            </div>

            <time>02:00 PM</time>
          </div>
        </div>

        {/* Check Out */}

        <div className="punch-event punch-event--last">
          <div className="punch-event__marker">
            <FiLogOut />
          </div>

          <div className="punch-event__body">
            <div>
              <strong>Check Out</strong>

              <span>
                {status === "checked_out"
                  ? "Session ended"
                  : "Active ongoing session"}
              </span>
            </div>

            <time>
              {status === "checked_out"
                ? "06:48 PM"
                : "Not yet"}
            </time>
          </div>
        </div>
      </div>

      {/* Footer */}

      <div className="today-punch-log__footer">
        <FiLogOut />

        <span>
          Next scheduled punch-out before 07:30 PM
        </span>
      </div>
    </section>
  );
};

export default TodayPunchLog;