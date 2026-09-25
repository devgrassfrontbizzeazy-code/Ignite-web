import { useState } from "react";

import DashboardHeader from "../../components/dashboard/DashboardHeader/DashboardHeader";
import DashboardGrid from "../../components/dashboard/DashboardGrid/DashboardGrid";
import ApplyLeaveModal from "../../components/leave/ApplyLeaveModal/ApplyLeaveModal";

import useDashboardData from "../../components/dashboard/hooks/useDashboardData";

import leaveApplicationAPI from "../../services/api/leaveApplicationAPI";
import { useNotification } from "../../context/NotificationContext";

import "./Dashboard.css";

const Dashboard = () => {
  const dashboardData = useDashboardData();

  const [showApplyLeave, setShowApplyLeave] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { notify } = useNotification();

  const handleApplyLeave = async (leaveData) => {
    try {
      setSubmitting(true);

      await leaveApplicationAPI.applyLeave(leaveData);

      notify.success("Leave application submitted successfully.");

      setShowApplyLeave(false);

      await dashboardData.refreshLeaveData();
    } catch (error) {
      console.error("Failed to apply leave:", error);

      const message =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        "Failed to submit leave application.";

      notify.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="dashboard-page">
      <DashboardHeader />

      <DashboardGrid
        dashboardData={dashboardData}
        onApplyLeave={() => setShowApplyLeave(true)}
      />

      {showApplyLeave && (
        <ApplyLeaveModal
          options={dashboardData.leaveBalance}
          submitting={submitting}
          onClose={() => !submitting && setShowApplyLeave(false)}
          onSubmit={handleApplyLeave}
        />
      )}
    </div>
  );
};

export default Dashboard;