import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  FileText,
  ShieldCheck,
} from "lucide-react";

import Button from "../../components/common/Button/Button";
import PageHeader from "../../components/common/PageHeader/PageHeader";
import StatCard from "../../components/common/StatCard/StatCard";
import LeavePolicyTable from "../../components/leavePolicies/LeavePolicyTable/LeavePolicyTable";
import LeavePolicyForm from "../../components/leavePolicies/LeavePolicyForm/LeavePolicyForm";
import ConfirmModal from "../../components/common/ConfirmModal/ConfirmModal";
import leavePolicyApi from "../../services/api/leavePolicyAPI";
import { useNotification } from "../../context/NotificationContext";

import "./LeavePolicies.css";

const normalizePolicy = (policy) => ({
  ...policy,

  id: policy.id,

  name: policy.name || "",
  description: policy.description || "",

  allocationType:
    policy.allocation_type ??
    policy.allocationType ??
    "YEARLY",

  days:
    policy.allocation_days ??
    policy.days ??
    policy.leave_days ??
    0,

  carryForward:
    policy.is_carry_forward ??
    policy.carry_forward ??
    policy.carryForward ??
    false,

  carryForwardType:
    policy.carry_forward_type ??
    policy.carryForwardType ??
    "NONE",

  carryForwardLimit:
    policy.max_carry_forward_days ??
    policy.carry_forward_limit ??
    policy.carryForwardLimit ??
    0,

  halfDayAllowed:
    policy.allow_half_day ??
    policy.half_day_allowed ??
    policy.halfDayAllowed ??
    false,

  requiresApproval:
    policy.requires_approval ??
    policy.requiresApproval ??
    false,

  isPaid:
    policy.is_paid ??
    policy.isPaid ??
    false,

  status:
    policy.status ||
    (policy.is_active ? "Active" : "Inactive"),
});



const LeavePolicies = () => {
  const { notify } = useNotification();

  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);

  const [deleteModal, setDeleteModal] = useState({
    open: false,
    policy: null,
    loading: false,
  });

  const fetchPolicies = async () => {
    try {
      setLoading(true);

      const response = await leavePolicyApi.getPolicies();

      const policyList = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
          ? response.data
          : [];

      setPolicies(policyList.map(normalizePolicy));
    } catch (err) {
      console.error("Failed to load leave policies:", err);
      notify.error("Unable to load leave policies.");
      setPolicies([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  const stats = useMemo(() => {
    const activePolicies = policies.filter(
      (policy) => policy.status === "Active"
    );


const annualDays = activePolicies.reduce(
  (total, policy) => {
    const days = Number(policy.days) || 0;

    if (policy.allocationType === "MONTHLY") {
      return total + days * 12;
    }

    return total + days;
  },
  0
);



    const approvalRequired = activePolicies.filter(
      (policy) => policy.requiresApproval
    ).length;

    const carryForwardPolicies = activePolicies.filter(
      (policy) => policy.carryForward
    ).length;

    return {
      total: policies.length,
      active: activePolicies.length,
      annualDays,
      approvalRequired,
      carryForwardPolicies,
    };
  }, [policies]);

  const policyStats = [
    {
      title: "Total Policies",
      value: stats.total,
      icon: FileText,
      variant: "blue",
    },
    {
      title: "Active Policies",
      value: stats.active,
      icon: CheckCircle2,
      variant: "green",
    },
    {
      title: "Approval Required",
      value: stats.approvalRequired,
      icon: ShieldCheck,
      variant: "gold",
    },
    {
      title: "Allocated Leave Days",
      value: stats.annualDays,
      icon: CalendarDays,
      variant: "teal",
    },
  ];

  const handleAddPolicy = () => {
    setEditingPolicy(null);
    setShowForm(true);
  };

  const handleEditPolicy = (policy) => {
    setEditingPolicy(policy);
    setShowForm(true);
  };

  const handleDeleteClick = (id) => {
    const policy = policies.find(
      (item) => item.id === id
    );

    if (!policy) return;

    setDeleteModal({
      open: true,
      policy,
      loading: false,
    });
  };

  const handleConfirmDelete = async () => {
    const policy = deleteModal.policy;
    if (!policy) return;

    try {
      setDeleteModal((prev) => ({ ...prev, loading: true }));

      await leavePolicyApi.deletePolicy(policy.id);
      await fetchPolicies();

      setDeleteModal({ open: false, policy: null, loading: false });
      notify.success(`Leave policy "${policy.name}" deleted successfully.`);
    } catch (err) {
      console.error("Failed to delete leave policy:", err);

      setDeleteModal((prev) => ({ ...prev, loading: false }));
      notify.error(
        err.response?.data?.detail ||
          "Unable to delete leave policy."
      );
    }
  };

  const handleToggleStatus = async (id) => {
    const policy = policies.find((item) => item.id === id);
    try {
      await leavePolicyApi.togglePolicyStatus(id);
      await fetchPolicies();
      notify.success(
        `Leave policy "${policy?.name || ""}" status updated successfully.`
      );
    } catch (err) {
      console.error(
        "Failed to toggle leave policy status:",
        err
      );
      notify.error(
        err.response?.data?.detail ||
          "Unable to update leave policy status."
      );
    }
  };

  const handleSavePolicy = async (payload) => {
    try {
      if (editingPolicy) {
        await leavePolicyApi.updatePolicy(
          editingPolicy.id,
          payload
        );
        notify.success("Leave policy updated successfully.");
      } else {
        await leavePolicyApi.createPolicy(payload);
        notify.success("Leave policy created successfully.");
      }

      await fetchPolicies();
      setShowForm(false);
      setEditingPolicy(null);
    } catch (err) {
      console.error("Failed to save leave policy:", err);
      notify.error(
        err.response?.data?.detail ||
          "Unable to save leave policy."
      );
    }
  };

  return (
    <div className="leave-policies-page">
      <PageHeader
        eyebrow="Organization"
        title="Leave Policies"
        description="Configure paid and unpaid leave types, allocations, and approval rules."
        action={
          <Button
            variant="primary"
            onClick={handleAddPolicy}
          >
            + Create Leave Policy
          </Button>
        }
      />

      <div className="stats-grid stats-grid--4">
        {policyStats.map((stat) => {
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

      <section className="leave-policies-section">
        {/* <div className="leave-policies-section-header">
          <div>
            <h2>Policy Configuration</h2>

            <p>
              Manage rules for employee leave requests and
              carry forwards.
            </p>
          </div>
        </div> */}

        {loading ? (
          <div className="leave-policies-loading">
            Loading leave policies...
          </div>
        ) : (
          <LeavePolicyTable
            policies={policies}
            onEdit={handleEditPolicy}
            onDelete={handleDeleteClick}
            onToggleStatus={handleToggleStatus}
          />
        )}
      </section>

      {showForm && (
        <LeavePolicyForm
          policy={editingPolicy}
          onSave={handleSavePolicy}
          onClose={() => {
            setShowForm(false);
            setEditingPolicy(null);
          }}
        />
      )}

      {deleteModal.open && (
        <ConfirmModal
          open={deleteModal.open}
          onClose={() => setDeleteModal({ open: false, policy: null, loading: false })}
          onConfirm={handleConfirmDelete}
          title="Delete Leave Policy?"
          itemName={deleteModal.policy?.name}
          confirmText="Delete"
          loading={deleteModal.loading}
        />
      )}
    </div>
  );
};

export default LeavePolicies;