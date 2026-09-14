import { useState } from "react";
import { ChevronRight } from "lucide-react";

import ScheduleDayModal from "../ScheduleDayModal/ScheduleDayModal";

import "./ScheduleDayRow.css";

function ScheduleDayRow({ daySchedule, shifts, onChange }) {
  const [showModal, setShowModal] = useState(false);

  const isWorking = daySchedule.pattern !== "non_working";

  const selectedShift = shifts.find(
    (shift) => shift.id === daySchedule.shift_id
  );

  const patternLabel = {
    every_week: "Every week",
    custom: "Custom",
    non_working: "Non-working",
  };

  const getCustomLabel = () => {
    if (!daySchedule.custom_occurrences?.length) {
      return "Custom";
    }

    return daySchedule.custom_occurrences
      .sort()
      .map((item) => `${item}${getOrdinal(item)}`)
      .join(", ");
  };

  const handleApply = (updatedDay) => {
    onChange(updatedDay);
    setShowModal(false);
  };

  return (
    <>
      <div className="schedule-day-row">
        <div className="schedule-day-name">
          <span className="day-name">{daySchedule.day}</span>
        </div>

        <div className="schedule-pattern">
          {isWorking ? (
            <>
              <span className="pattern-main">
                {patternLabel[daySchedule.pattern]}
              </span>

              {daySchedule.pattern === "custom" && (
                <span className="pattern-detail">
                  {getCustomLabel()}
                </span>
              )}
            </>
          ) : (
            <span className="non-working-text">Non-working</span>
          )}
        </div>

        <div className="schedule-shift">
          {selectedShift ? (
            <>
              <span>{selectedShift.name}</span>
              <small>
                {selectedShift.start_time} – {selectedShift.end_time}
              </small>
            </>
          ) : (
            <span className="unassigned-shift">
              {isWorking ? "No shift assigned" : "—"}
            </span>
          )}
        </div>

        <div>
          <span
            className={`schedule-status ${
              isWorking ? "working" : "off"
            }`}
          >
            <span />
            {isWorking ? "Working" : "Off"}
          </span>
        </div>

        <button
          className="configure-day-button"
          onClick={() => setShowModal(true)}
          aria-label={`Configure ${daySchedule.day}`}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {showModal && (
        <ScheduleDayModal
          daySchedule={daySchedule}
          shifts={shifts}
          onApply={handleApply}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}

function getOrdinal(number) {
  const suffixes = {
    1: "st week",
    2: "nd week",
    3: "rd week",
    4: "th week",
    5: "th week",
  };

  return suffixes[number] || "th week";
}

export default ScheduleDayRow;