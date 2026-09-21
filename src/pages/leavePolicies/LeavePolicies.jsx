import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  ShieldCheck,
} from "lucide-react";

import Button from "../../components/common/Button/Button";
import PageHeader from "../../components/common/PageHeader/PageHeader";
import StatCard from "../../components/common/StatCard/StatCard";
import LeavePolicyTable from "../../components/leavePolicies/LeavePolicyTable/LeavePolicyTable";
import LeavePolicyForm from "../../components/leavePolicies/LeavePolicyForm/LeavePolicyForm";
import leavePolicyApi from "../../services/api/leavePolicyAPI";

import "./LeavePolicies.css";

const normalizePolicy = (policy) => ({
  ...policy,

  id: policy.id,

  name: policy.name || "",
  description: policy.description || "",

  allocationType:
    policy.allocation_type ||
    policy.allocationType ||
    "YEARLY",

  days:
    policy.allocation_days !== undefined &&
    policy.allocation_days !== null
      ? Number(policy.allocation_days)
      : policy.days !== undefined && policy.days !== null
        ? Number(policy.days)
        : null,

  carryForward:
    policy.is_carry_forward !== undefined
      ? Boolean(policy.is_carry_forward)
      : Boolean(policy.carryForward),

  carryForwardType:
    policy.carry_forward_type ||
    policy.carryForwardType ||
    "NONE",

  carryForwardLimit:
    policy.max_carry_forward_days !== undefined &&
    policy.max_carry_forward_days !== null &&
    policy.max_carry_forward_days !== "-"
      ? Number(policy.max_carry_forward_days)
      : policy.carryForwardLimit !== undefined &&
          policy.carryForwardLimit !== null
        ? Number(policy.carryForwardLimit)
        : null,

  halfDayAllowed:
    policy.allow_half_day !== undefined
      ? Boolean(policy.allow_half_day)
      : Boolean(policy.halfDayAllowed),

  requiresApproval:
    policy.requires_approval !== undefined
      ? Boolean(policy.requires_approval)
      : Boolean(policy.requiresApproval),

  isPaid:
    policy.is_paid !== undefined
      ? Boolean(policy.is_paid)
      : policy.isPaid !== undefined
        ? Boolean(policy.isPaid)
        : true,

  status:
    policy.is_active !== undefined
      ? policy.is_active
        ? "Active"
        : "Inactive"
      : policy.status || "Inactive",
});

const buildPolicyPayload = (policy) => ({
  name: policy.name?.trim() || "",
  description: policy.description?.trim() || "",

  allocation_type: policy.allocationType,

  allocation_days:
    policy.days === "" ||
    policy.days === null ||
    policy.days === undefined
      ? null
      : String(policy.days),

  is_carry_forward: Boolean(policy.carryForward),

  carry_forward_type:
    policy.carryForward && policy.carryForwardType
      ? policy.carryForwardType
      : "NONE",

  max_carry_forward_days:
    policy.carryForward &&
    policy.carryForwardType !== "NONE" &&
    policy.carryForwardLimit !== "" &&
    policy.carryForwardLimit !== null &&
    policy.carryForwardLimit !== undefined
      ? String(policy.carryForwardLimit)
      : null,

  allow_half_day: Boolean(policy.halfDayAllowed),

  requires_approval: Boolean(policy.requiresApproval),

  is_paid: Boolean(policy.isPaid),

  is_active:
    policy.status !== undefined
      ? policy.status === "Active"
      : true,
});

const LeavePolicies = () => {
  const [policies, setPolicies] = useState([]);

  const [showForm, setShowForm] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchPolicies = async () => {
  try {
    setLoading(true);
    setError("");

    const data = await leavePolicyApi.getPolicies();

    const policyList = Array.isArray(data)
  ? data
  : data?.data || data?.results || [];

    setPolicies(policyList.map(normalizePolicy));
  } catch (err) {
    console.error("Failed to fetch leave policies:", err);

    setError(
      err.response?.data?.detail ||
        "Unable to load leave policies."
    );
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
        if (
          typeof policy.days !== "number" ||
          Number.isNaN(policy.days) ||
          policy.days < 0
        ) {
          return total;
        }

        if (policy.allocationType === "MONTHLY") {
          return total + policy.days * 12;
        }

        return total + policy.days;
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
    setError("");
  };

  const handleEditPolicy = (policy) => {
    setEditingPolicy(policy);
    setShowForm(true);
    setError("");
  };

  const handleDeletePolicy = async (id) => {
    const policy = policies.find(
      (item) => item.id === id
    );

    if (!policy) return;

    const confirmed = window.confirm(
      `Are you sure you want to remove "${policy.name}"?`
    );

    if (!confirmed) return;

    try {
      setError("");

      await leavePolicyApi.deletePolicy(id);

      await fetchPolicies();
    } catch (err) {
      console.error("Failed to delete leave policy:", err);

      setError(
        err.response?.data?.detail ||
          "Unable to delete leave policy."
      );
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      setError("");

      await leavePolicyApi.togglePolicyStatus(id);

      await fetchPolicies();
    } catch (err) {
      console.error(
        "Failed to toggle leave policy status:",
        err
      );

      setError(
        err.response?.data?.detail ||
          "Unable to update leave policy status."
      );
    }
  };

  const handleSavePolicy = async (policyData) => {
    try {
      setSaving(true);
      setError("");

      const payload = buildPolicyPayload(policyData);

      if (editingPolicy) {
        await leavePolicyApi.partialUpdatePolicy(
          editingPolicy.id,
          payload
        );
      } else {
        await leavePolicyApi.createPolicy(payload);
      }

      await fetchPolicies();

      setShowForm(false);
      setEditingPolicy(null);
    } catch (err) {
      console.error("Failed to save leave policy:", err);

      const responseData = err.response?.data;

      if (typeof responseData === "string") {
        setError(responseData);
      } else if (responseData?.detail) {
        setError(responseData.detail);
      } else {
        setError(
          "Unable to save leave policy. Please check the entered values."
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCloseForm = () => {
    if (saving) return;

    setShowForm(false);
    setEditingPolicy(null);
  };

  return (
    <div className="leave-policies-page">
      <PageHeader
        eyebrow="Leave"
        title="Leave Policies"
        description="Manage leave allocation and rules for your organization."
        action={
          <Button
            variant="primary"
            onClick={handleAddPolicy}
          >
            + Add Leave Policy
          </Button>
        }
      />

      {error && (
        <div className="leave-policy-error">
          {error}
        </div>
      )}

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

      <section className="leave-policy-content">
        <div className="leave-policy-section-header">
          <div>
            <h2>Leave Policies</h2>

            <p>
              Configure the leave options and rules
              available to employees.
            </p>
          </div>

          {stats.carryForwardPolicies > 0 && (
            <div className="leave-policy-count">
              <Clock3 size={15} />
              {stats.carryForwardPolicies} with carry forward
            </div>
          )}
        </div>

        {loading ? (
          <div className="leave-policy-empty">
            <div className="leave-policy-empty-icon">
              <Clock3 size={22} />
            </div>

            <h3>Loading leave policies...</h3>

            <p>
              Please wait while we fetch your leave policies.
            </p>
          </div>
        ) : (
          <LeavePolicyTable
            policies={policies}
            onEdit={handleEditPolicy}
            onDelete={handleDeletePolicy}
            onToggleStatus={handleToggleStatus}
          />
        )}
      </section>

      {showForm && (
        <LeavePolicyForm
          policy={editingPolicy}
          onSave={handleSavePolicy}
          onClose={handleCloseForm}
          saving={saving}
        />
      )}
    </div>
  );
};

export default LeavePolicies;