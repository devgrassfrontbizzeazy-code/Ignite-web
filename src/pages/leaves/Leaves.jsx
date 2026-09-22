import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  XCircle,
} from "lucide-react";

import ApplyLeaveModal from "../../components/leave/ApplyLeaveModal/ApplyLeaveModal";
import LeaveBalanceCards from "../../components/leave/LeaveBalanceCards/LeaveBalanceCards";
import LeaveRequests from "../../components/leave/LeaveRequests/LeaveRequests";
import Button from "../../components/common/Button/Button";
import ConfirmModal from "../../components/common/ConfirmModal/ConfirmModal";
import Modal from "../../components/common/Modal/Modal";
import PageHeader from "../../components/common/PageHeader/PageHeader";
import StatCard from "../../components/common/StatCard/StatCard";
import IgniteLoader from "../../components/common/IgniteLoader/IgniteLoader";
import { useNotification } from "../../context/NotificationContext";
import leaveApplicationAPI from "../../services/api/leaveApplicationAPI";
import {
  canApproveLeaves,
  canCreateLeaves,
  getCurrentUser,
  isSuperOrAdmin,
} from "../../utils/permissionUtils";

import "./Leaves.css";

const STATUS_LABELS = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
};

const unwrapArray = (response) => {
  const payload = response?.data ?? response;

  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.data)) return payload.data;

  return [];
};

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

const getEmployeeName = (leave) => {
  const employee =
    leave.employee || leave.employee_details || leave.user || {};

  return (
    leave.employee_name ||
    leave.employeeName ||
    employee.full_name ||
    employee.fullName ||
    [
      employee.first_name || employee.firstName,
      employee.last_name || employee.lastName,
    ]
      .filter(Boolean)
      .join(" ") ||
    employee.email ||
    "Employee"
  );
};

const mapLeaveRequest = (leave) => {
  const statusValue = String(leave.status || "Pending").toUpperCase();

  const employee =
    leave.employee || leave.employee_details || leave.user || {};

  return {
    ...leave,
    id: leave.id,
    type:
      leave.leave_policy_name ||
      leave.leavePolicyName ||
      leave.leave_policy?.name ||
      leave.leavePolicy?.name ||
      "Leave",
    from: formatDate(leave.from_date || leave.fromDate),
    to: formatDate(leave.to_date || leave.toDate),
    days: Number(leave.duration ?? leave.days ?? 0),
    appliedOn: formatDate(
      leave.applied_at ||
        leave.appliedAt ||
        leave.created_at ||
        leave.createdAt
    ),
    status: STATUS_LABELS[statusValue] || statusValue,
    reason: leave.reason || "No reason provided.",
    employeeName: getEmployeeName(leave),
    employeeCode:
      leave.employee_code ||
      leave.employeeCode ||
      employee.employee_code ||
      employee.employeeCode ||
      "",
    employeeEmail:
      leave.employee_email ||
      leave.employeeEmail ||
      employee.email ||
      "",
  };
};

const Leaves = () => {
  const { notify } = useNotification();

  const user = useMemo(() => getCurrentUser(), []);

  const canManage =
    canApproveLeaves(user) || isSuperOrAdmin(user);

  const canApply =
    canCreateLeaves(user) || isSuperOrAdmin(user);

  const [activeTab, setActiveTab] = useState("my");
  const [leaveOptions, setLeaveOptions] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [managementRequests, setManagementRequests] = useState([]);
  const [managementSearch, setManagementSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [managementLoading, setManagementLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [cancelRequest, setCancelRequest] = useState(null);
  const [rejectRequest, setRejectRequest] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  const fetchMyLeaveData = useCallback(async () => {
    setLoading(true);

    try {
      const [optionsResponse, requestsResponse] = await Promise.all([
        leaveApplicationAPI.getApplyOptions(),
        leaveApplicationAPI.getMyLeaves(),
      ]);

      setLeaveOptions(unwrapArray(optionsResponse));
      setMyRequests(
        unwrapArray(requestsResponse).map(mapLeaveRequest)
      );
    } catch (error) {
      notify.error(
        error?.response?.data?.detail ||
          "Failed to load your leave information."
      );
    } finally {
      setLoading(false);
    }
  }, [notify]);

  const fetchManagementLeaveData = useCallback(async () => {
    if (!canManage) return;

    setManagementLoading(true);

    try {
      const response =
        await leaveApplicationAPI.getPendingApprovals();

      setManagementRequests(
        unwrapArray(response).map(mapLeaveRequest)
      );
    } catch (error) {
      notify.error(
        error?.response?.data?.detail ||
          "Failed to load employee leave requests."
      );
    } finally {
      setManagementLoading(false);
    }
  }, [canManage, notify]);

  useEffect(() => {
    fetchMyLeaveData();
    fetchManagementLeaveData();
  }, [fetchMyLeaveData, fetchManagementLeaveData]);

  const leaveBalances = useMemo(
    () =>
      leaveOptions.map((leave) => ({
        id: String(
          leave.id || leave.name || "other"
        ).toLowerCase(),
        title: leave.name,
        available: Number(
          leave.remaining_balance ??
            leave.remainingBalance ??
            0
        ),
        total: Number(
          leave.allocated_days ??
            leave.allocatedDays ??
            0
        ),
        used: Math.max(
          Number(
            leave.allocated_days ??
              leave.allocatedDays ??
              0
          ) -
            Number(
              leave.remaining_balance ??
                leave.remainingBalance ??
                0
            ),
          0
        ),
      })),
    [leaveOptions]
  );

  const employeeStats = useMemo(
    () => ({
      available: leaveBalances.reduce(
        (sum, leave) => sum + leave.available,
        0
      ),
      allocated: leaveBalances.reduce(
        (sum, leave) => sum + leave.total,
        0
      ),
      used: leaveBalances.reduce(
        (sum, leave) => sum + leave.used,
        0
      ),
      pending: myRequests.filter(
        (request) => request.status === "Pending"
      ).length,
    }),
    [leaveBalances, myRequests]
  );

  const managementStats = useMemo(
    () => ({
      pending: managementRequests.filter(
        (request) => request.status === "Pending"
      ).length,
      approved: managementRequests.filter(
        (request) => request.status === "Approved"
      ).length,
      rejected: managementRequests.filter(
        (request) => request.status === "Rejected"
      ).length,
      total: managementRequests.length,
    }),
    [managementRequests]
  );

  const handleApplyLeave = async (leaveData) => {
    try {
      setSubmitting(true);

      await leaveApplicationAPI.applyLeave(leaveData);

      notify.success(
        "Leave request submitted successfully."
      );

      setShowApplyModal(false);

      await fetchMyLeaveData();
    } catch (error) {
      notify.error(
        error?.response?.data?.detail ||
          "Failed to submit leave request."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelRequest) return;

    try {
      setSubmitting(true);

      await leaveApplicationAPI.cancelLeave(
        cancelRequest.id
      );

      notify.success(
        `${cancelRequest.type} request cancelled successfully.`
      );

      setCancelRequest(null);

      await fetchMyLeaveData();
    } catch (error) {
      notify.error(
        error?.response?.data?.detail ||
          "Failed to cancel leave request."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (request) => {
    try {
      setSubmitting(true);

      await leaveApplicationAPI.approveLeave(request.id);

      notify.success(
        "Leave request approved successfully."
      );

      await fetchManagementLeaveData();
    } catch (error) {
      notify.error(
        error?.response?.data?.detail ||
          "Failed to approve leave request."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectRequest) return;

    try {
      setSubmitting(true);

      await leaveApplicationAPI.rejectLeave(
        rejectRequest.id,
        {
          reason: rejectReason.trim(),
        }
      );

      notify.success(
        "Leave request rejected successfully."
      );

      setRejectRequest(null);
      setRejectReason("");

      await fetchManagementLeaveData();
    } catch (error) {
      notify.error(
        error?.response?.data?.detail ||
          "Failed to reject leave request."
      );
    } finally {
      setSubmitting(false);
    }
  };

  /*
   * IMPORTANT:
   * This useMemo must stay ABOVE the loading early return.
   * Otherwise React sees a different number/order of hooks
   * between renders.
   */
  const visibleRequests = useMemo(() => {
    if (activeTab !== "employees") {
      return myRequests;
    }

    const query = managementSearch.trim().toLowerCase();

    if (!query) {
      return managementRequests;
    }

    return managementRequests.filter((request) =>
      [
        request.employeeName,
        request.employeeCode,
        request.employeeEmail,
        request.type,
      ].some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(query)
      )
    );
  }, [
    activeTab,
    managementRequests,
    managementSearch,
    myRequests,
  ]);

  /*
   * All hooks are now complete before this conditional return.
   */
  if (loading) {
    return (
      <IgniteLoader text="Loading leave information..." />
    );
  }

  const employeeStatCards = [
    {
      title: "Available Leave",
      value: employeeStats.available,
      icon: CalendarDays,
      variant: "teal",
    },
    {
      title: "Allocated Leave",
      value: employeeStats.allocated,
      icon: FileText,
      variant: "blue",
    },
    {
      title: "Leave Used",
      value: employeeStats.used,
      icon: CheckCircle2,
      variant: "gold",
    },
    {
      title: "Pending Requests",
      value: employeeStats.pending,
      icon: Clock3,
      variant: "green",
    },
  ];

  const managementStatCards = [
    {
      title: "Total Requests",
      value: managementStats.total,
      icon: FileText,
      variant: "blue",
    },
    {
      title: "Pending Approval",
      value: managementStats.pending,
      icon: Clock3,
      variant: "gold",
    },
    {
      title: "Approved",
      value: managementStats.approved,
      icon: CheckCircle2,
      variant: "green",
    },
    {
      title: "Rejected",
      value: managementStats.rejected,
      icon: XCircle,
      variant: "danger",
    },
  ];

  const statCards =
    activeTab === "employees"
      ? managementStatCards
      : employeeStatCards;

  return (
    <main className="leave-page">
      <PageHeader
        eyebrow="Leave"
        title={
          activeTab === "employees"
            ? "Employee Leave"
            : "My Leave"
        }
        description={
          activeTab === "employees"
            ? "Review and manage leave requests across the organization."
            : "Manage your leave balance, requests, and history."
        }
        action={
          activeTab === "my" && canApply ? (
            <Button
              variant="primary"
              onClick={() => setShowApplyModal(true)}
            >
              + Apply for Leave
            </Button>
          ) : null
        }
      />

      {canManage && (
        <div
          className="leave-page__tabs"
          role="tablist"
          aria-label="Leave views"
        >
          <button
            type="button"
            className={
              activeTab === "my" ? "is-active" : ""
            }
            onClick={() => setActiveTab("my")}
          >
            My Leave
          </button>

          <button
            type="button"
            className={
              activeTab === "employees"
                ? "is-active"
                : ""
            }
            onClick={() => setActiveTab("employees")}
          >
            Employee Leave
          </button>
        </div>
      )}

      <section className="leave-page__section">
        <div className="stats-grid stats-grid--4">
          {statCards.map((stat) => {
            const Icon = stat.icon;

            return (
              <StatCard
                key={stat.title}
                title={stat.title}
                value={stat.value}
                icon={<Icon size={18} />}
                variant={stat.variant}
              />
            );
          })}
        </div>
      </section>

      {activeTab === "my" && (
        <section className="leave-page__section">
          <div className="leave-page__section-heading">
            <div className="leave-page__section-title">
              <div className="leave-page__section-icon">
                <CalendarDays size={18} />
              </div>

              <div>
                <h2>Leave Balance</h2>
                <p>Available balance by leave type</p>
              </div>
            </div>
          </div>

          {leaveBalances.length > 0 ? (
            <LeaveBalanceCards
              balances={leaveBalances}
            />
          ) : (
            <div className="leave-page__empty">
              No leave balance information found.
            </div>
          )}
        </section>
      )}

      <section className="leave-page__section leave-page__requests-section">
        <div className="leave-page__section-heading">
          <div className="leave-page__section-title">
            <div className="leave-page__section-icon">
              <FileText size={18} />
            </div>

            <div>
              <h2>
                {activeTab === "employees"
                  ? "Employee Leave Requests"
                  : "My Leave Requests"}
              </h2>

              <p>
                {activeTab === "employees"
                  ? "Review submitted requests and take approval actions."
                  : "Track your submitted leave requests and history."}
              </p>
            </div>
          </div>
        </div>

        {activeTab === "employees" &&
        managementLoading ? (
          <div className="leave-page__loading">
            Loading employee leave requests...
          </div>
        ) : (
          <>
            {activeTab === "employees" && (
              <div className="leave-page__management-search">
                <input
                  type="search"
                  value={managementSearch}
                  onChange={(event) =>
                    setManagementSearch(
                      event.target.value
                    )
                  }
                  placeholder="Search employee, code, email, or leave type..."
                />
              </div>
            )}

            <LeaveRequests
              requests={visibleRequests}
              management={
                activeTab === "employees"
              }
              onView={setSelectedRequest}
              onCancel={
                activeTab === "my"
                  ? setCancelRequest
                  : undefined
              }
              onApprove={handleApprove}
              onReject={setRejectRequest}
            />
          </>
        )}
      </section>

      {showApplyModal && (
        <ApplyLeaveModal
          options={leaveOptions}
          submitting={submitting}
          onClose={() =>
            !submitting &&
            setShowApplyModal(false)
          }
          onSubmit={handleApplyLeave}
        />
      )}

      <Modal
        open={Boolean(selectedRequest)}
        onClose={() => setSelectedRequest(null)}
        title="Leave Request Details"
        size="small"
      >
        {selectedRequest && (
          <div className="leave-page__details">
            <dl>
              {activeTab === "employees" && (
                <>
                  <dt>Employee</dt>
                  <dd>
                    {selectedRequest.employeeName}
                  </dd>
                </>
              )}

              <dt>Leave Type</dt>
              <dd>{selectedRequest.type}</dd>

              <dt>Dates</dt>
              <dd>
                {selectedRequest.from} to{" "}
                {selectedRequest.to}
              </dd>

              <dt>Days</dt>
              <dd>{selectedRequest.days}</dd>

              <dt>Status</dt>
              <dd>{selectedRequest.status}</dd>

              <dt>Reason</dt>
              <dd>{selectedRequest.reason}</dd>
            </dl>

            <Button
              variant="secondary"
              onClick={() =>
                setSelectedRequest(null)
              }
            >
              Close
            </Button>
          </div>
        )}
      </Modal>

      <Modal
        open={Boolean(rejectRequest)}
        onClose={() =>
          !submitting &&
          setRejectRequest(null)
        }
        title="Reject Leave Request"
        description="Add an optional reason for the employee."
        size="small"
        footer={
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "10px",
            }}
          >
            <Button
              variant="secondary"
              onClick={() =>
                setRejectRequest(null)
              }
              disabled={submitting}
            >
              Cancel
            </Button>

            <Button
              variant="danger"
              onClick={handleReject}
              loading={submitting}
            >
              Reject Request
            </Button>
          </div>
        }
      >
        <textarea
          className="leave-page__reject-reason"
          rows="4"
          value={rejectReason}
          onChange={(event) =>
            setRejectReason(event.target.value)
          }
          placeholder="Reason for rejection"
          disabled={submitting}
        />
      </Modal>

      <ConfirmModal
        open={Boolean(cancelRequest)}
        onClose={() =>
          !submitting &&
          setCancelRequest(null)
        }
        onConfirm={handleConfirmCancel}
        title="Cancel Leave Request?"
        description={`Are you sure you want to cancel your ${
          cancelRequest?.type || "leave"
        } request?`}
        confirmText={
          submitting
            ? "Cancelling..."
            : "Cancel Request"
        }
        variant="danger"
      />
    </main>
  );
};

export default Leaves;