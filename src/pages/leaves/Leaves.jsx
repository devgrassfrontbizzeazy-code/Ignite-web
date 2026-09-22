

import { useEffect, useMemo, useState } from "react";
import { FileText } from "lucide-react";

import Button from "../../components/common/Button/Button";
import PageHeader from "../../components/common/PageHeader/PageHeader";
import StatCard from "../../components/common/StatCard/StatCard";
import LeaveBalanceCards from "../../components/leave/LeaveBalanceCards/LeaveBalanceCards";
import ApplyLeaveModal from "../../components/leave/ApplyLeaveModal/ApplyLeaveModal";
import LeaveRequests from "../../components/leave/LeaveRequests/LeaveRequests";
import ConfirmModal from "../../components/common/ConfirmModal/ConfirmModal";
import { canCreateLeaves } from "../../utils/permissionUtils";
import { useNotification } from "../../context/NotificationContext";
import leaveApplicationAPI from "../../services/api/leaveApplicationAPI";

import "./Leaves.css";



const Leaves = () => {
  const { notify } = useNotification();

  const [showApplyModal, setShowApplyModal] = useState(false);

  const [leaveRequests, setLeaveRequests] = useState([]);
  const [leaveOptions, setLeaveOptions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [cancelModal, setCancelModal] = useState({
    open: false,
    request: null,
  });

  const formatDate = (dateString) => {
    if (!dateString) return "—";

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return dateString;
    }

    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatAppliedDate = (dateString) => {
    if (!dateString) return "—";

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return dateString;
    }

    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const mapLeaveRequest = (leave) => ({
    id: leave.id,
    type: leave.leave_policy_name,
    from: formatDate(leave.from_date),
    to: formatDate(leave.to_date),
    days: Number(leave.duration),
    appliedOn: formatAppliedDate(leave.applied_at),
    status: leave.status,
    reason: leave.reason,
  });


const fetchLeaveData = async () => {
  try {
    setLoading(true);

    const [optionsResponse, requestsResponse] =
      await Promise.all([
        leaveApplicationAPI.getApplyOptions(),
        leaveApplicationAPI.getMyLeaves(),
      ]);

    const options = Array.isArray(optionsResponse)
      ? optionsResponse
      : Array.isArray(optionsResponse?.data)
        ? optionsResponse.data
        : [];

    const requests = Array.isArray(requestsResponse)
      ? requestsResponse
      : Array.isArray(requestsResponse?.data)
        ? requestsResponse.data
        : [];

    setLeaveOptions(options);

    const mappedRequests = requests.map(mapLeaveRequest);

    setLeaveRequests(mappedRequests);
  } catch (error) {
    console.error(
      "Failed to fetch leave data:",
      error
    );

    notify.error(
      error?.response?.data?.detail ||
        "Failed to load leave information."
    );
  } finally {
    setLoading(false);
  }
};



  useEffect(() => {
    fetchLeaveData();
  }, []);

  const leaveBalances = leaveOptions.map((leave) => ({
    id: leave.id,
    title: leave.name,
    available: Number(leave.remaining_balance),
    total: Number(leave.allocated_days),
    used:
      Number(leave.allocated_days) -
      Number(leave.remaining_balance),
  }));
 
const leaveStats = useMemo(() => {
  const available = leaveOptions.reduce(
    (total, leave) =>
      total + (Number(leave.remaining_balance) || 0),
    0
  );

  const allocated = leaveOptions.reduce(
    (total, leave) =>
      total + (Number(leave.allocated_days) || 0),
    0
  );

  const used = Math.max(allocated - available, 0);

  const pending = leaveRequests.filter(
    (request) =>
      String(request.status).toUpperCase() === "PENDING"
  ).length;

  return {
    available,
    allocated,
    used,
    pending,
  };
}, [leaveOptions, leaveRequests]);

const leaveStatCards = [
  {
    title: "Available Leave",
    value: leaveStats.available,
    icon: FileText,
    variant: "teal",
  },
  {
    title: "Allocated Leave",
    value: leaveStats.allocated,
    icon: FileText,
    variant: "blue",
  },
  {
    title: "Leave Used",
    value: leaveStats.used,
    icon: FileText,
    variant: "gold",
  },
  {
    title: "Pending Requests",
    value: leaveStats.pending,
    icon: FileText,
    variant: "green",
  },
];


  const handleApplyLeave = async (leaveData) => {
    try {
      setSubmitting(true);

      await leaveApplicationAPI.applyLeave(leaveData);

      notify.success(
        "Leave request submitted successfully."
      );

      setShowApplyModal(false);

      await fetchLeaveData();
    } catch (error) {
      console.error("Failed to apply for leave:", error);

      notify.error(
        error?.response?.data?.detail ||
          "Failed to submit leave request."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelRequestClick = (request) => {
    setCancelModal({
      open: true,
      request,
    });
  };

  const handleConfirmCancelRequest = async () => {
    const request = cancelModal.request;

    if (!request) return;

    try {
      setSubmitting(true);

      await leaveApplicationAPI.cancelLeave(request.id);

      notify.success(
        `${request.type} request cancelled successfully.`
      );

      setCancelModal({
        open: false,
        request: null,
      });

      await fetchLeaveData();
    } catch (error) {
      console.error("Failed to cancel leave:", error);

      notify.error(
        error?.response?.data?.detail ||
          "Failed to cancel leave request."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="leave-page">
      <PageHeader
        eyebrow="Leave"
        title="Leave Management"
        description="Manage your leave balances and requests."
        action={
          canCreateLeaves() ? (
            <Button
              variant="primary"
              onClick={() => setShowApplyModal(true)}
              disabled={loading}
            >
              + Apply for Leave
            </Button>
          ) : null
        }
      />

      {/* Leave Balances */}
      <section className="leave-page__section">
      <div className="stats-grid stats-grid--4">
        {leaveStatCards.map((stat) => {
          const Icon = stat.icon;

          return (
            <StatCard
              key={stat.title}
              title={stat.title}
              value={stat.value}
              icon={
                <Icon
                  size={18}
                  strokeWidth={2}
                />
              }
              variant={stat.variant}
            />
          );
        })}
      </div>


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

        <LeaveRequests
          requests={leaveRequests}
          onCancel={handleCancelRequestClick}
        />
      </section>

      {/* Apply Leave Modal */}
      {showApplyModal && (
        <ApplyLeaveModal
          options={leaveOptions}
          submitting={submitting}
          onClose={() => {
            if (!submitting) {
              setShowApplyModal(false);
            }
          }}
          onSubmit={handleApplyLeave}
        />
      )}

      {/* Cancel Confirmation */}
      {cancelModal.open && (
        <ConfirmModal
          open={cancelModal.open}
          onClose={() => {
            if (!submitting) {
              setCancelModal({
                open: false,
                request: null,
              });
            }
          }}
          onConfirm={handleConfirmCancelRequest}
          title="Cancel Leave Request?"
          description={`Are you sure you want to cancel your ${cancelModal.request?.type} request (${cancelModal.request?.from})?`}
          confirmText={
            submitting ? "Cancelling..." : "Cancel Request"
          }
          variant="danger"
        />
      )}
    </div>
  );
};

export default Leaves;

