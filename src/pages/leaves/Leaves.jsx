import React from "react";
import { FiCalendar, FiClock, FiPlusCircle, FiCheckCircle } from "react-icons/fi";
import "./Leaves.css";

export default function Leaves() {
  return (
    <div className="leaves-page">
      <header className="leaves-page__header">
        <div>
          <span className="leaves-page__eyebrow">LEAVE MANAGEMENT</span>
          <h1>Leave Requests & Balance</h1>
          <p>View your leave quota, apply for leave, and track request approvals.</p>
        </div>
        <button type="button" className="leaves-page__apply-btn" disabled>
          <FiPlusCircle />
          <span>Apply Leave</span>
        </button>
      </header>

      {/* Summary Cards */}
      <div className="leaves-page__grid">
        <div className="leaves-card">
          <div className="leaves-card__icon leaves-card__icon--emerald">
            <FiCalendar />
          </div>
          <div className="leaves-card__info">
            <span className="leaves-card__label">Annual Leave</span>
            <span className="leaves-card__val">12 <small>Days Available</small></span>
          </div>
        </div>

        <div className="leaves-card">
          <div className="leaves-card__icon leaves-card__icon--teal">
            <FiClock />
          </div>
          <div className="leaves-card__info">
            <span className="leaves-card__label">Sick / Casual</span>
            <span className="leaves-card__val">6 <small>Days Available</small></span>
          </div>
        </div>

        <div className="leaves-card">
          <div className="leaves-card__icon leaves-card__icon--blue">
            <FiCheckCircle />
          </div>
          <div className="leaves-card__info">
            <span className="leaves-card__label">Approved this Year</span>
            <span className="leaves-card__val">0 <small>Days</small></span>
          </div>
        </div>
      </div>

      {/* Empty State Banner */}
      <div className="leaves-empty-card">
        <div className="leaves-empty-badge">
          <FiCalendar size={28} />
        </div>
        <h2>Leave Management System</h2>
        <p>
          Your leave requests and company holiday balance are being synchronized with your HR department.
          Online leave applications and manager approval workflows will be active shortly.
        </p>
      </div>
    </div>
  );
}
