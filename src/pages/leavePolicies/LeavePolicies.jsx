
import { useMemo, useState } from "react";
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

import "./LeavePolicies.css";

const LeavePolicies = () => {
  const [policies, setPolicies] = useState([]);

  const [showForm, setShowForm] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);

  const stats = useMemo(() => {
    const activePolicies = policies.filter(
      (policy) => policy.status === "Active"
    );

    /*
     * Convert monthly allocation into an annual equivalent
     * so the stat can represent total yearly allocation.
     *
     * Example:
     * 12 days/year = 12
     * 1 day/month = 12
     */
    const annualDays = activePolicies.reduce(
      (total, policy) => {
        if (
          typeof policy.days !== "number" ||
          policy.days < 0
        ) {
          return total;
        }

        if (policy.allocationType === "Monthly") {
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
  };

  const handleEditPolicy = (policy) => {
    setEditingPolicy(policy);
    setShowForm(true);
  };

  const handleDeletePolicy = (id) => {
    const policy = policies.find(
      (item) => item.id === id
    );

    if (!policy) return;

    const confirmed = window.confirm(
      `Are you sure you want to remove "${policy.name}"?`
    );

    if (!confirmed) return;

    setPolicies((current) =>
      current.filter((item) => item.id !== id)
    );
  };

  const handleToggleStatus = (id) => {
    setPolicies((current) =>
      current.map((policy) =>
        policy.id === id
          ? {
              ...policy,
              status:
                policy.status === "Active"
                  ? "Inactive"
                  : "Active",
            }
          : policy
      )
    );
  };

  const handleSavePolicy = (policyData) => {
    if (editingPolicy) {
      setPolicies((current) =>
        current.map((policy) =>
          policy.id === editingPolicy.id
            ? {
                ...policy,
                ...policyData,
              }
            : policy
        )
      );
    } else {
      setPolicies((current) => [
        ...current,
        {
          id: Date.now(),
          ...policyData,
          status: "Active",
        },
      ]);
    }

    setShowForm(false);
    setEditingPolicy(null);
  };

  const handleCloseForm = () => {
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

      {/* POLICY STATS */}

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

      {/* LEAVE POLICIES */}

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

        <LeavePolicyTable
          policies={policies}
          onEdit={handleEditPolicy}
          onDelete={handleDeletePolicy}
          onToggleStatus={handleToggleStatus}
        />
      </section>

      {/* ADD / EDIT POLICY */}

      {showForm && (
        <LeavePolicyForm
          policy={editingPolicy}
          onSave={handleSavePolicy}
          onClose={handleCloseForm}
        />
      )}
    </div>
  );
};

export default LeavePolicies;

