import { useMemo, useState } from "react";
import { FiEdit2, FiEye, FiMapPin, FiPlus, FiTrash2, FiUsers } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

import Button from "../../../components/common/Button/Button";
import RowActions from "../../../components/common/RowActions/RowActions";
import SearchInput from "../../../components/common/SearchInput/SearchInput";
import Select from "../../../components/common/Select/Select";
import LeadStats from "../../../components/fieldSales/leads/leadStats/LeadStats";

import "./Leads.css";

const Leads = () => {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [assignedTo, setAssignedTo] = useState("all");

  /*
   * TEMPORARY DATA
   *
   * This will be replaced with leadAPI once
   * backend endpoints are available.
   */
  const [leads] = useState([
    {
      id: 1,
      first_name: "Rahul",
      last_name: "Sharma",
      email: "rahul@example.com",
      phone: "+91 9876543210",
      company_name: "ABC Enterprises",
      address: "Sector 18, Gurugram",

      // Lead outcome
      status: "NEW",

      // Visit status
      visit_status: "NOT_STARTED",

      assigned_to: "Amit Kumar",
    },
    {
      id: 2,
      first_name: "Priya",
      last_name: "Verma",
      email: "priya@example.com",
      phone: "+91 9876543211",
      company_name: "Verma Industries",
      address: "DLF Phase 2, Gurugram",

      // Lead outcome
      status: "FOLLOW_UP",

      // Visit status
      visit_status: "CHECKED_OUT",

      assigned_to: "Neha Singh",
    },
  ]);

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
      value: "FOLLOW_UP",
      label: "Follow-up",
    },
    {
      value: "DEAL_WON",
      label: "Deal Won",
    },
    {
      value: "LOST",
      label: "Lost",
    },
  ];

  const assignedOptions = [
    {
      value: "all",
      label: "All Employees",
    },
    {
      value: "Amit Kumar",
      label: "Amit Kumar",
    },
    {
      value: "Neha Singh",
      label: "Neha Singh",
    },
  ];

  /* =========================
     FILTERED LEADS
  ========================= */

  const filteredLeads = useMemo(() => {
    const searchValue = search.toLowerCase().trim();

    return leads.filter((lead) => {
      const name =
        `${lead.first_name} ${lead.last_name}`.toLowerCase();

      const matchesSearch =
        !searchValue ||
        name.includes(searchValue) ||
        lead.email?.toLowerCase().includes(searchValue) ||
        lead.phone?.toLowerCase().includes(searchValue) ||
        lead.company_name?.toLowerCase().includes(searchValue);

      const matchesStatus =
        status === "all" ||
        lead.status === status;

      const matchesAssigned =
        assignedTo === "all" ||
        lead.assigned_to === assignedTo;

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
    return {
      total: leads.length,

      new: leads.filter(
        (lead) => lead.status === "NEW"
      ).length,

      followUp: leads.filter(
        (lead) => lead.status === "FOLLOW_UP"
      ).length,

      won: leads.filter(
        (lead) => lead.status === "DEAL_WON"
      ).length,

      lost: leads.filter(
        (lead) => lead.status === "LOST"
      ).length,
    };
  }, [leads]);

  /* =========================
     FORMAT LEAD OUTCOME
  ========================= */

  const formatStatus = (value) => {
    switch (value) {
      case "NEW":
        return "New";

      case "FOLLOW_UP":
        return "Follow-up";

      case "DEAL_WON":
        return "Deal Won";

      case "LOST":
        return "Lost";

      default:
        return value || "—";
    }
  };

  /* =========================
     FORMAT VISIT STATUS
  ========================= */

  const formatVisitStatus = (value) => {
    switch (value) {
      case "NOT_STARTED":
        return "Not Started";

      case "CHECKED_IN":
        return "Checked In";

      case "CHECKED_OUT":
        return "Checked Out";

      default:
        return "Not Started";
    }
  };

  /* =========================
     VISIT STATUS CLASS
  ========================= */

  const getVisitStatusClass = (value) => {
    switch (value) {
      case "CHECKED_IN":
        return "checked-in";

      case "CHECKED_OUT":
        return "checked-out";

      case "NOT_STARTED":
      default:
        return "not-started";
    }
  };

  /* =========================
     ROW ACTIONS
  ========================= */

  const getLeadActions = (lead) => [
    {
      key: "view",
      label: "View",
      icon: FiEye,
      onClick: () =>
        navigate(`/field-sales/leads/${lead.id}`),
    },
    {
      key: "edit",
      label: "Edit",
      icon: FiEdit2,
      onClick: () =>
        navigate(`/field-sales/leads/${lead.id}/edit`),
    },
    {
      key: "delete",
      label: "Delete",
      icon: FiTrash2,
      isDanger: true,
      onClick: () => {
        console.log("Delete lead:", lead.id);
      },
    },
  ];

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
                filteredLeads.map((lead) => (
                  <tr key={lead.id}>

                    {/* LEAD */}

                    <td>
                      <div className="field-sales-leads-table__lead">

                        <div className="field-sales-leads-table__avatar">
                          <FiUsers />
                        </div>

                        <div className="field-sales-leads-table__lead-info">
                          <strong>
                            {lead.first_name}{" "}
                            {lead.last_name}
                          </strong>

                          <span>
                            {lead.email}
                          </span>
                        </div>

                      </div>
                    </td>

                    {/* COMPANY */}

                    <td>
                      <div className="field-sales-leads-table__company">

                        <strong>
                          {lead.company_name}
                        </strong>

                        <span>
                          {lead.address}
                        </span>

                      </div>
                    </td>

                    {/* CONTACT */}

                    <td>
                      <div className="field-sales-leads-table__contact">
                        <span>
                          {lead.phone}
                        </span>
                      </div>
                    </td>

                    {/* ASSIGNED TO */}

                    <td>
                      <span className="field-sales-leads-table__assigned">
                        {lead.assigned_to ||
                          "Unassigned"}
                      </span>
                    </td>

                    {/* LEAD OUTCOME */}

                    <td>
                      <span
                        className={`field-sales-leads-status field-sales-leads-status--${lead.status.toLowerCase()}`}
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
                        title={`Actions for ${lead.first_name} ${lead.last_name}`}
                      />
                    </td>

                  </tr>
                ))
              )}
            </tbody>

          </table>
        </div>
      </section>

    </main>
  );
};

export default Leads;