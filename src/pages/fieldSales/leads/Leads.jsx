import { useEffect, useMemo, useState } from "react";
import {
  Edit2,
  Eye,
  Plus,
  Users,
  UserCheck,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  XCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import Button from "../../../components/common/Button/Button";
import Drawer from "../../../components/common/Drawer/Drawer";
import Modal from "../../../components/common/Modal/Modal";
import RowActions from "../../../components/common/RowActions/RowActions";
import SearchInput from "../../../components/common/SearchInput/SearchInput";
import Select from "../../../components/common/Select/Select";
import PageHeader from "../../../components/common/PageHeader/PageHeader";
import LeadStats from "../../../components/fieldSales/leads/leadStats/LeadStats";
import LeadTimelineDrawer from "../../../components/fieldSales/leads/LeadTimelineDrawer/LeadTimelineDrawer";
import IgniteLoader from "../../../components/common/IgniteLoader/IgniteLoader";
import {
  getFieldSalesLeads,
  getFieldSalesEmployees,
  getFieldSalesCurrentEmployee,
  reassignFieldSalesLead,
  escalateFieldSalesLead,
  approveFieldSalesLeadAssignment,
} from "../../../services/api/fieldSalesAPI";
import { useNotification } from "../../../context/NotificationContext";

import "./Leads.css";

const Leads = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [assignedTo, setAssignedTo] = useState("all");
  const [assignmentStatus, setAssignmentStatus] = useState("all");

  const [leads, setLeads] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [reassignModalLead, setReassignModalLead] = useState(null);
  const [reassignTargetId, setReassignTargetId] = useState("");
  const [reassignReason, setReassignReason] = useState("");
  const [reassignSubmitting, setReassignSubmitting] = useState(false);

  const [escalateModalLead, setEscalateModalLead] = useState(null);
  const [escalateReason, setEscalateReason] = useState("");
  const [escalateSubmitting, setEscalateSubmitting] = useState(false);

  const [approveModalLead, setApproveModalLead] = useState(null);
  const [approveStatusChoice, setApproveStatusChoice] = useState("APPROVED");
  const [approveTargetEmpId, setApproveTargetEmpId] = useState("");
  const [approveNotes, setApproveNotes] = useState("");
  const [approveSubmitting, setApproveSubmitting] = useState(false);

  const fetchLeadsAndEmployees = async () => {
    try {
      setLoading(true);
      const [leadsRes, empsRes, meRes] = await Promise.allSettled([
        getFieldSalesLeads(),
        getFieldSalesEmployees(),
        getFieldSalesCurrentEmployee(),
      ]);

      if (leadsRes.status === "fulfilled" && leadsRes.value?.data) {
        setLeads(leadsRes.value.data);
      }
      if (empsRes.status === "fulfilled" && empsRes.value?.data) {
        setEmployees(empsRes.value.data);
      }
      if (meRes.status === "fulfilled" && meRes.value?.data) {
        setCurrentEmployee(meRes.value.data);
      }
    } catch (err) {
      console.error("Failed to load leads or employees:", err);
      showNotification({
        type: "error",
        message: "Failed to load leads directory.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeadsAndEmployees();
  }, []);

  /* =========================
     FILTER OPTIONS
  ========================= */

  const statusOptions = [
    { value: "all", label: "All Outcomes" },
    { value: "NEW", label: "New" },
    { value: "CONTACTED", label: "Contacted" },
    { value: "QUALIFIED", label: "Qualified" },
    { value: "PROPOSAL", label: "Proposal" },
    { value: "WON", label: "Won" },
    { value: "LOST", label: "Lost" },
  ];

  const assignmentStatusOptions = [
    { value: "all", label: "All Assignments" },
    { value: "ASSIGNED", label: "Assigned" },
    { value: "UNASSIGNED", label: "Unassigned" },
    { value: "PENDING_APPROVAL", label: "Pending Approval" },
    { value: "ESCALATED", label: "Escalated" },
  ];

  const assignedOptions = useMemo(() => {
    const list = [
      {
        value: "all",
        label: "All Employees",
      },
    ];

    employees.forEach((emp) => {
      const name = emp.full_name || `${emp.first_name || ""} ${emp.last_name || ""}`.trim();
      if (name) {
        list.push({
          value: String(emp.id),
          label: name,
        });
      }
    });

    return list;
  }, [employees]);

  /* =========================
     FILTERED LEADS
  ========================= */

  const filteredLeads = useMemo(() => {
    const searchValue = search.toLowerCase().trim();

    return leads.filter((lead) => {
      const name = `${lead.first_name || ""} ${lead.last_name || ""} ${lead.contact_name || ""} ${lead.title || ""}`.toLowerCase();

      const matchesSearch =
        !searchValue ||
        name.includes(searchValue) ||
        lead.email?.toLowerCase().includes(searchValue) ||
        lead.phone?.toLowerCase().includes(searchValue) ||
        lead.company_name?.toLowerCase().includes(searchValue) ||
        lead.created_by_name?.toLowerCase().includes(searchValue) ||
        lead.assigned_by_name?.toLowerCase().includes(searchValue);

      const matchesStatus =
        status === "all" ||
        lead.status?.toUpperCase() === status.toUpperCase();

      const matchesAssigned =
        assignedTo === "all" ||
        String(lead.assigned_to) === String(assignedTo) ||
        String(lead.assigned_to_name) === String(assignedTo);

      let matchesAssignmentStatus = true;
      if (assignmentStatus === "ASSIGNED") {
        matchesAssignmentStatus = Boolean(lead.assigned_to) && !lead.is_escalated && lead.approval_status !== "PENDING_APPROVAL";
      } else if (assignmentStatus === "UNASSIGNED") {
        matchesAssignmentStatus = !lead.assigned_to;
      } else if (assignmentStatus === "PENDING_APPROVAL") {
        matchesAssignmentStatus = lead.approval_status === "PENDING_APPROVAL";
      } else if (assignmentStatus === "ESCALATED") {
        matchesAssignmentStatus = Boolean(lead.is_escalated);
      }

      return (
        matchesSearch &&
        matchesStatus &&
        matchesAssigned &&
        matchesAssignmentStatus
      );
    });
  }, [
    leads,
    search,
    status,
    assignedTo,
    assignmentStatus,
  ]);

  /* =========================
     LEAD STATS
  ========================= */

  const stats = useMemo(() => {
    const total = leads.length;
    const newCount = leads.filter(
      (lead) => lead.status?.toUpperCase() === "NEW"
    ).length;
    const contactedCount = leads.filter(
      (lead) => ["CONTACTED", "FOLLOW_UP", "QUALIFIED", "PROPOSAL"].includes(lead.status?.toUpperCase())
    ).length;
    const wonCount = leads.filter(
      (lead) => ["WON", "DEAL_WON"].includes(lead.status?.toUpperCase())
    ).length;
    const lostCount = leads.filter(
      (lead) => lead.status?.toUpperCase() === "LOST"
    ).length;

    return {
      total,
      new: newCount,
      followUp: contactedCount,
      won: wonCount,
      lost: lostCount,
    };
  }, [leads]);

  /* =========================
     FORMAT LEAD OUTCOME
  ========================= */

  const formatStatus = (value) => {
    switch (value?.toUpperCase()) {
      case "NEW":
        return "New";
      case "CONTACTED":
        return "Contacted";
      case "QUALIFIED":
        return "Qualified";
      case "PROPOSAL":
        return "Proposal";
      case "FOLLOW_UP":
        return "Follow-up";
      case "WON":
      case "DEAL_WON":
        return "Won";
      case "LOST":
        return "Lost";
      default:
        return value || "New";
    }
  };

  /* =========================
     FORMAT VISIT STATUS
  ========================= */

  const formatVisitStatus = (value) => {
    switch (value?.toUpperCase()) {
      case "NOT_STARTED":
      case "SCHEDULED":
        return "Scheduled";
      case "CHECKED_IN":
      case "IN_PROGRESS":
        return "In Progress";
      case "CHECKED_OUT":
      case "COMPLETED":
        return "Completed";
      default:
        return "Scheduled";
    }
  };

  /* =========================
     VISIT STATUS CLASS
  ========================= */

  const getVisitStatusClass = (value) => {
    switch (value?.toUpperCase()) {
      case "CHECKED_IN":
      case "IN_PROGRESS":
        return "checked-in";
      case "CHECKED_OUT":
      case "COMPLETED":
        return "checked-out";
      case "NOT_STARTED":
      case "SCHEDULED":
      default:
        return "not-started";
    }
  };

  const [selectedLeadForTimeline, setSelectedLeadForTimeline] = useState(null);
  const [timelineOpen, setTimelineOpen] = useState(false);

  /* =========================
     ACTIONS
  ========================= */

  const getLeadActions = (lead) => {
    const leadDisplayName =
      `${lead.first_name || ""} ${lead.last_name || ""}`.trim() ||
      lead.contact_name ||
      lead.title ||
      "Lead";

    const actions = [
      {
        key: "timeline",
        label: "Lead History & Visits",
        icon: Eye,
        onClick: () => {
          setSelectedLeadForTimeline(lead);
          setTimelineOpen(true);
        },
      },
      {
        key: "edit",
        label: "Edit",
        icon: Edit2,
        onClick: () => navigate(`/field-sales/leads/${lead.id}/edit`),
      },
    ];

    // Manager can reassign (Case 6)
    if (currentEmployee?.is_manager) {
      actions.push({
        key: "reassign",
        label: "Reassign Lead",
        icon: UserCheck,
        onClick: () => {
          setReassignModalLead(lead);
          setReassignTargetId(lead.assigned_to ? String(lead.assigned_to) : "");
          setReassignReason("");
        },
      });

      // Manager can approve pending assignment (Case 4 / Case 14)
      if (lead.approval_status === "PENDING_APPROVAL") {
        actions.push({
          key: "approve",
          label: "Review Assignment",
          icon: CheckCircle2,
          onClick: () => {
            setApproveModalLead(lead);
            setApproveStatusChoice("APPROVED");
            setApproveTargetEmpId(lead.requested_assignee ? String(lead.requested_assignee) : (lead.assigned_to ? String(lead.assigned_to) : ""));
            setApproveNotes("");
          },
        });
      }
    }

    // Escalate lead to manager (Case 7)
    if (!lead.is_escalated) {
      actions.push({
        key: "escalate",
        label: "Escalate to Manager",
        icon: ShieldAlert,
        onClick: () => {
          setEscalateModalLead(lead);
          setEscalateReason("");
        },
      });
    }

    return actions;
  };

  /* =========================
     HANDLER: REASSIGN
  ========================= */

  const handleConfirmReassign = async (e) => {
    e.preventDefault();
    if (!reassignModalLead || !reassignTargetId) {
      showNotification({
        type: "error",
        message: "Please choose an employee to assign this lead to.",
      });
      return;
    }

    try {
      setReassignSubmitting(true);
      await reassignFieldSalesLead(reassignModalLead.id, {
        assigned_to: Number(reassignTargetId),
        reason: reassignReason || "Manager reassignment",
      });

      showNotification({
        type: "success",
        message: "Lead successfully reassigned.",
      });

      setReassignModalLead(null);
      await fetchLeadsAndEmployees();
    } catch (err) {
      console.error("Reassign failed:", err);
      showNotification({
        type: "error",
        message: err.response?.data?.error || "Failed to reassign lead.",
      });
    } finally {
      setReassignSubmitting(false);
    }
  };

  /* =========================
     HANDLER: ESCALATE
  ========================= */

  const handleConfirmEscalate = async (e) => {
    e.preventDefault();
    if (!escalateModalLead) return;
    if (!escalateReason.trim()) {
      showNotification({
        type: "error",
        message: "Please enter a reason for escalation to management.",
      });
      return;
    }

    try {
      setEscalateSubmitting(true);
      await escalateFieldSalesLead(escalateModalLead.id, {
        reason: escalateReason.trim(),
      });

      showNotification({
        type: "success",
        message: "Lead escalated to management successfully.",
      });

      setEscalateModalLead(null);
      await fetchLeadsAndEmployees();
    } catch (err) {
      console.error("Escalate failed:", err);
      showNotification({
        type: "error",
        message: err.response?.data?.error || "Failed to escalate lead.",
      });
    } finally {
      setEscalateSubmitting(false);
    }
  };

  /* =========================
     HANDLER: APPROVE/REJECT ASSIGNMENT
  ========================= */

  const handleConfirmApprove = async (e) => {
    e.preventDefault();
    if (!approveModalLead) return;

    try {
      setApproveSubmitting(true);
      await approveFieldSalesLeadAssignment(approveModalLead.id, {
        status: approveStatusChoice,
        assigned_to: approveTargetEmpId ? Number(approveTargetEmpId) : undefined,
        notes: approveNotes,
      });

      showNotification({
        type: "success",
        message:
          approveStatusChoice === "APPROVED"
            ? "Assignment request approved."
            : "Assignment request rejected.",
      });

      setApproveModalLead(null);
      await fetchLeadsAndEmployees();
    } catch (err) {
      console.error("Approve failed:", err);
      showNotification({
        type: "error",
        message: err.response?.data?.error || "Failed to process assignment review.",
      });
    } finally {
      setApproveSubmitting(false);
    }
  };

  if (loading) {
    return <IgniteLoader message="Loading leads..." />;
  }

  return (
    <main className="field-sales-leads-page">
      {/* =========================
          HEADER
      ========================= */}
      <PageHeader
        eyebrow="FIELD SALES"
        title="Leads"
        description="Manage sales leads, employee assignments, and field visit activities."
        action={
          <Button
            variant="primary"
            onClick={() => navigate("/field-sales/leads/add")}
          >
            <Plus size={16} />
            Add Lead
          </Button>
        }
      />

      {/* =========================
          STATS
      ========================= */}
      <LeadStats stats={stats} />

      {/* =========================
          FILTERS
      ========================= */}
      <section className="field-sales-leads-filters">
        <SearchInput
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search leads, creators, assigners..."
        />

        <Select
          value={status}
          onChange={setStatus}
          options={statusOptions}
          placeholder="All Outcomes"
          name="lead-status"
        />

        <Select
          value={assignmentStatus}
          onChange={setAssignmentStatus}
          options={assignmentStatusOptions}
          placeholder="All Assignments"
          name="assignment-status"
        />

        <Select
          value={assignedTo}
          onChange={setAssignedTo}
          options={assignedOptions}
          placeholder="All Employees"
          name="assigned-to"
        />
      </section>

      {/* =========================
          TABLE
      ========================= */}
      <section className="field-sales-leads-table-card">
        {/* TABLE HEADER */}
        <div className="field-sales-leads-table-card__header">
          <div>
            <h2>Lead Directory</h2>
            <p>
              {filteredLeads.length} lead
              {filteredLeads.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* TABLE WRAPPER */}
        <div className="field-sales-leads-table-wrapper">
          <table className="field-sales-leads-table">
            <thead>
              <tr>
                <th>Lead</th>
                <th>Company</th>
                <th>Contact</th>
                <th>Created By</th>
                <th>Assigned To</th>
                <th>Assigned By</th>
                <th>Assignment</th>
                <th>Outcome</th>
                <th>Visit Status</th>
                <th className="field-sales-leads-table__actions-header">Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan="10" className="field-sales-leads-table__empty">
                    <div>
                      <strong>No leads found</strong>
                      <span>Try changing your search or filters.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => {
                  const leadDisplayName =
                    `${lead.first_name || ""} ${lead.last_name || ""}`.trim() ||
                    lead.contact_name ||
                    lead.title ||
                    "Lead";

                  const assignedName =
                    lead.assigned_to_name ||
                    (typeof lead.assigned_to === "object" ? lead.assigned_to?.full_name : lead.assigned_to) ||
                    "Unassigned";

                  const createdByName = lead.created_by_name || "System";
                  const createdByRole = lead.created_by_role || "User";
                  const assignedByName = lead.assigned_by_name || "—";

                  // Assignment Status badge determination
                  let assignBadgeClass = "field-sales-assignment-badge--assigned";
                  let assignBadgeText = "Assigned";
                  let assignBadgeIcon = <UserCheck size={12} />;

                  if (lead.is_escalated) {
                    assignBadgeClass = "field-sales-assignment-badge--escalated";
                    assignBadgeText = "Escalated";
                    assignBadgeIcon = <ShieldAlert size={12} />;
                  } else if (lead.approval_status === "PENDING_APPROVAL") {
                    assignBadgeClass = "field-sales-assignment-badge--pending";
                    assignBadgeText = "Pending Approval";
                    assignBadgeIcon = <AlertCircle size={12} />;
                  } else if (!lead.assigned_to) {
                    assignBadgeClass = "field-sales-assignment-badge--unassigned";
                    assignBadgeText = "Unassigned";
                    assignBadgeIcon = <Users size={12} />;
                  }

                  return (
                    <tr key={lead.id}>
                      {/* LEAD */}
                      <td>
                        <div className="field-sales-leads-table__lead">
                          <div className="field-sales-leads-table__avatar">
                            <Users size={16} />
                          </div>
                          <div className="field-sales-leads-table__lead-info">
                            <strong>{leadDisplayName}</strong>
                            <span>{lead.email || "No email"}</span>
                          </div>
                        </div>
                      </td>

                      {/* COMPANY */}
                      <td>
                        <div className="field-sales-leads-table__company">
                          <strong>{lead.company_name || "—"}</strong>
                          <span>{lead.address || "—"}</span>
                        </div>
                      </td>

                      {/* CONTACT */}
                      <td>
                        <div className="field-sales-leads-table__contact">
                          <span>{lead.phone || "—"}</span>
                        </div>
                      </td>

                      {/* CREATED BY */}
                      <td>
                        <div className="field-sales-leads-user-cell">
                          <span className="field-sales-leads-user-name">
                            {createdByName}
                          </span>
                          <span
                            className={`field-sales-leads-role-tag ${
                              createdByRole.toUpperCase() === "MANAGER"
                                ? "field-sales-leads-role-tag--manager"
                                : ""
                            }`}
                          >
                            {createdByRole}
                          </span>
                        </div>
                      </td>

                      {/* ASSIGNED TO */}
                      <td>
                        <span className="field-sales-leads-table__assigned">
                          {assignedName}
                        </span>
                      </td>

                      {/* ASSIGNED BY */}
                      <td>
                        <div className="field-sales-leads-user-cell">
                          <span className="field-sales-leads-user-name">
                            {assignedByName}
                          </span>
                        </div>
                      </td>

                      {/* ASSIGNMENT STATUS */}
                      <td>
                        <span className={`field-sales-assignment-badge ${assignBadgeClass}`}>
                          {assignBadgeIcon}
                          {assignBadgeText}
                        </span>
                      </td>

                      {/* LEAD OUTCOME */}
                      <td>
                        <span
                          className={`field-sales-leads-status field-sales-leads-status--${(
                            lead.status || "new"
                          ).toLowerCase()}`}
                        >
                          {formatStatus(lead.status)}
                        </span>
                      </td>

                      {/* VISIT STATUS */}
                      <td>
                        <span
                          className={`field-sales-leads-visit-status field-sales-leads-visit-status--${getVisitStatusClass(
                            lead.visit_status
                          )}`}
                        >
                          {formatVisitStatus(lead.visit_status)}
                        </span>
                      </td>

                      {/* ACTION */}
                      <td className="field-sales-leads-table__actions-cell">
                        <RowActions
                          items={getLeadActions(lead)}
                          title={`Actions for ${leadDisplayName}`}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 360° LEAD TIMELINE DRAWER */}
      <Drawer
        open={timelineOpen}
        onClose={() => setTimelineOpen(false)}
        title={
          selectedLeadForTimeline?.company_name ||
          selectedLeadForTimeline?.title ||
          "Lead History"
        }
      >
        {selectedLeadForTimeline && (
          <LeadTimelineDrawer
            leadId={selectedLeadForTimeline.id}
            onClose={() => setTimelineOpen(false)}
          />
        )}
      </Drawer>

      {/* REASSIGN MODAL (Case 6) */}
      <Modal
        open={Boolean(reassignModalLead)}
        onClose={() => setReassignModalLead(null)}
        title="Reassign Lead"
        description="Assign this lead to another sales person and record the audit reason."
      >
        {reassignModalLead && (
          <form onSubmit={handleConfirmReassign} className="lead-modal-form">
            <div className="lead-modal-summary">
              <span className="lead-modal-summary__title">
                {reassignModalLead.company_name || reassignModalLead.contact_name || "Lead"}
              </span>
              <span className="lead-modal-summary__detail">
                Currently Assigned To: <strong>{reassignModalLead.assigned_to_name || "Unassigned"}</strong>
              </span>
            </div>

            <div className="lead-modal-field">
              <label htmlFor="reassign-select">Select New Assignee *</label>
              <Select
                id="reassign-select"
                value={reassignTargetId}
                onChange={setReassignTargetId}
                options={assignedOptions.filter((opt) => opt.value !== "all")}
                placeholder="Choose sales person"
                name="reassign-target"
              />
            </div>

            <div className="lead-modal-field">
              <label htmlFor="reassign-reason">Reassignment Reason / Note *</label>
              <input
                id="reassign-reason"
                type="text"
                placeholder="e.g. Territory realignment, workload balancing, client request..."
                value={reassignReason}
                onChange={(e) => setReassignReason(e.target.value)}
                required
              />
            </div>

            <div className="lead-modal-actions">
              <Button
                variant="secondary"
                type="button"
                onClick={() => setReassignModalLead(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={reassignSubmitting || !reassignTargetId}
              >
                {reassignSubmitting ? "Reassigning..." : "Confirm Reassignment"}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* ESCALATE MODAL (Case 7) */}
      <Modal
        open={Boolean(escalateModalLead)}
        onClose={() => setEscalateModalLead(null)}
        title="Escalate Lead to Manager"
        description="Notify the manager/supervisor that this lead requires special attention or guidance."
      >
        {escalateModalLead && (
          <form onSubmit={handleConfirmEscalate} className="lead-modal-form">
            <div className="lead-modal-summary">
              <span className="lead-modal-summary__title">
                {escalateModalLead.company_name || escalateModalLead.contact_name || "Lead"}
              </span>
              <span className="lead-modal-summary__detail">
                Assigned: {escalateModalLead.assigned_to_name || "Self"}
              </span>
            </div>

            <div className="lead-modal-field">
              <label htmlFor="escalate-reason">Why does this lead require Manager intervention? *</label>
              <textarea
                id="escalate-reason"
                rows="4"
                placeholder="Provide detailed context (e.g. enterprise pricing exception, outside territory dispute, client decision maker requesting senior leadership)..."
                value={escalateReason}
                onChange={(e) => setEscalateReason(e.target.value)}
                required
              />
            </div>

            <div className="lead-modal-actions">
              <Button
                variant="secondary"
                type="button"
                onClick={() => setEscalateModalLead(null)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                type="submit"
                disabled={escalateSubmitting || !escalateReason.trim()}
              >
                {escalateSubmitting ? "Submitting..." : "Submit Escalation"}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* APPROVE ASSIGNMENT MODAL (Case 4 / Case 14) */}
      <Modal
        open={Boolean(approveModalLead)}
        onClose={() => setApproveModalLead(null)}
        title="Review Assignment Request"
        description="A sales rep requested assignment for this lead or created it outside territory."
      >
        {approveModalLead && (
          <form onSubmit={handleConfirmApprove} className="lead-modal-form">
            <div className="lead-modal-summary">
              <span className="lead-modal-summary__title">
                {approveModalLead.company_name || approveModalLead.contact_name || "Lead"}
              </span>
              <span className="lead-modal-summary__detail">
                Created By: <strong>{approveModalLead.created_by_name || "Sales Rep"}</strong>
              </span>
              {approveModalLead.requested_assignee_name && (
                <span className="lead-modal-summary__detail">
                  Requested Assignee: <strong>{approveModalLead.requested_assignee_name}</strong>
                </span>
              )}
            </div>

            <div className="lead-modal-field">
              <label>Decision</label>
              <div style={{ display: "flex", gap: "14px", marginTop: "4px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "13px" }}>
                  <input
                    type="radio"
                    name="decision"
                    value="APPROVED"
                    checked={approveStatusChoice === "APPROVED"}
                    onChange={() => setApproveStatusChoice("APPROVED")}
                  />
                  Approve Assignment
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "13px" }}>
                  <input
                    type="radio"
                    name="decision"
                    value="REJECTED"
                    checked={approveStatusChoice === "REJECTED"}
                    onChange={() => setApproveStatusChoice("REJECTED")}
                  />
                  Reject Request (Keep Unassigned)
                </label>
              </div>
            </div>

            {approveStatusChoice === "APPROVED" && (
              <div className="lead-modal-field">
                <label htmlFor="approve-target">Assign To</label>
                <Select
                  id="approve-target"
                  value={approveTargetEmpId}
                  onChange={setApproveTargetEmpId}
                  options={assignedOptions.filter((opt) => opt.value !== "all")}
                  placeholder="Select employee"
                  name="approve-target"
                />
              </div>
            )}

            <div className="lead-modal-field">
              <label htmlFor="approve-notes">Manager Notes (Optional)</label>
              <textarea
                id="approve-notes"
                rows="3"
                placeholder="Add any instructions or remarks..."
                value={approveNotes}
                onChange={(e) => setApproveNotes(e.target.value)}
              />
            </div>

            <div className="lead-modal-actions">
              <Button
                variant="secondary"
                type="button"
                onClick={() => setApproveModalLead(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={approveSubmitting}
              >
                {approveSubmitting ? "Processing..." : "Submit Decision"}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </main>
  );
};

export default Leads;