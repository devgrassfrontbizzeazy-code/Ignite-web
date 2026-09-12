import { useState } from "react";
import {
  CalendarDays,
  FileText,
} from "lucide-react";

import Button from "../../components/common/Button/Button";
import PageHeader from "../../components/common/PageHeader/PageHeader";
import LeaveBalanceCards from "../../components/leave/LeaveBalanceCards/LeaveBalanceCards";
import ApplyLeaveModal from "../../components/leave/ApplyLeaveModal/ApplyLeaveModal";
import LeaveRequests from "../../components/leave/LeaveRequests/LeaveRequests";

import "./Leaves.css";

const Leave = () => {
  const [showApplyModal, setShowApplyModal] = useState(false);

  const [leaveRequests, setLeaveRequests] = useState([
    {
      id: 1,
      type: "Casual Leave",
      from: "15 Sep 2026",
      to: "16 Sep 2026",
      days: 2,
      appliedOn: "12 Sep 2026",
      status: "Pending",
      reason: "Personal work",
    },
    {
      id: 2,
      type: "Sick Leave",
      from: "05 Sep 2026",
      to: "05 Sep 2026",
      days: 1,
      appliedOn: "04 Sep 2026",
      status: "Approved",
      reason: "Not feeling well",
    },
    {
      id: 3,
      type: "Earned Leave",
      from: "20 Aug 2026",
      to: "22 Aug 2026",
      days: 3,
      appliedOn: "18 Aug 2026",
      status: "Rejected",
      reason: "Personal vacation",
    },
  ]);

  const leaveBalances = [
    {
      id: "casual",
      title: "Casual Leave",
      available: 8,
      total: 12,
      used: 4,
    },
    {
      id: "sick",
      title: "Sick Leave",
      available: 5,
      total: 10,
      used: 5,
    },
    {
      id: "earned",
      title: "Earned Leave",
      available: 12,
      total: 15,
      used: 3,
    },
    {
      id: "other",
      title: "Other Leave",
      available: 2,
      total: 5,
      used: 3,
    },
  ];

  const handleApplyLeave = (leaveData) => {
    const newRequest = {
      id: Date.now(),
      type: leaveData.leaveType,
      from: leaveData.fromDate,
      to: leaveData.toDate,
      days: leaveData.days,
      appliedOn: "12 Sep 2026",
      status: "Pending",
      reason: leaveData.reason,
    };

    setLeaveRequests((previous) => [
      newRequest,
      ...previous,
    ]);

    setShowApplyModal(false);
  };

  return (
    <div className="leave-page">
      <PageHeader
        eyebrow="Leave"
        title="Leave Management"
        description="Manage your leave balances and requests."
        action={
          <Button variant="primary" onClick={() => setShowApplyModal(true)}>
            + Apply for Leave
          </Button>
        }
      />

      {/* Leave Balances */}
      <section className="leave-page__section">
        <div className="leave-page__section-heading">
          <div>
            <h2>Leave Balance</h2>
            <p>View your available leave days</p>
          </div>
        </div>

        <LeaveBalanceCards balances={leaveBalances} />
      </section>

      {/* Leave Requests */}
      <section className="leave-page__section leave-page__requests-section">
        <div className="leave-page__section-heading">
          <div className="leave-page__section-title">
            <div className="leave-page__section-icon">
              <FileText size={18} />
            </div>

            <div>
              <h2>My Leave Requests</h2>
              <p>Track your submitted leave requests</p>
            </div>
          </div>
        </div>

        <LeaveRequests requests={leaveRequests} />
      </section>

      {/* Apply Leave Modal */}
      {showApplyModal && (
        <ApplyLeaveModal
          onClose={() => setShowApplyModal(false)}
          onSubmit={handleApplyLeave}
        />
      )}
    </div>
  );
};

export default Leave;