import { useEffect, useMemo, useState } from "react";
import { FiEdit2, FiEye, FiMapPin, FiPlus, FiTrash2, FiUsers } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

import Button from "../../../components/common/Button/Button";
import RowActions from "../../../components/common/RowActions/RowActions";
import SearchInput from "../../../components/common/SearchInput/SearchInput";
import Select from "../../../components/common/Select/Select";
import LeadStats from "../../../components/fieldSales/leads/leadStats/LeadStats";
import IgniteLoader from "../../../components/common/IgniteLoader/IgniteLoader";
import { getFieldSalesLeads, getFieldSalesEmployees } from "../../../services/api/fieldSalesAPI";
import { useNotification } from "../../../context/NotificationContext";

import "./Leads.css";

const Leads = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [assignedTo, setAssignedTo] = useState("all");

  const [leads, setLeads] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLeadsAndEmployees = async () => {
    try {
      setLoading(true);
      const [leadsRes, empsRes] = await Promise.allSettled([
        getFieldSalesLeads(),
        getFieldSalesEmployees(),
      ]);

      if (leadsRes.status === "fulfilled" && leadsRes.value?.data) {
        setLeads(leadsRes.value.data);
      }
      if (empsRes.status === "fulfilled" && empsRes.value?.data) {
        setEmployees(empsRes.value.data);
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
    {
      value: "all",
      label: "All Outcomes",
    },
    {
      value: "NEW",
      label: "New",
    },
    {
      value: "CONTACTED",
      label: "Contacted",
    },
    {
      value: "QUALIFIED",
      label: "Qualified",
    },
    {
      value: "PROPOSAL",
      label: "Proposal",
    },
    {
      value: "WON",
      label: "Won",
    },
    {
      value: "LOST",
      label: "Lost",
    },
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
        lead.company_name?.toLowerCase().includes(searchValue);

      const matchesStatus =
        status === "all" ||
        lead.status?.toUpperCase() === status.toUpperCase();

      const matchesAssigned =
        assignedTo === "all" ||
        String(lead.assigned_to) === String(assignedTo) ||
        String(lead.assigned_to_name) === String(assignedTo);

      return (
        matchesSearch &&
        matchesStatus &&
        matchesAssigned
      );
    });
  }, [
    leads,
    search,
    status,
    assignedTo,
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

  /* =========================
     ROW ACTIONS
  ========================= */

  const getLeadActions = (lead) => [
    {
      key: "edit",
      label: "Edit",
      icon: FiEdit2,
      onClick: () =>
        navigate(`/field-sales/leads/${lead.id}/edit`),
    },
  ];

  if (loading) {
    return <IgniteLoader message="Loading leads..." />;
  }

  return (
    <main className="field-sales-leads-page">

      {/* =========================
          HEADER
      ========================= */}

      <header className="field-sales-leads-page__header">
        <div>
          <span className="field-sales-leads-page__eyebrow">
            FIELD SALES
          </span>

          <h1>Leads</h1>

          <p>
            Manage leads, assignments and field visits.
          </p>
        </div>

        <div className="field-sales-leads-page__header-actions">
          <div className="field-sales-leads-page__date">
            <FiMapPin />
            <span>Field Sales</span>
          </div>

          <Button
            variant="primary"
            onClick={() =>
              navigate("/field-sales/leads/add")
            }
          >
            <FiPlus />
            Add Lead
          </Button>
        </div>
      </header>

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
          onChange={(event) =>
            setSearch(event.target.value)
          }
          placeholder="Search leads..."
        />

        <Select
          value={status}
          onChange={setStatus}
          options={statusOptions}
          placeholder="All Outcomes"
          name="lead-status"
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
              {filteredLeads.length !== 1
                ? "s"
                : ""}
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
                <th>Assigned To</th>
                <th>Outcome</th>
                <th>Visit Status</th>
                <th className="field-sales-leads-table__actions-header">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredLeads.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="field-sales-leads-table__empty"
                  >
                    <div>
                      <strong>
                        No leads found
                      </strong>

                      <span>
                        Try changing your search
                        or filters.
                      </span>
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

                  return (
                    <tr key={lead.id}>

                      {/* LEAD */}

                      <td>
                        <div className="field-sales-leads-table__lead">

                          <div className="field-sales-leads-table__avatar">
                            <FiUsers />
                          </div>

                          <div className="field-sales-leads-table__lead-info">
                            <strong>
                              {leadDisplayName}
                            </strong>

                            <span>
                              {lead.email || "No email"}
                            </span>
                          </div>

                        </div>
                      </td>

                      {/* COMPANY */}

                      <td>
                        <div className="field-sales-leads-table__company">

                          <strong>
                            {lead.company_name || "—"}
                          </strong>

                          <span>
                            {lead.address || "—"}
                          </span>

                        </div>
                      </td>

                      {/* CONTACT */}

                      <td>
                        <div className="field-sales-leads-table__contact">
                          <span>
                            {lead.phone || "—"}
                          </span>
                        </div>
                      </td>

                      {/* ASSIGNED TO */}

                      <td>
                        <span className="field-sales-leads-table__assigned">
                          {assignedName}
                        </span>
                      </td>

                      {/* LEAD OUTCOME */}

                      <td>
                        <span
                          className={`field-sales-leads-status field-sales-leads-status--${(lead.status || "new").toLowerCase()}`}
                        >
                          {formatStatus(
                            lead.status
                          )}
                        </span>
                      </td>

                      {/* VISIT STATUS */}

                      <td>
                        <span
                          className={`field-sales-leads-visit-status field-sales-leads-visit-status--${getVisitStatusClass(
                            lead.visit_status
                          )}`}
                        >
                          {formatVisitStatus(
                            lead.visit_status
                          )}
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

    </main>
  );
};

export default Leads;